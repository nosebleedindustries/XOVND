'use client';
import { useState, useEffect, useRef, useCallback, Fragment } from "react";
import { SiteHeader, SiteFooter, CartDrawer, useCart, useAuth, Marquee } from '@/components/shared';
import { AccessModal, useAccessModal } from '@/components/AccessModal';


/* -------------- DATA -------------- */

const PRODUCTS = [
{
  id: "clvster",
  name: "CLVSTER",
  type: "Algorithmic Sequencer",
  price: 79,
  badges: ["new"],
  viz: "clvster",
  blurb: "Cluster-based sequencing manipulated by live Algo Modifiers."
},
{
  id: "kantian",
  name: "KANTIAN",
  type: "Free M4L Device",
  price: 0,
  badges: [],
  viz: "wave",
  blurb: "Transcendental sequencer for Ableton Live — free forever."
},
{
  id: "rubber",
  name: "RUBBER",
  type: "Neo-VOSIM Synth",
  price: 69,
  sale: 49,
  badges: ["sale"],
  viz: "tire",
  blurb: "Vocal-formant synthesis with a rubbery, pneumatic core."
}];


const AWARDS = [
{ year: "2025", title: "Plugin of the Year", org: "Soundwave Mag" },
{ year: "2025", title: "Best Creative Tool", org: "Studio Press" },
{ year: "2024", title: "Editor's Choice", org: "MIX Quarterly" },
{ year: "2024", title: "Innovation Award", org: "Producer Forum" },
{ year: "2024", title: "Top 10 of the Year", org: "Tape & Wire" },
{ year: "2023", title: "Most Wanted", org: "Modular Monthly" }];


/* -------------- VIZ COMPONENTS -------------- */

const KnobViz = () =>
<div className="viz viz-knobs">
    <div className="knob-row">
      <div className="knob" style={{ "--rot": "-110deg" }}></div>
      <div className="knob" style={{ "--rot": "20deg" }}></div>
      <div className="knob" style={{ "--rot": "75deg" }}></div>
      <div className="knob" style={{ "--rot": "-40deg" }}></div>
    </div>
  </div>;


const WaveViz = () =>
<div className="viz viz-wave">
    <svg viewBox="0 0 400 120" preserveAspectRatio="none" style={{ height: 90 }}>
      <path d="M0 60 Q 25 10, 50 60 T 100 60 T 150 60 T 200 60 T 250 60 T 300 60 T 350 60 T 400 60"
    fill="none" stroke="#D4A8AE" strokeWidth="2" />
      <path d="M0 60 Q 25 100, 50 60 T 100 60 T 150 60 T 200 60 T 250 60 T 300 60 T 350 60 T 400 60"
    fill="none" stroke="#E8D60E" strokeWidth="2" opacity="0.7" />
    </svg>
  </div>;


const GridViz = () => <div className="viz viz-grid"></div>;

const ClvsterViz = () => {
  // Regular octagon path centered at 0,0 with radius r
  const oct = (cx, cy, r) => {
    const pts = [];
    for (let i = 0; i < 8; i++) {
      const a = Math.PI / 4 * i + Math.PI / 8;
      pts.push((cx + r * Math.cos(a)).toFixed(2) + "," + (cy + r * Math.sin(a)).toFixed(2));
    }
    return pts.join(" ");
  };
  const R = 26;
  const step = R * 1.95;
  return (
    <div className="viz viz-clvster" style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
      <svg viewBox="-100 -100 200 200" preserveAspectRatio="xMidYMid meet" style={{ width: "100%", height: "100%", display: "block" }} aria-hidden="true">
        <polygon points={oct(0, -step, R)} fill="none" stroke="#E8D60E" strokeWidth="1.6" />
        <polygon points={oct(0, step, R)} fill="none" stroke="#E8D60E" strokeWidth="1.6" />
        <polygon points={oct(-step, 0, R)} fill="none" stroke="#E8D60E" strokeWidth="1.6" />
        <polygon points={oct(step, 0, R)} fill="none" stroke="#E8D60E" strokeWidth="1.6" />
      </svg>
    </div>);

};

