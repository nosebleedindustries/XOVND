'use client';
import { useState, useEffect, useRef, useCallback, useMemo, Fragment } from 'react';
import { SiteHeader, SiteFooter, CartDrawer, useCart, useAuth } from '@/components/shared';
import { AccessModal, useAccessModal } from '@/components/AccessModal';

/* CLVSTER product detail page */

const PRODUCT = {
  id: "clvster",
  name: "CLVSTER",
  type: "Algorithmic Sequencer",
  price: 129,
  sale: 79,
  saleLabel: "39% Off",
  sub: 19
};

const AWARDS = [
{ mark: "SOS", title: "Sound on Sound", sub: "Innovation 2025" },
{ mark: "KVR", title: "KVR Reader's", sub: "Choice 2025" },
{ mark: "MR", title: "MusicRadar", sub: "Top Tools 2025" },
{ mark: "CM", title: "Computer Music", sub: "Editor's Pick" },
{ mark: "MT", title: "Music Tech", sub: "10/10 Excellence" },
{ mark: "PB", title: "Plugin Boutique", sub: "Best Sequencer" },
{ mark: "MG", title: "Magnetic Mag", sub: "Editor's Choice 2025" }];


const FEATURES = [
{
  eyebrow: "OVERVIEW",
  title: ["An improv algo-rave ", "instrument."],
  accent: "instrument.",
  body: [
  "CLVSTER reimagines the step sequencer around a single, opinionated idea: stop thinking in individual steps. Group them into clusters, then manipulate the cluster as a single living unit.",
  "The result is a sequencer that feels less like programming and more like sculpting — a live oriented, performative instrument designed for live situations or studio exploration. "],

  media: { kind: "video", label: "OVERVIEW", time: "1:42" }
},
{
  eyebrow: "ALGO MODS",
  title: ["Poly-algorithmic, ", "Chaos controllable."],
  accent: "Chaos controllable.",
  body: [
  "What makes it different:",
  "Most generative sequencers offer one algorithm. KANTIAN lets you mix all three in a single pattern cycle. Slot 1 can run a Euclidean tresillo while Slot 2 evolves a Turing melody and Slot 3 generates Nibbler arithmetic sequences — all locked to the same scale, key, and chord progression. The result is musically coherent complexity that no single algorithm can produce alone."],

  media: { kind: "video", label: "ALGO MODS", time: "2:14", reverse: true }
},
{
  eyebrow: "CLUSTER ENGINE",
  title: ["Modifiers,\n ", "BOOLEANS."],
  accent: "BOOLEANS.",
  body: [
  "Lasso steps into clusters by drawing across the grid. Re-shape, transpose, ratchet or invert an entire cluster with a single gesture — without ever touching the underlying step data.",
  "Cluster boundaries can be modulated themselves, so a phrase can morph from a tight loop into a polyrhythmic sprawl and back over a single bar."],

  media: { kind: "video", label: "CLUSTER ENGINE", time: "1:08" }
}];


const DEMOS = [
{ title: "Drunk-walk arpeggio", author: "Mira Okafor — On euclidean cluster + drunk-walk mod", time: "1:24" },
{ title: "Polyrhythmic bell sequence", author: "Jules Maren — On three clusters, three rates", time: "0:58" },
{ title: "Glitch breakbeat", author: "Wren Kovacs — On probability ratchets + swing", time: "2:11" },
{ title: "Ambient generative pad", author: "Sun Park — On slow modulator stack, key-locked", time: "3:42" }];


const TESTIMONIALS = [
{ initials: "MO", name: "Mira Okafor", role: "Producer — Lo-Fi 95, Hotline", quote: "CLVSTER has completely changed how I write loops. I drop in three clusters, hit randomize, and an entire bridge falls out of the box.", featured: true },
{ initials: "JM", name: "Jules Maren", role: "Engineer — Sable, KAINO", quote: "It is the first sequencer I've used in twenty years where I forget I'm 'programming' a part. I'm just playing it." },
{ initials: "WK", name: "Wren Kovacs", role: "Songwriter — Hexafloor", quote: "The ALGO MODS turn even the dumbest 4-note pattern into something that sounds like it has an opinion about the song." },
{ initials: "DB", name: "Dia Brennan", role: "Solo artist, scoring", quote: "Most generative tools leave me with a pile of pretty noises I can't use. CLVSTER stays in tune and in time. Huge difference." },
{ initials: "SP", name: "Sun Park", role: "Producer — Goldenrod, Tinta", quote: "I bought it on a Sunday. By Wednesday it was on every track on the record. There is no version 2 of this opinion." },
{ initials: "TV", name: "Theo Vance", role: "Mix engineer — pop & indie", quote: "It is a sequencer that wants to be part of the song instead of pretending to be invisible. I love it for that." }];


