'use client';
import { SiteHeader, SiteFooter, CartDrawer, useCart, useAuth } from '@/components/shared';
import { useState } from 'react';

/**
 * Generic "page is being migrated" stub. The legacy static HTML for each
 * page still exists at /<page>.html on the Vercel deployment — we keep
 * this placeholder so the Next.js router resolves the route while the
 * full port lands in subsequent Phase 2B.1 sessions.
 */
export default function ComingSoon({ title, current, legacyHref, body }) {
  const { cart, openCart, closeCart, cartOpen, removeAt } = useCart();
  const auth = useAuth();
  const [loginOpen, setLoginOpen] = useState(false);

  const onAccountClick = () => {
    if (auth.user) {
      if (confirm('Signed in as ' + auth.user.email + '\n\nSign out?')) auth.logout();
    } else {
      setLoginOpen(true);
    }
  };

  return (
    <>
      <SiteHeader cartCount={cart.length} onOpenCart={openCart}
        current={current} user={auth.user} onAccountClick={onAccountClick} />
      <main style={{
        minHeight: '70vh',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        padding: '80px 24px', gap: 18, textAlign: 'center'
      }}>
        <div style={{
          fontFamily: "'Space Mono', monospace",
          fontSize: 11, letterSpacing: '0.22em', color: 'var(--pink)',
          textTransform: 'uppercase'
        }}>
          [ Phase 2B.1 · Next.js port in progress ]
        </div>
        <h1 style={{
          fontFamily: "'Archivo Black', sans-serif",
          fontSize: 'clamp(40px, 6vw, 88px)', lineHeight: 0.92,
          margin: 0, letterSpacing: '-0.02em', textWrap: 'balance'
        }}>{title}</h1>
        <p style={{ color: '#b5b0a2', maxWidth: 480, fontSize: 15, lineHeight: 1.55 }}>
          {body}
        </p>
        {legacyHref && (
          <a href={legacyHref} className="btn btn-ghost" style={{
            marginTop: 16, padding: '12px 22px',
            border: '1px solid var(--yellow)', color: 'var(--yellow)',
            borderRadius: 999, fontFamily: "'Space Grotesk', sans-serif",
            fontWeight: 600, fontSize: 13
          }}>
            View the legacy design at {legacyHref} →
          </a>
        )}
      </main>
      <SiteFooter />
      <CartDrawer open={cartOpen} onClose={closeCart} items={cart} onRemove={removeAt} />
    </>
  );
}
