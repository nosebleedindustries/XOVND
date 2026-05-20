'use client';
import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { SiteHeader, SiteFooter, CartDrawer, useCart, useAuth } from '@/components/shared';

/* XOVND forum — localStorage-backed, registered-users-only.
   Threads list ↔ thread detail with replies. */

const FLX_THREADS = "xovnd_forum_threads_v2";
const FLX_CATEGORY = "xovnd_forum_category";

const CATEGORIES = [
{ id: "products", label: "Products presentations", tone: "yellow" },
{ id: "clvster", label: "CLVSTER Sequencer", tone: "yellow" },
{ id: "rubber", label: "RUBBER synth", tone: "pink" },
{ id: "bugs", label: "BUGS!", tone: "pink" },
{ id: "features", label: "FEATURE REQUEST", tone: "yellow" },
{ id: "music", label: "YOUR MUSIC WITH XOVND VSTs", tone: "pink" }];

const CAT_BY_ID = Object.fromEntries(CATEGORIES.map((c) => [c.id, c]));

function readThreads() {
  try {return JSON.parse(localStorage.getItem(FLX_THREADS) || "[]");} catch {return [];}
}
function writeThreads(list) {localStorage.setItem(FLX_THREADS, JSON.stringify(list));}

/* Seed a couple of example threads on first load */
function seedIfEmpty() {
  if (readThreads().length > 0) return;
  const now = Date.now();
  const seed = [
  {
    id: "t_seed1",
    title: "Show your CLVSTER patches — May 2026",
    category: "clvster",
    authorEmail: "mira@studio.audio",
    authorName: "Mira Okafor",
    createdAt: new Date(now - 1000 * 60 * 60 * 24 * 3).toISOString(),
    pinned: true,
    posts: [
    {
      id: "p_seed1a",
      authorEmail: "mira@studio.audio",
      authorName: "Mira Okafor",
      createdAt: new Date(now - 1000 * 60 * 60 * 24 * 3).toISOString(),
      body: "Kicking this off — drop a .clv export and a 30-sec render of your weirdest patch so far. I'll start: euclidean(7,16) + drunk-walk ±3 driving a wavetable through OTT. Sounds like a broken music box.",
      likes: ["jules@gear.fm", "sun@goldenrod.studio"]
    },
    {
      id: "p_seed1b",
      authorEmail: "jules@gear.fm",
      authorName: "Jules Maren",
      createdAt: new Date(now - 1000 * 60 * 60 * 22).toISOString(),
      body: "Stacking morph 0.42 over a polyrhythm 5:7 is basically free song ideas. Will upload tomorrow when I'm at the studio.",
      likes: []
    }]

  },
  {
    id: "t_seed2",
    title: "Feature request: MIDI Polyphonic Expression on per-cluster basis",
    category: "features",
    authorEmail: "wren@hexafloor.com",
    authorName: "Wren Kovacs",
    createdAt: new Date(now - 1000 * 60 * 60 * 14).toISOString(),
    pinned: false,
    posts: [
    {
      id: "p_seed2a",
      authorEmail: "wren@hexafloor.com",
      authorName: "Wren Kovacs",
      createdAt: new Date(now - 1000 * 60 * 60 * 14).toISOString(),
      body: "Would love MPE settings to live per-cluster rather than globally on the instance. Right now I'm running two instances side by side to fake it.",
      likes: ["mira@studio.audio"]
    }]

  },
  {
    id: "t_seed3",
    title: "Bug? Pattern morph clicks on tempo changes > 160bpm",
    category: "bugs",
    authorEmail: "theo@vance.audio",
    authorName: "Theo Vance",
    createdAt: new Date(now - 1000 * 60 * 30).toISOString(),
    pinned: false,
    posts: [
    {
      id: "p_seed3a",
      authorEmail: "theo@vance.audio",
      authorName: "Theo Vance",
      createdAt: new Date(now - 1000 * 60 * 30).toISOString(),
      body: "Logic Pro 11.1, M3 Max, latest CLVSTER build (1.0.2). Above ~160bpm I get a tiny click every time morph crosses 50%. Can repro on a default project.",
      likes: []
    }]

  },
  {
    id: "t_seed4",
    title: "Welcome — introducing the XOVND Studio line",
    category: "products",
    authorEmail: "noreply@xovnd.audio",
    authorName: "XOVND Team",
    createdAt: new Date(now - 1000 * 60 * 60 * 24 * 7).toISOString(),
    pinned: true,
    posts: [{
      id: "p_seed4a",
      authorEmail: "noreply@xovnd.audio",
      authorName: "XOVND Team",
      createdAt: new Date(now - 1000 * 60 * 60 * 24 * 7).toISOString(),
      body: "Hi everyone — welcome to the new forum. Use this category for product Q&A and feedback on anything we ship. Patches, song bounces and bug reports each get their own subsection.",
      likes: ["mira@studio.audio", "sun@goldenrod.studio", "theo@vance.audio"]
    }]
  },
  {
    id: "t_seed5",
    title: "RUBBER — anyone else getting beautiful sub-harmonics on chord input?",
    category: "rubber",
    authorEmail: "sun@goldenrod.studio",
    authorName: "Sun Park",
    createdAt: new Date(now - 1000 * 60 * 60 * 5).toISOString(),
    pinned: false,
    posts: [{
      id: "p_seed5a",
      authorEmail: "sun@goldenrod.studio",
      authorName: "Sun Park",
      createdAt: new Date(now - 1000 * 60 * 60 * 5).toISOString(),
      body: "Feeding a 4-note jazz voicing into RUBBER's PHYS engine pulls a ghost sub down an octave that wasn't in the input. It's gorgeous. Anyone else?",
      likes: ["mira@studio.audio"]
    }]
  },
  {
    id: "t_seed6",
    title: "New track — entirely sequenced with CLVSTER + RUBBER",
    category: "music",
    authorEmail: "dia@brennan.studio",
    authorName: "Dia Brennan",
    createdAt: new Date(now - 1000 * 60 * 90).toISOString(),
    pinned: false,
    posts: [{
      id: "p_seed6a",
      authorEmail: "dia@brennan.studio",
      authorName: "Dia Brennan",
      createdAt: new Date(now - 1000 * 60 * 90).toISOString(),
      body: "Single dropped today. Every melodic part is CLVSTER firing RUBBER. No drums, no guitar. Would love to hear what you all think.",
      likes: ["theo@vance.audio"]
    }]
  }];

  writeThreads(seed);
}