const EXPLORE = [
{ n: "01", title: "4 Clusters = 32 steps", body: "Divided into 8 STEPS, 4 CLUSTERS, individual sequence length." },
{ n: "02", title: "6+ ALGO MODS", body: "Euclidean, drunk-walk, polyrhythm, ratchet, prob-skip, golden-quant, mirror, swing-lerp..." },
{ n: "03", title: "Microtonal, polyrithmic", body: "Full per-note expression. Drives any modern synth, hardware or software." },
{ n: "04", title: "Circle of fifths, musical brain !", body: "Conform your sequence to the harmony you craft, \non the HARMONY Circle of Fifths page!." },
{ n: "05", title: "SNAPSHOTS!", body: "Store snapshots at any moment, and sequence them or perform with them." },
{ n: "06", title: "Pattern morph & chain", body: "Morph between up to 8 patterns. Chain them into songs without leaving the grid." }];


const VIDEOS = [
{ title: "Official launch video", label: "LAUNCH" },
{ title: "CLVSTER in 90 seconds", label: "TOUR" },
{ title: "ALGO MODS — deep dive", label: "TUTORIAL" }];


const FAQ = [
{ q: "Does CLVSTER replace my DAW's piano roll?", a: "Not at all. CLVSTER is a MIDI sequencer that sits next to your piano roll. It generates MIDI which you can record, edit, or freeze whenever you want a static part." },
{ q: "Can I export the MIDI it generates?", a: "Yes. Drag any pattern out of CLVSTER and drop it directly onto your DAW timeline as a regular MIDI clip. You can also record live to a MIDI track in real time." },
{ q: "Will it stay in time and in tune?", a: "Yes — that's the whole point. CLVSTER is tempo-synced, scale-locked and supports any time signature including odd meters. The randomness happens inside a musical grid you define." },
{ q: "What's the difference between a cluster and a step?", a: "A step is one event on the grid. A cluster is a group of steps you can manipulate together. Think of clusters as the words in a sentence — the ALGO MODS are how you re-arrange the grammar." },
{ q: "Does it work with hardware synths?", a: "Yes. CLVSTER outputs to any MIDI device — hardware or software. MPE-capable hardware gets per-note expression for free." }];


const TECHSPEC = [
"Formats: VST3 · AU · AAX (64-bit) · Standalone",
"Platforms: macOS 11+ (incl. Apple Silicon) · Windows 10+",
"Output: MIDI 1.0 / MIDI 2.0 / MPE",
"DAWs: Ableton Live, Logic Pro, FL Studio, Cubase, Bitwig, Studio One, Reaper, Pro Tools",
"License: 3 activations per seat — transferable",
"Free updates for the v1 lifecycle"];


const CHANGELOG = [
{ ver: "v1.0.0 — Apr 2026", notes: ["Initial public release", "30 ALGO MODS included", "Full MPE output support"] },
{ ver: "v1.0.1 — May 2026", notes: ["Drunk-walk modifier CPU optimization", "Fixed cluster boundary draw on Retina displays", "Added 'Golden Quant' modifier"] },
{ ver: "v1.0.2 — May 14 2026", notes: ["Logic Pro 11.1 compatibility patch", "Pattern morph clicking eliminated", "Tablet touch performance improvements"] }];


/* -------- Tweaks -------- */
const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "accent": "#E8D60E",
  "pink": "#D4A8AE",
  "bg": "#000000"
} /*EDITMODE-END*/;

function Tweaks() {
  // Tweaks panel removed in Phase 2B.1 migration — see app/page.jsx note.
  return null;
  /* eslint-disable no-unreachable */
  if (!window.TweaksPanel) return null;
  const { TweaksPanel, useTweaks, TweakSection, TweakColor } = window;
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
        <TweakColor label="Accent" value={t.accent} options={["#E8D60E", "#FF5C2A", "#7CFF6E", "#D4A8AE"]} onChange={(v) => setTweak("accent", v)} />
        <TweakColor label="Secondary" value={t.pink} options={["#D4A8AE", "#E8D60E", "#A89CD4", "#9CD4B8"]} onChange={(v) => setTweak("pink", v)} />
        <TweakColor label="Background" value={t.bg} options={["#000000", "#1A1814", "#F4F1E8", "#D4A8AE"]} onChange={(v) => setTweak("bg", v)} />
      </TweakSection>
    </TweaksPanel>);

}

/* -------- Hero -------- */
const DEFAULT_CAROUSEL = [
  { src: "/assets/clvster-promo.mp4", label: "Promo · 01", kind: "video" }];


