import GoogleProvider from 'next-auth/providers/google';
import AppleProvider from 'next-auth/providers/apple';

/* NextAuth options shared by the API route + (eventually) any server
   actions that need session info. Keep secrets in env; never inline. */

const providers = [];

if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  providers.push(
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      authorization: { params: { prompt: 'consent', access_type: 'offline', response_type: 'code' } },
    })
  );
}

if (process.env.APPLE_ID && process.env.APPLE_SECRET) {
  providers.push(
    AppleProvider({
      clientId: process.env.APPLE_ID,
      clientSecret: process.env.APPLE_SECRET,
    })
  );
}

export const authOptions = {
  providers,
  session: { strategy: 'jwt' },
  callbacks: {
    async jwt({ token, account, profile }) {
      if (account) token.provider = account.provider;
      return token;
    },
    async session({ session, token }) {
      if (token?.provider) session.provider = token.provider;
      return session;
    },
  },
  pages: {
    // Use our AccessModal as the sign-in surface — NextAuth's default
    // pages are bare. If signIn() is called without a UI, NextAuth
    // falls back to its own page; we usually call signIn(provider, ...)
    // directly so this never fires for the happy path.
  },
};

export const isProviderConfigured = (name) => {
  if (name === 'google') return !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
  if (name === 'apple')  return !!(process.env.APPLE_ID && process.env.APPLE_SECRET);
  return false;
};
