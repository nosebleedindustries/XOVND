'use client';
import ComingSoon from '@/components/ComingSoon';

export default function AdminPage() {
  return (
    <ComingSoon
      title="Admin."
      current=""
      body="Sales analytics, customer search, ticket inbox, forum moderation, manual license issuance. The legacy admin.jsx depended on an in-memory mock DB (window.xovndDB) that doesn't fit the Next.js model — it gets a proper port in Phase 2B.9 once Supabase is in. Route will be middleware-protected."
    />
  );
}
