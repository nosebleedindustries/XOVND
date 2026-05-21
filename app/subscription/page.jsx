'use client';
import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { SiteHeader, SiteFooter, CartDrawer, useCart, useAuth } from '@/components/shared';
import { AccessModal, useAccessModal } from '@/components/AccessModal';

/* Subscription plans page */

const PLANS = [
  {
    id: "all",
    kicker: "Basic subscription",
    title: "All Products",
    lede: "Full access to every XOVND plugin we've ever shipped. New products are added the day they launch.",
    price: 9, per: "/ month",
    pretext: "from",
    cta: "Start basic subscription",
    micro: "First month €0.99 with code COLLECT · Cancel anytime",
    features: [
      "Unlimited access to every <b>released</b> XOVND plugin",
      "All future plugins added the day they launch",
      "Free updates while subscribed",
      "Standard support — replies within 48h",
      "3 activations per seat, transferable",
      "Cancel any time, keep what you've earned",
    ],
  },
  {
    id: "pro",
    kicker: "Pro subscription",
    title: "All Products + Beta",
    lede: "Everything in the basic plan, plus early access to every new plugin before public release, your name in the credits, and a direct channel to the studio.",
    price: 15, per: "/ month",
    pretext: "from",
    cta: "Start pro subscription",
    micro: "Try 14 days free · Cancel anytime · Limited seats",
    featured: true,
    badge: "Most popular",
    features: [
      "<b>Everything in All Products</b>",
      "<b>Beta access</b> to every new XOVND plugin — usually 4–8 weeks before public release",
      "<b>Direct line</b> to our engineers via the private beta channel",
      "<b>Credit</b> in the plugin's about screen as a beta tester",
      "Priority support — replies within 24h, weekdays",
      "Early CLV/RBR preset packs from our roster of pro users",
      "Annual 1:1 studio call with the founders (yes, really)",
    ],
  },
];

const COMPARE = [
  { feat: "Full plugin catalog",                basic: "yes", pro: "yes" },
  { feat: "Future releases at launch",          basic: "yes", pro: "yes" },
  { feat: "Beta access to new products",        basic: "no",  pro: "yes" },
  { feat: "Direct line to engineers",           basic: "no",  pro: "yes" },
  { feat: "Credit as beta tester",              basic: "no",  pro: "yes" },
  { feat: "Support response time",              basic: "48h", pro: "24h" },
  { feat: "Founders 1:1 call (annual)",         basic: "no",  pro: "yes" },
];

const FAQ = [
  { q: "Can I switch between Basic and Pro?", a: "Anytime. Upgrade and you'll be prorated; downgrade and the change takes effect at the start of your next billing cycle." },
  { q: "What happens if I cancel?", a: "You keep access until the end of the current billing period. Any 'Sub-to-Own' plugins you've earned through the program are yours to keep forever." },
  { q: "Can I use the plugins commercially?", a: "Yes. Both plans include unlimited commercial use of any tracks, records or installations you produce with our software." },
  { q: "Do you offer student or hobbyist discounts?", a: "Educational pricing knocks 40% off both plans — write to hello@xovnd.audio from a valid .edu email and we'll get you set up." },
];

function PlanCard({ plan, onSubscribe }) {
  return (
    <div className={"sub-card" + (plan.featured ? " featured" : "")}>
      {plan.badge && <span className="ptag">{plan.badge}</span>}
      <div className="kicker">{plan.kicker}</div>
      <h2>{plan.title}</h2>
      <p className="lede">{plan.lede}</p>
      <div className="price-amt">
        <span className="pre">{plan.pretext}</span>
        <span>€{plan.price}</span>
        <span className="per">{plan.per}</span>
      </div>
      <ul>
        {plan.features.map((f, i) => <li key={i} dangerouslySetInnerHTML={{ __html: f }} />)}
      </ul>
      <button className="pbtn" onClick={() => onSubscribe(plan)}>
        <span>{plan.cta}</span>
        <span className="arrow">→</span>
      </button>
      <div className="micro">{plan.micro}</div>
    </div>
  );
}

