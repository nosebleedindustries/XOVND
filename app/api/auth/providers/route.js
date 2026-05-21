import { NextResponse } from 'next/server';

/* Tiny GET endpoint the client polls to learn which OAuth providers
   are configured server-side (without leaking secrets). The
   AccessModal uses this to swap the social buttons between "live"
   and a friendly "configure env" tooltip. */

export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json({
    google: !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET),
    apple:  !!(process.env.APPLE_ID && process.env.APPLE_SECRET),
  });
}