function ProductCarousel() {
  const [photos, setPhotos] = useState(DEFAULT_CAROUSEL);
  const [idx, setIdx] = useState(0);
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef(null);
  const folderRef = useRef(null);
  const autoplayRef = useRef(null);
  const videoRefs = useRef({});

  const current = photos[idx];
  const currentIsVideo = current?.kind === "video";

  // Auto-advance every 5s, pause when on a video slide or only one slide
  useEffect(() => {
    if (photos.length <= 1) return;
    if (currentIsVideo) return;
    autoplayRef.current = setInterval(() => {
      setIdx((i) => (i + 1) % photos.length);
    }, 5000);
    return () => clearInterval(autoplayRef.current);
  }, [photos.length, currentIsVideo]);

  // Pause non-active videos when the slide changes
  useEffect(() => {
    Object.entries(videoRefs.current).forEach(([key, el]) => {
      if (!el) return;
      if (parseInt(key, 10) !== idx) {
        el.pause();
        try {el.currentTime = 0;} catch (e) {}
      }
    });
  }, [idx]);

  // Clean up object URLs on unmount
  useEffect(() => {
    return () => {
      photos.forEach((p) => {
        if (p.objectUrl) URL.revokeObjectURL(p.src);
      });
    };
    // eslint-disable-next-line
  }, []);

  const ingestFiles = (fileList) => {
    const files = Array.from(fileList || []).
    filter((f) => f.type.startsWith("image/") || f.type.startsWith("video/")).
    sort((a, b) => (a.webkitRelativePath || a.name).localeCompare(b.webkitRelativePath || b.name));
    if (!files.length) return;
    const added = files.map((f, i) => ({
      src: URL.createObjectURL(f),
      label: (f.webkitRelativePath || f.name).toUpperCase().slice(0, 32),
      kind: f.type.startsWith("video/") ? "video" : "image",
      mime: f.type,
      objectUrl: true
    }));
    setPhotos((prev) => {
      // If only the default placeholder exists, replace it
      const base = prev.length === 1 && prev[0].src === DEFAULT_CAROUSEL[0].src ? [] : prev;
      return [...base, ...added];
    });
    setIdx((prev) => {
      const base = photos.length === 1 && photos[0].src === DEFAULT_CAROUSEL[0].src ? 0 : photos.length;
      return base;
    });
  };

  const onPick = (e) => {ingestFiles(e.target.files);e.target.value = "";};
  const onPickFolder = (e) => {ingestFiles(e.target.files);e.target.value = "";};

  const [replaceTarget, setReplaceTarget] = useState(-1);
  const replaceRef = useRef(null);
  const replaceSlideAt = (i) => {
    setReplaceTarget(i);
    replaceRef.current?.click();
  };
  const onReplaceFile = (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || replaceTarget < 0) {setReplaceTarget(-1);return;}
    if (!file.type.startsWith("image/") && !file.type.startsWith("video/")) {setReplaceTarget(-1);return;}
    setPhotos((prev) => {
      const next = [...prev];
      const old = next[replaceTarget];
      if (old?.objectUrl) URL.revokeObjectURL(old.src);
      next[replaceTarget] = {
        src: URL.createObjectURL(file),
        label: file.name.toUpperCase().slice(0, 32),
        kind: file.type.startsWith("video/") ? "video" : "image",
        mime: file.type,
        objectUrl: true
      };
      return next;
    });
    setReplaceTarget(-1);
  };
  const removeSlideAt = (i) => {
    setPhotos((prev) => {
      const old = prev[i];
      if (old?.objectUrl) URL.revokeObjectURL(old.src);
      const next = prev.filter((_, k) => k !== i);
      return next.length ? next : DEFAULT_CAROUSEL;
    });
    setIdx((cur) => Math.max(0, Math.min(cur, photos.length - 2)));
  };

  const clearAll = () => {
    photos.forEach((p) => {if (p.objectUrl) URL.revokeObjectURL(p.src);});
    setPhotos(DEFAULT_CAROUSEL);
    setIdx(0);
  };

  const go = (delta) => {
    setIdx((i) => (i + delta + photos.length) % photos.length);
  };

  const onDragOver = (e) => {e.preventDefault();setDragOver(true);};
  const onDragLeave = (e) => {e.preventDefault();setDragOver(false);};
  const onDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const items = e.dataTransfer?.items;
    if (items && items.length && items[0].webkitGetAsEntry) {
      const collected = [];
      let pending = 0;
      const done = () => {if (pending === 0) ingestFiles(collected);};
      const walk = (entry) => {
        if (entry.isFile) {
          pending++;
          entry.file((f) => {collected.push(f);pending--;done();});
        } else if (entry.isDirectory) {
          pending++;
          const reader = entry.createReader();
          reader.readEntries((entries) => {
            entries.forEach(walk);
            pending--;done();
          });
        }
      };
      for (let i = 0; i < items.length; i++) {
        const entry = items[i].webkitGetAsEntry?.();
        if (entry) walk(entry);
      }
      if (pending === 0) ingestFiles(e.dataTransfer.files);
    } else {
      ingestFiles(e.dataTransfer.files);
    }
  };

  return (
    <Fragment>
      <div
        className={"product-img" + (dragOver ? " drag-over" : "")}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}>

        <div className="carousel-track" style={{ transform: `translateX(-${idx * 100}%)` }}>
          {photos.map((p, i) =>
          <div className="slide" key={i + p.src}>
              {p.kind === "video" ?
            <video
              ref={(el) => videoRefs.current[i] = el}
              src={p.src}
              controls
              playsInline
              preload="metadata"
              onClick={(e) => e.stopPropagation()} /> :


            <img src={p.src} alt={p.label || `Slide ${i + 1}`} />
            }
              <div className="slide-tools" onClick={(e) => e.stopPropagation()}>
                <button onClick={() => replaceSlideAt(i)} title="Replace this file">
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4"><polyline points="23 4 23 10 17 10" /><polyline points="1 20 1 14 7 14" /><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" /></svg>
                  Replace
                </button>
                {(photos.length > 1 || p.objectUrl) &&
              <button className="danger" onClick={() => removeSlideAt(i)} title="Remove from carousel">
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4"><polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" /><path d="M10 11v6M14 11v6" /><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" /></svg>
                </button>
              }
              </div>
              <span className="idx-tag">{(p.kind === "video" ? "VID · " : "") + String(i + 1).padStart(2, "0")} / {String(photos.length).padStart(2, "0")}</span>
            </div>
          )}
        </div>

        {photos.length > 1 &&
        <Fragment>
            <button className="car-nav prev" onClick={() => go(-1)} aria-label="Previous">‹</button>
            <button className="car-nav next" onClick={() => go(1)} aria-label="Next">›</button>
            <div className="car-dots">
              {photos.map((_, i) =>
            <span key={i} className={"dot" + (i === idx ? " active" : "")} onClick={() => setIdx(i)}></span>
            )}
            </div>
          </Fragment>
        }

        <div className="corner">{PRODUCT.saleLabel}</div>
      </div>

      <div className="car-toolbar">
        <button className="upload-btn primary" onClick={() => folderRef.current?.click()} title="Upload an entire folder of images and videos">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 7v12a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-7l-2-2H5a2 2 0 0 0-2 2z" /><path d="M12 11v6M9 14l3-3 3 3" /></svg>
          Upload folder
        </button>
        <button className="upload-btn" onClick={() => fileRef.current?.click()} title="Upload multiple image or video files">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><path d="M21 15l-5-5L5 21" /></svg>
          Add media
        </button>
        <span className="count">{(() => {
          const imgs = photos.filter((p) => p.kind !== "video").length;
          const vids = photos.filter((p) => p.kind === "video").length;
          const parts = [];
          if (imgs) parts.push(`${imgs} ${imgs === 1 ? "photo" : "photos"}`);
          if (vids) parts.push(`${vids} ${vids === 1 ? "video" : "videos"}`);
          return parts.join(" · ") || "0 photos";
        })()}</span>
        {photos.some((p) => p.objectUrl) &&
        <button className="clear" onClick={clearAll} title="Reset to default">Reset</button>
        }
        <input ref={fileRef} type="file" accept="image/*,video/*" multiple onChange={onPick} />
        <input ref={folderRef} type="file" accept="image/*,video/*" multiple onChange={onPickFolder} webkitdirectory="" directory="" />
        <input ref={replaceRef} type="file" accept="image/*,video/*" onChange={onReplaceFile} />
      </div>
    </Fragment>);

}

