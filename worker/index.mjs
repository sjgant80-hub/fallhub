// OneHub · Cloudflare Worker · webhook + iCal + AI-draft endpoint
// ─────────────────────────────────────────────────────────────────
// Single Worker handles:
//   POST /api/stripe-webhook      · Stripe checkout events
//   POST /api/wa-webhook          · WhatsApp inbound (Twilio or Meta)
//   POST /api/email-inbound       · Email inbound-parse (Resend or SendGrid)
//   POST /api/booking-intent      · Frontend triggers a Stripe checkout session
//   POST /api/ai-draft            · Frontend requests an AI reply draft
//   GET  /api/calendar/:unit      · Aggregated iCal export (all channels merged)
//   GET  /api/config              · Public config read (public fields only)
//   GET  /api/health              · Liveness
// ─────────────────────────────────────────────────────────────────
// Deploy: npm run deploy · wrangler.toml holds bindings + secrets
// State: Cloudflare KV namespace ONEHUB_STATE
// ─────────────────────────────────────────────────────────────────

// Public config fields that may be safely returned to the browser
const PUBLIC_CFG_FIELDS = ['business', 'brand', 'units', 'operator', 'policies', 'legal'];

// ─── main fetch handler ─────────────────────────────────────────
export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;

    // CORS preflight
    if (request.method === 'OPTIONS') return cors();

    try {
      if (path === '/api/health') return json({ status: 'ok', ts: Date.now() });

      if (path === '/api/config' && request.method === 'GET') {
        return handleGetConfig(env);
      }

      if (path === '/api/stripe-webhook' && request.method === 'POST') {
        return handleStripeWebhook(request, env, ctx);
      }

      if (path === '/api/wa-webhook') {
        return handleWhatsAppWebhook(request, env, ctx);
      }

      if (path === '/api/email-inbound' && request.method === 'POST') {
        return handleEmailInbound(request, env, ctx);
      }

      if (path === '/api/booking-intent' && request.method === 'POST') {
        return handleBookingIntent(request, env);
      }

      if (path === '/api/ai-draft' && request.method === 'POST') {
        return handleAIDraft(request, env);
      }

      if (path.startsWith('/api/calendar/')) {
        const unit = path.split('/').pop();
        return handleCalendar(unit, env);
      }

      return new Response('not found', { status: 404 });
    } catch (e) {
      console.error('[onehub-worker]', e);
      return json({ error: e.message }, 500);
    }
  },
};

// ─── endpoint: GET /api/config (public fields only) ─────────────
async function handleGetConfig(env) {
  const raw = await env.ONEHUB_STATE.get('config', 'json');
  if (!raw) return json({ error: 'config not seeded · POST to /api/admin/seed-config first' }, 404);
  const pub = {};
  for (const k of PUBLIC_CFG_FIELDS) if (raw[k]) pub[k] = raw[k];
  return json(pub);
}

// ─── endpoint: POST /api/booking-intent · direct booking flow ───
async function handleBookingIntent(request, env) {
  const body = await request.json();
  const { unit_id, arrive, depart, guest, email, phone, notes } = body;
  if (!unit_id || !arrive || !depart || !guest || !email) {
    return json({ error: 'missing required fields' }, 400);
  }

  const cfg = await env.ONEHUB_STATE.get('config', 'json');
  const unit = cfg?.units?.find(u => u.id === unit_id);
  if (!unit) return json({ error: 'unknown unit' }, 400);

  const nights = daysBetween(arrive, depart);
  if (nights < unit.min_nights) {
    return json({ error: `minimum ${unit.min_nights} nights for ${unit.name}` }, 400);
  }

  const total_gbp = unit.nightly_from * nights;
  const deposit_gbp = Math.round(total_gbp * (cfg.channels.direct.deposit_pct / 100));

  // Create Stripe Checkout session
  const stripeResp = await fetch('https://api.stripe.com/v1/checkout/sessions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${env.STRIPE_SECRET_KEY}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      'mode': 'payment',
      'payment_method_types[]': 'card',
      'line_items[0][price_data][currency]': 'gbp',
      'line_items[0][price_data][unit_amount]': String(deposit_gbp * 100),
      'line_items[0][price_data][product_data][name]': `Deposit · ${unit.name} · ${arrive} to ${depart}`,
      'line_items[0][quantity]': '1',
      'success_url': `https://${cfg.business.domain}/booking-confirmed?session_id={CHECKOUT_SESSION_ID}`,
      'cancel_url': `https://${cfg.business.domain}/book.html`,
      'customer_email': email,
      'metadata[unit_id]': unit_id,
      'metadata[guest]': guest,
      'metadata[arrive]': arrive,
      'metadata[depart]': depart,
      'metadata[nights]': String(nights),
      'metadata[phone]': phone || '',
      'metadata[notes]': notes || '',
      'metadata[total_gbp]': String(total_gbp),
    }),
  });
  if (!stripeResp.ok) {
    const err = await stripeResp.text();
    return json({ error: 'stripe error: ' + err.slice(0, 200) }, 500);
  }
  const session = await stripeResp.json();

  // Log the intent (before payment) in KV
  await env.ONEHUB_STATE.put(`intent:${session.id}`, JSON.stringify({
    unit_id, arrive, depart, guest, email, phone, notes,
    total_gbp, deposit_gbp, session_id: session.id, ts: Date.now(), status: 'pending',
  }), { expirationTtl: 60 * 60 * 24 * 7 });

  return json({ checkout_url: session.url, session_id: session.id });
}