function FAQItem({ q, a, defaultOpen }) {
  const [open, setOpen] = useState(!!defaultOpen);
  return (
    <div className={"faq-item" + (open ? " open" : "")} onClick={() => setOpen(o => !o)}>
      <div className="faq-q"><span>{q}</span><span className="chev">+</span></div>
      <div className="faq-a">{a}</div>
    </div>
  );
}

function App() {
  const { cart, cartOpen, openCart, closeCart, addToCart, removeAt, toast } = useCart();
  const auth = useAuth();
  const access = useAccessModal();

  const onAccountClick = () => {
    if (auth.user) {
      const id = auth.user.code || auth.user.email || 'user';
      if (confirm(`Signed in as ${id}\n\nSign out?`)) auth.logout();
    } else {
      access.openModal('code');
    }
  };

  const onSubscribe = (plan) => {
    if (!auth.user) {
      access.openModal('code');
      return;
    }
    addToCart({
      id: "sub-" + plan.id,
      name: plan.title.toUpperCase(),
      type: plan.kicker,
      price: plan.price,
    });
  };

  return (
    <>
      <SiteHeader
        cartCount={cart.length}
        onOpenCart={openCart}
        current="subscription"
        user={auth.user}
        onAccountClick={onAccountClick}
      />
      <div className="sub-shell">
        <div className="sub-head">
          <div className="eyebrow">[ Subscription · two plans ]</div>
          <h1>Subscribe once.<br/>Own the <span className="alt">whole studio.</span></h1>
          <p>Unlimited access to every XOVND plugin for less than the price of a coffee subscription — and a second tier for the people who want to shape what we build next.</p>
        </div>

        <div className="sub-grid">
          {PLANS.map(p => <PlanCard key={p.id} plan={p} onSubscribe={onSubscribe} />)}
        </div>

        <div className="sub-compare">
          <h3>[ Side by side ]</h3>
          <div className="crow head">
            <span>Feature</span>
            <span className="basic-h">All Products · €9/mo</span>
            <span className="pro-h">+ Beta · €15/mo</span>
          </div>
          {COMPARE.map((r, i) => (
            <div className="crow" key={i}>
              <span className="feat">{r.feat}</span>
              <span className={"cell " + (r.basic === "yes" ? "yes" : r.basic === "no" ? "no" : "")}>
                {r.basic === "yes" ? "✓" : r.basic === "no" ? "—" : r.basic}
              </span>
              <span className={"cell " + (r.pro === "yes" ? "yes" : r.pro === "no" ? "no" : "")}>
                {r.pro === "yes" ? "✓" : r.pro === "no" ? "—" : r.pro}
              </span>
            </div>
          ))}
        </div>

        <div className="sub-faq">
          <h2>Common <span className="alt">questions.</span></h2>
          {FAQ.map((f, i) => <FAQItem key={i} q={f.q} a={f.a} defaultOpen={i === 0} />)}
        </div>
      </div>

      <SiteFooter />

      <CartDrawer open={cartOpen} onClose={closeCart} items={cart} onRemove={removeAt} />
      <AccessModal open={access.open} initialTab={access.initialTab} onClose={access.closeModal} />
      {/* LoginModal stub — Phase 2B.3 Supabase Auth */}
      <div className={"toast" + (toast ? " show" : "")} style={{
        position: "fixed", bottom: 24, left: "50%",
        transform: "translateX(-50%) translateY(" + (toast ? "0" : "20px") + ")",
        background: "var(--yellow)", color: "var(--black)",
        padding: "12px 18px", borderRadius: 999,
        fontFamily: "'Space Mono', monospace", fontSize: 12, fontWeight: 700,
        letterSpacing: "0.06em", textTransform: "uppercase",
        opacity: toast ? 1 : 0, pointerEvents: "none", transition: "all .3s ease",
        zIndex: 200,
      }}>{toast}</div>
    </>
  );
}


export default function Page() { return <App />; }
