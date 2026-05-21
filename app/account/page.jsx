'use client';
import { useState, useEffect, useRef, useCallback, useMemo, Fragment } from 'react';
import { SiteHeader, SiteFooter, CartDrawer, useCart, useAuth } from '@/components/shared';

/* Account page — profile, downloads (with 8-digit codes), subscription, messages, logout */

const ACC_PROFILE_KEY = "xovnd_profile";
const ACC_DL_KEY      = "xovnd_downloads";
const ACC_MSG_KEY     = "xovnd_user_messages";

/* ---------- helpers ---------- */

function readObj(k, fb) {
  if (typeof window === 'undefined') return fb;
  try { return JSON.parse(localStorage.getItem(k)) ?? fb; } catch { return fb; }
}
function writeObj(k, v) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(k, JSON.stringify(v));
}

function randomCode8() {
  let s = "";
  for (let i = 0; i < 8; i++) s += Math.floor(Math.random() * 10);
  return s;
}

function downloadBlob(filename, content, type = "text/plain") {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click();
  setTimeout(() => { URL.revokeObjectURL(url); a.remove(); }, 100);
}

/* ---------- mocked initial purchase data ---------- */

const DEFAULT_PURCHASES = [
  { id: "clvster",  name: "CLVSTER",  version: "v1.0.2", purchased: "2026-04-12" },
  { id: "rubber",   name: "RUBBER",   version: "v2.1.0", purchased: "2026-02-03" },
];

function ensurePurchaseCodes(user) {
  const stored = readObj(ACC_DL_KEY, null);
  if (stored && Array.isArray(stored.purchases)) return stored;
  const seed = {
    user: user.email,
    purchases: DEFAULT_PURCHASES.map(p => ({ ...p, code: randomCode8() })),
  };
  writeObj(ACC_DL_KEY, seed);
  return seed;
}

/* ---------- icons ---------- */

const Ic = {
  user: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="8" r="4"/><path d="M4 20c1.5-4 5-6 8-6s6.5 2 8 6"/>
    </svg>
  ),
  dl: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 3v12"/><path d="M7 10l5 5 5-5"/><path d="M4 21h16"/>
    </svg>
  ),
  sub: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="6" width="18" height="14" rx="2"/><path d="M3 10h18"/><path d="M8 16h4"/>
    </svg>
  ),
  msg: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M4 5h16v11H8l-4 4V5z"/>
    </svg>
  ),
  out: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
      <path d="M6 6l12 12"/><path d="M18 6l-12 12"/>
    </svg>
  ),
  admin: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round">
      <path d="M12 3l8 3v5c0 5-3.5 8.5-8 10-4.5-1.5-8-5-8-10V6l8-3z"/>
      <path d="M9 12l2 2 4-4"/>
    </svg>
  ),
  vst: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="4" width="18" height="16" rx="1"/><path d="M3 9h18"/><circle cx="8" cy="14" r="1.6"/><circle cx="13" cy="14" r="1.6"/>
    </svg>
  ),
  app: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="4" y="3" width="16" height="18" rx="2"/><path d="M9 8h6"/><circle cx="12" cy="14" r="2.6"/>
    </svg>
  ),
  pdf: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M6 3h9l4 4v14H6z"/><path d="M15 3v4h4"/><path d="M8 13h2v4M14 13h2M14 13v4"/>
    </svg>
  ),
  copy: (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4">
      <rect x="8" y="8" width="12" height="12" rx="1"/><path d="M4 16V5a1 1 0 011-1h11"/>
    </svg>
  ),
};

/* ---------- Profile ---------- */