function ProductHero({ onBuy }) {
  return (
    <section className="product-hero" data-screen-label="01 Product hero">
      <div className="ph-left">
        <div className="ph-card">
          <ProductCarousel />
          <div className="name-line">
            <h2><span className="clvster-glow">CLVSTER</span></h2>
            <span className="off">{PRODUCT.saleLabel}</span>
          </div>
          <div className="sub">{PRODUCT.type}</div>
        </div>
      </div>
      <div className="ph-right">
        <img src="/assets/clvster-logo.jpg" alt="CLVSTER" className="ph-logo" />
        <div className="ph-eyebrow">[ NEW · v1.0.2 · ALGORITHMIC SEQUENCER ]</div>
        <h1>Clusters, not steps.<br /><span className="alt">Explorative</span>.</h1>
        <ul className="bullets">
          <li>KANTIAN is the first algorithmic and deterministic sequencer with a special ability…</li>
          <li>Sequence different algorithms across a timeline — drawing from mathematics developed by ancient Greek thinkers (Euclid of Alexandria, 300 B.C.) to World War II decryption systems (the Turing machine, Alan Turing)…</li>
          <li>…or more esoteric analog logic (NIBBLER 4-bit register, a Eurorack module by Schlappi Engineering).</li>
          <li>Microtonal, Polyrithimc, micro-rythmic, Polymetric</li>
          <li><b>ALGO Modifiers: Euclidean masking, Ratchets, Hold Step
Pitch Squeeze....
</b> <a href="#">Log in</a> to see your loyalty discount</li>
        </ul>
        <div className="ph-cta">
          <button className="price-cta" onClick={onBuy}>
            <span className="lbl">Buy now</span>
            <span className="amt"><s>{`€${PRODUCT.price}`}</s>{`€${PRODUCT.sale}`}</span>
          </button>
          <button className="price-cta alt">
            <span className="lbl">Sub to own</span>
            <span className="amt">{`€${PRODUCT.sub}`}<span style={{ opacity: 0.65, fontSize: 12, fontFamily: "'Space Mono'", fontWeight: 400, marginLeft: 4 }}>/mo</span></span>
          </button>
        </div>
      </div>
    </section>);}