const TireViz = () =>
<div className="viz viz-tire" style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
    <svg viewBox="-100 -100 200 200" preserveAspectRatio="xMidYMid meet" style={{ width: "100%", height: "100%", display: "block" }} aria-hidden="true">
      {/* outer tread */}
      <circle cx="0" cy="0" r="78" fill="none" stroke="#E8D60E" strokeWidth="3.2" />
      {/* inner sidewall */}
      <circle cx="0" cy="0" r="60" fill="none" stroke="#E8D60E" strokeWidth="1.6" />
      {/* hub */}
      <circle cx="0" cy="0" r="22" fill="none" stroke="#E8D60E" strokeWidth="1.6" />
      <circle cx="0" cy="0" r="6" fill="#E8D60E" />
      {/* tread blocks — short radial ticks around the outside */}
      {Array.from({ length: 28 }).map((_, i) => {
      const a = i * 2 * Math.PI / 28;
      const x1 = Math.cos(a) * 70;
      const y1 = Math.sin(a) * 70;
      const x2 = Math.cos(a) * 84;
      const y2 = Math.sin(a) * 84;
      return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#E8D60E" strokeWidth="2.2" strokeLinecap="square" />;
    })}
      {/* 5 spokes */}
      {Array.from({ length: 5 }).map((_, i) => {
      const a = i * 2 * Math.PI / 5 - Math.PI / 2;
      const x = Math.cos(a) * 58;
      const y = Math.sin(a) * 58;
      return <line key={"s" + i} x1="0" y1="0" x2={x} y2={y} stroke="#E8D60E" strokeWidth="2.2" strokeLinecap="round" />;
    })}
    </svg>
  </div>;


const VIZ = { knobs: KnobViz, wave: WaveViz, grid: GridViz, clvster: ClvsterViz, tire: TireViz };

/* -------------- HEADER -------------- */

function Header({ cartCount, onOpenCart, user, onAccountClick }) {
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
            <img src="/assets/xovnd-logo.jpg" alt="XOVND" className="xovnd-logo" />
          </span>
        </a>
        <nav className="primary">
          <a href="#">VST Instruments</a>
          <a href="#">Max4Live FREE!</a>
          <a href="/trials">Trials<span className="badge">14d</span></a>
          <a href="/subscription">Subscriptions</a>
          <a href="/support">Support</a>
          <a href="/forum">Forum</a>
        </nav>
        <div className="nav-right">
          <a className="nav-btn" href="#" onClick={(e) => { e.preventDefault(); onAccountClick(); }}>
            {user
              ? (user.name || (user.email && user.email.split('@')[0]) || (user.type === 'beta' ? 'Beta tester' : user.type === 'buyer' ? 'Customer' : 'Account'))
              : 'Account'}
          </a>
          <button className="nav-btn cart-btn" onClick={onOpenCart}>
            Cart <span className="cart-count">{cartCount}</span>
          </button>
        </div>
      </header>
    </>);

}

/* -------------- HERO -------------- */

/* generative-art background ports the p5 sketch the user shared:
   a grid of n×n cells, each filled with one of five wiggle/line/noise
   primitives. Three params (n, marg, amp) rerandomize on every epoch so
   the pattern keeps recomposing. Palette is locked to dark/medium grays
   so the CLVSTER logo and plugin photo stay the visual focus. */