// ─── endpoint: POST /api/stripe-webhook ─────────────────────────
async function handleStripeWebhook(request, env, ctx) {
  const rawBody = await request.text();
  const sig = request.headers.get('stripe-signature');
  if (!sig) return json({ error: 'missing stripe-signature' }, 400);

  // Verify signature
  const verified = await verifyStripeSignature(rawBody, sig, env.STRIPE_WEBHOOK_SECRET);
  if (!verified) return json({ error: 'invalid signature' }, 400);

  const event = JSON.parse(rawBody);

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const meta = session.metadata || {};
    const bookingId = `bk_${Date.now()}_${session.id.slice(-6)}`;

    // Persist booking
    await env.ONEHUB_STATE.put(`booking:${bookingId}`, JSON.stringify({
      id: bookingId,
      unit_id: meta.unit_id,
      guest: meta.guest,
      email: session.customer_details?.email || meta.email,
      phone: meta.phone,
      arrive: meta.arrive,
      depart: meta.depart,
      nights: Number(meta.nights),
      total_gbp: Number(meta.total_gbp),
      paid_gbp: session.amount_total / 100,
      channel: 'direct',
      status: 'confirmed',
      stripe_session_id: session.id,
      notes: meta.notes,
      ts: Date.now(),
    }));

    // Fire confirmation email (fire-and-forget)
    ctx.waitUntil(sendConfirmationEmail(env, {
      to: session.customer_details?.email || meta.email,
      guest: meta.guest,
      unit_id: meta.unit_id,
      arrive: meta.arrive,
      depart: meta.depart,
      nights: meta.nights,
      total: meta.total_gbp,
      booking_id: bookingId,
    }));

    // Fire WhatsApp confirmation if phone provided
    if (meta.phone) {
      ctx.waitUntil(sendWhatsAppConfirmation(env, meta.phone, meta.guest, meta.arrive));
    }
  }

  return json({ received: true });
}

// ─── endpoint: WhatsApp inbound (Twilio + Meta both supported) ──
async function handleWhatsAppWebhook(request, env, ctx) {
  // Meta uses GET with hub.challenge for verification
  if (request.method === 'GET') {
    const u = new URL(request.url);
    const mode = u.searchParams.get('hub.mode');
    const token = u.searchParams.get('hub.verify_token');
    const challenge = u.searchParams.get('hub.challenge');
    if (mode === 'subscribe' && token === env.WA_WEBHOOK_VERIFY_TOKEN) {
      return new Response(challenge, { status: 200 });
    }
    return new Response('forbidden', { status: 403 });
  }

  if (request.method !== 'POST') return new Response('method not allowed', { status: 405 });

  const contentType = request.headers.get('content-type') || '';
  let msg;
  if (contentType.includes('application/json')) {
    const j = await request.json();
    // Meta shape
    const entry = j.entry?.[0]?.changes?.[0]?.value;
    const m = entry?.messages?.[0];
    if (m) {
      msg = { from: m.from, text: m.text?.body || '', channel_msg_id: m.id, provider: 'meta', ts: Date.now() };
    }
  } else {
    // Twilio urlencoded shape
    const form = await request.formData();
    msg = {
      from: form.get('From')?.replace('whatsapp:', '') || '',
      text: form.get('Body') || '',
      channel_msg_id: form.get('MessageSid') || '',
      provider: 'twilio', ts: Date.now(),
    };
  }
  if (!msg?.text) return json({ ignored: true });

  const threadKey = `thread:whatsapp:${msg.from}`;
  const existing = await env.ONEHUB_STATE.get(threadKey, 'json') || { messages: [] };
  existing.messages.push({ role: 'guest', ...msg });
  existing.last_ts = msg.ts;
  await env.ONEHUB_STATE.put(threadKey, JSON.stringify(existing));

  // Optionally auto-draft (fire-and-forget; operator sees the draft next time they open hub.html)
  ctx.waitUntil(precomputeDraft(env, threadKey, msg.text));

  return json({ received: true });
}

