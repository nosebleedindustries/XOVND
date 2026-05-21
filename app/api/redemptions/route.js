import { NextResponse } from 'next/server';
import { supabasePublic } from '@/lib/supabase';

/* POST /api/redemptions — body: { code, type, email?, name? }
   Logs every code-redeem so we can spot reuse / patterns. */

export const runtime = 'nodejs';

export async function POST(req) {
  if (!supabasePublic) {
    return NextResponse.json({ ok: false, error: 'Supabase not configured' }, { status: 503 });
  }
  let body;
  try { body = await req.json(); }
  catch { return NextResponse.json({ ok: false, error: 'invalid json' }, { status: 400 }); }

  const code = String(body.code || '').trim().toUpperCase();
  const type = body.type === 'buyer' ? 'buyer' : 'beta';
  const user_email = body.email ? String(body.email).trim().toLowerCase() : null;
  const user_name  = body.name  ? String(body.name).trim()  : null;
  const user_agent = req.headers.get('user-agent') || null;

  if (!code) {
    return NextResponse.json({ ok: false, error: 'code required' }, { status: 400 });
  }

  const { error } = await supabasePublic
    .from('redemptions')
    .insert({ code, type, user_email, user_name, user_agent });
  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
