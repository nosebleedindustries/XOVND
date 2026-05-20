/* Admin — multi-panel dashboard
   Tabs: Overview · Purchases · Support · Forum · Live Chat · Feature Requests · Mail */
const { useState, useEffect, useMemo, useRef } = React;

const FROM_ADDR = "noreply@xovnd.audio";

/* ============== icons ============== */
const Ic = {
  overview: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="8" height="8"/><rect x="13" y="3" width="8" height="8"/><rect x="3" y="13" width="8" height="8"/><rect x="13" y="13" width="8" height="8"/></svg>,
  purchases: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 7h14l-1.5 12H6.5L5 7z"/><path d="M8 7V5a4 4 0 018 0v2"/></svg>,
  /* helmet + pen */
  tickets: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 13a8 8 0 0116 0v5H4v-5z"/>
      <path d="M4 13c0-4 3-8 8-8s8 4 8 8"/>
      <path d="M9 18v3h6v-3"/>
      <path d="M14 7l4 4-2 5-5 2-4-4 5-2 2-5z"/>
    </svg>
  ),
  forum: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"><path d="M3 5h14v10H8l-5 5V5z"/><path d="M7 9h6"/><path d="M7 12h4"/></svg>,
  chat: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="9"/><path d="M8 12h0M12 12h0M16 12h0" strokeLinecap="round" strokeWidth="3"/></svg>,
  features: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 3l2.5 5 5.5.8-4 4 1 5.5L12 16l-5 2.3 1-5.5-4-4 5.5-.8L12 3z"/></svg>,
  mail: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 7 9-7"/></svg>,
};

const HeartIcon = ({ filled }) => (
  <svg viewBox="0 0 24 24" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round">
    <path d="M12 21s-7-4.5-9.5-9C.8 8.2 3.2 4 7 4c2 0 3.6 1 5 2.7C13.4 5 15 4 17 4c3.8 0 6.2 4.2 4.5 8C19 16.5 12 21 12 21z"/>
  </svg>
);

/* ============== helpers ============== */
function initials(s) {
  if (!s) return "??";
  const parts = s.trim().split(/[\s@.]+/).filter(Boolean);
  return (parts[0]?.[0] || "?").toUpperCase() + (parts[1]?.[0] || "").toUpperCase();
}
function fmtDate(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" }) +
    " · " + d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
}
function fmtDay(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}
function randomCode8() {
  let s = "";
  for (let i = 0; i < 8; i++) s += Math.floor(Math.random() * 10);
  return s;
}

/* ============== seed/persisted data ============== */
const KEY_PURCHASES = "xovnd_admin_purchases";
const KEY_TICKETS   = "xovnd_admin_tickets";
const KEY_FORUM     = "xovnd_admin_forum";
const KEY_FEATURES  = "xovnd_admin_features";
const KEY_CHATS     = "xovnd_admin_chats";

function readObj(k, fb) { try { return JSON.parse(localStorage.getItem(k)) ?? fb; } catch { return fb; } }
function writeObj(k, v) { localStorage.setItem(k, JSON.stringify(v)); }

const SEED_PURCHASES = [
  { id: "p1", name: "Rita Borg",        email: "rita.borg@studio.audio",     product: "CLVSTER",  amount: 79,  code: "20830174", purchasedAt: "2026-04-12T11:32:00Z" },
  { id: "p2", name: "Marcel Ko",        email: "m.ko@hello.fr",              product: "RUBBER",   amount: 49,  code: "44081902", purchasedAt: "2026-04-09T15:11:00Z" },
  { id: "p3", name: "Tina Lacuna",      email: "tlacuna@gmail.com",          product: "CLVSTER",  amount: 79,  code: "70112289", purchasedAt: "2026-03-29T08:02:00Z" },
  { id: "p4", name: "Ola Hofmann",      email: "o.hofmann@vinyl-bx.de",      product: "PRISMA",   amount: 89,  code: "98223410", purchasedAt: "2026-03-22T18:45:00Z" },
  { id: "p5", name: "Yuto Kano",        email: "yuto@kano.tokyo",            product: "ECHOIST",  amount: 39,  code: "30224011", purchasedAt: "2026-03-14T20:01:00Z" },
  { id: "p6", name: "Sasha P.",         email: "sasha.p@protonmail.com",     product: "CLVSTER",  amount: 79,  code: "55003318", purchasedAt: "2026-02-28T09:09:00Z" },
];

