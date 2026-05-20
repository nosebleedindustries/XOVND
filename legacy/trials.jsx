/* Trials page — yellow background, white pillows, Windows download */
const { useState: useTrialState } = React;

const WinLogo = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M3 5.5L10.5 4.45V11.4H3V5.5z" />
    <path d="M11.5 4.3L21 3v8.4H11.5V4.3z" />
    <path d="M3 12.6h7.5v6.95L3 18.5V12.6z" />
    <path d="M11.5 12.6H21V21l-9.5-1.3v-7.1z" />
  </svg>
);

const TRIALS = [
  {
    id: "clvster-demo",
    name: "CLVSTER",
    edition: "Demo",
    tag: "Demo · 14 days",
    tagClass: "",
    lede: "The full multi-algorithmic sequencer — every Cluster, every Algo Modifier, every voice — unlocked for two weeks. Silences every 90s after day 14.",
    specs: [
      { k: "Formats", v: "VST3 · AU · AAX" },
      { k: "Size",    v: "184 MB" },
      { k: "Build",   v: "1.0.2" },
    ],
    cta: "Download CLVSTER Demo",
    meta: "Windows 10/11 · 64-bit · No account required",
  },
  {
    id: "kantian-free",
    name: "KANTIAN",
    edition: "Free (M4L)",
    tag: "Free forever",
    tagClass: "free",
    lede: "Our Max for Live transcendental sequencer — free and unrestricted. Just drop it into an Ableton MIDI track and go.",
    specs: [
      { k: "Format",  v: "Max for Live" },
      { k: "Size",    v: "12 MB" },
      { k: "Req.",    v: "Live 11 · Max 8.5+" },
    ],
    cta: "Download KANTIAN",
    meta: "Windows 10/11 · 64-bit · Ableton Suite required",
  },
];

function Pillow({ p }) {
  return (
    <article className="pillow">
      <span className={"tag " + p.tagClass}>{p.tag}</span>
      <h2>{p.name}<span className="sub">{p.edition}</span></h2>
      <p className="lede">{p.lede}</p>
      <div className="specs">
        {p.specs.map((s, i) => (
          <span key={i}>{s.k} <b>{s.v}</b></span>
        ))}
      </div>
      <div className="dl-row">
        <button className="dl-btn" onClick={() => alert("Download for " + p.name + " (" + p.edition + ") starting…")}>
          <span>{p.cta}</span>
          <span className="arrow">↓</span>
        </button>
        <button className="os" title="Windows installer" aria-label="Windows installer">
          <WinLogo />
        </button>
      </div>
      <div className="meta">{p.meta}</div>
    </article>
  );
}

function TrialsApp() {
  const { cart, cartOpen, openCart, closeCart, removeAt, toast } = window.useCart();
  const auth = window.useAuth();
  const [loginOpen, setLoginOpen] = useTrialState(false);

  const onAccountClick = () => {
    if (auth.user) {
      if (confirm("Signed in as " + auth.user.email + "\n\nSign out?")) auth.logout();
    } else {
      setLoginOpen(true);
    }
  };

  return (
    <>
      {window.AdminTrigger && <window.AdminTrigger />}
      <window.SiteHeader
        cartCount={cart.length}
        onOpenCart={openCart}
        current="trials"
        user={auth.user}
        onAccountClick={onAccountClick} />
      <div className="sub-shell">
        <div className="tr-head">
          <div className="eyebrow">[ Trials · 02 ]</div>
          <h1>Try before<br/>you <span className="stamp">commit.</span></h1>
          <p>Free downloads of the instruments we want you to actually live with. No emails, no credit cards — just unzip and load.</p>
        </div>

        <div className="tr-grid">
          {TRIALS.map((p) => <Pillow key={p.id} p={p} />)}
        </div>

        <div className="tr-note">
          <span className="dot"></span>
          <span className="msg"><b>macOS builds</b> · coming with v1.1 — sign up to the newsletter for a heads-up.</span>
          <span className="right">XOVND · 2026.05.19</span>
        </div>
      </div>

      <window.SiteFooter />

      <window.CartDrawer open={cartOpen} onClose={closeCart} items={cart} onRemove={removeAt} />
      {window.LoginModal && (
        <window.LoginModal open={loginOpen} onClose={() => setLoginOpen(false)} onAuth={auth.login} />
      )}
      <div className={"toast" + (toast ? " show" : "")} style={{
        position: "fixed", bottom: 24, left: "50%",
        transform: "translateX(-50%) translateY(" + (toast ? "0" : "20px") + ")",
        background: "var(--black)", color: "var(--yellow)",
        padding: "12px 18px", borderRadius: 999,
        fontFamily: "'Space Mono', monospace", fontSize: 12, fontWeight: 700,
        letterSpacing: "0.06em", textTransform: "uppercase",
        opacity: toast ? 1 : 0, pointerEvents: "none", transition: "all .3s ease",
        zIndex: 200,
      }}>{toast}</div>
    </>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<TrialsApp />);
