import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth-options';
import { supabaseAdmin } from '@/lib/supabase';

/* GET /api/admin/data — returns { leads, redemptions } from Supabase.
   Service-role only access, gated on the NextAuth session matching
   ADMIN_EMAIL env var (set to your Google account email in Vercel). */

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  const session = await getServerSession(authOptions);
  const adminEmail = (process.env.ADMIN_EMAIL || '').toLowerCase();
  if (!session?.user?.email || session.user.email.toLowerCase() !== adminEmail) {
    return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 });
  }
  if (!supabaseAdmin) {
    return NextResponse.json({ ok: false, error: 'Supabase not configured' }, { status: 503 });
  }

  const [leadsRes, redempRes] = await Promise.all([
    supabaseAdmin.from('leads').select('*').order('signed_at', { ascending: false }).limit(1000),
    supabaseAdmin.from('redemptions').select('*').order('redeemed_at', { ascending: false }).limit(1000),
  ]);

  if (leadsRes.error || redempRes.error) {
    return NextResponse.json({
      ok: false,
      error: leadsRes.error?.message || redempRes.error?.message,
    }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    leads: leadsRes.data || [],
    redemptions: redempRes.data || [],
  });
}
