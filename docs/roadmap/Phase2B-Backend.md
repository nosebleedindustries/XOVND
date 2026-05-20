# Phase 2B — Web backend

**Status:** unblocked — Phase 2A (static deploy) ✅ done
**Estimate:** 3–5 focused sessions over ~2–3 weeks

Picks up from Phase 2A (static `xovnd.com` on Vercel with Moonbase hosted
checkout) and turns the design's account / forum / admin / support /
subscription pages into a real working application.

---

## ✅ Phase 2A — already done

- [x] `xovnd.com` registered (Cloudflare Registrar)
- [x] Vercel project deployed, GitHub auto-deploys on push to `main`
- [x] DNS configured + SSL provisioned (Vercel-managed)
- [x] Cloudflare Email Routing: `joan@xovnd.com` forwards to gmail
- [x] CLVSTER BUY buttons route to Moonbase hosted checkout

---

## 🟢 Phase 2B — checklist

### 2B.1 · Next.js migration
The current site is multi-page HTML + React-via-Babel-in-browser. Works
for static content but can't host serverless API routes, auth middleware,
or DB queries. Migrate to Next.js 14 (App Router) to get all three.

- [ ] `npx create-next-app@latest` → fresh Next.js 14 project, TypeScript,
      Tailwind CSS, App Router, ESLint
- [ ] Port each page → corresponding `app/<route>/page.tsx`:
  - `index.html` → `app/page.tsx`
  - `clvster.html` → `app/clvster/page.tsx`
  - `account.html` → `app/account/page.tsx`
  - `auth.html` → `app/auth/page.tsx`
  - `subscription.html` → `app/subscription/page.tsx`
  - `trials.html` → `app/trials/page.tsx`
  - `support.html` → `app/support/page.tsx`
  - `forum.html` → `app/forum/page.tsx`
  - `admin.html` → `app/admin/page.tsx` (protected — see 2B.8)
  - `walkthrough.html` → `app/walkthrough/page.tsx`
- [ ] Move shared components from `shared.jsx` → `components/` folder
- [ ] CSS: keep current vanilla CSS in `app/globals.css`, migrate
      component-level styles to Tailwind incrementally
- [ ] Move assets to `public/`
- [ ] Verify all routes render + look identical to Phase 2A
- [ ] Update `vercel.json` (or delete — Next.js needs none)
- [ ] First `vercel deploy` from the Next.js codebase → confirm
      `xovnd.com` still loads

### 2B.2 · Database + auth — Supabase
Supabase = managed Postgres + auth + storage + realtime. Free tier
covers everything we need at launch (<50k MAU, 500MB DB, 1GB storage).

- [ ] Sign up at https://supabase.com — create project `xovnd`
- [ ] Note the project URL + anon key + service role key
- [ ] Install `@supabase/supabase-js` + `@supabase/ssr` in the Next.js project
- [ ] Create `lib/supabase/server.ts` + `lib/supabase/client.ts`
      (SSR + browser variants — standard pattern)
- [ ] Create initial tables:

```sql
-- Email-magic-link / Google OAuth users handled by Supabase Auth itself;
-- we just need a per-user profile table that links to it.
create table profiles (
  id           uuid primary key references auth.users on delete cascade,
  email        text unique not null,
  display_name text,
  avatar_url   text,
  created_at   timestamptz default now()
);

create table support_tickets (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid references auth.users,
  email        text not null,
  subject      text not null,
  body         text not null,
  status       text default 'open',  -- open / in_progress / closed
  created_at   timestamptz default now()
);

create table forum_threads (
  id           uuid primary key default gen_random_uuid(),
  author_id    uuid references auth.users,
  title        text not null,
  category     text not null,        -- 'help' / 'feature' / 'showcase' etc.
  created_at   timestamptz default now(),
  pinned       boolean default false
);

create table forum_posts (
  id           uuid primary key default gen_random_uuid(),
  thread_id    uuid references forum_threads on delete cascade,
  author_id    uuid references auth.users,
  body_md      text not null,
  created_at   timestamptz default now()
);

-- Cache of sales pulled from Moonbase webhooks — lets the admin
-- dashboard query analytics without hitting Moonbase every page load.
create table sales (
  id              uuid primary key default gen_random_uuid(),
  moonbase_order  text unique not null,
  customer_email  text,
  product_id      text,
  amount_cents    integer,
  currency        text,
  channel         text,                  -- 'direct' / 'plugin_boutique' / etc.
  voucher_batch   text,
  created_at      timestamptz default now()
);
```

- [ ] Enable Row Level Security on every table; write RLS policies
      (users can read/write their own rows; admin role can read all)
- [ ] Add Supabase env vars to Vercel project settings

### 2B.3 · Auth pages — Supabase Auth
Replace the design's UI-only auth flow with real signups.

