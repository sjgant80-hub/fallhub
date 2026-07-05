# DNS setup · ai-nativesolutions.com → FallHub + FallForge

Follow these steps when ready to point the domain. Until then the `.github.io` URLs work as-is.

## What we're setting up

- **`ai-nativesolutions.com`** (apex) → `sjgant80-hub.github.io/fallhub/` — corporate homepage
- **`www.ai-nativesolutions.com`** → same as apex
- **`install.ai-nativesolutions.com`** → `sjgant80-hub.github.io/fallforge/` — the FallForge concierge
- **`roost.ai-nativesolutions.com`** → `sjgant80-hub.github.io/roost/` — hospitality showroom
- **`adshop.ai-nativesolutions.com`** → `sjgant80-hub.github.io/adshop/` — creative-agency showroom
- **`trades.ai-nativesolutions.com`** → `sjgant80-hub.github.io/tradeshub/` — trades showroom
- **`barber.ai-nativesolutions.com`** → `sjgant80-hub.github.io/barberhq/` — multi-location chain showroom

## Step 1 · Add DNS records at your registrar

For **`ai-nativesolutions.com`** (apex) — four A records to GitHub Pages IPs:

```
Type   Name   Value
A      @      185.199.108.153
A      @      185.199.109.153
A      @      185.199.110.153
A      @      185.199.111.153
```

For **`www.ai-nativesolutions.com`**:

```
Type    Name    Value
CNAME   www     sjgant80-hub.github.io
```

For **`install.ai-nativesolutions.com`**:

```
Type    Name    Value
CNAME   install sjgant80-hub.github.io
```

For the showroom subdomains (add each as its own CNAME):

```
Type    Name     Value
CNAME   roost    sjgant80-hub.github.io
CNAME   adshop   sjgant80-hub.github.io
CNAME   trades   sjgant80-hub.github.io
CNAME   barber   sjgant80-hub.github.io
```

## Step 2 · Wait for DNS propagation (5-30 min)

Verify with: `dig ai-nativesolutions.com +short` — should return the four GitHub IPs.

## Step 3 · Restore the CNAME files (one-shot script)

After DNS has propagated, paste this whole block into your terminal — it restores every CNAME in one go:

```bash
# fallhub → apex
cd /c/Users/sjgan/Downloads/onehub && echo "ai-nativesolutions.com" > CNAME && git add CNAME && git commit -m "Point ai-nativesolutions.com at FallHub" && git push
# fallforge → install subdomain
cd /c/Users/sjgan/Downloads/fallforge && echo "install.ai-nativesolutions.com" > CNAME && git add CNAME && git commit -m "Point install.ai-nativesolutions.com at FallForge" && git push
# roost → hospitality showroom
cd /c/Users/sjgan/Downloads/roost && echo "roost.ai-nativesolutions.com" > CNAME && git add CNAME && git commit -m "Point roost.ai-nativesolutions.com at Roost" && git push
# adshop → creative-agency showroom
cd /c/Users/sjgan/Downloads/adshop && echo "adshop.ai-nativesolutions.com" > CNAME && git add CNAME && git commit -m "Point adshop.ai-nativesolutions.com at AdShop" && git push
# tradeshub → trades showroom
cd /c/Users/sjgan/Downloads/tradeshub && echo "trades.ai-nativesolutions.com" > CNAME && git add CNAME && git commit -m "Point trades.ai-nativesolutions.com at TradesHub" && git push
# barberhq → chain showroom
cd /c/Users/sjgan/Downloads/barberhq && echo "barber.ai-nativesolutions.com" > CNAME && git add CNAME && git commit -m "Point barber.ai-nativesolutions.com at BarberHQ" && git push
```

## Step 4 · Enable HTTPS in GitHub Pages settings

For each repo (`fallhub` and `fallforge`):

1. Go to Settings → Pages
2. Under "Custom domain", GitHub will show your domain
3. Wait ~1 hour for GitHub to provision the Let's Encrypt cert
4. Check "Enforce HTTPS"

## Step 5 · Test

- `https://ai-nativesolutions.com/` → FallHub landing
- `https://www.ai-nativesolutions.com/` → FallHub landing (redirects)
- `https://install.ai-nativesolutions.com/` → FallForge landing

## Rollback

If anything goes wrong, delete the CNAME file from either repo and push. Reverts instantly.

---

Kept in sync with the estate. Update these instructions if a new subdomain is added (e.g. `roost.ai-nativesolutions.com`, `adshop.ai-nativesolutions.com`).
