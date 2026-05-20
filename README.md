# XOVND · web

Source for the XOVND web presence (xound.com) — landing, CLVSTER product page, account / forum / admin / support pages.

## Stack

- **Phase 2A (current)**: static HTML + React loaded from CDN + Babel-in-browser. No build step. Hosted on Vercel from this repo.
- **Phase 2B (next)**: convert to Next.js 14 App Router; add Supabase (auth + Postgres) and Vercel serverless functions for backend (Moonbase webhooks, forum, admin).

## Pages

| Page | URL | Status |
|---|---|---|
| Landing | `/` (`index.html`) | live |
| CLVSTER product | `/clvster` | live · BUY → Moonbase checkout |
| Account | `/account` | UI only — backend in Phase 2B |
| Auth | `/auth` | UI only |
| Subscription | `/subscription` | UI only |
| Trials | `/trials` | UI only |
| Support | `/support` | UI only |
| Forum | `/forum` | UI only |
| Admin | `/admin` | UI only |
| Walkthrough | `/walkthrough` | live |

## Sales

CLVSTER BUY buttons currently link to the Moonbase hosted checkout:
`https://xound.moonbase.sh/buy/clvster`

Moonbase handles:
- MoR (merchant of record)
- VAT / GST / sales tax compliance
- Localised currency + card processing
- Customer license key delivery via email
- Customer portal (subscription management, downloads, license deactivation)

To flip the BUY action back to the in-browser cart UI (for testing the
multi-product cart flow), set `window.__USE_LOCAL_CART = true` in the
browser console before clicking.

## Deploy

Auto-deploys on push to `master` via Vercel. Domain config in Vercel
dashboard → Settings → Domains.

## Local dev

Open `index.html` in a modern browser (Chrome / Edge / Firefox). Because
all JSX is compiled in-browser via Babel-standalone, no build step is
needed locally. Use `python -m http.server 8000` if you want a quick local
server (avoids `file://` CORS issues with the fonts).