/* -------- Awards strip -------- */
function AwardsStrip() {
  return (
    <section style={{ padding: "44px 56px", borderBottom: "1px solid #2a2722", background: "var(--charcoal)" }} data-screen-label="02 Awards">
      <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 11, color: "var(--pink)", letterSpacing: "0.18em", textTransform: "uppercase", marginBottom: 22, textAlign: "center" }}>THE MODIFIERS

      </div>
      <div style={{ display: "grid", gridTemplateColumns: `repeat(${AWARDS.length}, 1fr)`, gap: 24, alignItems: "center" }}>
        {AWARDS.map((a, i) =>
        <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6, textAlign: "center" }}>
            <div style={{ width: 56, height: 56, borderRadius: "50%", border: "1px solid var(--yellow)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Archivo Black'", fontSize: 14, color: "var(--yellow)", letterSpacing: "0.04em", lineHeight: "0" }}>
              {a.mark}
            </div>
            <div style={{ fontSize: 11, fontWeight: 600, color: "#d7d3c5" }}>{a.title}</div>
            <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 10, color: "#807a6c", letterSpacing: "0.08em", textTransform: "uppercase" }}>{a.sub}</div>
          </div>
        )}
      </div>
    </section>);

}

/* -------- Reusable uploadable media slot (one image OR one video) -------- */
function MediaSlot({ defaultSrc, defaultKind = "image", placeholder = "Upload media", className = "", children }) {
  const [media, setMedia] = useState(defaultSrc ? { src: defaultSrc, kind: defaultKind } : null);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => () => {
    if (media?.objectUrl) URL.revokeObjectURL(media.src);
  }, []);

  const accept = (file) => {
    if (!file) return;
    if (!file.type.startsWith("image/") && !file.type.startsWith("video/")) return;
    setMedia((prev) => {
      if (prev?.objectUrl) URL.revokeObjectURL(prev.src);
      return {
        src: URL.createObjectURL(file),
        kind: file.type.startsWith("video/") ? "video" : "image",
        mime: file.type,
        name: file.name,
        objectUrl: true
      };
    });
  };

  const onChange = (e) => {accept(e.target.files?.[0]);e.target.value = "";};
  const onDragOver = (e) => {e.preventDefault();setDragOver(true);};
  const onDragLeave = (e) => {e.preventDefault();setDragOver(false);};
  const onDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    accept(e.dataTransfer.files?.[0]);
  };
  const reset = () => {
    if (media?.objectUrl) URL.revokeObjectURL(media.src);
    setMedia(defaultSrc ? { src: defaultSrc, kind: defaultKind } : null);
  };

  const hasUserMedia = !!media?.objectUrl;
  const showEmpty = !media;

  return (
    <div
      className={`media-slot ${className} ${showEmpty ? "empty" : ""} ${dragOver ? "drag-over" : ""}`}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      onClick={showEmpty ? () => inputRef.current?.click() : undefined}>

      {children}
      {media &&
      <div className="ms-content">
          {media.kind === "video" ?
        <video src={media.src} controls playsInline preload="metadata" onClick={(e) => e.stopPropagation()} /> :

        <img src={media.src} alt={media.name || "media"} />
        }
        </div>
      }
      {showEmpty &&
      <div className="ms-empty">
          <div className="ms-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><path d="M21 15l-5-5L5 21" /></svg>
          </div>
          <div className="ms-label">{placeholder}</div>
        </div>
      }
      <div className="ms-tools" onClick={(e) => e.stopPropagation()}>
        <button onClick={() => inputRef.current?.click()} title={media ? "Replace footage" : "Upload footage"}>
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4"><polyline points="23 4 23 10 17 10" /><polyline points="1 20 1 14 7 14" /><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" /></svg>
          {media ? "Replace" : "Upload"}
        </button>
        {hasUserMedia &&
        <button className="danger" onClick={reset} title="Reset">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4"><polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" /></svg>
          </button>
        }
      </div>
      <input ref={inputRef} type="file" accept="image/*,video/*" onChange={onChange} />
    </div>);

}

