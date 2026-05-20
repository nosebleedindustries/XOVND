# XOVND · web

Source for **xound.com** — `https://xovnd.com`.

## Stack

- **Next.js 14** (App Router, JSX — TypeScript migration deferred)
- **React 18**
- Static CSS in `app/globals.css` (merged from the original
  shared / auth / walkthrough stylesheets + per-page inline `<style>`
  blocks; Tailwind migration deferred)
- Vercel hosting, auto-deploy on push to `main`
- All sales currently route to **Moonbase hosted checkout** at
  `https://xound.moonbase.sh/buy/clvster`

## Status

**Phase 2B.1 — Next.js migration in progress.**

The Babel-in-browser multi-page static site has been ported to a
Next.js 14 App Router project. Two critical pages (landing `/` and
CLVSTER product `/clvster`) are fully ported. The remaining pages
(`/account`, `/subscription`, `/trials`, `/support`, `/forum`,
`/admin`, `/auth`, `/walkthrough`) are placeholder stubs that share
the header/footer chrome and link back to the legacy reference.

Original JSX files preserved under [`legacy/`](./legacy/) for
incremental porting.

## Routes

| Route | File | Status |
|---|---|---|
| `/` | `app/page.jsx` | ✅ ported |
| `/clvster` | `app/clvster/page.jsx` | ✅ ported (BUY → Moonbase) |
| `/trials` | `app/trials/page.jsx` | ✅ ported |
| `/account` | `app/account/page.jsx` | 🚧 placeholder |
| `/subscription` | `app/subscription/page.jsx` | 🚧 placeholder |
| `/support` | `app/support/page.jsx` | 🚧 placeholder |
| `/forum` | `app/forum/page.jsx` | 🚧 placeholder |
| `/admin` | `app/admin/page.jsx` | 🚧 placeholder |
| `/auth` | `app/auth/page.jsx` | 🚧 placeholder |
| `/walkthrough` | `app/walkthrough/page.jsx` | 🚧 placeholder |

## Local dev

```bash
npm install
npm run dev          # http://localhost:3000
```

`npm run build` for production build; `npm start` to serve it locally.

## Deploy

Vercel auto-detects Next.js, no config needed. Push to `main` →
auto-deploy to production. Push to any other branch → preview deploy
URL appears in PR / commit.

## Roadmap

Phase 2B detailed checklist in
[`docs/roadmap/Phase2B-Backend.md`](./docs/roadmap/Phase2B-Backend.md):
Supabase auth + DB, Moonbase webhook handler, support tickets, forum
threads, admin analytics, promotion management, email infrastructure,
SEO, mailing list, analytics.

## Shared infrastructure

- **Domain**: Cloudflare Registrar (`xovnd.com`)
- **DNS**: Cloudflare (with Vercel CNAMEs as `DNS only` — don't proxy)
- **Email**: Cloudflare Email Routing — `joan@xovnd.com` → Gmail
- **Hosting**: Vercel (free hobby tier)
- **Future**: Supabase (Postgres + Auth), Resend (email), Plausible
  (analytics), Sentry (errors), EmailOctopus (mailing list)
