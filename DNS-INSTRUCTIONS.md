# DNS setup · ai-nativesolutions.com → FallHub + FallForge

Follow these steps when ready to point the domain. Until then the `.github.io` URLs work as-is.

## What we're setting up

- **`ai-nativesolutions.com`** (apex) → `sjgant80-hub.github.io/fallhub/` — corporate homepage
- **`www.ai-nativesolutions.com`** → same as apex
- **`install.ai-nativesolutions.com`** → `sjgant80-hub.github.io/fallforge/` — the FallForge concierge

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

## Step 2 · Wait for DNS propagation (5-30 min)

Verify with: `dig ai-nativesolutions.com +short` — should return the four GitHub IPs.

## Step 3 · Restore the CNAME files in the repos

In this repo (fallhub):

```bash
cd C:\Users\sjgan\Downloads\onehub
echo "ai-nativesolutions.com" > CNAME
git add CNAME
git commit -m "Point ai-nativesolutions.com at FallHub"
git push
```

In the fallforge repo:

```bash
cd C:\Users\sjgan\Downloads\fallforge
echo "install.ai-nativesolutions.com" > CNAME
git add CNAME
git commit -m "Point install.ai-nativesolutions.com at FallForge"
git push
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
