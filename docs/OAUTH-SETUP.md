# OAuth setup (Google + Apple)

The Google and Apple buttons on `<AccessModal />` are wired through
NextAuth (`/api/auth/[...nextauth]/route.js`). Until the env vars
below exist in Vercel, the buttons display a friendly alert telling
the visitor sign-in is not configured yet.

## Vercel env vars

Set these in **Vercel → Project → Settings → Environment Variables**,
scoped to **Production** (and **Preview** if you want OAuth working
on preview deploys too).

### Required for NextAuth itself

| Name              | Value                                                       |
| ----------------- | ----------------------------------------------------------- |
| `NEXTAUTH_URL`    | `https://www.xovnd.com`                                     |
| `NEXTAUTH_SECRET` | a random 32+ char string — generate with `openssl rand -base64 32` |

### Google OAuth

| Name                    | How to get                                                |
| ----------------------- | --------------------------------------------------------- |
| `GOOGLE_CLIENT_ID`      | Google Cloud Console → APIs & Services → Credentials → Create OAuth Client ID (Web application) |
| `GOOGLE_CLIENT_SECRET`  | Same screen, shown once after creation                    |

Authorized redirect URI to paste into Google's setup:

```
https://www.xovnd.com/api/auth/callback/google
```

(Also add `http://localhost:3000/api/auth/callback/google` if you
test locally.)

### Apple OAuth

Apple needs a paid Apple Developer account ($99/yr) and Sign in with
Apple enabled for your app's Services ID.

| Name           | How to get                                                                                  |
| -------------- | ------------------------------------------------------------------------------------------- |
| `APPLE_ID`     | Your Services ID (e.g. `com.xovnd.web`)                                                     |
| `APPLE_SECRET` | A JWT signed with your Apple `.p8` private key — generate with the official Apple snippet   |

Apple's `APPLE_SECRET` rotates every 6 months. The
[next-auth docs](https://next-auth.js.org/providers/apple) include a
ready-to-run JWT generator.

Authorized return URL:

```
https://www.xovnd.com/api/auth/callback/apple
```

## Once env vars are live

1. Save the variables in Vercel.
2. Trigger a redeploy (push any commit, or the Vercel UI's "Redeploy"
   on the latest deployment).
3. Reload the site. The Google / Apple buttons now jump straight to
   the provider's sign-in flow instead of showing the alert.

## What the buttons do today (no env vars set)

- Click → friendly alert telling you which env vars to add.
- The code-redeem and "Request access" tabs work end-to-end already.
