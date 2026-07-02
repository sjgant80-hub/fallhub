# OneHub

**Sovereign direct-booking + unified inbox + AI reply drafting for independent stay operators.**

Fork one repo · edit one config · live in a day. No monthly SaaS.

**Live case study:** https://sjgant80-hub.github.io/wishwood/  · [Wishwood story →](case-studies/wishwood.html)

**Landing:** https://sjgant80-hub.github.io/onehub/

---

## For operators

Independently run a glamping site, B&B, boutique hotel, campsite, cottage, treehouse retreat, or shepherd's hut?

You're probably paying £79-£200/month for a channel manager + £25/month for a booking widget + 15% to Airbnb on every booking. That's £948+/year for tools you don't own.

OneHub replaces the channel manager, booking widget, and unified-inbox tools with one repo you fork and configure. MIT-licensed. Free tier of Cloudflare covers a small operator.

See [Wishwood's live setup](https://sjgant80-hub.github.io/wishwood/) for the reference operator.

## For developers / agencies

OneHub is a fork-and-configure product template. You can:

- Deploy for your own hospitality business (~30-60 min setup)
- Deploy for clients as a paid service (typical rate: £599-£3,499 per deployment, see the [Fiverr G6 pricing tiers](https://github.com/sjgant80-hub/fiverr-launch-pack) for the reference commercials)
- Fork the codebase and add features specific to your vertical
- Skin it entirely for your own brand — the `config.brand` block covers colours, fonts, and glyph

## Repo layout

```
onehub/
├── index.html                             ← marketing landing
├── ai.html                                ← AI agent dossier
├── llms.txt                               ← llms.txt for crawlers
├── robots.txt · sitemap.xml               ← AI-SEO surface
├── config/
│   └── onehub.config.example.json         ← THE config file
├── demo/
│   ├── hub.html                           ← operator inbox demo
│   └── book.html                          ← guest booking demo
├── worker/
│   ├── index.mjs                          ← Cloudflare Worker (webhooks + AI + iCal)
│   ├── wrangler.example.toml
│   └── package.json
├── case-studies/
│   └── wishwood.html                      ← flagship testimonial
├── docs/
│   ├── QUICKSTART.md                      ← fork → live in 30-60 min
│   └── CREDENTIALS-SETUP.md               ← client-onboarding checklist template
└── README.md · LICENSE
```

## Quickstart

Read [`docs/QUICKSTART.md`](docs/QUICKSTART.md) for the full 7-step walk from fork to live domain.

Short version:

```bash
git clone https://github.com/YOU/onehub.git
cd onehub
cp config/onehub.config.example.json config/onehub.config.json
# edit config/onehub.config.json for your business
cd worker
npm install
npx wrangler login
npx wrangler kv:namespace create "ONEHUB_STATE"
# paste the id into worker/wrangler.toml
npx wrangler secret put STRIPE_SECRET_KEY
# ... set other secrets
npm run deploy
cd ..
npx wrangler kv:key put --binding=ONEHUB_STATE 'config' --path=config/onehub.config.json --config=worker/wrangler.toml
git commit -am "my brand config" && git push
# enable GitHub Pages in repo settings
```

## What's in the box

| Piece | What |
|---|---|
| **Landing** (`index.html`) | Marketing hero + Wishwood testimonial + how it works + FAQ · single HTML |
| **Demo Hub** (`demo/hub.html`) | Config-driven operator inbox · unified feed from Airbnb/Booking.com/WhatsApp/Direct/Email · AI draft pane |
| **Demo Book** (`demo/book.html`) | Config-driven guest booking · Stripe checkout stub · calendar view |
| **Worker** (`worker/index.mjs`) | Stripe webhook · WhatsApp webhook (Twilio + Meta) · email inbound · iCal aggregator · AI draft endpoint · SQLite-of-poor-man's audit chain via KV |
| **Config template** (`config/onehub.config.example.json`) | Every operator-specific value — business, units, channels, brand, AI, policies, legal |
| **Case study** (`case-studies/wishwood.html`) | Full Wishwood story with numbers, before/after, deployment timeline |
| **Docs** | Quickstart · client credentials-gathering checklist |

## Deployment stack

- **Frontend** · GitHub Pages (static HTML)
- **Backend** · Cloudflare Workers (webhooks, AI proxy, iCal aggregator) · free tier fine
- **State** · Cloudflare KV (bookings, threads, config)
- **Payments** · Stripe direct (1.4% GBP)
- **Comms** · Twilio / Meta Cloud (WhatsApp) · Resend / SendGrid (email)
- **Domain** · Cloudflare DNS with GitHub Pages CNAME + Worker route

Nothing else. No cloud DB, no external SaaS, no vendor lock-in.

## Composition with the estate

- **FallEnterprise** ([landing](https://sjgant80-hub.github.io/fallenterprise/)) · the £20k-£200k productised delivery service. If you're delivering OneHub for a mid-market or enterprise operator, FallEnterprise's Sovereign/Trained/AI-Native tiers are the pricing ladder.
- **FallRouter** ([landing](https://sjgant80-hub.github.io/fallrouter/)) · the AI orchestrator. OneHub's `worker/index.mjs` can point its `/api/ai-draft` at FallRouter's OpenAI-compatible endpoint to get local Ollama + frontier failover.
- **Wishwood** ([site](https://sjgant80-hub.github.io/wishwood/)) · reference operator running OneHub in production.

## FAQ

See the [landing page FAQ](https://sjgant80-hub.github.io/onehub/#faq) or the case study.

## License

MIT · © 2026 AI Native Solutions · Simon Gant

`◊·κ=1`
