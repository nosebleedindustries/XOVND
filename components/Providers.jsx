'use client';
import { SessionProvider } from 'next-auth/react';

/* Root-level wrapper so any client component can call useSession()
   or signIn()/signOut() from next-auth/react. Mounted from
   app/layout.jsx. */

export default function Providers({ children }) {
  return <SessionProvider>{children}</SessionProvider>;
}
