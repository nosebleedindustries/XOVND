'use client';
import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { SiteHeader, SiteFooter, CartDrawer, useCart, useAuth } from '@/components/shared';
import { AccessModal, useAccessModal } from '@/components/AccessModal';
import { AccountModal, useAccountModal } from '@/components/AccountModal';

/* XOVND support page — mail + live chat + tickets + satisfaction */

const SUPPORT_ADDR = "XOVND@tech.help";
const SUP_TICKETS_KEY = "xovnd_tickets";
const SUP_SAT_KEY = "xovnd_support_sat";

/* Documentation available for download on the support page */
const SUPPORT_DOCS = [
  {
    id: "clvster-quickstart",
    tag: "CLVSTER",
    title: "Quickstart Manual",
    desc: "The 8-page guide — workflow, the four algorithms, harmony, locking, and the snapshot sequencer.",
    meta: "PDF · 8 pages",
    href: "/downloads/CLVSTER-Quickstart.pdf",
    file: "CLVSTER-Quickstart.pdf",
    ready: true,
  },
  {
    id: "skvvelch-manual",
    tag: "SKVVELCH",
    title: "Synth Manual",
    desc: "Full reference for the SKVVELCH synth — arriving with the plugin.",
    meta: "Coming soon",
    ready: false,
  },
];

