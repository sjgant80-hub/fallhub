# OneHub · Quickstart

Fork the repo, edit one config, deploy. About 30-60 minutes from fork to first booking.

## Prerequisites

- GitHub account (any tier)
- Cloudflare account (free tier is fine · https://dash.cloudflare.com/sign-up)
- Node.js 20+ installed (for the Worker deploy step)
- A Stripe account (test mode fine at first)
- A domain (optional at first — you can start with `yourname.github.io/onehub/`)

## Step 1 · Fork the repo

Go to https://github.com/sjgant80-hub/onehub · click **Fork** · pick your account.

You now have `github.com/YOU/onehub`.

```bash
git clone https://github.com/YOU/onehub.git
cd onehub
```

## Step 2 · Edit the config

```bash
cp config/onehub.config.example.json config/onehub.config.json
```

Open `config/onehub.config.json` in any text editor. Change:

- `business.name` · your business name
- `business.tagline` · one sentence positioning
- `business.contact` · your email/phone
- `business.domain` · your domain (or leave the github.io URL for now)
- `units[]` · one entry per bookable unit (cabin, room, cottage). Set id, name, sleeps, nightly rate, min nights, description
- `channels.airbnb.ical_import_per_unit` · iCal export URL from each Airbnb listing
- `channels.booking_com.ical_import_per_unit` · same for Booking.com
- `brand.preset` · `woodland` / `coastal` / `urban` / `boutique` (or leave blank to use OneHub default)
- `brand.logo_glyph` · unicode symbol used as your mark (◊, △, ✿, ★, etc.)

Save the file. Commit:

```bash
git add config/onehub.config.json
git commit -m "my brand config"
git push
```

## Step 3 · Deploy the Cloudflare Worker

The Worker handles Stripe payments, WhatsApp inbound, email inbound, and iCal aggregation.

```bash
cd worker
npm install
npx wrangler login                                        # opens browser to auth
npx wrangler kv:namespace create "ONEHUB_STATE"           # copy the id from the output
cp wrangler.example.toml wrangler.toml
# edit wrangler.toml: paste your KV namespace id, pick a Worker name
```

Set your secrets (one at a time · wrangler prompts securely):

```bash
npx wrangler secret put STRIPE_SECRET_KEY
npx wrangler secret put STRIPE_WEBHOOK_SECRET
npx wrangler secret put RESEND_KEY                         # or SENDGRID_KEY
npx wrangler secret put TWILIO_ACCOUNT_SID                 # WhatsApp via Twilio
npx wrangler secret put TWILIO_AUTH_TOKEN
npx wrangler secret put WHATSAPP_SENDER                    # your E.164 number
npx wrangler secret put WA_WEBHOOK_VERIFY_TOKEN            # random 32-char you invent
npx wrangler secret put ANTHROPIC_KEY                      # optional, for server-side AI drafts
```

Deploy:

```bash
npm run deploy
```

The Worker URL prints to the console — save it, you'll need it for Stripe + WhatsApp webhook setup.

Seed your config into KV (so the Worker can read it):

```bash
cd ..
npx wrangler kv:key put --binding=ONEHUB_STATE 'config' --path=config/onehub.config.json --config=worker/wrangler.toml
```

## Step 4 · Enable GitHub Pages

In your repo on GitHub: **Settings → Pages** · Source: `Deploy from a branch` · Branch: `main` · `/ (root)` · Save.

Wait 1-2 minutes. Your site goes live at:

```
https://YOU.github.io/onehub/
```

## Step 5 · Point Stripe + WhatsApp at your Worker

**Stripe webhook:**

Dashboard → Developers → Webhooks → **Add endpoint** → paste `https://YOUR-WORKER.workers.dev/api/stripe-webhook` · listen to `checkout.session.completed` · copy the signing secret · run `npx wrangler secret put STRIPE_WEBHOOK_SECRET` and paste it.

**WhatsApp webhook (Twilio):**

Twilio Console → Messaging → WhatsApp senders → your number → **Callback URL** → `https://YOUR-WORKER.workers.dev/api/wa-webhook`

**WhatsApp webhook (Meta Cloud API):**

Meta Business → WhatsApp Manager → Configuration → Webhook → paste `https://YOUR-WORKER.workers.dev/api/wa-webhook` and use the same `WA_WEBHOOK_VERIFY_TOKEN` you set as a secret.

## Step 6 · Test end-to-end

1. Open `https://YOU.github.io/onehub/demo/book.html`
2. Click **Book** on any unit
3. Complete Stripe test checkout (`4242 4242 4242 4242`)
4. Confirmation email arrives
5. Booking appears in `https://YOU.github.io/onehub/demo/hub.html`
6. WhatsApp message to your sender number → check hub inbox

If any step fails, check the Cloudflare Worker logs: `npx wrangler tail`.

## Step 7 · Point your domain

In Cloudflare DNS:

- `@` → CNAME `YOU.github.io` (or A records to GitHub Pages IPs · see GitHub docs)
- `www` → CNAME `YOU.github.io`
- `api` → CNAME `YOUR-WORKER.workers.dev` (or map via Worker Routes for tighter integration)

In GitHub Pages settings, set your custom domain to `yourdomain.com`.

Wait for DNS propagation (~15-60 min). Done.

## What to do next

- **Rebrand the CSS palette** if the woodland preset isn't right for your business (edit the `--` custom properties at the top of `index.html`, `demo/hub.html`, `demo/book.html`)
- **Ship the credentials.html pattern to your client operator** (see how Wishwood does it: https://sjgant80-hub.github.io/wishwood/credentials.html)
- **Wire up more channels** as they become relevant (§12 of the credentials checklist covers Hostelworld, Expedia, VRBO, Messenger, Instagram, Telegram, Signal, PayPal, Square, Mailchimp, Google Calendar, QuickBooks, etc.)
- **Read the FallEnterprise tier ladder** if you're delivering this as a paid engagement rather than DIY: https://sjgant80-hub.github.io/fallenterprise/

## When something breaks

`npx wrangler tail` — live Worker logs.

For frontend issues open the browser DevTools console. All errors are logged there.

For deeper help: **sjgant80@gmail.com** · reply within 24h.

`◊·κ=1`