- [ ] **Login** — Supabase magic-link (passwordless email):
  ```ts
  await supabase.auth.signInWithOtp({ email });
  ```
- [ ] **Google OAuth** — enable in Supabase dashboard → Auth → Providers,
      add Google OAuth client ID/secret (Google Cloud Console),
      configure redirect URL `https://xovnd.com/auth/callback`
- [ ] **Sign-out** button on every page when logged in
- [ ] **Auth middleware** — `middleware.ts` that protects `/account`,
      `/subscription`, `/trials`, `/forum/post`, `/admin`
- [ ] On first login: insert a row in `profiles` automatically
      (trigger or callback)

### 2B.4 · Moonbase webhook handler
Single Vercel serverless function that handles every Moonbase event.

- [ ] In Moonbase dashboard → **Settings → Webhooks → Add Endpoint**:
  - URL: `https://xovnd.com/api/moonbase-webhook`
  - Subscribe: `license.created`, `license.activated`,
    `voucher.redeemed`, `refund.processed`, `chargeback.opened`,
    `subscription.created`, `subscription.cancelled`,
    `subscription.payment_failed`
  - Copy signing secret → set as `MOONBASE_WEBHOOK_SECRET` env var on Vercel
- [ ] Create `app/api/moonbase-webhook/route.ts`:
  - Read raw body
  - Verify HMAC SHA-256 of body using signing secret vs
    `x-moonbase-signature` header
  - 401 if mismatch
  - Switch on `event.type`:
    - `license.created` → insert into `sales`, send welcome email
      via Resend with the license key
    - `voucher.redeemed` → insert into `sales` with `channel` =
      derived from voucher `batch_name`
    - `refund.processed` → mark sale as refunded, send confirmation
    - `chargeback.opened` → flag for manual review, notify admin
    - `subscription.*` → upsert subscription state
- [ ] Test with Moonbase's webhook test-fire feature
- [ ] Verify Vercel function logs (no errors, 200 responses)

### 2B.5 · Email infrastructure — Resend
- [ ] Sign up at https://resend.com (free tier: 3k/mo)
- [ ] Verify `xovnd.com` domain in Resend (adds 3 DNS records to
      Cloudflare — SPF, DKIM, MX-equivalent — they walk you through)
- [ ] Set `RESEND_API_KEY` env var on Vercel
- [ ] Build email templates (`lib/email/templates.tsx` — React Email):
  - `WelcomeWithLicense.tsx` — sent on `license.created`
  - `RefundConfirmation.tsx` — sent on `refund.processed`
  - `SupportTicketReceived.tsx` — sent on ticket form submit
  - `MagicLinkLogin.tsx` — optional custom magic-link template
- [ ] Wire all four to fire from the appropriate API route

### 2B.6 · Account / Subscription / Trial pages
The design has the UI; we just wire it to real data.

- [ ] Create `lib/moonbase/client.ts` — wrapper around Moonbase REST API
  - `getLicensesForCustomer(email)`
  - `getSubscriptionStatus(customerId)`
  - `getTrialsForCustomer(email)`
  - `deactivateMachine(licenseId, machineId)`
- [ ] Auth Moonbase API calls with API key (env var `MOONBASE_API_KEY`,
      generated from Moonbase Settings → API Keys)
- [ ] `/account` page: server component fetches user's licenses from
      Moonbase via their email, renders the design's account UI with
      real data (license keys, activation counts, expiry dates)
- [ ] **Deactivate machine** button → calls Moonbase API → revalidate
- [ ] `/subscription` page: same pattern, list subscriptions, "Cancel"
      button → calls Moonbase API
- [ ] `/trials` page: list trial periods, days remaining, "Convert to
      full license" → opens checkout URL

### 2B.7 · Support ticket system
- [ ] `/support` page: contact form (subject + body + email if not
      logged-in)
- [ ] Submit → POST `/api/support/create` → inserts into `support_tickets`,
      sends:
  - Confirmation to the submitter (via Resend)
  - Notification to `joan@xovnd.com` with ticket link to admin panel
- [ ] Optional: integrate with **Help Scout** or **Crisp** instead of
      building your own — both have free tiers and proper inbox UX

### 2B.8 · Forum
- [ ] `/forum` page: list threads grouped by category, with pinned
      threads first
- [ ] `/forum/[category]` page: list threads in that category
- [ ] `/forum/thread/[id]` page: thread view + posts + reply form
      (requires login)
- [ ] `/forum/new` page: create new thread (requires login)
- [ ] Markdown rendering: `@uiw/react-md-editor` or `react-markdown`
- [ ] Realtime updates via Supabase Realtime (optional polish)
- [ ] Moderation:
  - User reports → flag in DB
  - Admin can delete posts / lock threads
- [ ] Anti-spam: hCaptcha on signup; rate limit on post creation
  (Vercel KV or Upstash Redis)

