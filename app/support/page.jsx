'use client';
import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { SiteHeader, SiteFooter, CartDrawer, useCart, useAuth } from '@/components/shared';
import { AccessModal, useAccessModal } from '@/components/AccessModal';

/* XOVND support page — mail + live chat + tickets + satisfaction */

const SUPPORT_ADDR = "XOVND@tech.help";
const SUP_TICKETS_KEY = "xovnd_tickets";
const SUP_CHAT_KEY = "xovnd_support_chat";
const SUP_SAT_KEY = "xovnd_support_sat";

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

/* ---------------- Live chat ---------------- */

function Chat({ user }) {
  const seed = [{
    role: "bot",
    text: "Hi! I'm Lyra, the XOVND support assistant. I can help with installation, license activation, common bugs, or any plugin question. What's going on?",
    at: new Date().toISOString(),
  }];
  const [messages, setMessages] = useState(() => readJSON(SUP_CHAT_KEY, seed));
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const bodyRef = useRef(null);

  useEffect(() => { writeJSON(SUP_CHAT_KEY, messages); }, [messages]);
  useEffect(() => {
    if (bodyRef.current) bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
  }, [messages, busy]);

  const send = async () => {
    const v = input.trim();
    if (!v || busy) return;
    const userMsg = { role: "user", text: v, at: new Date().toISOString() };
    const next = [...messages, userMsg];
    setMessages(next);
    setInput("");
    setBusy(true);
    try {
      const history = next.slice(-12).map(m => ({
        role: m.role === "bot" ? "assistant" : "user",
        content: m.text,
      }));
      const system = `You are Lyra, a friendly, concise support agent for XOVND Audio — a small independent audio plugin company. Their flagship products are CLVSTER (an algorithmic step sequencer with "clusters" and "ALGO MODS") and RUBBER (a physical-modelling synth). Plugin formats: VST3, AU, AAX. Free 14-day trial on every plugin. Pricing in euros. Subscription tiers: All Products €9/mo, All Products + Beta €15/mo. Help the user diagnose problems, point them to the right step, and stay warm but brief — 3-5 sentences max. If you don't know something, say so and offer to open a ticket to ${SUPPORT_ADDR}.`;
      const reply = await window.claude.complete({
        messages: [{ role: "user", content: system }, ...history],
      });
      setMessages((cur) => [...cur, { role: "bot", text: reply.trim(), at: new Date().toISOString() }]);
    } catch (err) {
      setMessages((cur) => [...cur, {
        role: "bot",
        text: "Lyra is offline right now. Please use the mail form above and we'll get back to you within 4 hours.",
        at: new Date().toISOString(),
      }]);
    } finally {
      setBusy(false);
    }
  };

  const onKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  const clear = () => {
    if (confirm("Clear the chat history?")) {
      setMessages(seed);
    }
  };

  return (
    <div className="chat-card">
      <div className="chat-head">
        <div className="who">
          <div className="avatar">L</div>
          <div>
            <div className="name">Lyra · Live support</div>
            <div className="status">Online · Avg reply &lt; 30s</div>
          </div>
        </div>
        <button className="chat-clear" onClick={clear}>Clear chat</button>
      </div>
      <div className="chat-body" ref={bodyRef}>
        {messages.map((m, i) => (
          <div key={i} className={"msg " + m.role}>
            <div className="avatar-sm">{m.role === "bot" ? "L" : (user?.name?.[0] || user?.email?.[0] || "Y").toUpperCase()}</div>
            <div>
              <div className="bubble">{m.text}</div>
              <div className="ts">{timeOnly(m.at)}</div>
            </div>
          </div>
        ))}
        {busy && (
          <div className="msg bot">
            <div className="avatar-sm">L</div>
            <div className="bubble"><div className="typing"><span></span><span></span><span></span></div></div>
          </div>
        )}
      </div>
      <div className="chat-input">
        <textarea
          placeholder="Tell Lyra what's happening… (Enter to send · Shift+Enter for newline)"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={onKey}
          rows={1}
        />
        <button className="chat-send" onClick={send} disabled={!input.trim() || busy} aria-label="Send">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M2 21l21-9L2 3v7l15 2-15 2v7z"/></svg>
        </button>
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
      const id = auth.user.code || auth.user.email || 'user';
      if (confirm(`Signed in as ${id}\n\nSign out?`)) auth.logout();
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
          <p className="lead">Real humans replying within 4 hours on weekdays. Mail us, chat with Lyra in real time, or track your tickets below.</p>
        </div>

        <div className="sup-grid">
          <MailForm user={auth.user} onSent={onSent} />
          <TicketsCard tickets={tickets} user={auth.user} onToggle={onToggle} />
          <Chat user={auth.user} />
          <SatisfactionBar />
        </div>
      </div>

      <SiteFooter />
      <CartDrawer open={cartOpen} onClose={closeCart} items={cart} onRemove={removeAt} />
      <AccessModal open={access.open} initialTab={access.initialTab} onClose={access.closeModal} />
      {/* LoginModal stub — Phase 2B.3 Supabase Auth */}
      <div className={"toast" + (toast ? " show" : "")}>{toast}</div>
    </>
  );
}


export default function Page() { return <App />; }
