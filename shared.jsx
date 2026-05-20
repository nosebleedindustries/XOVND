/* Shared chrome: Header, Footer, Cart drawer, Toast, Tweaks
   Exposes everything to window so clvster.jsx and (optionally) app.jsx can reuse */
const { useState, useEffect, useCallback } = React;

function Marquee() {
  const items = [
    "NEW! CLVSTER CHAIN SEQUENCER",
    "VST3 · AU · AAX",
    "WIN & MAC (UPCOMING)",
    "FREE 14-DAY TRIAL",
  ];
  return (
    <div className="announce">
      <div className="announce-track">
        {[...Array(4)].map((_, k) => (
          <React.Fragment key={k}>
            {items.map((t, i) => (
              <React.Fragment key={i}>
                <span>{t}</span>
                <span className="dot"></span>
              </React.Fragment>
            ))}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}

function SiteHeader({ cartCount, onOpenCart, current, user, onAccountClick }) {
  return (
    <>
      <Marquee />
      <header className="nav">
        <a href="index.html" className="brand">
          <img src="assets/fluxus-mark.png" alt="Xovnd mark" />
          <span className="wordmark">OVND</span>
        </a>
        <nav className="primary">
          <a href="index.html" className={current === "products" ? "current" : ""}>Products</a>
          <a href="trials.html" className={current === "trials" ? "current" : ""}>Trials<span className="badge">14d</span></a>
          <a href="subscription.html" className={current === "subscription" ? "current" : ""}>Subscription</a>
          <a href="support.html" className={current === "support" ? "current" : ""}>Support</a>
          <a href="forum.html" className={current === "forum" ? "current" : ""}>Forum</a>
        </nav>
        <div className="nav-right">
          <a className="nav-btn" href={user ? "account.html" : "#"} onClick={(e) => { if (!user) { e.preventDefault(); onAccountClick(); } }}>
            {user ? (user.name || user.email.split("@")[0]) : "Account"}
          </a>
          <button className="nav-btn cart-btn" onClick={onOpenCart}>
            Cart <span className="cart-count">{cartCount}</span>
          </button>
        </div>
      </header>
    </>
  );
}

function SiteFooter() {
  return (
    <footer className="foot">
      <div className="foot-brand">
        <div className="logo">
          <img src="assets/fluxus-mark.png" alt="" />
          <span>OVND</span>
        </div>
        <p>An independent software studio building creative audio instruments for producers, artists, and engineers.</p>
        <div className="socials" style={{ marginTop: 18 }}>
          <a href="#" aria-label="Instagram"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="3.5"/><circle cx="17.5" cy="6.5" r="0.6" fill="currentColor"/></svg></a>
          <a href="#" aria-label="YouTube"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="6" width="20" height="12" rx="3"/><path d="M10 9l5 3-5 3z" fill="currentColor"/></svg></a>
          <a href="#" aria-label="X"><svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M18 3h3l-7.5 8.5L22 21h-6.5l-5-6.5L4 21H1l8-9-8-9h6.5l4.5 6L18 3z"/></svg></a>
          <a href="#" aria-label="TikTok"><svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M17 4v3a5 5 0 0 0 4 5v3a8 8 0 0 1-4-1v5a6 6 0 1 1-6-6v3a3 3 0 1 0 3 3V4z"/></svg></a>
        </div>
      </div>
      <div>
        <h4>Products</h4>
        <ul>
          <li><a href="clvster.html">CLVSTER</a></li>
          <li><a href="index.html">All Plugins</a></li>
          <li><a href="#">The Bundle</a></li>
          <li><a href="#">Free Tools</a></li>
          <li><a href="#">Trials</a></li>
        </ul>
      </div>
      <div>
        <h4>Resources</h4>
        <ul>
          <li><a href="support.html">Support</a></li>
          <li><a href="forum.html">Forum</a></li>
          <li><a href="#">Tutorials</a></li>
          <li><a href="#">Account</a></li>
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
          <li><a href="#">Privacy</a></li>
        </ul>
      </div>
      <div className="foot-bottom">
        <span>© 2026 XOVND Audio — All sounds reserved</span>
        <span>Mastered in Brooklyn / Built worldwide</span>
      </div>
    </footer>
  );
}

function CartDrawer({ open, onClose, items, onRemove }) {
  const subtotal = items.reduce((s, x) => s + (x.sale || x.price), 0);
  return (
    <>
      <div className={"cart-overlay" + (open ? " open" : "")} onClick={onClose}></div>
      <aside className={"cart-drawer" + (open ? " open" : "")} aria-hidden={!open}>
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
          <button className="checkout-btn" disabled={items.length === 0} style={{ opacity: items.length ? 1 : 0.4 }}>
            <span>Checkout</span>
            <span>→</span>
          </button>
        </div>
      </aside>
    </>
  );
}

/* useCart — shared state hook for cart + toast */
function useCart() {
  const [cart, setCart] = useState([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [toast, setToast] = useState("");

  const addToCart = useCallback((p) => {
    setCart(c => [...c, p]);
    setToast(`Added ${p.name}`);
    setCartOpen(true);
  }, []);
  const removeAt = useCallback((i) => setCart(c => c.filter((_, k) => k !== i)), []);

  useEffect(() => {
    if (!toast) return;
    const id = setTimeout(() => setToast(""), 1800);
    return () => clearTimeout(id);
  }, [toast]);

  return { cart, cartOpen, openCart: () => setCartOpen(true), closeCart: () => setCartOpen(false), addToCart, removeAt, toast };
}

Object.assign(window, { SiteHeader, SiteFooter, CartDrawer, Marquee, useCart });