/* -------- Feature blocks -------- */
function MediaBlock({ media, screenLabel }) {
  return (
    <MediaSlot className="media" placeholder={`Drop ${media.label?.toLowerCase() || "footage"} here`}>
      <div className="media-bg"></div>
      <span className="corner-label">{media.label}</span>
      <span className="corner-label tr">XOVND · DEMO</span>
      <span className="runtime">{media.time}</span>
      <span className="sr-only" data-screen-label={screenLabel}></span>
    </MediaSlot>);

}

function FeatureBlock({ f, idx }) {
  const reverse = f.media.reverse;
  return (
    <section className={"feature" + (reverse ? " reverse" : "")} data-screen-label={`0${3 + idx} ${f.eyebrow}`}>
      <div className="copy">
        <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 11, color: "var(--pink)", letterSpacing: "0.18em", textTransform: "uppercase", marginBottom: 18 }}>
          [ {f.eyebrow} ]
        </div>
        <h2>{f.title[0]}<span className="alt">{f.title[1]}</span></h2>
        {f.body.map((p, i) => <p key={i} style={{ color: "rgb(180, 147, 0)" }}>{p}</p>)}
      </div>
      <MediaBlock media={f.media} screenLabel={`0${3 + idx} ${f.eyebrow} media`} />
    </section>);

}

function AudioDemos() {
  const [playing, setPlaying] = useState(-1);
  return (
    <section className="audio-demos" data-screen-label="06 Audio demos">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 32, flexWrap: "wrap", gap: 16 }}>
        <div>
          <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 11, color: "var(--pink)", letterSpacing: "0.18em", textTransform: "uppercase", marginBottom: 14 }}>
            [ Audio demos · {DEMOS.length} ]
          </div>
          <h2 style={{ fontFamily: "'Archivo Black'", fontSize: "clamp(32px, 4vw, 56px)", margin: 0, letterSpacing: "-0.02em", lineHeight: 0.95 }}>
            Hear it run. <span style={{ color: "var(--yellow)" }}></span>
          </h2>
        </div>
        <p style={{ maxWidth: 380, color: "#b5b0a2", margin: 0, fontSize: 15, lineHeight: 1.5 }}>
          Four producers, four wildly different patches — all built from the same engine. Click any row to hear the result, plus a quick note on which mods are in play.
        </p>
      </div>
      <div className="demo-list">
        {DEMOS.map((d, i) => {
          const isP = playing === i;
          return (
            <div key={i} className={"demo-row" + (isP ? " playing" : "")} onClick={() => setPlaying(isP ? -1 : i)}>
              <button className="play-btn" aria-label={isP ? "Pause" : "Play"}>
                {isP ?
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="5" width="4" height="14" /><rect x="14" y="5" width="4" height="14" /></svg> :
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z" /></svg>}
              </button>
              <div>
                <div className="title">{d.title}</div>
                <div className="author">{d.author}</div>
              </div>
              <div className="waveform">
                {[...Array(36)].map((_, k) => {
                  const h = 25 + Math.abs(Math.sin(k * 0.7 + i)) * 75;
                  return <div key={k} className={"bar" + (isP && k < 28 ? " active" : "")} style={{ height: `${h}%`, animationDelay: `${k * 30}ms` }}></div>;
                })}
              </div>
              <div className="runtime">{d.time}</div>
            </div>);

        })}
      </div>
    </section>);

}