function readJSON(k, fallback) {
  if (typeof window === 'undefined') return fallback;
  try { return JSON.parse(localStorage.getItem(k) || JSON.stringify(fallback)); }
  catch { return fallback; }
}
function writeJSON(k, v) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(k, JSON.stringify(v));
}
function relTime(iso) {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60) return "just now";
  if (diff < 3600) return Math.floor(diff/60) + "m ago";
  if (diff < 86400) return Math.floor(diff/3600) + "h ago";
  if (diff < 86400*30) return Math.floor(diff/86400) + "d ago";
  return new Date(iso).toLocaleDateString();
}
function timeOnly(iso) {
  return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

/* ---------------- Mail form ---------------- */

function MailForm({ user, onSent }) {
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [topic, setTopic] = useState("General");
  const [busy, setBusy] = useState(false);
  const [email, setEmail] = useState(user?.email || "");
  const [name, setName] = useState(user?.name || "");

  useEffect(() => {
    if (user) {
      setEmail(user.email);
      setName(user.name || "");
    }
  }, [user]);

  const canSend = !!subject.trim() && !!body.trim() && email.includes("@");
  const send = (e) => {
    e.preventDefault();
    if (!canSend) return;
    setBusy(true);
    setTimeout(() => {
      const ticket = {
        id: "T-" + Math.floor(100000 + Math.random() * 900000),
        subject: subject.trim(),
        body: body.trim(),
        topic,
        from: { name: name.trim() || email.split("@")[0], email: email.trim().toLowerCase() },
        to: SUPPORT_ADDR,
        status: "open",
        createdAt: new Date().toISOString(),
      };
      const list = readJSON(SUP_TICKETS_KEY, []);
      list.unshift(ticket);
      writeJSON(SUP_TICKETS_KEY, list);
      // Also log into xovndDB messages so admin can see
      if (typeof window !== 'undefined' && window.xovndDB) {
        window.xovndDB.addMessage({
          from: ticket.from.email,
          to: [SUPPORT_ADDR],
          subject: `[${ticket.id}] ${ticket.subject}`,
          body: `Topic: ${ticket.topic}\n\n${ticket.body}`,
        });
      }
      onSent(ticket);
      setSubject(""); setBody(""); setTopic("General"); setBusy(false);
    }, 600);
  };

  return (
    <div className="sup-card">
      <div className="panel-kicker">[ Send a message ]</div>
      <h2>Write to support</h2>
      <form className="mail-form" onSubmit={send}>
        <div className="from">
          <span><b>To:</b> {SUPPORT_ADDR}</span>
          <span style={{ color: "#3a3630" }}>·</span>
          <span>Avg reply 4h on weekdays</span>
        </div>
        <div className="row">
          <label>
            <span>Your name</span>
            <input type="text" placeholder="Jane Producer"
                   value={name} onChange={(e) => setName(e.target.value)} />
          </label>
          <label>
            <span>Your email</span>
            <input type="email" required placeholder="you@studio.audio"
                   value={email} onChange={(e) => setEmail(e.target.value)} />
          </label>
        </div>
        <div className="row">
          <label>
            <span>Topic</span>
            <select value={topic} onChange={(e) => setTopic(e.target.value)}>
              <option>General</option>
              <option>Bug report</option>
              <option>Installation</option>
              <option>Licensing & activation</option>
              <option>Billing</option>
              <option>Feature request</option>
            </select>
          </label>
          <label>
            <span>Subject</span>
            <input type="text" required placeholder="Crash on Logic Pro 11.1 launch"
                   value={subject} onChange={(e) => setSubject(e.target.value)} />
          </label>
        </div>
        <label>
          <span>Message</span>
          <textarea placeholder={`Tell us what's happening — what you did, what you expected, what actually happened.\n\nDAW / OS / plugin version helps a lot.`}
                    value={body} onChange={(e) => setBody(e.target.value)} />
        </label>
        <button type="submit" className="send-btn" disabled={!canSend || busy}>
          {busy ? "Sending…" : "Send to support"} <span>→</span>
        </button>
      </form>
    </div>
  );
}

/* ---------------- Tickets ---------------- */

function TicketStat({ kind, count, label }) {
  return (
    <div className={"ticket-stat " + kind}>
      <div className="ic">
        {kind === "open" && (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v6"/><circle cx="12" cy="16.5" r="0.9" fill="currentColor"/></svg>
        )}
        {kind === "closed" && (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9"/><path d="M8 12l3 3 5-6"/></svg>
        )}
        {kind === "pending" && (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>
        )}
      </div>
      <div>
        <span className="lbl">{label}</span>
        <span className="num">{count}</span>
      </div>
    </div>
  );
}

function TicketsCard({ tickets, user, onToggle }) {
  const mine = useMemo(() => {
    if (!user) return tickets;
    return tickets.filter(t => t.from.email === user.email);
  }, [tickets, user]);
  const open = mine.filter(t => t.status === "open").length;
  const closed = mine.filter(t => t.status === "closed").length;
  const pending = mine.filter(t => t.status === "pending").length;

  return (
    <div className="sup-card">
      <div className="panel-kicker">[ Your tickets ]</div>
      <h2>Status <span style={{ fontFamily: "'Space Mono', monospace", fontSize: 12, color: "var(--yellow)" }}>{mine.length} TOTAL</span></h2>
      <div className="ticket-strip">
        <TicketStat kind="open" count={open} label="Open" />
        <TicketStat kind="pending" count={pending} label="Awaiting you" />
        <TicketStat kind="closed" count={closed} label="Closed" />
      </div>
      {mine.length === 0 ? (
        <div className="ticket-empty">
          No tickets yet. Send a message and we'll open one for you.
        </div>
      ) : (
        <div className="ticket-list">
          {mine.slice(0, 6).map((t) => (
            <div key={t.id} className={"ticket-row " + t.status}>
              <span className="dot">
                {t.status === "open"
                  ? <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><circle cx="12" cy="12" r="9"/></svg>
                  : <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12l5 5 9-11"/></svg>}
              </span>
              <div>
                <div className="subj">[{t.id}] {t.subject}</div>
                <div className="meta">{t.topic} · opened {relTime(t.createdAt)}{t.closedAt ? ` · closed ${relTime(t.closedAt)}` : ""}</div>
              </div>
              <span className={"pill " + t.status} onClick={() => onToggle(t.id)} style={{ cursor: "pointer" }} title="Click to toggle status">
                {t.status}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ---------------- Documentation downloads ---------------- */

function DocsCard() {
  return (
    <div className="docs-card">
      <div className="panel-kicker">[ Documentation ]</div>
      <h2>Manuals &amp; downloads</h2>
      <p className="docs-intro">Guides and reference material for your XOVND instruments — grab the PDF and keep it next to your DAW.</p>
      <div className="docs-list">
        {SUPPORT_DOCS.map((d) => (
          <div key={d.id} className={"docs-row" + (d.ready ? "" : " soon")}>
            <div className="docs-ic" aria-hidden="true">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/>
                <path d="M14 3v5h5"/>
                <path d="M9 13h6M9 17h5"/>
              </svg>
            </div>
            <div className="docs-meta">
              <div className="docs-title">
                <span className="docs-tag">{d.tag}</span>{d.title}
              </div>
              <div className="docs-desc">{d.desc}</div>
              <div className="docs-sub">{d.meta}</div>
            </div>
            {d.ready ? (
              <a className="docs-dl" href={d.href} download={d.file}>
                Download <span>↓</span>
              </a>
            ) : (
              <span className="docs-dl disabled">Soon</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ---------------- Satisfaction bar ---------------- */

const FACES = [
  { id: 1, glyph: "😡", label: "Awful" },
  { id: 2, glyph: "🙁", label: "Bad" },
  { id: 3, glyph: "😐", label: "Meh" },
  { id: 4, glyph: "🙂", label: "Good" },
  { id: 5, glyph: "🤩", label: "Loved it" },
];

function SatisfactionBar() {
  const [rating, setRating] = useState(() => readJSON(SUP_SAT_KEY, null));
  const [shown, setShown] = useState(!!rating);
  useEffect(() => { writeJSON(SUP_SAT_KEY, rating); }, [rating]);

  const pick = (r) => {
    setRating(r);
    setShown(true);
  };

  return (
    <div className="sat-card">
      <div className="copy">
        <h3>How was your support experience?</h3>
        <p>One tap. Anonymous. Helps us pick the right battles.</p>
      </div>
      <div className="sat-bar">
        {FACES.map(f => (
          <button key={f.id}
                  className={"sat-btn" + (rating === f.id ? " on" : "")}
                  onClick={() => pick(f.id)}
                  title={f.label}
                  aria-label={f.label}>
            <span>{f.glyph}</span>
          </button>
        ))}
      </div>
      <span className={"sat-thanks" + (shown ? " show" : "")}>
        {rating ? `Thanks — recorded as "${FACES.find(f => f.id === rating)?.label}"` : ""}
      </span>
    </div>
  );
}

/* ---------------- App ---------------- */

function App() {
  const { cart, cartOpen, openCart, closeCart, addToCart, removeAt, toast: cartToast } = useCart();
  const auth = useAuth();
  const access = useAccessModal();
  const accountModal = useAccountModal();
  const [tickets, setTickets] = useState(readJSON(SUP_TICKETS_KEY, []));
  const [toast, setToast] = useState("");

  useEffect(() => {
    const onStorage = (e) => {
      if (e.key === SUP_TICKETS_KEY) setTickets(readJSON(SUP_TICKETS_KEY, []));
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  useEffect(() => {
    if (!toast) return;
    const id = setTimeout(() => setToast(""), 2000);
    return () => clearTimeout(id);
  }, [toast]);

  const onAccountClick = () => {
    if (auth.user) {
      accountModal.openModal();
    } else {
      access.openModal('code');
    }
  };

  const onSent = (ticket) => {
    setTickets(readJSON(SUP_TICKETS_KEY, []));
    setToast(`Ticket ${ticket.id} opened`);
  };
  const onToggle = (id) => {
    const list = readJSON(SUP_TICKETS_KEY, []);
    const t = list.find(x => x.id === id);
    if (!t) return;
    t.status = t.status === "open" ? "closed" : "open";
    t.closedAt = t.status === "closed" ? new Date().toISOString() : null;
    writeJSON(SUP_TICKETS_KEY, list);
    setTickets(list);
    setToast(`Ticket ${id} ${t.status}`);
  };

  return (
    <>
      <SiteHeader
        cartCount={cart.length}
        onOpenCart={openCart}
        current="support"
        user={auth.user}
        onAccountClick={onAccountClick}
      />
      <div className="sup-shell">
        <div className="sup-head">
          <div>
            <div className="eyebrow">[ Support · we answer everything ]</div>
            <h1>Stuck? <span className="alt">We're here.</span></h1>
          </div>
          <p className="lead">Real humans replying within 4 hours on weekdays. Mail us, grab the docs, or track your tickets below.</p>
        </div>

        <div className="sup-grid">
          <MailForm user={auth.user} onSent={onSent} />
          <TicketsCard tickets={tickets} user={auth.user} onToggle={onToggle} />
          <DocsCard />
          <SatisfactionBar />
        </div>
      </div>

      <SiteFooter />
      <CartDrawer open={cartOpen} onClose={closeCart} items={cart} onRemove={removeAt} />
      <AccessModal open={access.open} initialTab={access.initialTab} onClose={access.closeModal} />
      <AccountModal open={accountModal.open} onClose={accountModal.closeModal} user={auth.user} onLogout={auth.logout} />
      {/* LoginModal stub — Phase 2B.3 Supabase Auth */}
      <div className={"toast" + (toast ? " show" : "")}>{toast}</div>
    </>
  );
}


export default function Page() { return <App />; }