// ─── endpoint: email inbound parse ──────────────────────────────
async function handleEmailInbound(request, env, ctx) {
  const contentType = request.headers.get('content-type') || '';
  let payload;
  if (contentType.includes('application/json')) {
    payload = await request.json();
  } else {
    const form = await request.formData();
    payload = {
      from: form.get('from') || '',
      subject: form.get('subject') || '',
      text: form.get('text') || form.get('body-plain') || '',
      messageId: form.get('Message-Id') || form.get('message-id') || '',
    };
  }
  const from = payload.from || 'unknown';
  const threadKey = `thread:email:${from}`;
  const existing = await env.ONEHUB_STATE.get(threadKey, 'json') || { messages: [] };
  existing.messages.push({
    role: 'guest',
    from,
    subject: payload.subject,
    text: payload.text,
    channel_msg_id: payload.messageId,
    provider: 'email',
    ts: Date.now(),
  });
  await env.ONEHUB_STATE.put(threadKey, JSON.stringify(existing));
  return json({ received: true });
}

// ─── endpoint: POST /api/ai-draft ───────────────────────────────
async function handleAIDraft(request, env) {
  const { message, channel, unit_hint, voice_hint } = await request.json();
  const cfg = await env.ONEHUB_STATE.get('config', 'json');
  const voice = voice_hint || cfg?.ai?.voice_hint || 'warm, brief, moves toward booking';
  const bizName = cfg?.business?.name || 'the business';

  const system = `You are the AI assistant for ${bizName}. Draft replies in the voice of the operator.
VOICE: ${voice}
CONTEXT: guest reached out via ${channel || 'unknown channel'}${unit_hint ? ' about ' + unit_hint : ''}.
RULES:
 - Warm, brief (2-3 sentences)
 - Always move toward booking or a clear next step
 - Never invent details you don't have (dates, prices, availability)
 - Sign off with the operator's first name only, or a woodland emoji if uncertain
Return the reply text only.`;

  // Route to configured provider
  const provider = cfg?.ai?.provider || 'anthropic';
  if (provider === 'anthropic' && env.ANTHROPIC_KEY) {
    const resp = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': env.ANTHROPIC_KEY,
        'anthropic-version': '2023-06-01',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: cfg.ai.model || 'claude-opus-4-8',
        max_tokens: 256,
        system,
        messages: [{ role: 'user', content: message }],
      }),
    });
    if (!resp.ok) return json({ error: 'anthropic error' }, 500);
    const j = await resp.json();
    return json({ draft: j.content?.map(c => c.text || '').join('') });
  }
  if (provider === 'openai' && env.OPENAI_KEY) {
    const resp = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${env.OPENAI_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: cfg.ai.model || 'gpt-4o',
        max_tokens: 256,
        messages: [{ role: 'system', content: system }, { role: 'user', content: message }],
      }),
    });
    if (!resp.ok) return json({ error: 'openai error' }, 500);
    const j = await resp.json();
    return json({ draft: j.choices?.[0]?.message?.content });
  }
  return json({ draft: null, hint: 'no server-side AI configured · use browser WebLLM fallback' });
}

// ─── endpoint: GET /api/calendar/:unit · aggregate iCal ────────
async function handleCalendar(unitId, env) {
  const cfg = await env.ONEHUB_STATE.get('config', 'json');
  if (!cfg) return new Response('config not seeded', { status: 404 });

  const events = [];
  // 1. Direct bookings for this unit (from KV)
  const list = await env.ONEHUB_STATE.list({ prefix: 'booking:' });
  for (const k of list.keys) {
    const b = await env.ONEHUB_STATE.get(k.name, 'json');
    if (b?.unit_id === unitId && b.status === 'confirmed') {
      events.push({
        uid: b.id,
        summary: `${b.guest} · direct`,
        start: b.arrive,
        end: b.depart,
      });
    }
  }
  // 2. Airbnb + Booking.com imports (fetch each iCal, parse minimally)
  for (const [name, ch] of Object.entries(cfg.channels)) {
    if (!ch.enabled) continue;
    const feeds = ch.ical_import_per_unit?.[unitId];
    if (!feeds) continue;
    const urls = Array.isArray(feeds) ? feeds : [feeds];
    for (const feedUrl of urls) {
      try {
        const r = await fetch(feedUrl, { cf: { cacheTtl: 300 } });
        if (r.ok) {
          const ics = await r.text();
          events.push(...parseICal(ics).map(e => ({ ...e, summary: `${e.summary} · ${name}` })));
        }
      } catch (e) { /* skip failed feed */ }
    }
  }

  // Emit merged ICS
  const ics = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    `PRODID:-//OneHub//${unitId}//EN`,
    ...events.flatMap(e => [
      'BEGIN:VEVENT',
      `UID:${e.uid}@onehub`,
      `DTSTART;VALUE=DATE:${e.start.replace(/-/g, '')}`,
      `DTEND;VALUE=DATE:${e.end.replace(/-/g, '')}`,
      `SUMMARY:${e.summary}`,
      'END:VEVENT',
    ]),
    'END:VCALENDAR',
  ].join('\r\n');

  return new Response(ics, {
    status: 200,
    headers: { 'Content-Type': 'text/calendar; charset=utf-8', 'Cache-Control': 'public, max-age=300' },
  });
}

