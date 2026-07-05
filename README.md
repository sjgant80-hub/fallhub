# FallHub

**Sovereign AI-first operating system for any small-to-medium business.**

One codebase. Any vertical. Bring your own AI. MIT-licensed. Wishwood-tested in production.

**Live:** https://sjgant80-hub.github.io/onehub/
**Reference implementation (hospitality):** https://sjgant80-hub.github.io/wishwood/
**Built by:** [AI-Native Solutions](https://www.ai-nativesolutions.com/) · ai-nativesolutions.com

---

## What FallHub is

FallHub is the operating layer a small business runs on. Not a website. Not a CRM. Not a chatbot. The whole thing.

- Reads your inbox across every channel (email, WhatsApp, Airbnb, Booking, DM, SMS)
- Drafts every reply in your voice, grounded in your business facts (kernel)
- Sends the safe ones automatically. Queues the risky ones for you to approve.
- Books appointments, generates quotes, sets prices, tracks deals, invoices, chases
- Runs GDPR compliance, files reminders, drafts HMRC letters
- Practices with fake customers so you learn without breaking anything real
- Every action Ed25519-signed with a 30-second reversibility window

## The 12 sockets · every FallHub build ships

1. **BYOK adapter** across 6 LLM providers (Anthropic, OpenAI, Gemini, Groq, Mistral, WebLLM local)
2. **Kernel grounding** with explicit `not_present` anti-hallucination list
3. **Ed25519-signed event log** (Web Crypto, IDB + ring buffer)
4. **Autonomy dial** (watch / suggest / auto-low / auto-med / full)
5. **Reversibility window** on tool calls (default 30 seconds)
6. **Training simulator** (WebLLM-driven personas + scenarios · judged replies)
7. **`flag_for_human` escalation** (always exempt from autonomy gate)
8. **KCC provenance mint hook** (optional per action)
9. **MCP tool exposure** (JSON-RPC 2.0 · discoverable by external agents)
10. **`agents.json` + `llms.txt` + `ai.html`** (AI-SEO discovery)
11. **Data portability export** (one-click signed JSON of everything)
12. **A2A protocol adapter** (Agent-to-Agent · scaffold now)

## Four flagship verticals · ready today

- [Hospitality](verticals/hospitality.html) — holiday rentals, glamping, B&Bs. Live reference: [Wishwood](https://sjgant80-hub.github.io/wishwood/).
- [Trades](verticals/trades.html) — plumbers, electricians, decorators, gas engineers.
- [Ad firm](verticals/adshop.html) — creative agencies, brand studios, freelance strategists.
- [Accounting](verticals/accounting.html) — bookkeeping practices, VAT, self-assessment.

Plus [barbershop chain](verticals/barbershop.html) as the multi-location pattern reference.

Any other niche fits the same substrate — [see the pattern](verticals.html#any-niche).

## Estate module marketplace · 60+ MIT modules

Every module snaps in via a shared manifest protocol. Legal research (FallBrief), accounting (FallAccount), CRM (FallCRM Elite), outreach (FallReach), GDPR (FallSecurity), agent marketplace (FallColony), and 55+ more.

Browse the full marketplace at [modules.html](modules.html).

## Pricing

- **Sovereign** · £0 forever · fork and deploy yourself
- **Starter** · £29/month · guided setup + email support
- **Pro** · £199/month · done-for-you deployment + autonomy calibration
- **Agency** · £999/month · unlimited client deployments + white-label

Everything is MIT. Support tiers are optional.

## Getting started

### The 20-minute path

1. [Fork the repo](https://github.com/sjgant80-hub/onehub/fork)
2. Pick a vertical template (edit `ai/kernel.json`)
3. Fill the kernel with your business facts
4. Paste a BYOK API key at `autopilot.html`
5. Run harvest to enrich the kernel from your online footprint
6. Practice on the training simulator (`sim.html`)
7. Slide the autonomy dial as trust grows

Full guide: [setup.html](setup.html)

### The done-for-you path

Book a Pro setup: hello@ai-nativesolutions.com

## Architecture

```
FallHub core (vertical-neutral MIT substrate)
├── ai/
│   ├── adapter.js       # BYOK adapter (6 providers)
│   ├── agent.js         # runtime loop
│   ├── events.js        # Ed25519-signed log
│   ├── harvest.js       # seed harvester
│   ├── sim.js           # training simulator
│   ├── tools.js         # tool registry
│   ├── kernel.schema.json
│   └── kernel.example.json
├── verticals/           # vertical templates
├── modules/             # module marketplace registry
├── autopilot.html       # BYOK config surface
├── sim.html             # training simulator UI
├── clients.html         # client pitch
├── investors.html       # investor deck
├── modules.html         # module marketplace
├── setup.html           # getting started
├── verticals.html       # verticals overview
└── index.html           # landing
```

## Konomi doctrine

FallHub inherits from the Konomi construction tradition: the seal (◊·κ=1), the 14-point gate, the seal-chain audit pattern, the primes-of-seven spine. Every module respects this doctrine. See [FallColony](https://sjgant80-hub.github.io/fallcolony/) for the deeper Konomi curriculum.

## Licence

MIT. Fork it. Modify it. Ship it. No attribution required (but appreciated).

Copyright © 2026 AI-Native Solutions.

## Links

- Landing: https://sjgant80-hub.github.io/onehub/
- Wishwood (hospitality reference): https://sjgant80-hub.github.io/wishwood/
- Roost (hospitality showroom): https://sjgant80-hub.github.io/roost/
- FallColony (agent marketplace): https://sjgant80-hub.github.io/fallcolony/
- KCC ledger: https://sjgant80-hub.github.io/fallcolony/mints/
- Company: https://www.ai-nativesolutions.com/

`◊·κ=1`