/* -------- Testimonials grid -------- */
function TestimonialGrid() {
  return (
    <section className="testimonials-grid" data-screen-label="07 Testimonials">
      {TESTIMONIALS.map((t, i) =>
      <div key={i} className={"tcard" + (t.featured ? " featured" : "")}>
          <svg width="32" height="24" viewBox="0 0 32 24" fill="currentColor" style={{ opacity: 0.6 }}><path d="M0 24V12C0 5.4 4.4 0 12 0v4c-3 0-6 2-6 8h6v12H0zm18 0V12c0-6.6 4.4-12 12-12v4c-3 0-6 2-6 8h6v12H18z" /></svg>
          <blockquote>{t.quote}</blockquote>
          <div className="who" style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div className="avatar">{t.initials}</div>
            <div>
              <div className="name">{t.name}</div>
              <div className="role">{t.role}</div>
            </div>
          </div>
        </div>
      )}
    </section>);

}

/* -------- Explore features grid -------- */
function ExploreGrid() {
  return (
    <section className="explore" data-screen-label="08 Explore features">
      <div style={{ marginBottom: 32 }}>
        <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 11, color: "var(--pink)", letterSpacing: "0.18em", textTransform: "uppercase", marginBottom: 14 }}>
          [ Explore the features · {EXPLORE.length} ]
        </div>
        <h2 style={{ fontFamily: "'Archivo Black'", fontSize: "clamp(32px, 4vw, 56px)", margin: 0, letterSpacing: "-0.02em", lineHeight: 0.95 }}>
          Everything in <span style={{ color: "var(--yellow)" }}>the box.</span>
        </h2>
      </div>
      <div className="explore-grid">
        {EXPLORE.map((e, i) =>
        <div key={i} className="explore-card">
            <span className="num">{e.n}</span>
            <h3>{e.title}</h3>
            <p>{e.body}</p>
          </div>
        )}
      </div>
    </section>);

}

/* -------- Videos -------- */
function VideoGrid() {
  return (
    <section className="videos" data-screen-label="09 Videos">
      <div style={{ marginBottom: 32 }}>
        <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 11, color: "var(--pink)", letterSpacing: "0.18em", textTransform: "uppercase", marginBottom: 14 }}>
          [ Videos · {VIDEOS.length} ]
        </div>
        <h2 style={{ fontFamily: "'Archivo Black'", fontSize: "clamp(32px, 4vw, 56px)", margin: 0, letterSpacing: "-0.02em", lineHeight: 0.95 }}>
          See it <span style={{ color: "var(--yellow)" }}>in motion.</span>
        </h2>
      </div>
      <div className="video-grid">
        {VIDEOS.map((v, i) =>
        <MediaSlot key={i} className="video-card" placeholder={`Drop ${v.label.toLowerCase()} footage`}>
            <div className="vbg"></div>
            <span className="vlabel">{v.label} — {v.title}</span>
          </MediaSlot>
        )}
      </div>
    </section>);

}

/* -------- Accordion -------- */
function Accordion({ items, defaultOpen }) {
  const [open, setOpen] = useState(defaultOpen ?? -1);
  return (
    <div className="acc">
      {items.map((it, i) =>
      <div key={i} className={"acc-item" + (open === i ? " open" : "")}>
          <button className="acc-head" onClick={() => setOpen(open === i ? -1 : i)}>
            <span>{it.q || it.ver || it.title}</span>
            <span className="chev">+</span>
          </button>
          <div className="acc-body">
            <div className="acc-body-inner">
              {it.a && <p style={{ margin: 0 }}>{it.a}</p>}
              {it.notes && <ul style={{ margin: 0 }}>{it.notes.map((n, k) => <li key={k}>{n}</li>)}</ul>}
              {it.body && <div>{it.body}</div>}
            </div>
          </div>
        </div>
      )}
    </div>);

}

/* -------- Details (tech specs + FAQ + changelog) -------- */
function Details() {
  return (
    <section className="details" data-screen-label="10 More details">
      <div>
        <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 11, color: "var(--pink)", letterSpacing: "0.18em", textTransform: "uppercase", marginBottom: 14 }}>
          [ Tech & FAQ ]
        </div>
        <h2 style={{ fontFamily: "'Archivo Black'", fontSize: "clamp(28px, 3.4vw, 44px)", margin: "0 0 28px", letterSpacing: "-0.02em", lineHeight: 0.95 }}>
          More <span style={{ color: "var(--yellow)" }}>details.</span>
        </h2>
        <Accordion items={[
        { q: "Tech specs", body: <ul style={{ margin: 0, paddingLeft: 16 }}>{TECHSPEC.map((s, i) => <li key={i} style={{ marginBottom: 8 }}>{s}</li>)}</ul> },
        ...FAQ]
        } defaultOpen={0} />
      </div>
      <div>
        <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 11, color: "var(--pink)", letterSpacing: "0.18em", textTransform: "uppercase", marginBottom: 14 }}>
          [ Changelog ]
        </div>
        <h2 style={{ fontFamily: "'Archivo Black'", fontSize: "clamp(28px, 3.4vw, 44px)", margin: "0 0 28px", letterSpacing: "-0.02em", lineHeight: 0.95 }}>
          What's <span style={{ color: "var(--yellow)" }}>new.</span>
        </h2>
        <Accordion items={CHANGELOG} defaultOpen={CHANGELOG.length - 1} />
        <div style={{ marginTop: 28, padding: 22, background: "var(--charcoal)", border: "1px solid #2a2722", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
          <div>
            <div style={{ fontFamily: "'Archivo Black'", fontSize: 18, marginBottom: 4 }}>Get the free trial</div>
            <div style={{ fontSize: 13, color: "#807a6c" }}>14-day full-feature trial. No credit card required.</div>
          </div>
          <button className="btn btn-primary">Download trial <span className="arrow">→</span></button>
        </div>
      </div>
    </section>);

}

