# OneHub · Client Setup Checklist (Template)

This is the generic operator checklist. **Fork it, rename it, put it in your operator's repo**, and use it as the single point of contact for gathering everything you need.

**Live reference implementation:** https://sjgant80-hub.github.io/wishwood/credentials.html

That's the Wishwood version rendered as an HTML page matching their site aesthetic. Copy the pattern.

---

## For the operator

Work through top-to-bottom. Fill `<paste here>` slots. Send back to your OneHub installer as each section is complete — don't wait for all of them.

## 1 · Stripe (direct booking payments)

**MUST-HAVE** to accept payments.

- Stripe account? https://dashboard.stripe.com/register → Yes / No
- **Publishable key (live):** `pk_live_...` → `<paste>`
- **Secret key (live):** `sk_live_...` → `<paste>`
- **Publishable key (test):** `pk_test_...` → `<paste>`
- **Secret key (test):** `sk_test_...` → `<paste>`
- **Webhook signing secret** (added after installer gives you the endpoint URL): `whsec_...` → `<paste>`
- Bank account for payouts confirmed? Yes / No

## 2 · Booking.com

**MUST-HAVE** if listed there.

- Extranet login working? Yes / No
- Property ID (numeric from URL): `<paste>`
- **iCal export URL** per unit (one per bookable listing): `<paste x N>`

## 3 · Airbnb

**MUST-HAVE** if listed there. Airbnb has no direct API for small hosts — iCal export only.

- Host account working? Yes / No
- **iCal export URL** per listing: `<paste x N>`

## 4 · Agoda / other OTAs (optional)

- Listed on Agoda? Yes / No
- YCS access confirmed? Yes / No
- Property code + iCal exports: `<paste>`

## 5 · WhatsApp Business (pick ONE)

**MUST-HAVE** for unified guest comms. Start early — sender approval takes 1-2 weeks.

**Option A · Twilio (easier signup):**
- Account SID: `<paste>`
- Auth Token: `<paste>`
- WhatsApp sender number (E.164): `<paste>`

**Option B · Meta Cloud API (cheaper long-term):**
- WABA ID · Phone Number ID · Permanent access token · App ID + Secret: `<paste each>`

## 6 · Email (sending confirmations)

**MUST-HAVE.** Pick one:

**Option A · Resend** (recommended)
- API key `re_...` → `<paste>`
- Domain verified? Yes / No
- From address (e.g. `bookings@example.co.uk`): `<paste>`

**Option B · SendGrid**
- API key `SG.___` → `<paste>`
- Verified sender/domain: Yes / No

## 7 · Email (receiving guest replies · nice-to-have)

- Current inbox address: `<paste>`
- App password for IMAP fetch: `<paste>`
- IMAP host + port (e.g. `imap.gmail.com:993`): `<paste>`

## 8 · SMS fallback (nice-to-have)

- Twilio UK phone number (uses same Twilio account as §5A): `<paste E.164>`

## 9 · Cloudflare (webhooks live here)

**MUST-HAVE.** Free tier fine.

- Cloudflare account? Yes / No
- Domain added + nameservers switched? Yes / No
- Zone ID: `<paste>`
- Account ID: `<paste>`
- API token (scope: Workers Scripts Edit + KV Edit): `<paste>`

## 10 · Domain

**MUST-HAVE.**

- Registrar: `<paste>`
- Domain name: `<paste>`
- Nameservers pointed at Cloudflare? Yes / No
- Existing DNS records worth preserving: `<paste list>`

## 11 · Business + legal

**MUST-HAVE** before Stripe payouts + WhatsApp verification.

- Registered business name · Business address · UTR / Companies House number · VAT registered? · Guest contact phone · Guest contact email — `<paste each>`

## 12 · Other platforms (the gap section)

**NICE-TO-HAVE.** Anything not covered above:

- Other OTA channels · Hostelworld, Expedia, VRBO, Sawday's, Canopy & Stars, Pitchup, Coolstays, etc.
- Other messaging · Facebook Messenger, Instagram DM, Telegram, Signal
- Other payments · PayPal, Square, Klarna, bank transfer
- Other integrations · Mailchimp, Google Calendar, Trustpilot, smart-home, QuickBooks, Xero, Zapier
- **Anything else** — describe in your own words: `<paste>`

## 13 · Operator access

**MUST-HAVE** for handover.

- Chosen admin dashboard password: `<paste>`
- Operator phone (for WhatsApp Business + SMS + 2FA): `<paste E.164>`
- Personal email for recovery: `<paste>`
- 2FA method preferred (SMS / authenticator / paper codes): `<paste>`

## 14 · AI keys (optional)

If left blank, OneHub falls back to browser-native WebLLM (free, works offline, slower first load).

- Anthropic API key `sk-ant-...`: `<paste or leave blank>`
- OpenAI API key `sk-...`: `<paste or leave blank>`

---

## What to send back

Format · just paste values from each section into a message with the section number. Example:

```
§1 Stripe
Publishable live: pk_live_ABC123
Secret live: sk_live_XYZ789
Bank confirmed: yes

§9 Cloudflare
Zone ID: abc123...
Account ID: def456...
API token: ...
```

**Send via Signal / iMessage / physical hand-off · NOT email or WhatsApp.** Some of these are secrets an attacker could use to charge cards, send messages as your operator, or drain their bank account.

---

## When to send what

Don't wait to send everything at once. Each section is independent — installer can start wiring integrations in parallel with the operator gathering the next section.

Priority order for the operator to start without installer involvement:

1. Stripe signup + UK verification (§1) · 1-2 days KYC lag
2. Twilio signup + request WhatsApp sender (§5A) · 1-2 weeks approval · **start early**
3. Cloudflare account + add domain (§9) · 30 min
4. Resend signup + add domain (§6A) · 1 hour once DNS is set
5. Business info (§11) · already known

`◊·κ=1`
