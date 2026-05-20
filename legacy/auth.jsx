/* Auth + customer database.
   localStorage-backed so it persists per-browser.
   Exposes:
     - window.useAuth()       — { user, login, logout } hook
     - window.LoginModal      — modal component
     - window.AdminTrigger    — small "?" button → admin.html
     - window.xovndDB        — { getCustomers, addCustomer, getMessages, addMessage }
*/

const FLX_CUSTOMERS = "xovnd_customers";
const FLX_CURRENT = "xovnd_current_user";
const FLX_MESSAGES = "xovnd_messages";

function _readArr(k) { try { return JSON.parse(localStorage.getItem(k) || "[]"); } catch { return []; } }
function _writeArr(k, v) { localStorage.setItem(k, JSON.stringify(v)); }
function _readObj(k) { try { return JSON.parse(localStorage.getItem(k) || "null"); } catch { return null; } }

window.xovndDB = {
  getCustomers: () => _readArr(FLX_CUSTOMERS),
  addCustomer: (c) => {
    const list = _readArr(FLX_CUSTOMERS);
    const existing = list.findIndex(x => x.email.toLowerCase() === c.email.toLowerCase());
    if (existing >= 0) {
      list[existing] = { ...list[existing], ...c, lastSeen: new Date().toISOString() };
    } else {
      list.push({ ...c, registeredAt: new Date().toISOString(), lastSeen: new Date().toISOString() });
    }
    _writeArr(FLX_CUSTOMERS, list);
    return list;
  },
  removeCustomer: (email) => {
    const list = _readArr(FLX_CUSTOMERS).filter(c => c.email !== email);
    _writeArr(FLX_CUSTOMERS, list);
    return list;
  },
  getMessages: () => _readArr(FLX_MESSAGES),
  addMessage: (m) => {
    const list = _readArr(FLX_MESSAGES);
    list.unshift({ ...m, id: "msg_" + Date.now(), sentAt: new Date().toISOString() });
    _writeArr(FLX_MESSAGES, list);
    return list;
  },
  clearAll: () => {
    localStorage.removeItem(FLX_CUSTOMERS);
    localStorage.removeItem(FLX_MESSAGES);
  },
};

