# Tomorrow — actionable TODO

Snapshot of the actionable backlog as of 2026-05-21.
Update this file after each session so we never lose state.

---

## ✅ Already shipped (no action needed)

- Landing page + product page (live on xovnd.com)
- Beta access modal — code redemption + request-access tabs
- 5 MB installer bundled in `/public/assets/CLVSTER-1.0.0-Win.exe`
- Google sign-in (NextAuth + Vercel env vars)
- Account popup — license, coupon, sign out, delete, terminate
- Supabase backend (`leads` + `redemptions` tables, RLS, indexes)
- `/admin` dashboard reading from Supabase via service-role API
- Centralized lead capture (every form submission lands in Supabase)
- Hero promo video (2:12, with audio, 720p, 8 MB)
- AccessModal also writes to localStorage (offline-tolerant fallback)

---

## 🟥 Blockers — must do tomorrow (≈ 1.5 h)

### Publish CLVSTER on Moonbase
- Log in to https://moonbase.sh dashboard → **New product**
- Slug **must** be `clvster` (matches `productId` baked into the plugin's
  `Resources/Licensing/moonbase_api_config.json` — DO NOT change it)
- Name: `CLVSTER`
- Price: €79 (or whatever final pricing — change later if needed)
- Upload: `C:\Users\stala\Documents\KantianOctoSeq\Installer\Output\CLVSTER-1.0.0-Win.exe`
- Enable JUCE SDK / Moonbase license delivery — plugin already validates
- Publish
- **Verify**: `https://xound.moonbase.sh/buy/clvster` returns 200 (no longer 404)
- **Test buy** with a real card → confirm receipt + buyer code arrive

### Wire the issued buyer code into the site
- Send Joan the buyer code Moonbase issued (e.g. `BUY-XOVND-LIVE-001`)
- Joan adds it to `BUYER_CODES` array in `components/AccessModal.jsx`
  and pushes — ~5 min

---

## 🟧 Should-have tomorrow (≈ 1 h)

### Privacy policy
- Generate `app/privacy/page.jsx` from a EU/GDPR template
- Mention: Supabase as data processor, NextAuth/Google as auth provider,
  Moonbase as payment processor, what we collect (name/email/handle/IP/UA)
- Footer link from every page

### Cookie consent banner
- Required for EU before storing any cookie/localStorage
- Bottom-of-page strip with Accept/Reject buttons
- Block AccessModal/AccountModal localStorage writes until accepted

---

## 🟨 Influencer-program kickoff (≈ 1.5 h)

### First code batch
- Decide names — e.g. `BETA-XOVND-ANGEL`, `BETA-XOVND-LAVA`,
  `BETA-XOVND-RYAN`, etc.
- Joan adds them to `BETA_CODES` in `components/AccessModal.jsx`
- 10–20 codes is plenty for a first wave

### Outreach spreadsheet
- Columns: name, platform, handle, code assigned, sent date, redeemed (✓/✗)
- Source rows from your existing IG/YT/TikTok shortlist
- One row per influencer = one unique code

### Send to first 5
- Personalized DM/email per influencer
- Include: their code, what makes CLVSTER different in 1 sentence,
  what you'd love them to post, the install link, your support email
- Wait for first redemptions to land in `/admin`

### Welcome email draft
- Subject, body, tag line, ask
- Phase 2B.5 wires this to fire automatically via Resend on lead submission

---

## 📅 This week — by EOW

- [ ] Wire Resend for email broadcasts ("Email all betas" button in /admin)
- [ ] Welcome email auto-fires on `/api/leads` insert
- [ ] Add code-generation UI to `/admin` so Joan doesn't need to ship a
      commit to add new beta codes
- [ ] Add "revoke code" UI to `/admin` for if a code leaks
- [ ] Analytics on (Vercel Analytics, free, one click in dashboard)
- [ ] First buyer-code added to source after first paid sale

---

## 📅 Later — Phase 2B.4+

- [ ] Apple sign-in (needs paid Apple Dev account: $99/yr)
- [ ] Real subscription billing — Stripe or Moonbase Subscriptions
- [ ] Email verification on signup (Resend magic link)
- [ ] Per-user license activation count / device management
- [ ] Audit log of admin actions
- [ ] Backups of Supabase tables (automated CSV export to S3 weekly)
- [ ] macOS .pkg installer + Apple notarization

---

## Status reference

| Subsystem | Tech | State |
|---|---|---|
| Frontend | Next.js 14.2 App Router | live |
| Auth | NextAuth + Google | live |
| Database | Supabase Postgres | live |
| Lead capture | `/api/leads` → `leads` table | live |
| Code redemption log | `/api/redemptions` → `redemptions` table | live |
| Admin API | `/api/admin/data` (service-role, gated on `ADMIN_EMAIL`) | live |
| Sales | Moonbase | **PENDING — product not published** |
| Email broadcast | — | not wired |
| Apple OAuth | NextAuth scaffold present | env vars not set |
| Privacy policy | — | not written |
| Cookie banner | — | not implemented |

---

## Vercel env vars currently set
- `NEXTAUTH_URL`, `NEXTAUTH_SECRET`
- `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`
- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `SUPABASE_SECRET_KEY`
- `ADMIN_EMAIL` (= `stalactite3d@gmail.com`)
- Missing: `APPLE_ID`, `APPLE_SECRET`, `RESEND_API_KEY`

---

## Open files / scripts worth keeping in mind
- `scripts/init-supabase.sql` — schema source of truth (idempotent, safe to re-run)
- `scripts/run-sql.mjs` — local runner: `PG_URI=... node scripts/run-sql.mjs`
- `docs/OAUTH-SETUP.md` — Google + Apple OAuth setup steps
- `docs/roadmap/Phase2B-Backend.md` — the full multi-phase plan