function relTime(iso) {
  const d = new Date(iso).getTime();
  const diff = (Date.now() - d) / 1000;
  if (diff < 60) return "just now";
  if (diff < 3600) return Math.floor(diff / 60) + "m ago";
  if (diff < 86400) return Math.floor(diff / 3600) + "h ago";
  if (diff < 86400 * 30) return Math.floor(diff / 86400) + "d ago";
  return new Date(iso).toLocaleDateString();
}
function initials(name, email) {
  const s = (name || email || "?").trim();
  const parts = s.split(/[\s@.]+/).filter(Boolean);
  return ((parts[0]?.[0] || "?") + (parts[1]?.[0] || "")).toUpperCase();
}

/* -------- Gate -------- */
function LoginGate({ onSignIn }) {
  return (
    <div className="gated">
      <div className="lock-icon">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="4" y="11" width="16" height="10" rx="2" /><path d="M8 11V8a4 4 0 0 1 8 0v3" /></svg>
      </div>
      <h2>Members only</h2>
      <p>The forum is reserved for registered XOVND customers. Sign in or create a free account to read and post.</p>
      <button className="post-btn" onClick={onSignIn}>Sign in / register <span>→</span></button>
    </div>);

}

/* -------- New thread bar -------- */
function NewThreadBar({ onCreate, busy, currentCategory }) {
  const [title, setTitle] = useState("");
  const [cat, setCat] = useState(currentCategory && currentCategory !== "all" ? currentCategory : CATEGORIES[1].id);
  useEffect(() => {
    if (currentCategory && currentCategory !== "all") setCat(currentCategory);
  }, [currentCategory]);
  const submit = () => {
    const t = title.trim();
    if (!t) return;
    onCreate(t, cat);
    setTitle("");
  };
  return (
    <div className="new-thread-bar">
      <select className="cat-select" value={cat} onChange={(e) => setCat(e.target.value)}>
        {CATEGORIES.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
      </select>
      <input
        type="text"
        placeholder="Start a new thread… (e.g. how do you set up swing on a 5:7 cluster?)"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onKeyDown={(e) => {if (e.key === "Enter") submit();}} />
      
      <button className="post-btn" disabled={!title.trim() || busy} onClick={submit}>
        Post <span>→</span>
      </button>
    </div>);

}

/* -------- Sidebar -------- */
function CategorySidebar({ current, onPick, counts }) {
  return (
    <aside className="cat-sidebar">
      <div className="cat-label"></div>
      <button className={"cat-item" + (current === "all" ? " on" : "")} onClick={() => onPick("all")}>
        <span>All threads</span>
        <span className="cat-count">{counts.all}</span>
      </button>
      {CATEGORIES.map((c) =>
      <button key={c.id} className={"cat-item cat-" + c.tone + (current === c.id ? " on" : "")} onClick={() => onPick(c.id)}>
          <span>{c.label}</span>
          <span className="cat-count">{counts[c.id] || 0}</span>
        </button>
      )}
    </aside>);

}

/* -------- Thread list -------- */
function ThreadList({ threads, onOpen, user, onCreate, currentCategory }) {
  return (
    <>
      <NewThreadBar onCreate={onCreate} currentCategory={currentCategory} />
      <div className="thread-list">
        {threads.length === 0 &&
        <div className="thread-empty">
            <b>No threads yet</b>
            Be the first to start a conversation in this subsection.
          </div>
        }
        {threads.map((t) => {
          const last = t.posts[t.posts.length - 1];
          const cat = CAT_BY_ID[t.category];
          return (
            <div className="thread-row" key={t.id} onClick={() => onOpen(t.id)}>
              <div className="avatar">{initials(t.authorName, t.authorEmail)}</div>
              <div className="info">
                <div className="title">
                  {t.title}
                  {t.pinned && <span className="tag">Pinned</span>}
                </div>
                <div className="meta">
                  {cat && <span className={"cat-chip cat-chip-" + cat.tone}>{cat.label}</span>}
                  <span className="author">{t.authorName}</span> · started {relTime(t.createdAt)}
                  {last && t.posts.length > 1 && <> · last reply {relTime(last.createdAt)} by {last.authorName}</>}
                </div>
              </div>
              <div className="count"><b>{t.posts.length}</b><span>{t.posts.length === 1 ? "post" : "posts"}</span></div>
              <div className="arrow">→</div>
            </div>);

        })}
      </div>
    </>);

}

/* -------- Thread detail -------- */
function ThreadView({ thread, onBack, user, onReply, onToggleLike }) {
  const [body, setBody] = useState("");
  const submit = () => {
    const v = body.trim();
    if (!v) return;
    onReply(v);
    setBody("");
  };
  return (
    <>
      <button className="back-link" onClick={onBack}>← All threads</button>
      <h1 className="thread-title">{thread.title}</h1>
      <div className="thread-meta">
        Started by <span className="author">{thread.authorName}</span> · {relTime(thread.createdAt)} · {thread.posts.length} {thread.posts.length === 1 ? "post" : "posts"}
      </div>
      <div className="post-list">
        {thread.posts.map((p, i) => {
          const isOp = i === 0;
          const isSelf = user && p.authorEmail === user.email;
          const liked = user && p.likes?.includes(user.email);
          return (
            <article key={p.id} className={"post-card" + (isOp ? " op" : "") + (isSelf && !isOp ? " self" : "")}>
              <div className="avatar">{initials(p.authorName, p.authorEmail)}</div>
              <div>
                <div className="top">
                  <span className="who">{p.authorName}{isOp ? " · OP" : ""}{isSelf ? " · you" : ""}</span>
                  <span className="ts">{relTime(p.createdAt)}</span>
                </div>
                <div className="body">{p.body}</div>
                <div className="actions">
                  <button className={liked ? "liked" : ""} onClick={() => onToggleLike(p.id)}>
                    {liked ? "★" : "☆"} {p.likes?.length || 0} like{(p.likes?.length || 0) === 1 ? "" : "s"}
                  </button>
                </div>
              </div>
            </article>);

        })}
      </div>
      <div className="reply-form">
        <textarea
          placeholder="Write a reply…"
          value={body}
          onChange={(e) => setBody(e.target.value)} />
        
        <div className="footer-row">
          <div className="as">Replying as <b>{user.name || user.email}</b></div>
          <button className="post-btn" disabled={!body.trim()} onClick={submit}>
            Reply <span>→</span>
          </button>
        </div>
      </div>
    </>);

}

/* -------- App -------- */
function ForumApp() {
  seedIfEmpty();
  const auth = useAuth();
  const { cart, cartOpen, openCart, closeCart, addToCart, removeAt, toast } = useCart();
  const [threads, setThreads] = useState(readThreads());
  const [openId, setOpenId] = useState(null);
  const [loginOpen, setLoginOpen] = useState(false);

  const refresh = useCallback(() => setThreads(readThreads().slice().sort((a, b) => {
    if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
    const al = a.posts[a.posts.length - 1]?.createdAt || a.createdAt;
    const bl = b.posts[b.posts.length - 1]?.createdAt || b.createdAt;
    return new Date(bl) - new Date(al);
  })), []);

  useEffect(() => {refresh();}, [refresh]);

  useEffect(() => {
    const onStorage = (e) => {if (e.key === FLX_THREADS) refresh();};
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [refresh]);

  const createThread = (title, category) => {
    const all = readThreads();
    const t = {
      id: "t_" + Date.now(),
      title,
      category: category || "clvster",
      authorEmail: auth.user.email,
      authorName: auth.user.name || auth.user.email.split("@")[0],
      createdAt: new Date().toISOString(),
      pinned: false,
      posts: [{
        id: "p_" + Date.now(),
        authorEmail: auth.user.email,
        authorName: auth.user.name || auth.user.email.split("@")[0],
        createdAt: new Date().toISOString(),
        body: title,
        likes: []
      }]
    };
    all.unshift(t);
    writeThreads(all);
    refresh();
    setOpenId(t.id);
  };

  const reply = (threadId, body) => {
    const all = readThreads();
    const t = all.find((x) => x.id === threadId);
    if (!t) return;
    t.posts.push({
      id: "p_" + Date.now(),
      authorEmail: auth.user.email,
      authorName: auth.user.name || auth.user.email.split("@")[0],
      createdAt: new Date().toISOString(),
      body,
      likes: []
    });
    writeThreads(all);
    refresh();
  };

  const toggleLike = (threadId, postId) => {
    const all = readThreads();
    const t = all.find((x) => x.id === threadId);
    const p = t?.posts.find((x) => x.id === postId);
    if (!p) return;
    p.likes = p.likes || [];
    const i = p.likes.indexOf(auth.user.email);
    if (i >= 0) p.likes.splice(i, 1);else p.likes.push(auth.user.email);
    writeThreads(all);
    refresh();
  };

  const onAccountClick = () => {
    if (auth.user) {
      if (confirm(`Signed in as ${auth.user.email}\n\nSign out?`)) auth.logout();
    } else {
      setLoginOpen(true);
    }
  };

  const openThread = openId ? threads.find((t) => t.id === openId) : null;

  // category filter
  const [category, setCategory] = useState(localStorage.getItem(FLX_CATEGORY) || "all");
  useEffect(() => {localStorage.setItem(FLX_CATEGORY, category);}, [category]);
  const visibleThreads = useMemo(() => {
    if (category === "all") return threads;
    return threads.filter((t) => t.category === category);
  }, [threads, category]);
  const counts = useMemo(() => {
    const c = { all: threads.length };
    for (const cat of CATEGORIES) c[cat.id] = threads.filter((t) => t.category === cat.id).length;
    return c;
  }, [threads]);

  return (
    <>
      <SiteHeader
        cartCount={cart.length}
        onOpenCart={openCart}
        current="forum"
        user={auth.user}
        onAccountClick={onAccountClick} />
      
      <div className="forum-shell">
        <div className="forum-head">
          <div>
            <div className="eyebrow">[ Community · members only ]</div>
            <h1>The <span className="alt">Forum</span></h1>
          </div>
          <p>Patch swaps, feature requests, bug reports and the occasional rant. Reserved for registered XOVND customers.</p>
        </div>

        {!auth.user && <LoginGate onSignIn={() => setLoginOpen(true)} />}
        {auth.user && !openThread &&
        <div className="forum-body">
            <CategorySidebar current={category} onPick={setCategory} counts={counts} />
            <div className="forum-main">
              <ThreadList threads={visibleThreads} onOpen={setOpenId} user={auth.user} onCreate={createThread} currentCategory={category} />
            </div>
          </div>
        }
        {auth.user && openThread &&
        <ThreadView
          thread={openThread}
          onBack={() => setOpenId(null)}
          user={auth.user}
          onReply={(body) => reply(openThread.id, body)}
          onToggleLike={(postId) => toggleLike(openThread.id, postId)} />

        }
      </div>
      <SiteFooter />
      <CartDrawer open={cartOpen} onClose={closeCart} items={cart} onRemove={removeAt} />
      {/* LoginModal stub — Phase 2B.3 Supabase Auth */}
    </>);

}


export default function Page() { return <ForumApp />; }