window.useAuth = function useAuth() {
  const [user, setUser] = React.useState(_readObj(FLX_CURRENT));
  React.useEffect(() => {
    const onStorage = (e) => {
      if (e.key === FLX_CURRENT) setUser(_readObj(FLX_CURRENT));
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);
  const login = (u) => {
    const payload = { ...u, lastSeen: new Date().toISOString() };
    localStorage.setItem(FLX_CURRENT, JSON.stringify(payload));
    window.xovndDB.addCustomer(payload);
    setUser(payload);
  };
  const logout = () => {
    localStorage.removeItem(FLX_CURRENT);
    setUser(null);
  };
  return { user, login, logout };
};

/* ---------------- LoginModal ---------------- */

const PROVIDER_META = {
  google: { label: "Google", color: "#fff", textColor: "#1a1a1a" },
  apple:  { label: "Apple",  color: "#fff", textColor: "#000" },
  email:  { label: "Email",  color: "var(--yellow)", textColor: "#000" },
};

function GoogleIcon({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48">
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3c-1.6 4.7-6.1 8-11.3 8-6.6 0-12-5.4-12-12s5.4-12 12-12c3 0 5.8 1.1 7.9 3l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.3-.4-3.5z"/>
      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 16 19 13 24 13c3 0 5.8 1.1 7.9 3l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.4 6.3 14.7z"/>
      <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.5-5.2l-6.2-5.2c-2 1.5-4.6 2.4-7.3 2.4-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z"/>
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.3 4.4-4.3 5.6l6.2 5.2C40.7 35.7 44 30.3 44 24c0-1.3-.1-2.3-.4-3.5z"/>
    </svg>
  );
}

function AppleIcon({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.05 12.04c-.03-2.79 2.28-4.13 2.38-4.19-1.3-1.9-3.32-2.16-4.04-2.19-1.72-.17-3.36 1.02-4.24 1.02-.88 0-2.22-1-3.65-.97-1.88.03-3.62 1.1-4.59 2.77-1.96 3.4-.5 8.43 1.4 11.2.93 1.36 2.03 2.88 3.48 2.82 1.4-.06 1.93-.9 3.62-.9 1.69 0 2.16.9 3.63.87 1.5-.03 2.45-1.37 3.36-2.74 1.06-1.57 1.49-3.09 1.52-3.16-.03-.01-2.92-1.12-2.95-4.45zM14.34 4.07c.78-.95 1.31-2.26 1.17-3.57-1.13.05-2.49.75-3.3 1.7-.72.84-1.36 2.18-1.19 3.46 1.26.1 2.54-.64 3.32-1.59z"/>
    </svg>
  );
}

function LoginModal({ open, onClose, onAuth }) {
  const [step, setStep] = React.useState("choose"); // choose | provider | success
  const [provider, setProvider] = React.useState(null);
  const [email, setEmail] = React.useState("");
  const [name, setName] = React.useState("");
  const [busy, setBusy] = React.useState(false);

  React.useEffect(() => {
    if (open) { setStep("choose"); setProvider(null); setEmail(""); setName(""); setBusy(false); }
  }, [open]);

  React.useEffect(() => {
    if (!open) return;
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const pick = (p) => {
    setProvider(p);
    setStep("provider");
  };

  const submit = (e) => {
    e?.preventDefault();
    if (!email || !email.includes("@")) return;
    setBusy(true);
    const displayName = name.trim() || email.split("@")[0];
    const user = { email: email.trim().toLowerCase(), name: displayName, provider };
    setTimeout(() => {
      setStep("success");
      setTimeout(() => {
        onAuth(user);
        setTimeout(() => onClose(), 700);
      }, 700);
    }, 600);
  };

  if (!open) return null;

  const meta = provider ? PROVIDER_META[provider] : null;

  return (
    <div className="auth-overlay" onClick={onClose}>
      <div className="auth-card" onClick={(e) => e.stopPropagation()}>
        <button className="auth-close" onClick={onClose} aria-label="Close">✕</button>

        {step === "choose" && (
          <>
            <div className="auth-brand">
              <img src="assets/fluxus-mark.png" alt="" />
              <span>OVND</span>
            </div>
            <h2>Sign in <span style={{ color: "var(--yellow)" }}>or create</span> your account</h2>
            <p className="auth-sub">Save your trials, sync settings between machines, and grab your existing customer loyalty discount.</p>

            <div className="auth-providers">
              <button className="auth-provider auth-provider-google" onClick={() => pick("google")}>
                <GoogleIcon />
                <span>Continue with Google</span>
                <span className="auth-arrow">→</span>
              </button>
              <button className="auth-provider auth-provider-apple" onClick={() => pick("apple")}>
                <AppleIcon />
                <span>Continue with Apple</span>
                <span className="auth-arrow">→</span>
              </button>
              <div className="auth-divider"><span>or</span></div>
              <button className="auth-provider auth-provider-email" onClick={() => pick("email")}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 7 9-7"/></svg>
                <span>Continue with email</span>
                <span className="auth-arrow">→</span>
              </button>
            </div>

            <p className="auth-fine">
              By continuing you agree to our <a href="#">Terms</a> and <a href="#">Privacy</a>. We don't sell your data and we sure don't sell your records either.
            </p>
          </>
        )}

        {step === "provider" && (
          <>
            <button className="auth-back" onClick={() => setStep("choose")}>← back</button>
            <div className="auth-brand auth-brand-small">
              {provider === "google" && <GoogleIcon size={20} />}
              {provider === "apple" && <AppleIcon size={20} />}
              {provider === "email" && (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 7 9-7"/></svg>
              )}
              <span>Continue with {meta.label}</span>
            </div>
            <h2 style={{ fontSize: 22, margin: "0 0 8px" }}>Tell us who you are</h2>
            <p className="auth-sub" style={{ marginBottom: 22 }}>
              {provider === "email"
                ? "Enter the email you want associated with your XOVND account."
                : `Sign-in to your ${meta.label} account is mocked in this prototype — enter the email you'd like to register.`}
            </p>

            <form className="auth-form" onSubmit={submit}>
              <label>
                <span>Email</span>
                <input type="email" required placeholder="you@studio.audio"
                       value={email} onChange={(e) => setEmail(e.target.value)} autoFocus />
              </label>
              <label>
                <span>Display name <em>(optional)</em></span>
                <input type="text" placeholder="The artist formerly known as…"
                       value={name} onChange={(e) => setName(e.target.value)} />
              </label>
              <button type="submit" className="auth-submit" disabled={busy || !email.includes("@")}>
                {busy ? "Connecting…" : `Continue with ${meta.label}`} <span>→</span>
              </button>
            </form>
          </>
        )}

        {step === "success" && (
          <div className="auth-success">
            <div className="auth-check">
              <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 6L9 17l-5-5"/>
              </svg>
            </div>
            <h2>You're in.</h2>
            <p className="auth-sub">Welcome to XOVND, {name || email.split("@")[0]}.</p>
          </div>
        )}
      </div>
    </div>
  );
}

window.LoginModal = LoginModal;

/* ---------------- Admin trigger (?) ---------------- */

function AdminTrigger() {
  return (
    <a className="admin-trigger" href="admin.html" aria-label="Admin (hidden)" title="?">?</a>
  );
}

window.AdminTrigger = AdminTrigger;