// ─── helpers ────────────────────────────────────────────────────
function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    },
  });
}

function cors() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, Stripe-Signature',
    },
  });
}

function daysBetween(a, b) {
  const ms = new Date(b).getTime() - new Date(a).getTime();
  return Math.round(ms / 86400000);
}

async function verifyStripeSignature(payload, header, secret) {
  const parts = Object.fromEntries(header.split(',').map(p => p.split('=')));
  if (!parts.t || !parts.v1) return false;
  const signed = `${parts.t}.${payload}`;
  const key = await crypto.subtle.importKey(
    'raw', new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
  );
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(signed));
  const hex = [...new Uint8Array(sig)].map(b => b.toString(16).padStart(2, '0')).join('');
  return timingSafeEqual(hex, parts.v1);
}

function timingSafeEqual(a, b) {
  if (a.length !== b.length) return false;
  let r = 0;
  for (let i = 0; i < a.length; i++) r |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return r === 0;
}

function parseICal(ics) {
  // minimal VEVENT extractor
  const events = [];
  const blocks = ics.split(/BEGIN:VEVENT/i).slice(1);
  for (const b of blocks) {
    const uid = (b.match(/UID:([^\r\n]+)/i) || [])[1] || crypto.randomUUID();
    const start = (b.match(/DTSTART[^:]*:(\d{8})/i) || [])[1];
    const end   = (b.match(/DTEND[^:]*:(\d{8})/i) || [])[1];
    const summary = (b.match(/SUMMARY:([^\r\n]+)/i) || [])[1] || 'external';
    if (start && end) {
      const s = `${start.slice(0,4)}-${start.slice(4,6)}-${start.slice(6,8)}`;
      const e = `${end.slice(0,4)}-${end.slice(4,6)}-${end.slice(6,8)}`;
      events.push({ uid: uid.trim(), start: s, end: e, summary: summary.trim() });
    }
  }
  return events;
}

async function sendConfirmationEmail(env, opts) {
  const cfg = await env.ONEHUB_STATE.get('config', 'json');
  if (!env.RESEND_KEY && !env.SENDGRID_KEY) return;
  const from = cfg?.channels?.email?.from_address || 'bookings@example.com';
  const subject = `Your booking · ${opts.arrive} to ${opts.depart}`;
  const html = `
    <p>Hi ${opts.guest.split(' ')[0]},</p>
    <p>You're booked into <strong>${opts.unit_id}</strong> from <strong>${opts.arrive}</strong> to <strong>${opts.depart}</strong> · ${opts.nights} nights.</p>
    <p>Total: £${opts.total}</p>
    <p>Booking reference: <code>${opts.booking_id}</code></p>
    <p>See you soon.</p>
  `;
  if (env.RESEND_KEY) {
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${env.RESEND_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from, to: opts.to, subject, html }),
    }).catch(() => {});
  }
}

async function sendWhatsAppConfirmation(env, phone, guest, arrive) {
  if (!env.TWILIO_ACCOUNT_SID || !env.TWILIO_AUTH_TOKEN || !env.WHATSAPP_SENDER) return;
  const body = `Hi ${guest.split(' ')[0]}! You're booked in from ${arrive} · we'll be in touch nearer the time with directions. Any questions just reply here.`;
  await fetch(`https://api.twilio.com/2010-04-01/Accounts/${env.TWILIO_ACCOUNT_SID}/Messages.json`, {
    method: 'POST',
    headers: {
      'Authorization': 'Basic ' + btoa(`${env.TWILIO_ACCOUNT_SID}:${env.TWILIO_AUTH_TOKEN}`),
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      From: `whatsapp:${env.WHATSAPP_SENDER}`,
      To: `whatsapp:${phone}`,
      Body: body,
    }),
  }).catch(() => {});
}

async function precomputeDraft(env, threadKey, message) {
  // Placeholder · production would call handleAIDraft internally and cache the result on the thread
  const existing = await env.ONEHUB_STATE.get(threadKey, 'json') || {};
  existing.pending_draft = null;
  existing.pending_draft_at = Date.now();
  await env.ONEHUB_STATE.put(threadKey, JSON.stringify(existing));
}