const SEED_TICKETS = [
  { id: "t-4129", subject: "CLVSTER crashes when reloading session in Live 12",
    customer: "rita.borg@studio.audio", customerName: "Rita Borg",
    product: "CLVSTER", status: "open", opened: "2026-05-12T10:14:00Z",
    thread: [
      { who: "user",  body: "Hey, every time I reopen a Live 12 set with CLVSTER on a track, it crashes during plugin scan. Mac M2. Sonoma 14.4.", when: "2026-05-12T10:14:00Z" },
      { who: "admin", body: "Hi Rita — sorry about this. Can you send your crash report from ~/Library/Logs/DiagnosticReports?", when: "2026-05-12T11:02:00Z" },
    ],
  },
  { id: "t-4131", subject: "Licence transfer to new laptop",
    customer: "m.ko@hello.fr", customerName: "Marcel Ko",
    product: "RUBBER", status: "pending", opened: "2026-05-14T16:01:00Z",
    thread: [
      { who: "user", body: "Bought a new MacBook — how do I move my RUBBER licence over without losing the seat on the old one?", when: "2026-05-14T16:01:00Z" },
    ],
  },
  { id: "t-4133", subject: "PRISMA preset folder not loading",
    customer: "o.hofmann@vinyl-bx.de", customerName: "Ola Hofmann",
    product: "PRISMA", status: "open", opened: "2026-05-15T08:22:00Z",
    thread: [
      { who: "user", body: "After updating to 1.2 my custom preset folder is empty in the browser, but the .xprs files are still on disk.", when: "2026-05-15T08:22:00Z" },
    ],
  },
  { id: "t-4120", subject: "Refund request — accidentally bought RUBBER twice",
    customer: "tlacuna@gmail.com", customerName: "Tina Lacuna",
    product: "RUBBER", status: "closed", opened: "2026-05-04T19:00:00Z",
    closedBy: "admin",
    thread: [
      { who: "user",  body: "I think I clicked Buy twice. Can you refund one of them?", when: "2026-05-04T19:00:00Z" },
      { who: "admin", body: "Refunded the duplicate, will appear in 3–5 business days.", when: "2026-05-04T19:42:00Z" },
    ],
  },
];

const SEED_FORUM = [
  { id: "f1", who: "rita.borg",   email: "rita.borg@studio.audio",  body: "Could the next CLVSTER beta expose Cluster size to MIDI CC? Would let me morph patterns from a controller in real time.", when: "2026-05-16T09:12:00Z", hearts: 4 },
  { id: "f2", who: "marcel_ko",   email: "m.ko@hello.fr",            body: "Loving RUBBER. The compander mode is sounding insane on drum buses — any chance of a sidechain key input in 2.2?", when: "2026-05-14T20:51:00Z", hearts: 5 },
  { id: "f3", who: "yuto_k",      email: "yuto@kano.tokyo",          body: "Is the algorithmic rave mode in CLVSTER going to support odd time signatures (5/8, 7/8)?", when: "2026-05-12T13:34:00Z", hearts: 3 },
  { id: "f4", who: "ola.h",       email: "o.hofmann@vinyl-bx.de",    body: "PRISMA preset packs roadmap? My eurorack friends are asking.", when: "2026-05-09T11:00:00Z", hearts: 2 },
];

const SEED_FEATURES = [
  { id: "fr1", product: "CLVSTER", title: "MIDI CC mapping for Cluster size + Algo Modifier intensity", author: "rita.borg",   votes: 87 },
  { id: "fr2", product: "CLVSTER", title: "Odd time signatures (5/8, 7/8, 11/16)",                          author: "yuto_k",     votes: 64 },
  { id: "fr3", product: "CLVSTER", title: "Export pattern as MIDI clip",                                    author: "sasha.p",    votes: 41 },
  { id: "fr4", product: "RUBBER",  title: "External sidechain key input",                                   author: "marcel_ko",  votes: 92 },
  { id: "fr5", product: "RUBBER",  title: "Mid/Side compression mode",                                      author: "tlacuna",    votes: 38 },
  { id: "fr6", product: "PRISMA",  title: "Spectral freeze + scrub",                                        author: "ola.h",      votes: 71 },
  { id: "fr7", product: "PRISMA",  title: "Resynth from microphone input (live)",                           author: "rita.borg",  votes: 22 },
  { id: "fr8", product: "ECHOIST", title: "Tempo-synced ducking with curve editor",                         author: "marcel_ko",  votes: 45 },
];

