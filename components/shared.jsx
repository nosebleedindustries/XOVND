'use client';
import { useState, useEffect, useCallback, useRef, Fragment } from 'react';
import { useSession, signOut } from 'next-auth/react';

// ─── Marquee ────────────────────────────────────────────────────────────
// mode: 'text' (default scrolling announcements) | 'pattern' (animated
// Perlin dot-grid that fills the strip — toggled from the SiteHeader logo)
export function Marquee({ mode = 'text' }) {
  if (mode === 'pattern') {
    return (
      <div className="announce announce-pattern">
        <DotGridCanvas />
      </div>
    );
  }
  const items = [
    'NEW! CLVSTER CHAIN SEQUENCER',
    'VST3 · AU · AAX',
    'WIN & MAC (UPCOMING)',
    'FREE 14-DAY TRIAL',
  ];
  return (
    <div className="announce">
      <div className="announce-track">
        {[...Array(4)].map((_, k) => (
          <Fragment key={k}>
            {items.map((t, i) => (
              <Fragment key={`${k}-${i}`}>
                <span>{t}</span>
                <span className="dot"></span>
              </Fragment>
            ))}
          </Fragment>
        ))}
      </div>
    </div>
  );
}

// ─── DotGridCanvas ──────────────────────────────────────────────────────
// Vanilla port of the p5 Perlin dot-grid sketch the user shared. Black
// dots on yellow, dot diameter modulated by smooth 2D value noise;
// the `offset` parameter is incremented per frame so the field flows.
function DotGridCanvas() {
  const ref = useRef(null);
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const xScale = 0.05;
    const yScale = 0.10;
    const gap = 10;
    const noise = makeValueNoise();
    let raf = 0;
    let offset = 0;

    function resize() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const r = canvas.getBoundingClientRect();
      canvas.width = Math.max(1, Math.floor(r.width * dpr));
      canvas.height = Math.max(1, Math.floor(r.height * dpr));
      canvas.__dpr = dpr;
    }
    resize();
    window.addEventListener('resize', resize);

    function draw() {
      const w = canvas.width;
      const h = canvas.height;
      const dpr = canvas.__dpr || 1;
      ctx.fillStyle = '#E8D60E';
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = '#000';
      const g = gap * dpr;
      for (let x = g / 2; x < w; x += g) {
        for (let y = g / 2; y < h; y += g) {
          const v = noise((x + offset) * xScale, (y + offset) * yScale);
          const d = v * g;
          ctx.beginPath();
          ctx.arc(x, y, d / 2, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      offset += 0.6;
      raf = requestAnimationFrame(draw);
    }
    raf = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
    };
  }, []);
  return <canvas ref={ref} className="announce-canvas" />;
}

// Smooth 2D value noise — small, dependency-free Perlin substitute.
function makeValueNoise() {
  const p = new Uint8Array(512);
  for (let i = 0; i < 256; i++) p[i] = i;
  for (let i = 255; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const t = p[i]; p[i] = p[j]; p[j] = t;
  }
  for (let i = 0; i < 256; i++) p[i + 256] = p[i];
  const fade = (t) => t * t * t * (t * (t * 6 - 15) + 10);
  const lerp = (a, b, t) => a + t * (b - a);
  const hash = (ix, iy) => p[(p[ix & 255] + (iy & 255)) & 511] / 255;
  return function noise(x, y) {
    const ix = Math.floor(x), iy = Math.floor(y);
    const fx = x - ix, fy = y - iy;
    const u = fade(fx), v = fade(fy);
    const a = lerp(hash(ix, iy),     hash(ix + 1, iy),     u);
    const b = lerp(hash(ix, iy + 1), hash(ix + 1, iy + 1), u);
    return lerp(a, b, v);
  };
}

