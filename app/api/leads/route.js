import { NextResponse } from 'next/server';
import { supabasePublic } from '@/lib/supabase';

/* POST /api/leads — body: { name, email, platform, handle }
   Inserts into Supabase leads table using the publishable key. RLS only
   allows INSERT for anon, so callers can't read anything back. */

export const runtime = 'nodejs';

export async function POST(req) {
  if (!supabasePublic) {
    return NextResponse.json({ ok: false, error: 'Supabase not configured' }, { status: 503 });
  }
  let body;
  try { body = await req.json(); }
  catch { return NextResponse.json({ ok: false, error: 'invalid json' }, { status: 400 }); }

  const name     = (body.name     || '').trim();
  const email    = (body.email    || '').trim().toLowerCase();
  const platform = (body.platform || '').trim() || null;
  const handle   = (body.handle   || '').trim() || null;

  if (!name || !email.includes('@')) {
    return NextResponse.json({ ok: false, error: 'name and valid email required' }, { status: 400 });
  }

  const { error } = await supabasePublic
    .from('leads')
    .insert({ name, email, platform, handle, source: 'web' });
  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