/* -------- Pricing -------- */
function Pricing({ onBuy }) {
  return (
    <section className="pricing" data-screen-label="11 Pricing">
      <div style={{ textAlign: "center", marginBottom: 40 }}>
        <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 11, color: "var(--pink)", letterSpacing: "0.18em", textTransform: "uppercase", marginBottom: 14 }}>
          [ Buy CLVSTER ]
        </div>
        <h2 style={{ fontFamily: "'Archivo Black'", fontSize: "clamp(40px, 5vw, 72px)", margin: 0, letterSpacing: "-0.02em", lineHeight: 0.95 }}>
          Two ways to <span style={{ color: "var(--yellow)" }}>own it.</span>
        </h2>
      </div>
      <div className="pricing-grid">
        <div className="price-card">
          <h3>Own forever</h3>
          <div className="price-amt"><s>{`€${PRODUCT.price}`}</s>{`€${PRODUCT.sale}`}</div>
          <ul>
            <li>One-time purchase. Yours forever.</li>
            <li>Free updates for the v1 lifecycle</li>
            <li>3 activations per seat — transferable</li>
            <li><b>Existing customers:</b> log in for your loyalty discount</li>
          </ul>
          <button className="pbtn" onClick={onBuy}>
            <span>{`Buy now — €${PRODUCT.sale}`}</span><span>→</span>
          </button>
        </div>
        <div className="price-card featured">
          <span className="ptag">Most popular</span>
          <h3>Sub to own</h3>
          <div className="price-amt">{`€${PRODUCT.sub}`}<span className="per"> / month</span></div>
          <ul>
            <li>Full access to <b>every</b> XOVND plugin while subscribed</li>
            <li>Choose <b>any</b> plugin to own forever every 6 months</li>
            <li>Cancel any time, keep what you've earned</li>
            <li>First month €0.99 with code <b>COLLECT</b></li>
          </ul>
          <button className="pbtn">
            <span>Start subscription</span><span>→</span>
          </button>
        </div>
      </div>
    </section>);

}

/* -------- App -------- */
function App() {
  const { cart, cartOpen, openCart, closeCart, addToCart, removeAt, toast } = useCart();
  const auth = useAuth();
  const access = useAccessModal();
  // Phase 2A: Buy buttons route straight to Moonbase hosted checkout —
  // they handle MoR, VAT, localised currency, card forms. The local cart
  // UI stays in the codebase for Phase 2B (multi-product cart + custom
  // checkout). Set window.__USE_LOCAL_CART = true to flip back.
  const MOONBASE_CHECKOUT = 'https://xound.moonbase.sh/buy/clvster';
  const onBuy = () => {
    if (window.__USE_LOCAL_CART) { addToCart(PRODUCT); return; }
    window.open(MOONBASE_CHECKOUT, '_blank', 'noopener,noreferrer');
  };

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
      <SiteHeader cartCount={cart.length} onOpenCart={openCart} current="products" user={auth.user} onAccountClick={onAccountClick} />

      <ProductHero onBuy={onBuy} />
      <AwardsStrip />

      {FEATURES.map((f, i) => <FeatureBlock key={i} f={f} idx={i} />)}

      <AudioDemos />
      <TestimonialGrid />
      <ExploreGrid />
      <VideoGrid />
      <Details />
      <Pricing onBuy={onBuy} />

      <SiteFooter />

      <CartDrawer open={cartOpen} onClose={closeCart} items={cart} onRemove={removeAt} />
      <AccessModal open={access.open} initialTab={access.initialTab} onClose={access.closeModal} />
      <Tweaks />
      {/* LoginModal stub — Phase 2B.3 replaces with Supabase Auth. */}
      <div className={"toast" + (toast ? " show" : "")}>{toast}</div>
    </>);

}


export default function Page() { return <App />; }