function ProfilePanel({ user, profile, setProfile }) {
  const [name, setName] = useState(profile.name || user.name || user.email.split("@")[0]);
  const [photo, setPhoto] = useState(profile.photo || null);
  const [saved, setSaved] = useState(false);
  const fileRef = useRef(null);

  const onFile = (e) => {
    const f = e.target.files && e.target.files[0];
    if (!f) return;
    const img = new Image();
    const url = URL.createObjectURL(f);
    img.onload = () => {
      const SIZE = 1080;
      // contain inside 1080x1080 (preserve aspect, max 1080)
      const s = Math.min(SIZE / img.width, SIZE / img.height, 1);
      const w = Math.round(img.width * s);
      const h = Math.round(img.height * s);
      const canvas = document.createElement("canvas");
      canvas.width = w; canvas.height = h;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0, w, h);
      const dataUrl = canvas.toDataURL("image/jpeg", 0.86);
      setPhoto(dataUrl);
      URL.revokeObjectURL(url);
    };
    img.src = url;
  };

  const save = () => {
    const next = { ...profile, name: name.trim() || user.email.split("@")[0], photo };
    setProfile(next);
    setSaved(true);
    setTimeout(() => setSaved(false), 1600);
  };

  return (
    <div className="acc-panel">
      <div className="panel-head">
        <span className="lbl">▸ Profile</span>
        <span className="right">Visible name & photo · max 1080×1080</span>
      </div>
      <div className="pf-grid">
        <label className="pf-photo">
          {photo ? <img src={photo} alt="Avatar" /> : <span>UPLOAD<br/>PHOTO</span>}
          <span className="hover-tag">CHANGE</span>
          <span className="crop-mask"></span>
          <input ref={fileRef} type="file" accept="image/*" onChange={onFile} />
        </label>
        <div className="pf-fields">
          <label>
            <span>Visible name</span>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="How you appear on the forum & support" />
          </label>
          <label>
            <span>Email · read-only</span>
            <input type="email" value={user.email} disabled />
          </label>
          <div className="pf-rules">↳ JPG / PNG — auto-resized to 1080×1080 and cropped to a circle when shown.</div>
          <div className="pf-actions">
            <button className="pf-save" onClick={save}>Save changes</button>
            <span className={"pf-status" + (saved ? " show" : "")}>✓ Saved</span>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------- Downloads ---------- */

function DownloadsPanel({ purchases, regenCode, showToast }) {
  const dl = (p, kind) => {
    const fmt = { vst: "VST3 installer (Win)", app: "Standalone (Win)", pdf: "User manual (PDF)" }[kind];
    const ext = { vst: ".exe", app: ".exe", pdf: ".pdf" }[kind];
    downloadBlob(
      `${p.name.toLowerCase()}-${kind}-${p.version}${ext}`,
      `XOVND // ${p.name} // ${fmt}\nVersion: ${p.version}\nLicence code: ${p.code}\nPurchased: ${p.purchased}\n\n(prototype placeholder file)`
    );
    showToast(`${p.name} · ${fmt} download started`);
  };

  const dlCode = (p) => {
    downloadBlob(`${p.name.toLowerCase()}-licence-${p.code}.txt`,
`XOVND — LICENCE CODE
====================

Product:   ${p.name} ${p.version}
Purchased: ${p.purchased}

  ${p.code}

This code was emailed to you at purchase.
Keep it private — it's how we authenticate your installation.
`);
    showToast(`Code saved · ${p.name}`);
  };

  const copyCode = async (p) => {
    try {
      await navigator.clipboard.writeText(p.code);
      showToast(`Code copied · ${p.code}`);
    } catch {
      showToast("Couldn't copy — use download instead");
    }
  };

  return (
    <div className="acc-panel">
      <div className="panel-head">
        <span className="lbl">▸ My Downloads · {purchases.length}</span>
        <span className="right">Codes are also emailed at purchase</span>
      </div>
      <div className="dl-grid">
        {purchases.map((p) => (
          <div className="dl-card" key={p.id}>
            <div className="dl-card-head">
              <div className="name">{p.name}<span className="ver">{p.version} · bought {p.purchased}</span></div>
              <div className="code">
                LICENCE <b onClick={() => copyCode(p)} title="Click to copy" style={{ cursor: "pointer" }}>{p.code}</b>
                <button className="dl-code-btn" onClick={() => dlCode(p)} title="Download as .txt">
                  {Ic.copy}&nbsp;.txt
                </button>
                <button className="dl-code-btn" onClick={() => regenCode(p.id)} title="Regenerate">↻</button>
              </div>
            </div>
            <div className="dl-buttons">
              <button className="dl-btn" onClick={() => dl(p, "vst")}>
                <span className="ic">{Ic.vst}</span>
                <span className="lbl">VST/Plugin<br/><b>installer</b></span>
                <span className="arr">↓</span>
              </button>
              <button className="dl-btn" onClick={() => dl(p, "app")}>
                <span className="ic">{Ic.app}</span>
                <span className="lbl">Standalone<br/><b>app</b></span>
                <span className="arr">↓</span>
              </button>
              <button className="dl-btn" onClick={() => dl(p, "pdf")}>
                <span className="ic">{Ic.pdf}</span>
                <span className="lbl">User manual<br/><b>PDF</b></span>
                <span className="arr">↓</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ---------- Subscription ---------- */

function SubscriptionPanel({ profile, setProfile, showToast }) {
  const plan = profile.subscription?.plan || "Pro";
  const active = profile.subscription?.active ?? true;
  const next = profile.subscription?.next || "2026-06-12";

  const cancel = () => {
    if (!confirm("Cancel your subscription? You keep access until " + next + ".")) return;
    setProfile({ ...profile, subscription: { plan, active: false, next } });
    showToast("Subscription cancelled");
  };
  const resume = () => {
    setProfile({ ...profile, subscription: { plan, active: true, next } });
    showToast("Subscription resumed");
  };

  return (
    <div className="acc-panel">
      <div className="panel-head">
        <span className="lbl">▸ Subscription</span>
        <span className="right">Billed monthly via Stripe</span>
      </div>
      <div className="sub-state">
        <div>
          <div className="plan">{plan}<span className="alt"> · {active ? "active" : "cancelled"}</span></div>
          <p className="lede">All XOVND plugins + beta access + private engineer channel + annual founders call. Switch plans or pause whenever you want.</p>
        </div>
        <div className="next">
          {active ? <>Next charge<br/><b>{next}</b></> : <>Access until<br/><b>{next}</b></>}
        </div>
      </div>
      <div className="sub-actions">
        <a href="/subscription" className="sub-act primary">Change plan</a>
        <button className="sub-act" onClick={() => showToast("Receipt downloaded")}>Download receipts</button>
        <button className="sub-act" onClick={() => showToast("Payment method (mock)")}>Update payment</button>
        {active
          ? <button className="sub-act danger" onClick={cancel}>Cancel subscription</button>
          : <button className="sub-act" onClick={resume}>Resume</button>}
      </div>
    </div>
  );
}

/* ---------- Messages ---------- */

const SEED_MESSAGES = [
  { id: "m_a", from: "admin", who: "XOVND Admin", subject: null, body: "Heads-up — KANTIAN v1.1 beta drops next Thursday. As a Pro subscriber you'll get the build link 48h before public.", when: "May 12, 2026", unread: true },
  { id: "m_u", from: "user",  who: "rita.borg",   subject: null, body: "Hey! I saw your CLVSTER demo on YouTube — would you trade a preset pack for a copy of my new Max patch? :)", when: "May 04, 2026", unread: false },
  { id: "m_a2", from: "admin", who: "XOVND Support", subject: null, body: "Your support ticket #4129 (CLVSTER crash on session reload) is fixed in 1.0.2. Re-download the installer.", when: "Apr 22, 2026", unread: false },
];

function MessagesPanel({ messages, setMessages, user, showToast }) {
  const [draft, setDraft] = useState("");

  const send = () => {
    if (!draft.trim()) return;
    const next = [
      { id: "m_" + Date.now(), from: "user", who: user.name || user.email.split("@")[0], body: draft.trim(), when: "Just now", unread: false, mine: true },
      ...messages,
    ];
    setMessages(next);
    setDraft("");
    showToast("Message sent to admins");
  };

  const markAllRead = () => {
    setMessages(messages.map(m => ({ ...m, unread: false })));
  };

  const unreadCount = messages.filter(m => m.unread).length;

  return (
    <div className="acc-panel">
      <div className="panel-head">
        <span className="lbl">▸ Private Messages{unreadCount ? ` · ${unreadCount} unread` : ""}</span>
        <button className="sub-act" style={{ padding: "8px 14px" }} onClick={markAllRead}>Mark all read</button>
      </div>

      <div className="msg-list">
        {messages.map((m) => (
          <div key={m.id} className={"msg-item" + (m.unread ? " unread" : "")}>
            <div className={"who-avatar" + (m.from === "admin" ? " admin" : "")}>
              {m.who[0].toUpperCase()}
            </div>
            <div>
              <div className="who">
                {m.who}
                {m.from === "admin"
                  ? <span className="badge">Admin</span>
                  : m.mine ? <span className="badge user">You</span>
                  : <span className="badge user">User</span>}
              </div>
              <div className="body">{m.body}</div>
            </div>
            <div className="when">{m.when}</div>
          </div>
        ))}
      </div>

      <div className="msg-compose">
        <textarea
          placeholder="Send a private message to the admins…"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
        />
        <button className="send" onClick={send}>Send →</button>
      </div>
    </div>
  );
}

/* ---------- Main app ---------- */

function AccountApp() {
  const { cart, cartOpen, openCart, closeCart, removeAt } = useCart();
  const auth = useAuth();
  const [loginOpen, setLoginOpen] = useState(false);
  const [open, setOpen] = useState("profile"); // profile|downloads|subscription|messages
  const [toast, setToast] = useState("");
  const showToast = (t) => { setToast(t); setTimeout(() => setToast(""), 2000); };

  const [profile, setProfile] = useState(() => readObj(ACC_PROFILE_KEY, {}));
  useEffect(() => { writeObj(ACC_PROFILE_KEY, profile); }, [profile]);

  const [dl, setDl] = useState(() => readObj(ACC_DL_KEY, null));
  useEffect(() => { if (auth.user && !dl) setDl(ensurePurchaseCodes(auth.user)); }, [auth.user]);
  useEffect(() => { if (dl) writeObj(ACC_DL_KEY, dl); }, [dl]);

  const regenCode = (id) => {
    if (!dl) return;
    setDl({ ...dl, purchases: dl.purchases.map(p => p.id === id ? { ...p, code: randomCode8() } : p) });
    showToast("New code generated — email re-sent");
  };

  const [messages, setMessages] = useState(() => readObj(ACC_MSG_KEY, SEED_MESSAGES));
  useEffect(() => { writeObj(ACC_MSG_KEY, messages); }, [messages]);

  const visibleName = profile.name || auth.user?.name || auth.user?.email.split("@")[0] || "";
  const initials = (visibleName || "?").trim().slice(0, 2).toUpperCase();

  const onAccountClick = () => {
    if (auth.user) {
      if (confirm("Sign out of " + auth.user.email + "?")) auth.logout();
    } else {
      setLoginOpen(true);
    }
  };

  // not logged in gate
  if (!auth.user) {
    return (
      <>
        <SiteHeader
          cartCount={cart.length}
          onOpenCart={openCart}
          current="account"
          user={auth.user}
          onAccountClick={onAccountClick} />
        <div className="acc-gate">
          <h2>Account access</h2>
          <p>Sign in to manage your profile, downloads, subscription and messages.</p>
          <button onClick={() => setLoginOpen(true)}>Sign in</button>
        </div>
        <SiteFooter />
        {/* LoginModal stub — Phase 2B.3 Supabase Auth */}
      </>
    );
  }

  const purchases = dl?.purchases || [];
  const isAdmin = auth.user?.email?.toLowerCase() === "stalactite3d@gmail.com";

  const rows = [
    ...(isAdmin ? [{ id: "admin", title: "Admin dashboard", sub: "Studio inbox · tickets · purchases · features", ic: Ic.admin, href: "/admin" }] : []),
    { id: "profile", title: "Profile", sub: "Visible name · profile photo", ic: Ic.user,
      panel: <ProfilePanel user={auth.user} profile={profile} setProfile={setProfile} /> },
    { id: "downloads", title: "My downloads", sub: `${purchases.length} licences · installers · manuals`, ic: Ic.dl,
      panel: <DownloadsPanel purchases={purchases} regenCode={regenCode} showToast={showToast} /> },
    { id: "subscription", title: "Manage subscription", sub: profile.subscription?.active === false ? "Cancelled — keeps access until next renewal" : "Pro · active", ic: Ic.sub,
      panel: <SubscriptionPanel profile={profile} setProfile={setProfile} showToast={showToast} /> },
    { id: "messages", title: "Private messages", sub: `${messages.filter(m => m.unread).length} unread · ${messages.length} total`, ic: Ic.msg,
      panel: <MessagesPanel messages={messages} setMessages={setMessages} user={auth.user} showToast={showToast} /> },
  ];

  return (
    <>
      <SiteHeader
        cartCount={cart.length}
        onOpenCart={openCart}
        current="account"
        user={{ ...auth.user, name: visibleName }}
        onAccountClick={onAccountClick} />

      <div className="acc-shell">
        <div className="acc-head">
          <div className="acc-avatar">
            {profile.photo ? <img src={profile.photo} alt="" /> : <span>{initials}</span>}
          </div>
          <div>
            <div className="eyebrow">[ Account · {auth.user.provider || "email"} ]</div>
            <h1>Hey, {visibleName}.</h1>
            <div className="meta">Signed in as <b>{auth.user.email}</b> · member since {(auth.user.registeredAt || "2026-01-01").slice(0, 10)}</div>
          </div>
          <div className="acc-head-r">
            <div className="uid">USER ID<br/><b>{(auth.user.email).split("@")[0].toUpperCase()}-{(profile.uid || (profile.uid = Math.floor(1000 + Math.random()*9000)))}</b></div>
          </div>
        </div>

        <div className="acc-col">
          {rows.map((r) => (
            <Fragment key={r.id}>
              {r.href ? (
                <a className="acc-row admin-link" href={r.href}>
                  <span className="icn">{r.ic}</span>
                  <span className="body">
                    <span className="title">{r.title}</span>
                    <span className="sub">{r.sub}</span>
                  </span>
                  <span className="chev">›</span>
                </a>
              ) : (
                <>
                  <button
                    className={"acc-row" + (open === r.id ? " active" : "")}
                    onClick={() => setOpen(open === r.id ? "" : r.id)}>
                    <span className="icn">{r.ic}</span>
                    <span className="body">
                      <span className="title">{r.title}</span>
                      <span className="sub">{r.sub}</span>
                    </span>
                    <span className="chev">{open === r.id ? "▾" : "›"}</span>
                  </button>
                  {open === r.id && r.panel}
                </>
              )}
            </Fragment>
          ))}

          <button className="acc-row logout" onClick={() => { if (confirm("Log out of " + auth.user.email + "?")) auth.logout(); }}>
            <span className="icn">{Ic.out}</span>
            <span className="body">
              <span className="title">Log out</span>
              <span className="sub">End this session on this device</span>
            </span>
            <span className="chev">›</span>
          </button>
        </div>
      </div>

      <SiteFooter />

      <CartDrawer open={cartOpen} onClose={closeCart} items={cart} onRemove={removeAt} />
      <div className={"acc-toast" + (toast ? " show" : "")}>{toast}</div>
    </>
  );
}


export default function Page() { return <AccountApp />; }
