import { createClient } from '@supabase/supabase-js';

/* Two Supabase clients:
   - supabasePublic — uses the publishable key. Safe to use in browser code
     or unauthenticated server routes. Only allowed actions match the RLS
     policies (INSERT on leads + redemptions).
   - supabaseAdmin  — uses the secret key. Server-only. Bypasses RLS.
     Never import from a client component. */

const URL          = process.env.NEXT_PUBLIC_SUPABASE_URL;
const PUBLIC_KEY   = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const SECRET_KEY   = process.env.SUPABASE_SECRET_KEY;

export const supabasePublic = URL && PUBLIC_KEY
  ? createClient(URL, PUBLIC_KEY, { auth: { persistSession: false } })
  : null;

export const supabaseAdmin = (URL && SECRET_KEY)
  ? createClient(URL, SECRET_KEY, { auth: { persistSession: false } })
  : null;

export const isConfigured = () => !!(URL && PUBLIC_KEY);