// ─── SiteHeader ─────────────────────────────────────────────────────────
export function SiteHeader({ cartCount = 0, onOpenCart, current, user, onAccountClick }) {
  const [marqueeMode, setMarqueeMode] = useState('text');
  const [springing, setSpringing] = useState(false);
  const onLogoClick = (e) => {
    e.preventDefault();
    setMarqueeMode((m) => (m === 'text' ? 'pattern' : 'text'));
    setSpringing(true);
    setTimeout(() => setSpringing(false), 600);
  };
  return (
    <>
      <Marquee mode={marqueeMode} />
      <header className="nav">
        <a
          href="/"
          className="brand brand-xovnd"
          aria-label="XOVND home — click to toggle the noise field"
          onClick={onLogoClick}
        >
          <span className={'brand-glow-ring' + (springing ? ' springing' : '')}>
            <img src="/assets/xovnd-logo.png" alt="XOVND" className="xovnd-logo" />
          </span>
        </a>
        <nav className="primary">
          <a href="/" className={current === 'products' ? 'current' : ''}>Products</a>
          <a href="/trials" className={current === 'trials' ? 'current' : ''}>
            Trials<span className="badge">14d</span>
          </a>
          <a href="/subscription" className={current === 'subscription' ? 'current' : ''}>Subscription</a>
          <a href="/support" className={current === 'support' ? 'current' : ''}>Support</a>
          <a href="/forum" className={current === 'forum' ? 'current' : ''}>Forum</a>
        </nav>
        <div className="nav-right">
          <a
            className="nav-btn"
            href="#"
            onClick={(e) => { e.preventDefault(); onAccountClick && onAccountClick(); }}
          >
            {user
              ? (user.name || (user.email && user.email.split('@')[0]) || (user.type === 'beta' ? 'Beta tester' : user.type === 'buyer' ? 'Customer' : 'Account'))
              : 'Account'}
          </a>
          <button className="nav-btn cart-btn" onClick={onOpenCart}>
            Cart <span className="cart-count">{cartCount}</span>
          </button>
        </div>
      </header>
    </>
  );
}

// ─── SiteFooter ─────────────────────────────────────────────────────────
export function SiteFooter() {
  return (
    <footer className="foot">
      <div className="foot-brand">
        <div className="logo">
          <img src="/assets/xovnd-logo.png" alt="XOVND" className="xovnd-logo" style={{ height: 36 }} />
        </div>
        <p>An independent software studio building creative audio instruments for producers, artists, and engineers.</p>
        <div className="socials" style={{ marginTop: 18 }}>
          <a href="#" aria-label="Instagram">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="3.5"/><circle cx="17.5" cy="6.5" r="0.6" fill="currentColor"/></svg>
          </a>
          <a href="#" aria-label="YouTube">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="6" width="20" height="12" rx="3"/><path d="M10 9l5 3-5 3z" fill="currentColor"/></svg>
          </a>
          <a href="#" aria-label="X">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M18 3h3l-7.5 8.5L22 21h-6.5l-5-6.5L4 21H1l8-9-8-9h6.5l4.5 6L18 3z"/></svg>
          </a>
          <a href="#" aria-label="TikTok">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M17 4v3a5 5 0 0 0 4 5v3a8 8 0 0 1-4-1v5a6 6 0 1 1-6-6v3a3 3 0 1 0 3 3V4z"/></svg>
          </a>
        </div>
      </div>
      <div>
        <h4>Products</h4>
        <ul>
          <li><a href="/clvster">CLVSTER</a></li>
          <li><a href="/">All Plugins</a></li>
          <li><a href="#">The Bundle</a></li>
          <li><a href="#">Free Tools</a></li>
          <li><a href="/trials">Trials</a></li>
        </ul>
      </div>
      <div>
        <h4>Resources</h4>
        <ul>
          <li><a href="/support">Support</a></li>
          <li><a href="/forum">Forum</a></li>
          <li><a href="#">Tutorials</a></li>
          <li><a href="/account">Account</a></li>
          <li><a href="#">Refund Policy</a></li>
        </ul>
      </div>
      <div>
        <h4>Studio</h4>
        <ul>
          <li><a href="#">About</a></li>
          <li><a href="#">Blog</a></li>
          <li><a href="#">Jobs</a></li>
          <li><a href="#">Press Kit</a></li>
          <li><a href="/privacy">Privacy</a></li>
        </ul>
      </div>
      <div className="foot-bottom">
        <span>© 2026 XOVND Audio — All sounds reserved</span>
        <span>Mastered in Brooklyn / Built worldwide</span>
      </div>
    </footer>
  );
}

// ─── CartDrawer ─────────────────────────────────────────────────────────
// Phase 2A: the local cart is mostly decorative; every BUY button on
// /clvster routes straight to Moonbase hosted checkout. The Checkout
// button here is a fallback for users who interact with the cart UI
// directly — it sends them to the same Moonbase URL. Phase 2B builds
// a real multi-product cart against the Moonbase Cart API.
const MOONBASE_CHECKOUT = 'https://xound.moonbase.sh/buy/clvster';