const SEED_CHATS = [
  { id: "c1", who: "Rita Borg",   email: "rita.borg@studio.audio",  live: true,  last: "Hey, can you check my crash log?",       messages: [
      { who: "user", body: "Hey, can you check my crash log?", when: "2026-05-19T10:02:00Z" },
    ] },
  { id: "c2", who: "Marcel Ko",   email: "m.ko@hello.fr",            live: false, last: "Bought a new MacBook…",                  messages: [
      { who: "user",  body: "Bought a new MacBook — how do I move my RUBBER licence over?", when: "2026-05-14T16:01:00Z" },
      { who: "admin", body: "We can transfer it manually. What's your new machine ID?",    when: "2026-05-14T16:05:00Z" },
    ] },
  { id: "c3", who: "Sasha P.",    email: "sasha.p@protonmail.com",   live: true,  last: "Any update on the MIDI export?",        messages: [
      { who: "user",  body: "Any update on the MIDI export feature?", when: "2026-05-19T11:10:00Z" },
    ] },
];

function ensureSeed(k, fb) {
  const v = readObj(k, null);
  if (v) return v;
  writeObj(k, fb);
  return fb;
}

/* ============== Tabs ============== */
function TabBar({ tabs, current, onChange }) {
  return (
    <div className="tabs">
      {tabs.map((t) => (
        <button key={t.id}
          className={"tab" + (current === t.id ? " active" : "")}
          onClick={() => onChange(t.id)}>
          {t.icon}
          <span>{t.label}</span>
          {typeof t.count === "number" && <span className="count">{t.count}</span>}
        </button>
      ))}
    </div>
  );
}

