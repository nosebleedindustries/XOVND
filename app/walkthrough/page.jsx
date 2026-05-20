'use client';
import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { SiteHeader, SiteFooter, CartDrawer, useCart, useAuth } from '@/components/shared';

/* Walkthrough — interactive sequencer video with chapter list.
   Exposes window.Walkthrough. */

const WT_CHAPTERS = [
{
  t: 0, time: "0:00",
  title: "Lay down a base pattern",
  body: "Tap a few steps on the 16-cell grid to define a starting phrase. Nothing fancy — CLVSTER is designed so the seed pattern can be deliberately dumb.",
  tags: ["GRID", "16 STEPS"],
  pattern: [1, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 0],
  clusters: [],
  callout: "BASE PATTERN — 4 STEPS, EVENLY-SPACED",
  mods: []
},
{
  t: 12, time: "0:12",
  title: "Lasso steps into a cluster",
  body: "Draw across the lit steps to group them into a single cluster. From here on, you operate on the cluster, not the individual steps.",
  tags: ["CLUSTER", "LASSO"],
  pattern: [1, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 0],
  clusters: [{ from: 0, to: 12, color: "c1" }],
  callout: "CLUSTER 01 — 4 STEPS",
  mods: ["CLUSTER 01"]
},
{
  t: 26, time: "0:26",
  title: "Apply a Euclidean modifier",
  body: "Drop a Euclidean(5,16) modifier onto cluster 01. The cluster redistributes its hits along the 16-step grid, in real time.",
  tags: ["ALGO MOD", "EUCLIDEAN(5,16)"],
  pattern: [1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 0],
  clusters: [{ from: 0, to: 12, color: "c1" }],
  callout: "MOD: EUCLIDEAN(5,16) → CLUSTER 01",
  mods: ["EUCLIDEAN 5/16"]
},
{
  t: 40, time: "0:40",
  title: "Stack a drunk-walk mod",
  body: "Add a drunk-walk modifier on top. Cells shuffle their positions a step or two per bar — the pattern stays musical but never repeats itself.",
  tags: ["ALGO MOD", "DRUNK-WALK", "STACKED"],
  pattern: [1, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0],
  clusters: [{ from: 0, to: 15, color: "c1" }],
  callout: "DRUNK-WALK ± 2 STEPS / BAR",
  mods: ["EUCLIDEAN 5/16", "DRUNK-WALK ±2"]
},
{
  t: 56, time: "0:56",
  title: "Add a second cluster",
  body: "Lasso a new region into cluster 02. Different rate, different scale-lock, different stack of mods. Two clusters now run in counterpoint.",
  tags: ["CLUSTER 02", "POLYRHYTHM"],
  pattern: [1, 2, 0, 0, 2, 0, 1, 0, 0, 2, 0, 1, 0, 2, 1, 0],
  clusters: [
  { from: 0, to: 15, color: "c1" },
  { from: 1, to: 14, color: "c2" }],

  callout: "CLUSTER 02 — RATE 3/4 · SCALE: MIN",
  mods: ["EUCLIDEAN 5/16", "DRUNK-WALK ±2", "PRB-SKIP 30%"]
},
{
  t: 70, time: "1:10",
  title: "Performance morph",
  body: "Hit a morph keybind and CLVSTER blends between two saved cluster topologies — live. This is the part you'll record straight to your DAW timeline.",
  tags: ["MORPH", "LIVE", "RECORD"],
  pattern: [1, 2, 3, 0, 2, 3, 1, 2, 3, 2, 0, 1, 2, 3, 1, 2],
  clusters: [
  { from: 0, to: 6, color: "c1" },
  { from: 4, to: 11, color: "c2" },
  { from: 8, to: 15, color: "c3" }],

  callout: "MORPH ENGAGED — RECORDING TO DAW",
  mods: ["MORPH 0.42", "REC"]
}];


const WT_DURATION = 84;