export function CartDrawer({ open, onClose, items, onRemove }) {
  const subtotal = items.reduce((s, x) => s + (x.sale || x.price), 0);
  const onCheckout = () => {
    if (items.length === 0) return;
    window.open(MOONBASE_CHECKOUT, '_blank', 'noopener,noreferrer');
  };
  return (
    <>
      <div className={'cart-overlay' + (open ? ' open' : '')} onClick={onClose}></div>
      <aside className={'cart-drawer' + (open ? ' open' : '')} aria-hidden={!open}>
        <div className="cart-head">
          <h3>CART ({items.length})</h3>
          <button className="close-btn" onClick={onClose} aria-label="Close cart">✕</button>
        </div>
        <div className="cart-promo">
          <b>Buy 2 — Get 1 Free</b>
          Add 3 plugins, the cheapest is free at checkout.
        </div>
        {items.length === 0 ? (
          <div className="cart-empty">
            <div className="blob"></div>
            <div>Your cart is empty.</div>
            <div style={{ fontSize: 12, marginTop: 8 }}>Browse plugins above to get started.</div>
          </div>
        ) : (
          <div className="cart-items">
            {items.map((it, i) => (
              <div className="cart-item" key={i}>
                <div className="thumb">{it.name[0]}</div>
                <div>
                  <div className="name">{it.name}</div>
                  <div className="type">{it.type}</div>
                  <button className="remove" onClick={() => onRemove(i)}>Remove</button>
                </div>
                <div className="price">${it.sale || it.price}</div>
              </div>
            ))}
          </div>
        )}
        <div className="cart-foot">
          <div className="cart-subtotal">
            <span className="label">Subtotal</span>
            <span className="amt">${subtotal}</span>
          </div>
          <button
            className="checkout-btn"
            disabled={items.length === 0}
            onClick={onCheckout}
            style={{ opacity: items.length ? 1 : 0.4 }}
          >
            <span>Checkout</span>
            <span>→</span>
          </button>
        </div>
      </aside>
    </>
  );
}

// ─── useCart hook ───────────────────────────────────────────────────────
export function useCart() {
  const [cart, setCart] = useState([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [toast, setToast] = useState('');

  const addToCart = useCallback((p) => {
    setCart((c) => [...c, p]);
    setToast(`Added ${p.name}`);
    setCartOpen(true);
  }, []);
  const removeAt = useCallback((i) => setCart((c) => c.filter((_, k) => k !== i)), []);

  useEffect(() => {
    if (!toast) return;
    const id = setTimeout(() => setToast(''), 1800);
    return () => clearTimeout(id);
  }, [toast]);

  return {
    cart,
    cartOpen,
    openCart: () => setCartOpen(true),
    closeCart: () => setCartOpen(false),
    addToCart,
    removeAt,
    toast,
  };
}

// ─── useAuth (NextAuth session + localStorage redemption) ──────────────
// Identity has two sources during the closed-beta phase:
//   1. NextAuth session — Google/Apple OAuth via /api/auth/[...nextauth]
//   2. localStorage redemption — code entered through <AccessModal />
// NextAuth wins when both are present (a signed-in OAuth user shouldn't
// be downgraded to a code-only user mid-session).
const AUTH_KEY = 'xovnd_user';

export function useAuth() {
  const { data: session, status } = useSession();
  const [local, setLocal] = useState(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const raw = localStorage.getItem(AUTH_KEY);
      if (raw) setLocal(JSON.parse(raw));
    } catch {}
    const onStorage = (e) => {
      if (e.key !== AUTH_KEY) return;
      try { setLocal(e.newValue ? JSON.parse(e.newValue) : null); } catch { setLocal(null); }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const oauthUser = session?.user
    ? {
        name: session.user.name,
        email: session.user.email,
        image: session.user.image,
        provider: session.provider,
      }
    : null;
  const user = oauthUser || local;

  return {
    user,
    status, // 'loading' | 'authenticated' | 'unauthenticated' — useful for UI
    login: (u) => {
      const next = u && typeof u === 'object' ? u : { email: String(u || ''), name: String(u || '').split('@')[0] };
      try { localStorage.setItem(AUTH_KEY, JSON.stringify(next)); } catch {}
      setLocal(next);
    },
    logout: () => {
      try { localStorage.removeItem(AUTH_KEY); } catch {}
      setLocal(null);
      if (session) signOut({ redirect: false }).catch(() => {});
    },
  };
}