/* ============== Purchases panel ============== */
function PurchasesPanel({ purchases, onCopy }) {
  return (
    <div className="admin-panel">
      <div className="eyebrow">{Ic.purchases} [ Purchases · last 90 days ]</div>
      <h2>Sales <span className="count">{purchases.length} ORDERS · €{purchases.reduce((s,p) => s + p.amount, 0)}</span></h2>
      <div className="ad-table">
        <div className="ad-row pur-row head">
          <span>Customer</span>
          <span>Product</span>
          <span>8-digit key</span>
          <span>Date</span>
          <span></span>
        </div>
        {purchases.map((p) => (
          <div className="ad-row pur-row" key={p.id}>
            <div className="who">
              <div className="avatar">{initials(p.name || p.email)}</div>
              <div style={{ minWidth: 0 }}>
                <div className="name">{p.name}</div>
                <div className="em">{p.email}</div>
              </div>
            </div>
            <span className="product">{p.product} <span style={{ color: "#807a6c", fontWeight: 400 }}>· €{p.amount}</span></span>
            <span className="key" onClick={() => onCopy(p.code)} title="Click to copy" style={{ cursor: "pointer" }}>{p.code}</span>
            <span className="when">{fmtDate(p.purchasedAt)}</span>
            <div className="row-actions">
              <button className="ad-action" onClick={() => onCopy(p.code)}>Copy</button>
              <button className="ad-action" onClick={() => alert(`Resending licence email for ${p.product} to ${p.email}…`)}>Resend</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ============== Tickets ============== */
function TicketsPanel({ tickets, setTickets, showToast }) {
  const [sel, setSel] = useState(tickets.find(t => t.status !== "closed")?.id || tickets[0]?.id);
  const [draft, setDraft] = useState("");
  const active = tickets.find(t => t.id === sel);

  const sendReply = () => {
    if (!draft.trim() || !active) return;
    const updated = tickets.map(t => t.id === active.id
      ? { ...t, status: t.status === "closed" ? t.status : "open", thread: [...t.thread, { who: "admin", body: draft.trim(), when: new Date().toISOString() }] }
      : t);
    setTickets(updated);
    setDraft("");
    showToast("Reply sent to " + active.customerName);
  };

  const close = () => {
    if (!active) return;
    setTickets(tickets.map(t => t.id === active.id ? { ...t, status: "closed", closedBy: "admin", closedAt: new Date().toISOString() } : t));
    showToast("Ticket " + active.id + " closed");
  };
  const reopen = () => {
    if (!active) return;
    setTickets(tickets.map(t => t.id === active.id ? { ...t, status: "open" } : t));
    showToast("Ticket " + active.id + " reopened");
  };

  const openCt = tickets.filter(t => t.status === "open").length;
  const pendCt = tickets.filter(t => t.status === "pending").length;

  return (
    <div className="admin-panel">
      <div className="eyebrow">{Ic.tickets} [ Support inbox · pen + helmet ]</div>
      <h2>Tickets <span className="count">{openCt} OPEN · {pendCt} PENDING · {tickets.length} TOTAL</span></h2>
      <div className="ticket-grid">
        <div className="ticket-list">
          {tickets.map((t) => (
            <div key={t.id}
              className={"ticket-card status-" + t.status + (sel === t.id ? " active" : "") + (t.status === "closed" ? " closed" : "")}
              onClick={() => setSel(t.id)}>
              <span className="num">{t.id}</span>
              <div>
                <div className="subj">{t.subject}</div>
                <div className="meta"><b>{t.customerName}</b> · {t.product} · {fmtDay(t.opened)}</div>
              </div>
              <span className={"status status-" + t.status}>{t.status}</span>
            </div>
          ))}
        </div>

        {active ? (
          <div className="ticket-detail">
            <div className="head">
              <div>
                <h3>{active.subject}</h3>
                <div className="meta">{active.id} · {active.customerName} · {active.customer} · {active.product}</div>
              </div>
              <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                {active.status === "closed"
                  ? <button className="ad-action" onClick={reopen}>Reopen</button>
                  : <button className="ad-action primary" onClick={close}>Close ticket</button>}
              </div>
            </div>
            <div className="thread">
              {active.thread.map((m, i) => (
                <div className={"bubble " + m.who} key={i}>
                  <div className="who">{m.who === "admin" ? "Admin" : active.customerName} · {fmtDate(m.when)}</div>
                  {m.body}
                </div>
              ))}
              {active.status === "closed" && (
                <div style={{ textAlign: "center", color: "#6a6557", fontFamily: "'Space Mono', monospace", fontSize: 11, letterSpacing: "0.16em", textTransform: "uppercase", padding: "10px 0" }}>
                  — closed by {active.closedBy || "user"} {active.closedAt ? "· " + fmtDate(active.closedAt) : ""} —
                </div>
              )}
            </div>
            <div className="reply-row">
              <textarea
                placeholder={active.status === "closed" ? "Ticket is closed. Reopen to reply." : "Reply to " + active.customerName + "…"}
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                disabled={active.status === "closed"} />
              <button className="send-btn" onClick={sendReply} disabled={!draft.trim() || active.status === "closed"}>
                Reply <span>→</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="empty"><b>No ticket selected</b>Pick a ticket from the list.</div>
        )}
      </div>
    </div>
  );
}

/* ============== Forum messages — with 5 heart rating ============== */
function ForumPanel({ messages, setMessages, showToast }) {
  const setHearts = (id, n) => {
    setMessages(messages.map(m => m.id === id ? { ...m, hearts: m.hearts === n ? n - 1 : n } : m));
  };
  return (
    <div className="admin-panel">
      <div className="eyebrow">{Ic.forum} [ Private messages from the forum ]</div>
      <h2>Inbox <span className="count">{messages.length} MESSAGES</span></h2>
      <div className="forum-grid">
        {messages.map((m) => (
          <div className="forum-msg" key={m.id}>
            <div className="who-avatar">{initials(m.who)}</div>
            <div>
              <div className="head">
                <span className="who">{m.who}<span className="em">{m.email}</span></span>
                <span className="when">{fmtDay(m.when)}</span>
              </div>
              <div className="body">{m.body}</div>
              <div className="acts">
                <button className="ad-action" onClick={() => showToast("Reply composer (mock)")}>Reply</button>
                <button className="ad-action" onClick={() => showToast("Opened on forum")}>Open thread</button>
                <button className="ad-action danger" onClick={() => setMessages(messages.filter(x => x.id !== m.id))}>Archive</button>
              </div>
            </div>
            <div className="hearts" title="Rate this message">
              <span className="lbl">Rate</span>
              {[1,2,3,4,5].map(n => (
                <button key={n} className={n <= m.hearts ? "on" : ""} onClick={() => setHearts(m.id, n)} aria-label={"Rate " + n + " hearts"}>
                  <HeartIcon filled={n <= m.hearts} />
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ============== Live chat ============== */
function LiveChatPanel({ chats, setChats, showToast }) {
  const [sel, setSel] = useState(chats[0]?.id);
  const [draft, setDraft] = useState("");
  const scrollRef = useRef(null);
  const active = chats.find(c => c.id === sel);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [sel, active?.messages.length]);

  const send = () => {
    if (!draft.trim() || !active) return;
    const msg = { who: "admin", body: draft.trim(), when: new Date().toISOString() };
    setChats(chats.map(c => c.id === active.id ? { ...c, messages: [...c.messages, msg], last: msg.body } : c));
    setDraft("");
  };

  const openWith = (id) => {
    setSel(id);
    setChats(chats.map(c => c.id === id ? { ...c, live: true } : c));
    showToast("Live chat opened");
  };

  return (
    <div className="admin-panel">
      <div className="eyebrow">{Ic.chat} [ Live chat ]</div>
      <h2>Conversations <span className="count">{chats.filter(c => c.live).length} LIVE · {chats.length} TOTAL</span></h2>
      <div className="chat-shell">
        <div className="chat-list">
          {chats.map((c) => (
            <div key={c.id}
              className={"it" + (c.live ? " live" : "") + (sel === c.id ? " active" : "")}
              onClick={() => setSel(c.id)}>
              <span className="dot"></span>
              <div className="avatar">{initials(c.who)}</div>
              <div style={{ minWidth: 0 }}>
                <div className="name">{c.who}</div>
                <div className="last" style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{c.last}</div>
              </div>
            </div>
          ))}
        </div>
        {active ? (
          <div className="chat-stage">
            <div className="ch-head">
              <span className="name">{active.who}<span className="em">{active.email}</span></span>
              {active.live
                ? <span className="live-pill">Live now</span>
                : <button className="ad-action primary" onClick={() => openWith(active.id)}>Open live chat</button>}
            </div>
            <div className="scroll" ref={scrollRef}>
              {active.messages.map((m, i) => (
                <div className={"bubble " + m.who} key={i} style={{ alignSelf: m.who === "admin" ? "flex-end" : "flex-start" }}>
                  <div className="who">{m.who === "admin" ? "You" : active.who} · {fmtDate(m.when)}</div>
                  {m.body}
                </div>
              ))}
            </div>
            <div className="reply">
              <input type="text" placeholder={"Message " + active.who + "…"}
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") send(); }} />
              <button className="send-btn" onClick={send} disabled={!draft.trim()}>Send <span>→</span></button>
            </div>
          </div>
        ) : (
          <div className="empty"><b>No customer selected</b>Pick a conversation on the left.</div>
        )}
      </div>
    </div>
  );
}

/* ============== Feature requests ============== */
function FeaturesPanel({ features }) {
  const grouped = useMemo(() => {
    const m = {};
    features.forEach(f => { (m[f.product] ||= []).push(f); });
    Object.values(m).forEach(arr => arr.sort((a,b) => b.votes - a.votes));
    return m;
  }, [features]);

  const productOrder = Object.keys(grouped).sort();

  return (
    <div className="admin-panel">
      <div className="eyebrow">{Ic.features} [ Feature requests · forum aggregate ]</div>
      <h2>Roadmap candidates <span className="count">{features.length} REQUESTS · {productOrder.length} PRODUCTS</span></h2>
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {productOrder.map((prod) => (
          <div className="fr-product" key={prod}>
            <h3><span className="pname">{prod}</span> <span className="ct">{grouped[prod].length} requests · {grouped[prod].reduce((s,r) => s + r.votes, 0)} votes</span></h3>
            <div className="fr-list">
              {grouped[prod].map((f, i) => (
                <div className={"fr-item" + (i === 0 ? " top" : "")} key={f.id}>
                  <div className="votes">{f.votes}<span className="lbl">votes</span></div>
                  <div>
                    <div className="ftitle">{f.title}</div>
                    <div className="fmeta">
                      {i === 0 && <span className="crown">★ TOP</span>}
                      Filed by {f.author}
                    </div>
                  </div>
                  <div className="fbtns">
                    <button className="ad-action primary">Add to roadmap</button>
                    <button className="ad-action">View thread</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ============== Mail compose (existing) ============== */
function ComposeMail({ customers, onSent }) {
  const [to, setTo] = useState("ALL");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);
  const canSend = !!subject.trim() && !!body.trim() && (to === "ALL" ? customers.length > 0 : !!to);

  const send = (e) => {
    e.preventDefault();
    if (!canSend) return;
    setBusy(true);
    const recipients = to === "ALL" ? customers.map(c => c.email) : [to];
    setTimeout(() => {
      window.xovndDB.addMessage({ from: FROM_ADDR, to: recipients, subject: subject.trim(), body: body.trim() });
      onSent("Sent to " + recipients.length + " " + (recipients.length === 1 ? "client" : "clients"));
      setSubject(""); setBody(""); setTo("ALL"); setBusy(false);
    }, 400);
  };

  return (
    <div className="admin-panel">
      <div className="eyebrow">{Ic.mail} [ Compose mail ]</div>
      <h2>Send a broadcast <span className="count">FROM XOVND</span></h2>
      <form className="compose-form" onSubmit={send}>
        <div className="from"><b>From:</b> {FROM_ADDR}</div>
        <div className="row">
          <label><span>To</span>
            <select value={to} onChange={(e) => setTo(e.target.value)}>
              <option value="ALL">All clients ({customers.length})</option>
              {customers.map(c => <option key={c.email} value={c.email}>{c.email}</option>)}
            </select>
          </label>
          <label><span>Subject</span>
            <input type="text" placeholder="Spring drop — €40 off CLVSTER" value={subject} onChange={(e) => setSubject(e.target.value)} />
          </label>
        </div>
        <label><span>Body</span>
          <textarea placeholder={"Hi {{name}},\n\nWe've just shipped CLVSTER v1.0.3…"} value={body} onChange={(e) => setBody(e.target.value)} />
        </label>
        <button type="submit" className="send-btn" disabled={!canSend || busy}>{busy ? "Sending…" : "Send"} <span>→</span></button>
      </form>
    </div>
  );
}

function MailLog({ messages }) {
  return (
    <div className="admin-panel">
      <div className="eyebrow">{Ic.mail} [ Sent messages ]</div>
      <h2>Mail log <span className="count">{messages.length} SENT</span></h2>
      {messages.length === 0
        ? <div className="empty"><b>No mail sent yet</b>Compose your first message above.</div>
        : <div className="msg-log">
            {messages.map((m) => (
              <div className="msg-card" key={m.id}>
                <div className="h">
                  <span><span className="to">to:</span> {m.to.length} · {m.to.slice(0, 2).join(", ")}{m.to.length > 2 ? " +" + (m.to.length - 2) : ""}</span>
                  <span>{fmtDate(m.sentAt)}</span>
                </div>
                <div className="subj">{m.subject}</div>
                <div className="body">{m.body}</div>
              </div>
            ))}
          </div>
      }
    </div>
  );
}

/* ============== Overview (stats) ============== */
function OverviewPanel({ purchases, tickets, forum, features, chats, onJump }) {
  const totalRev = purchases.reduce((s,p) => s + p.amount, 0);
  const openTickets = tickets.filter(t => t.status !== "closed").length;
  const live = chats.filter(c => c.live).length;
  const stats = [
    { label: "Revenue · 90d",    big: "€" + totalRev,           sub: purchases.length + " orders",   to: "purchases" },
    { label: "Open tickets",     big: openTickets,              sub: tickets.length + " total",      to: "tickets"   },
    { label: "Forum DMs",        big: forum.length,             sub: "private inbox",                to: "forum"     },
    { label: "Live chats",       big: live,                     sub: chats.length + " open",         to: "chat"      },
    { label: "Feature requests", big: features.length,          sub: "sorted by product",            to: "features"  },
  ];
  return (
    <div className="admin-panel">
      <div className="eyebrow">{Ic.overview} [ Overview ]</div>
      <h2>Today, at a glance</h2>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12 }}>
        {stats.map((s) => (
          <button key={s.to} className="ad-action" style={{
            background: "var(--black)", padding: "18px 18px 20px", textAlign: "left",
            display: "flex", flexDirection: "column", gap: 6, alignItems: "flex-start",
            letterSpacing: 0, textTransform: "none", fontSize: 13, color: "var(--white)",
            cursor: "pointer", lineHeight: 1.2,
          }} onClick={() => onJump(s.to)}>
            <span style={{ fontFamily: "'Space Mono', monospace", fontSize: 10, color: "#807a6c", letterSpacing: "0.18em", textTransform: "uppercase" }}>{s.label}</span>
            <span style={{ fontFamily: "'Archivo Black'", fontSize: 30, lineHeight: 1, letterSpacing: "-0.02em" }}>{s.big}</span>
            <span style={{ fontFamily: "'Space Mono', monospace", fontSize: 11, color: "#807a6c", letterSpacing: "0.08em" }}>{s.sub}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

/* ============== Admin gate ============== */
const ADMIN_EMAIL = "stalactite3d@gmail.com";

function AdminGate({ children }) {
  const auth = window.useAuth();
  const [loginOpen, setLoginOpen] = useState(false);
  const isAdmin = auth.user && auth.user.email.toLowerCase() === ADMIN_EMAIL.toLowerCase();

  if (isAdmin) return children;

  const signedInButWrong = auth.user && !isAdmin;

  return (
    <div className="admin-shell">
      <div className="admin-bar">
        <div className="left">
          <img src="assets/fluxus-mark.png" alt="" />
          <span className="wm">OVND</span>
          <span className="tag">Admin · restricted</span>
        </div>
        <div className="right">
          <a href="index.html">← Back to site</a>
        </div>
      </div>

      <div style={{ maxWidth: 520, margin: "120px auto", padding: 32, border: "1px dashed #2a2722", textAlign: "center" }}>
        <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 10, color: "var(--pink)", letterSpacing: "0.22em", textTransform: "uppercase", marginBottom: 12 }}>
          [ Restricted area ]
        </div>
        <h1 style={{ fontFamily: "'Archivo Black'", fontSize: 38, margin: "0 0 14px", letterSpacing: "-0.02em", color: "var(--white)" }}>
          {signedInButWrong ? "Not your account." : "Admin only."}
        </h1>
        <p style={{ color: "#b5b0a2", fontSize: 14, lineHeight: 1.55, margin: "0 0 22px", textWrap: "pretty" }}>
          {signedInButWrong
            ? <>You're signed in as <b style={{ color: "var(--white)" }}>{auth.user.email}</b>. Admin tools are only available to the studio account.</>
            : "This page is for the XOVND studio. Sign in with the admin email to continue."}
        </p>
        <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
          {signedInButWrong
            ? <button className="send-btn" style={{ alignSelf: "auto" }} onClick={() => { auth.logout(); setLoginOpen(true); }}>
                Sign out &amp; switch <span>→</span>
              </button>
            : <button className="send-btn" style={{ alignSelf: "auto" }} onClick={() => setLoginOpen(true)}>
                Sign in <span>→</span>
              </button>}
          <a href="index.html" className="ad-action" style={{ alignSelf: "center" }}>Back to site</a>
        </div>
        <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 10, color: "#4a463d", letterSpacing: "0.16em", textTransform: "uppercase", marginTop: 28 }}>
          ADMIN · {ADMIN_EMAIL}
        </div>
      </div>

      {window.LoginModal && (
        <window.LoginModal open={loginOpen} onClose={() => setLoginOpen(false)} onAuth={auth.login} />
      )}
    </div>
  );
}

/* ============== Main app ============== */
function AdminApp() {
  const [tab, setTab] = useState("overview");
  const [customers, setCustomers] = useState(window.xovndDB.getCustomers());
  const [messages, setMessages] = useState(window.xovndDB.getMessages());

  const [purchases, setPurchases] = useState(() => ensureSeed(KEY_PURCHASES, SEED_PURCHASES));
  const [tickets,   setTickets]   = useState(() => ensureSeed(KEY_TICKETS, SEED_TICKETS));
  const [forum,     setForum]     = useState(() => ensureSeed(KEY_FORUM, SEED_FORUM));
  const [features,  setFeatures]  = useState(() => ensureSeed(KEY_FEATURES, SEED_FEATURES));
  const [chats,     setChats]     = useState(() => ensureSeed(KEY_CHATS, SEED_CHATS));

  useEffect(() => writeObj(KEY_PURCHASES, purchases), [purchases]);
  useEffect(() => writeObj(KEY_TICKETS,   tickets),   [tickets]);
  useEffect(() => writeObj(KEY_FORUM,     forum),     [forum]);
  useEffect(() => writeObj(KEY_FEATURES,  features),  [features]);
  useEffect(() => writeObj(KEY_CHATS,     chats),     [chats]);

  const [toast, setToast] = useState("");
  useEffect(() => { if (!toast) return; const t = setTimeout(() => setToast(""), 2200); return () => clearTimeout(t); }, [toast]);
  const showToast = (s) => setToast(s);

  const copy = async (s) => { try { await navigator.clipboard.writeText(s); showToast("Copied · " + s); } catch { showToast("Copy failed"); } };

  // listen for sign-ups
  useEffect(() => {
    const onStorage = () => {
      setCustomers(window.xovndDB.getCustomers());
      setMessages(window.xovndDB.getMessages());
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const tabs = [
    { id: "overview",  label: "Overview",  icon: Ic.overview  },
    { id: "purchases", label: "Purchases", icon: Ic.purchases, count: purchases.length },
    { id: "tickets",   label: "Support",   icon: Ic.tickets,   count: tickets.filter(t => t.status !== "closed").length },
    { id: "forum",     label: "Forum DMs", icon: Ic.forum,     count: forum.length },
    { id: "chat",      label: "Live chat", icon: Ic.chat,      count: chats.filter(c => c.live).length },
    { id: "features",  label: "Features",  icon: Ic.features,  count: features.length },
    { id: "mail",      label: "Broadcast", icon: Ic.mail,      count: messages.length },
  ];

  return (
    <div className="admin-shell">
      <div className="admin-bar">
        <div className="left">
          <img src="assets/fluxus-mark.png" alt="" />
          <span className="wm">OVND</span>
          <span className="tag">Admin · hidden</span>
        </div>
        <div className="right">
          <span>{customers.length} clients · {purchases.length} sales · {tickets.filter(t => t.status !== "closed").length} open tickets</span>
          <span style={{ color: "#3a3630" }}>·</span>
          <a href="index.html">← Back to site</a>
        </div>
      </div>

      <TabBar tabs={tabs} current={tab} onChange={setTab} />

      <div className="admin-grid">
        {tab === "overview" && <OverviewPanel
          purchases={purchases} tickets={tickets} forum={forum} features={features} chats={chats}
          onJump={setTab} />}
        {tab === "purchases" && <PurchasesPanel purchases={purchases} onCopy={copy} />}
        {tab === "tickets"   && <TicketsPanel tickets={tickets} setTickets={setTickets} showToast={showToast} />}
        {tab === "forum"     && <ForumPanel messages={forum} setMessages={setForum} showToast={showToast} />}
        {tab === "chat"      && <LiveChatPanel chats={chats} setChats={setChats} showToast={showToast} />}
        {tab === "features"  && <FeaturesPanel features={features} />}
        {tab === "mail"      && (
          <>
            <ComposeMail customers={customers} onSent={(msg) => { setMessages(window.xovndDB.getMessages()); showToast(msg); }} />
            <MailLog messages={messages} />
          </>
        )}
      </div>

      <div className={"admin-toast" + (toast ? " show" : "")}>{toast}</div>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<AdminGate><AdminApp /></AdminGate>);