### 2B.9 · Admin panel
- [ ] Auth middleware → only allow access to specific emails
      (`joan@xovnd.com`, future team members) — keep simple, can
      migrate to a `role` column on `profiles` later
- [ ] `/admin` overview:
  - Total sales (last 7d / 30d / lifetime)
  - Revenue (gross + net after Moonbase fees)
  - Active licenses count
  - Active subscriptions count
  - Refund rate
- [ ] `/admin/sales` — table of all sales, filterable by channel,
      date range, refund status
- [ ] `/admin/customers` — search customers by email, view their
      licenses, subscriptions, support tickets, forum activity
- [ ] `/admin/tickets` — support ticket inbox, reply UI
- [ ] `/admin/forum` — moderation tools
- [ ] `/admin/issue-license` — manually issue a free license (press,
      friends, contests)
- [ ] All analytics queries against `sales` table (populated by
      webhook handler) — Moonbase data is local + queryable

### 2B.10 · Promotion management
- [ ] Moonbase has a **Coupons** panel — promos live there server-side
- [ ] `/admin/promos` page: list active / scheduled / expired coupons,
      create new (calls Moonbase Coupons API):
  - Code (e.g. `BLACKFRIDAY30`)
  - Discount type (% or fixed amount)
  - Valid from / until
  - Max uses (total + per customer)
  - Applicable products
  - Geographic restrictions
- [ ] Public `/promos` page — show currently-active promos (banner)
- [ ] **Announcement marquee** on landing page (the yellow scrolling
      bar in the design) — driven by `active_announcements` Supabase
      table, edited from `/admin/announcements`
- [ ] Track redemptions via `voucher.redeemed` / `coupon.applied`
      webhooks → analytics in admin
- [ ] **Mailing-list integration** — when launching a promo, blast
      the EmailOctopus list with a templated announcement

### 2B.11 · Analytics + monitoring
- [ ] **Plausible** for site analytics (privacy-friendly, €9/mo,
      or self-hosted free) → script tag in `app/layout.tsx`
- [ ] **Vercel Analytics** (free tier) for performance / Core Web Vitals
- [ ] **Sentry** for error tracking (free 5k events/mo)
- [ ] Custom event tracking on:
  - "Buy button clicked"
  - "Activate from in-plugin link"
  - "Support ticket submitted"
  - "Forum post created"

### 2B.12 · Mailing-list capture
- [ ] EmailOctopus account (free up to 2.5k subs)
- [ ] Embed signup widget in landing-page footer + dedicated
      `/notify-me` page
- [ ] Optionally segment: "Pre-launch", "CLVSTER owners", "Newsletter"
- [ ] Pre-fill subscribers list during pre-launch + launch (Phase 4)

### 2B.13 · SEO + Open Graph
- [ ] `app/layout.tsx`: proper `<title>`, `<meta description>`,
      `<meta property="og:*">` per page
- [ ] `/sitemap.xml` (Next.js built-in: `app/sitemap.ts`)
- [ ] `/robots.txt`
- [ ] OG image generator (Vercel OG: `next/og`) — auto-renders
      branded preview cards for social shares
- [ ] JSON-LD structured data for product page (SoftwareApplication
      schema with price, rating, etc.)

---

## ✅ Definition of Done for Phase 2B

- User can sign up + log in at `xovnd.com` via magic link or Google
- After buying CLVSTER on Moonbase, user sees their license key in
  `/account` (synced via webhook)
- User can deactivate a machine slot from `/account`
- Support ticket form sends real emails + creates DB rows
- Forum is usable: post, reply, browse, search
- Admin panel shows live sales / revenue data
- Promo codes can be created from admin → take effect immediately
  at checkout
- All page loads < 1s, lighthouse score ≥ 90
- Plausible / Vercel Analytics show real visitor data
- Sentry catches and notifies on errors

---

## ⏱ Aggressive timeline

| Session | Focus | Output |
|---|---|---|
| 1 | 2B.1 · Next.js migration | Existing static site rebuilt as Next.js + still deploying to xovnd.com |
| 2 | 2B.2 + 2B.3 · Supabase auth + DB | Working login/signup, profiles, empty tables |
| 3 | 2B.4 + 2B.5 + 2B.6 · Moonbase webhook + emails + account | Customer pages show real license data; webhook syncs sales |
| 4 | 2B.7 + 2B.8 · Support + Forum | Working ticket system + functional forum threads/posts |
| 5 | 2B.9 + 2B.10 · Admin + Promos | Full admin dashboard, ability to create + manage promotions |
| 6 (polish) | 2B.11 + 2B.12 + 2B.13 · Analytics + SEO | Production-ready, monitored, indexed |

---

## Pre-launch readiness

When Phase 2B is done, the site is functionally ready for the
Phase 4 launch campaign. Everything customers need (buy, activate,
account, support, community) and everything you need (sales analytics,
ticket inbox, promo management) is live and works in production.