function wtFmt(t) {
  const m = Math.floor(t / 60);
  const s = Math.floor(t % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

function VideoStage({ chapter, playing, time, muted, onToggleMute, onTogglePlay }) {
  const head = Math.floor(time * 4 % 16);
  return (
    <div className="vstage">
      <button className={"vpanic" + (playing ? "" : " paused")} onClick={(e) => {e.stopPropagation();onTogglePlay();}} aria-label={playing ? "Stop video" : "Play video"}>
        <span className="vpanic-dot" style={{ color: playing ? "var(--pink)" : "var(--yellow)" }}>
          {playing ?
          <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="5" width="4" height="14" /><rect x="14" y="5" width="4" height="14" /></svg> :
          <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z" /></svg>}
        </span>
        <span>{playing ? "Stop" : "Play"}</span>
        <span className="vpanic-hint">{playing ? "— if annoying" : "— resume"}</span>
      </button>
      <span className="vlabel-tl">CLVSTER · WALKTHROUGH</span>
      <span className="vlabel-tr">{playing ? "REC" : "PAUSED"}</span>
      <button className={"vmute" + (muted ? " muted" : "")} onClick={(e) => {e.stopPropagation();onToggleMute();}} aria-label={muted ? "Unmute" : "Mute"} title={muted ? "Unmute" : "Mute"}>
        {muted ?
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M11 5L6 9H3v6h3l5 4z" fill="currentColor" stroke="none" /><line x1="23" y1="9" x2="17" y2="15" /><line x1="17" y1="9" x2="23" y2="15" /></svg> :

        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M11 5L6 9H3v6h3l5 4z" fill="currentColor" stroke="none" /><path d="M15.5 8.5a5 5 0 0 1 0 7" /><path d="M18.5 5.5a9 9 0 0 1 0 13" /></svg>
        }
      </button>
      <div className="vscene">
        <div className="step-grid">
          {chapter.pattern.map((v, i) => {
            const colorCls = v === 2 ? "pink" : v === 3 ? "white" : "";
            return (
              <div
                key={i}
                className={
                "step" + (v ? " lit" : "") + (colorCls ? " " + colorCls : "") + (
                playing && head === i ? " head" : "")
                } />);


          })}
          {chapter.clusters.map((c, i) =>
          <div
            key={i}
            className={"cluster-overlay show " + c.color}
            style={{
              left: `calc(${c.from / 16 * 100}% - 4px)`,
              width: `calc(${(c.to - c.from + 1) / 16 * 100}% + 8px)`
            }} />

          )}
        </div>
        <div className="scene-callout">{chapter.callout}</div>
        {chapter.mods.length > 0 &&
        <div className="mod-badges">
            {chapter.mods.map((m, i) =>
          <span key={i} className={"mod-badge" + (i % 2 === 1 ? " pink" : "")}>{m}</span>
          )}
          </div>
        }
      </div>
    </div>);

}

function Walkthrough() {
  const [time, setTime] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [rate, setRate] = useState(1);
  const [muted, setMuted] = useState(true);
  const scrubRef = useRef(null);

  useEffect(() => {
    if (!playing) return;
    let last = performance.now();
    let raf;
    const tick = (now) => {
      const dt = (now - last) / 1000;
      last = now;
      setTime((t) => {
        const nt = t + dt * rate;
        if (nt >= WT_DURATION) {setPlaying(false);return 0;}
        return nt;
      });
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [playing, rate]);

  let activeIdx = 0;
  for (let i = 0; i < WT_CHAPTERS.length; i++) {
    if (time >= WT_CHAPTERS[i].t) activeIdx = i;
  }
  const active = WT_CHAPTERS[activeIdx];

  const onScrub = (e) => {
    const r = scrubRef.current.getBoundingClientRect();
    const pct = Math.max(0, Math.min(1, (e.clientX - r.left) / r.width));
    setTime(pct * WT_DURATION);
  };
  const jumpTo = (t) => {setTime(t);setPlaying(true);};
  const pct = time / WT_DURATION * 100;

  return (
    <section className="walkthrough" data-screen-label="Walkthrough">
      <div className="wt-head">
        <div>
          <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 11, color: "var(--pink)", letterSpacing: "0.18em", textTransform: "uppercase", marginBottom: 14 }}>
            [ Inside CLVSTER · {WT_CHAPTERS.length} chapters ]
          </div>
          <h2>Fast creation. <span className="alt">Clusters.</span></h2>
        </div>
        <p className="lead">
          A guided walkthrough of a single CLVSTER session, from base pattern to live morph.
          The video plays. The text follows. Skip to any chapter.
        </p>
      </div>

      <div className="wt-grid">
        <div className="vside-wrap">
          <div className="vplayer">
            <VideoStage chapter={active} playing={playing} time={time} muted={muted} onToggleMute={() => setMuted((m) => !m)} onTogglePlay={() => setPlaying((p) => !p)} />
            <div className="vcontrols">
              <div className="vscrubber" ref={scrubRef} onClick={onScrub}>
                <div className="vfill" style={{ width: `${pct}%` }} />
                <div className="vhandle" style={{ left: `${pct}%` }} />
                {WT_CHAPTERS.map((c, i) =>
                <div key={i}
                className={"vtick" + (i === activeIdx ? " active" : "")}
                style={{ left: `${c.t / WT_DURATION * 100}%` }} />
                )}
              </div>
              <div className="vrow">
                <div className="vleft">
                  <button className="vplay" onClick={() => setPlaying((p) => !p)} aria-label={playing ? "Pause" : "Play"}>
                    {playing ?
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="5" width="4" height="14" /><rect x="14" y="5" width="4" height="14" /></svg> :
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z" /></svg>}
                  </button>
                  <div className="vtime">
                    <b>{wtFmt(time)}</b> / {wtFmt(WT_DURATION)} <span style={{ color: "#807a6c", marginLeft: 10 }}>· CH {String(activeIdx + 1).padStart(2, "0")}/{String(WT_CHAPTERS.length).padStart(2, "0")}</span>
                  </div>
                </div>
                <div style={{ display: "flex", gap: 6 }}>
                  {[0.5, 1, 1.5, 2].map((r) =>
                  <button key={r} className={"vrate" + (rate === r ? " on" : "")} onClick={() => setRate(r)}>
                      {r}x
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="wt-chapters">
          {WT_CHAPTERS.map((c, i) =>
          <div key={i} className={"wt-chapter" + (i === activeIdx ? " active" : "")} onClick={() => jumpTo(c.t + 0.01)}>
              <div>
                <div className="cmeta">
                  <span className="ctime">{c.time}</span>
                  <span className="csep">—</span>
                  <span>Chapter {String(i + 1).padStart(2, "0")}</span>
                </div>
                <h3 className="ctitle">{c.title}</h3>
                <p className="cbody">{c.body}</p>
                <div className="ctags">
                  {c.tags.map((tg, k) =>
                <span key={k} className={"ctag" + (k % 2 === 1 ? " pink" : "")}>{tg}</span>
                )}
                </div>
              </div>
              <span className="cnum">{String(i + 1).padStart(2, "0")}</span>
            </div>
          )}
        </div>
      </div>
    </section>);

}

// (Legacy: this used to `window.Walkthrough = Walkthrough` so app.jsx could
// embed it as a sub-section. In the Next.js setup it's its own page.)
export default function Page() { return <Walkthrough />; }