function HeroGenArt() {
  const canvasRef = useRef(null);
  const wrapRef = useRef(null);
  const [params, setParams] = useState({ n: 5, marg: 12, amp: 4 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let raf = 0;
    let stopped = false;
    let epoch = 0;
    let cur = { n: 5, marg: 12, amp: 4 };
    let target = cur;

    function resize() {
      const r = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.max(1, Math.floor(r.width * dpr));
      canvas.height = Math.max(1, Math.floor(r.height * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    resize();
    window.addEventListener("resize", resize);

    function pickTarget() {
      return {
        n: 3 + Math.floor(Math.random() * 7), // 3..9
        marg: 4 + Math.random() * 26, // 4..30
        amp: 1.5 + Math.random() * 9 // 1.5..10.5
      };
    }

    // small seeded PRNG so each cell's pattern type is stable within an epoch
    function mulberry32(a) {
      return function () {
        let t = a += 0x6d2b79f5;
        t = Math.imul(t ^ t >>> 15, t | 1);
        t ^= t + Math.imul(t ^ t >>> 7, t | 61);
        return ((t ^ t >>> 14) >>> 0) / 4294967296;
      };
    }

    /* --- primitives, gray on transparent --- */
    const STROKES = ["#3a3a3a", "#4a4a4a", "#5a5a5a", "#6a6a6a"];

    function rectLines(ctx, x, y, w, h, rng) {
      const step = 3 + rng() * 4;
      ctx.lineWidth = 1;
      for (let yy = y + step / 2; yy < y + h; yy += step) {
        ctx.beginPath();
        ctx.moveTo(x, yy);
        ctx.lineTo(x + w, yy);
        ctx.stroke();
      }
    }
    function rectWiggleLines(ctx, x, y, w, h, rng, amp) {
      const step = 4 + rng() * 5;
      const freq = 0.03 + rng() * 0.05;
      const phase = rng() * Math.PI * 2;
      ctx.lineWidth = 1;
      for (let yy = y + step / 2; yy < y + h; yy += step) {
        ctx.beginPath();
        let first = true;
        for (let xx = x; xx <= x + w; xx += 3) {
          const dy = Math.sin((xx - x) * freq + phase + yy * 0.04) * amp;
          if (first) {ctx.moveTo(xx, yy + dy);first = false;} else
          ctx.lineTo(xx, yy + dy);
        }
        ctx.stroke();
      }
    }
    function rectWiggleXLines(ctx, x, y, w, h, rng, amp) {
      const step = 4 + rng() * 5;
      const freq = 0.03 + rng() * 0.05;
      const phase = rng() * Math.PI * 2;
      ctx.lineWidth = 1;
      for (let xx = x + step / 2; xx < x + w; xx += step) {
        ctx.beginPath();
        let first = true;
        for (let yy = y; yy <= y + h; yy += 3) {
          const dx = Math.sin((yy - y) * freq + phase + xx * 0.04) * amp;
          if (first) {ctx.moveTo(xx + dx, yy);first = false;} else
          ctx.lineTo(xx + dx, yy);
        }
        ctx.stroke();
      }
    }
    function rectBackforthLines(ctx, x, y, w, h, rng) {
      const step = Math.max(4, 4 + rng() * 5);
      ctx.lineWidth = 1;
      ctx.beginPath();
      let dir = 1;
      let yy = y;
      ctx.moveTo(x, yy);
      while (yy <= y + h) {
        ctx.lineTo(dir > 0 ? x + w : x, yy);
        yy += step;
        if (yy <= y + h) ctx.lineTo(dir > 0 ? x + w : x, yy);
        dir *= -1;
      }
      ctx.stroke();
    }
    function rectNoise(ctx, x, y, w, h, rng) {
      const density = Math.floor(40 + rng() * (w * h) * 0.04);
      for (let i = 0; i < density; i++) {
        const px = x + rng() * w;
        const py = y + rng() * h;
        const g = 50 + Math.floor(rng() * 60);
        ctx.fillStyle = `rgb(${g},${g},${g})`;
        ctx.fillRect(px, py, 1, 1);
      }
    }

    function draw() {
      const W = canvas.clientWidth;
      const H = canvas.clientHeight;
      ctx.clearRect(0, 0, W, H);

      const n = Math.max(2, Math.round(cur.n));
      const marg = cur.marg;
      const amp = cur.amp;

      const cellW = (W - marg * (n + 1)) / n;
      const cellH = (H - marg * (n + 1)) / n;

      const rng = mulberry32(epoch * 9973 + n * 131);

      for (let j = 0; j < n; j++) {
        for (let k = 0; k < n; k++) {
          const x = marg + j * (cellW + marg);
          const y = marg + k * (cellH + marg);
          const t = Math.floor(rng() * 5);
          ctx.strokeStyle = STROKES[Math.floor(rng() * STROKES.length)];
          ctx.fillStyle = ctx.strokeStyle;
          switch (t) {
            case 0:rectWiggleXLines(ctx, x, y, cellW, cellH, rng, amp);break;
            case 1:rectWiggleLines(ctx, x, y, cellW, cellH, rng, amp);break;
            case 2:rectLines(ctx, x, y, cellW, cellH, rng);break;
            case 3:rectBackforthLines(ctx, x, y, cellW, cellH, rng);break;
            case 4:rectNoise(ctx, x, y, cellW, cellH, rng);break;
          }
        }
      }
    }

    function lerp(a, b, k) {return a + (b - a) * k;}
    function ease(t) {return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;}

    target = pickTarget();
    cur = { ...target };
    let lastEpoch = performance.now();
    let from = { ...cur };
    const epochMs = 2800; // how long until next reroll
    const transMs = 1400; // morph time

    let lastFrame = performance.now();
    function tick(now) {
      if (stopped) return;
      const dt = now - lastFrame;
      lastFrame = now;
      const sinceEpoch = now - lastEpoch;

      if (sinceEpoch >= epochMs) {
        lastEpoch = now;
        from = { ...cur };
        target = pickTarget();
        epoch++;
      }
      const k = ease(Math.min(1, sinceEpoch / transMs));
      cur = {
        n: lerp(from.n, target.n, k),
        marg: lerp(from.marg, target.marg, k),
        amp: lerp(from.amp, target.amp, k)
      };
      // breathing on amplitude for life between epochs
      cur.amp += Math.sin(now * 0.0009) * 0.6;

      setParams({
        n: Math.round(cur.n),
        marg: Math.round(cur.marg),
        amp: +cur.amp.toFixed(1)
      });
      draw();
      raf = requestAnimationFrame(tick);
    }
    raf = requestAnimationFrame(tick);

    return () => {
      stopped = true;
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <Fragment>
      <canvas ref={canvasRef} className="hero-genart" aria-hidden="true" />
      <div className="hero-genart-readout" aria-hidden="true">
        <span>n <b>{params.n}</b></span>
        <span>marg <b>{params.marg}</b></span>
        <span>amp <b>{params.amp}</b></span>
      </div>
    </Fragment>);

}

/* -------------- BETA SECTION (closed-beta free download) -------------- */

function BetaSection({ onClickGet }) {
  return (
    <section className="section beta-section" data-screen-label="Beta">
      <div className="beta-shell">
        <div className="beta-eyebrow">[ CLOSED BETA · INFLUENCERS &amp; EARLY TESTERS ]</div>
        <h2>
          Get the full <span className="alt">CLVSTER</span> build —{' '}
          <span className="accent">free</span>, ahead of launch.
        </h2>
        <p className="beta-lead">
          We&rsquo;re sending the v1.0.0 build to a small group of producers
          and creators before the public release. Drop your details and
          you&rsquo;ll get the Windows installer immediately — macOS lands in
          the next round. Tag <b>@xovnd.audio</b> if you post anything cool.
        </p>
        <button className="btn btn-primary discover-glow beta-cta" onClick={onClickGet}>
          Get the <span className="clvster-glow">free beta</span>{' '}
          <span className="arrow">↓</span>
        </button>
        <div className="beta-meta">
          <span>Windows · VST3</span>
          <span className="sep">·</span>
          <span>5 MB</span>
          <span className="sep">·</span>
          <span>14-day trial activates on install</span>
        </div>
      </div>
    </section>
  );
}

function Hero({ onAdd }) {
  const videoRef = useRef(null);
  const [muted, setMuted] = useState(true);
  const toggleMute = () => {
    const v = videoRef.current;
    if (!v) return;
    const next = !v.muted;
    v.muted = next;
    if (!next) { v.play().catch(() => {}); }
    setMuted(next);
  };
  // Browsers block autoplay-with-audio until the user interacts with the
  // page. Listen once for any user gesture and unmute as soon as it fires
  // so the video has sound by the time the visitor actually engages.
  useEffect(() => {
    let done = false;
    const unmute = () => {
      if (done) return;
      const v = videoRef.current;
      if (!v) return;
      done = true;
      v.muted = false;
      v.play().catch(() => {});
      setMuted(false);
      window.removeEventListener('pointerdown', unmute);
      window.removeEventListener('keydown', unmute);
      window.removeEventListener('scroll', unmute);
    };
    window.addEventListener('pointerdown', unmute, { once: false });
    window.addEventListener('keydown', unmute, { once: false });
    window.addEventListener('scroll', unmute, { once: false, passive: true });
    return () => {
      window.removeEventListener('pointerdown', unmute);
      window.removeEventListener('keydown', unmute);
      window.removeEventListener('scroll', unmute);
    };
  }, []);
  return (
    <section className="hero" data-screen-label="01 Hero">
      <div className="hero-left" style={{ width: "369px" }}>
        <div>
          <div className="hero-pretitle">
            <span className="tagchip">NEW</span>
            <span className="clvster-glow" style={{ fontSize: "26px" }}>CLVSTER</span>
            <span className="sep">/</span>
            <span>ALGORITHMIC SEQUENCER</span>
          </div>
          <h1>
            Sequence<em>Reshape</em><span className="alt">Explore</span>
          </h1>
          <p className="hero-desc"><span className="clvster-glow"></span>CLVSTER is a human-operated, multi-algorithmic sequencer. 🎛️ Instead of working with individual steps, you operate on Clusters — groups of steps treated as a single unit. 🔲



            <span className="clvster-glow"></span>Each Cluster can then be shaped and transformed by Algo Modifiers ⚙️ — small algorithmic processes that manipulate rhythmic and pitch data in real time.

The result? A fully interactive, live algorithmic rave experience. 🕺🔊REAL-TIME ALGO-RAVE! 
</p>
          <div className="hero-cta">
            <button className="btn btn-primary" onClick={() => onAdd(PRODUCTS[0])}>
              Add to cart — €79 <span className="arrow">→</span>
            </button>
            <a className="btn btn-ghost discover-glow" href="/clvster">
              Discover <span className="clvster-glow">CLVSTER</span> <span className="arrow">→</span>
            </a>
          </div>
        </div>
        <div className="hero-meta">
          <div style={{ width: "146px", padding: "19.2px 0px 0px 13.6px" }}>FORMATS<b>VST3 · AU · AAX</b></div>
          <div>PLATFORMS<b>MAC · WIN</b></div>
          <div>VERSION<b>1.0.2</b></div>
          <div>TRIAL<b>14 DAYS · FREE</b></div>
        </div>
      </div>
      <div className="hero-right">
        <HeroGenArt />
        <img src="/assets/clvster-logo.jpg" alt="CLVSTER" className="hero-logo" />
        <div className="hero-tagline" style={{ letterSpacing: "3.9px", padding: "3.19995px 0px 0px" }}>Cluster Chain Sequencer</div>
        <div className="hero-mark hero-ui video-flash-in" style={{ position: "relative" }}>
          <video
            ref={videoRef}
            src="/assets/clvster-promo.mp4"
            autoPlay
            loop
            muted
            playsInline
            preload="metadata"
            style={{ width: "100%", height: "auto", display: "block" }}
          />
          <button
            type="button"
            className="video-mute-btn"
            aria-label={muted ? "Unmute video" : "Mute video"}
            aria-pressed={!muted}
            onClick={toggleMute}
          >
            {muted ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M11 5 6 9H2v6h4l5 4z" />
                <line x1="23" y1="9" x2="17" y2="15" />
                <line x1="17" y1="9" x2="23" y2="15" />
              </svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M11 5 6 9H2v6h4l5 4z" />
                <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
                <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
              </svg>
            )}
          </button>
        </div>
        <div className="hero-ticker">
          <span className="live">LIVE — 2,418 producers using XOVND right now</span>
          <span>VER 1.0.2 / BUILD 2026-05-12</span>
        </div>
      </div>
    </section>);}
/* -------------- PRODUCT GRID -------------- */

function ProductCard({ p, onAdd }) {
  const Viz = VIZ[p.viz];
  return (
    <div className="product-card" data-comment-anchor={"product-" + p.id}>
      <Viz />
      <div className="top">
        <div className="badges">
          {p.badges.includes("new") && <span className="badge new">New</span>}
          {p.badges.includes("sale") && <span className="badge sale">Sale</span>}
        </div>
        <div className="price">
          {p.sale ? <><s>{`€${p.price}`}</s>{`€${p.sale}`}</> : <>{`€${p.price}`}</>}
        </div>
      </div>
      <div className="bottom">
        <div className="ptype">{p.type}</div>
        <h3>{p.name}</h3>
      </div>
      <div className="actions">
        <button className="mini-btn primary" onClick={() => onAdd(p)}>Add</button>
        <button className="mini-btn">Discover</button>
      </div>
    </div>);

}

function PlanCard() {
  return (
    <div className="product-card plan">
      <div className="viz-pink"></div>
      <div className="top" style={{ position: "relative", zIndex: 2 }}>
        <div className="badges"><span className="badge new" style={{ background: "var(--black)", color: "var(--yellow)" }}>Best Value</span></div>
        <div className="price">From €19/mo</div>
      </div>
      <div style={{ position: "relative", zIndex: 2, textAlign: "right" }}>
        <div className="plan-num">2</div>
      </div>
      <div className="bottom">
        <div className="ptype">Subscription</div>
        <h3>The Bundle</h3>
        <p style={{ margin: "8px 0 0", fontSize: 13, lineHeight: 1.35, maxWidth: 220, opacity: 0.75 }}>
          Subscribe to own every XOVND plugin. Cancel anytime. Keep what you've earned.
        </p>
      </div>
      <div className="actions">
        <button className="mini-btn primary" style={{ background: "var(--black)", color: "var(--yellow)", borderColor: "var(--black)" }}>Start trial</button>
        <button className="mini-btn" style={{ background: "transparent", borderColor: "var(--black)", color: "var(--black)" }}>Learn more</button>
      </div>
    </div>);

}

function AllCard() {
  return (
    <div className="product-card all">
      <div className="grid-mosaic">
        {[...Array(9)].map((_, i) => <div key={i}></div>)}
      </div>
      <div className="top" style={{ position: "relative", zIndex: 2 }}>
        <div className="badges"><span className="badge sale">Catalog</span></div>
        <div className="price">13 plugins</div>
      </div>
      <div className="bottom">
        <div className="ptype">All Products</div>
        <h3>The Full<br />Catalog</h3>
      </div>
      <div className="actions">
        <button className="mini-btn primary">Browse all</button>
        <button className="mini-btn">Compare</button>
      </div>
    </div>);

}

function ProductSection({ onAdd }) {
  return (
    <section className="section" data-screen-label="02 Products">
      <div className="section-head">
        <div>
          <span className="eyebrow">[ OUR ADVAANCED DSP WORK, A LABOUR OF LOVE!]</span>
          <h2>Tools for producers<br />who'd rather <span className="accent">make a XOON.</span></h2>
        </div>
        <p className="lead">Advanced  plugins with an easy GUI interaction , all the power of DSP, under an easy to use and educative GUI, this is our expertise. This makes our tools explorative by default.


        </p>
      </div>
      <div className="product-grid">
        <PlanCard />
        {PRODUCTS.map((p) => <ProductCard key={p.id} p={p} onAdd={onAdd} />)}
      </div>
    </section>);

}


/* -------------- AWARDS -------------- */

function Awards() {
  return (
    <section className="section" data-screen-label="04 Awards" style={{ paddingTop: 56, paddingBottom: 56 }}>
      <div style={{ textAlign: "center", marginBottom: 32 }}>
        <span className="eyebrow" style={{ color: "var(--pink)", fontFamily: "'Space Mono'", fontSize: 11, letterSpacing: "0.18em", textTransform: "uppercase" }}>RELEASES ROADMAP

        </span>
      </div>
      <div className="awards">
        {AWARDS.map((a, i) =>
        <div className="award" key={i}>
            <div className="year">{a.year}</div>
            <div className="title">{a.title}</div>
            <div className="org">{a.org}</div>
          </div>
        )}
      </div>
    </section>);

}

/* -------------- MANIFESTO -------------- */

function Manifesto() {
  return (
    <section className="section manifesto" data-screen-label="05 Manifesto">
      <div className="visual">
        <span className="corner c-tl">XOVND / MARK</span>
        <span className="corner c-tr">↗ 2026</span>
        <span className="corner c-bl">independent</span>
        <span className="corner c-br">since 2019</span>
        <img src="/assets/fluxus-mark.png" alt="" />
      </div>
      <div className="copy">
        <h2>Tools for <span className="alt">human</span><br />algorithmic<br />artists.</h2>
        <p>
          XOVND is an independent, producer-owned software studio. We make
          opinionated instruments and effects for people who'd rather finish a
          record than fight a UI.
        </p>
        <p>
          In an industry sprinting toward more buttons, more presets, and more AI
          doing the work for you — we make the opposite bet. The future sound of
          music belongs to the people writing it. Our job is to put a tool in
          their hand that gets out of the way.
        </p>
        <button className="btn btn-primary" style={{ marginTop: 16 }}>
          About XOVND <span className="arrow">→</span>
        </button>
      </div>
    </section>);

}

/* -------------- FOOTER -------------- */

function Footer() {
  return (
    <footer className="foot">
      <div className="foot-brand">
        <div className="logo">
          <img src="/assets/xovnd-logo.jpg" alt="XOVND" className="xovnd-logo" style={{ height: 36 }} />
        </div>
        <p>An independent software studio building creative audio instruments for producers, artists, and engineers.</p>
        <div className="socials" style={{ marginTop: 18 }}>
          <a href="#" aria-label="Instagram">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="5" /><circle cx="12" cy="12" r="3.5" /><circle cx="17.5" cy="6.5" r="0.6" fill="currentColor" /></svg>
          </a>
          <a href="#" aria-label="YouTube">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="6" width="20" height="12" rx="3" /><path d="M10 9l5 3-5 3z" fill="currentColor" /></svg>
          </a>
          <a href="#" aria-label="X">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M18 3h3l-7.5 8.5L22 21h-6.5l-5-6.5L4 21H1l8-9-8-9h6.5l4.5 6L18 3z" /></svg>
          </a>
          <a href="#" aria-label="TikTok">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M17 4v3a5 5 0 0 0 4 5v3a8 8 0 0 1-4-1v5a6 6 0 1 1-6-6v3a3 3 0 1 0 3 3V4z" /></svg>
          </a>
        </div>
      </div>
      <div className="foot-bottom">
        <span>© 2026 XOVND Audio — All sounds reserved</span>
        <span>Mastered in Brooklyn / Built worldwide</span>
      </div>
    </footer>);

}

/* -------------- CART -------------- */

// Cart routes to Moonbase hosted checkout. The buy URL 404s today
// because the CLVSTER product hasn't been published on Moonbase yet —
// just update MOONBASE_CHECKOUT here when it's live.
const MOONBASE_CHECKOUT = 'https://xound.moonbase.sh/buy/clvster';

function Cart({ open, onClose, items, onRemove }) {
  const subtotal = items.reduce((s, x) => s + (x.sale || x.price), 0);
  const onCheckout = () => {
    if (items.length === 0) return;
    window.open(MOONBASE_CHECKOUT, '_blank', 'noopener,noreferrer');
  };
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
        {items.length === 0 ?
        <div className="cart-empty">
            <div className="blob"></div>
            <div>Your cart is empty.</div>
            <div style={{ fontSize: 12, marginTop: 8 }}>Browse plugins above to get started.</div>
          </div> :

        <div className="cart-items">
            {items.map((it, i) =>
          <div className="cart-item" key={i}>
                <div className="thumb">{it.name[0]}</div>
                <div>
                  <div className="name">{it.name}</div>
                  <div className="type">{it.type}</div>
                  <button className="remove" onClick={() => onRemove(i)}>Remove</button>
                </div>
                <div className="price">{`€${it.sale || it.price}`}</div>
              </div>
          )}
          </div>
        }
        <div className="cart-foot">
          <div className="cart-subtotal">
            <span className="label">Subtotal</span>
            <span className="amt">{`€${subtotal}`}</span>
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
    </>);

}

/* -------------- TWEAKS -------------- */

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "accent": "#E8D60E",
  "pink": "#D4A8AE",
  "bg": "#000000",
  "headlineStyle": "stack"
} /*EDITMODE-END*/;

function Tweaks() {
  // Tweaks panel removed in Phase 2B.1 migration — the design-tweak panel
  // was a global helper attached to window, only useful while iterating
  // on the design. Re-add as a proper component if you want it back.
  return null;
  /* eslint-disable no-unreachable */
  if (!window.TweaksPanel) return null;
  const { TweaksPanel, useTweaks, TweakSection, TweakColor, TweakRadio } = window;
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);
  useEffect(() => {
    document.documentElement.style.setProperty("--yellow", t.accent);
    document.documentElement.style.setProperty("--accent", t.accent);
    document.documentElement.style.setProperty("--pink", t.pink);
    document.documentElement.style.setProperty("--black", t.bg);
  }, [t.accent, t.pink, t.bg]);
  return (
    <TweaksPanel title="Tweaks">
      <TweakSection title="Palette">
        <TweakColor label="Accent" value={t.accent}
        options={["#E8D60E", "#FF5C2A", "#7CFF6E", "#D4A8AE"]}
        onChange={(v) => setTweak("accent", v)} />
        <TweakColor label="Secondary" value={t.pink}
        options={["#D4A8AE", "#E8D60E", "#A89CD4", "#9CD4B8"]}
        onChange={(v) => setTweak("pink", v)} />
        <TweakColor label="Background" value={t.bg}
        options={["#000000", "#1A1814", "#F4F1E8", "#D4A8AE"]}
        onChange={(v) => setTweak("bg", v)} />
      </TweakSection>
    </TweaksPanel>);

}

/* -------------- APP -------------- */

function App() {
  const [cart, setCart] = useState([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [toast, setToast] = useState("");
  const auth = useAuth();
  const access = useAccessModal();

  const addToCart = useCallback((p) => {
    setCart((c) => [...c, p]);
    setToast(`Added ${p.name}`);
    setCartOpen(true);
  }, []);

  useEffect(() => {
    if (!toast) return;
    const id = setTimeout(() => setToast(""), 1800);
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

  return (
    <>
      <Header cartCount={cart.length} onOpenCart={() => setCartOpen(true)} user={auth.user} onAccountClick={onAccountClick} />
      <Hero onAdd={addToCart} />
      <BetaSection onClickGet={() => access.openModal('code')} />
      <AccessModal open={access.open} initialTab={access.initialTab} onClose={access.closeModal} />
      {/* Walkthrough moved to its own route: /walkthrough */}
      <Manifesto />
      <Footer />
      <Cart open={cartOpen}
      onClose={() => setCartOpen(false)}
      items={cart}
      onRemove={(i) => setCart((c) => c.filter((_, k) => k !== i))} />
      <Tweaks />
      {/* LoginModal stub — Phase 2B.3 replaces with Supabase Auth. */}
      <div className={"toast" + (toast ? " show" : "")}>{toast}</div>
    </>);

}


export default function Page() { return <App />; }
