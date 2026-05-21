'use client';
import { useState, useEffect } from 'react';

/* Unified access modal for the closed-beta phase.
   Two paths in one UI:
     1. "I have a code" — paste an issued code, validate, download the
        installer, persist the user as a redeemed buyer/beta-tester.
     2. "Request access" — capture name/email/platform/handle for users
        we haven't issued a code to yet (we'll mail them one).
   All state lives in localStorage; Phase 2B.3 (Supabase) will replace
   the storage layer without changing the UI. */

const USER_KEY      = 'xovnd_user';
const REDEEMED_KEY  = 'xovnd_redeemed';
const REQUESTS_KEY  = 'xovnd_influencers';   // backward-compat with admin
const INSTALLER_URL = '/assets/CLVSTER-1.0.0-Win.exe';

// Starter code lists — extend freely. Admin UI in Phase 2B.9.
// Codes are case-insensitive; we uppercase before comparing.
export const BUYER_CODES = [
  'BUY-XOVND-2026-001',
  'BUY-XOVND-2026-002',
  'BUY-XOVND-2026-003',
  'BUY-XOVND-2026-004',
  'BUY-XOVND-2026-005',
];
export const BETA_CODES = [
  'BETA-XOVND-MIRA',
  'BETA-XOVND-JULES',
  'BETA-XOVND-WREN',
  'BETA-XOVND-SUN',
  'BETA-XOVND-DIA',
  'BETA-XOVND-OPEN-001',
  'BETA-XOVND-OPEN-002',
];
const PLATFORMS = ['Instagram', 'YouTube', 'TikTok', 'X / Twitter', 'Twitch', 'Other'];

function readJSON(k, fb) {
  if (typeof window === 'undefined') return fb;
  try { return JSON.parse(localStorage.getItem(k) || JSON.stringify(fb)); }
  catch { return fb; }
}
function writeJSON(k, v) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(k, JSON.stringify(v));
}

function triggerDownload() {
  const a = document.createElement('a');
  a.href = INSTALLER_URL;
  a.download = 'CLVSTER-1.0.0-Win.exe';
  document.body.appendChild(a); a.click(); a.remove();
}

function classifyCode(raw) {
  const code = raw.trim().toUpperCase();
  if (BUYER_CODES.map(c => c.toUpperCase()).includes(code)) return { code, type: 'buyer' };
  if (BETA_CODES.map(c => c.toUpperCase()).includes(code))  return { code, type: 'beta'  };
  return null;
}

export function AccessModal({ open, onClose, initialTab = 'code' }) {
  const [tab, setTab] = useState(initialTab);
  const [code, setCode] = useState('');
  const [codeError, setCodeError] = useState('');
  const [stage, setStage] = useState('form');     // form | redeemed | requested
  const [redeemed, setRedeemed] = useState(null); // {code, type}

  // Request-access form fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [platform, setPlatform] = useState(PLATFORMS[0]);
  const [handle, setHandle] = useState('');

  useEffect(() => {
    if (open) { setTab(initialTab); setStage('form'); setCode(''); setCodeError(''); }
  }, [open, initialTab]);

  const submitCode = (e) => {
    e.preventDefault();
    const hit = classifyCode(code);
    if (!hit) { setCodeError('That code is not valid. Double-check the spelling or request access below.'); return; }
    const user = { code: hit.code, type: hit.type, redeemedAt: new Date().toISOString() };
    writeJSON(USER_KEY, user);
    const log = readJSON(REDEEMED_KEY, []);
    log.push(user);
    writeJSON(REDEEMED_KEY, log);
    triggerDownload();
    setRedeemed(user);
    setStage('redeemed');
  };

  const canRequest = name.trim().length > 1 && email.includes('@') && handle.trim().length > 0;
  const submitRequest = (e) => {
    e.preventDefault();
    if (!canRequest) return;
    const list = readJSON(REQUESTS_KEY, []);
    list.push({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      platform,
      handle: handle.trim(),
      signedAt: new Date().toISOString(),
    });
    writeJSON(REQUESTS_KEY, list);
    setStage('requested');
  };

  if (!open) return null;
  return (
    <div className="infl-overlay" onClick={onClose}>
      <div className="infl-modal" onClick={(e) => e.stopPropagation()}>
        <button className="infl-close" onClick={onClose} aria-label="Close">✕</button>

        {stage === 'form' && (
          <>
            <div className="infl-eyebrow">[ XOVND ACCESS · CLVSTER 1.0.0 ]</div>
            <div className="access-tabs">
              <button className={'access-tab' + (tab === 'code' ? ' active' : '')} onClick={() => setTab('code')}>
                I have a code
              </button>
              <button className={'access-tab' + (tab === 'request' ? ' active' : '')} onClick={() => setTab('request')}>
                Request access
              </button>
            </div>

            {tab === 'code' && (
              <>
                <h2>Redeem your <span className="infl-accent">code</span></h2>
                <p className="infl-lead">
                  Buyer codes ship with your Moonbase receipt; beta codes go
                  out to invited testers. Paste it below and your installer
                  starts immediately.
                </p>
                <form onSubmit={submitCode} className="infl-form">
                  <label>
                    <span>Access code</span>
                    <input
                      type="text"
                      value={code}
                      onChange={(e) => { setCode(e.target.value); setCodeError(''); }}
                      placeholder="BETA-XOVND-… or BUY-XOVND-…"
                      autoFocus
                      autoComplete="off"
                      spellCheck={false}
                      style={{ fontFamily: "'Space Mono', monospace", letterSpacing: '0.06em' }}
                    />
                  </label>
                  {codeError && <div className="access-error">{codeError}</div>}
                  <button type="submit" className="infl-submit" disabled={code.trim().length < 4}>
                    <span>Redeem &amp; download</span>
                    <span>↓</span>
                  </button>
                  <p className="infl-fineprint">
                    Codes are single-issue per person; we log redemptions on
                    your browser for reference. Lost your code? Reply to the
                    email we sent you.
                  </p>
                </form>
              </>
            )}

            {tab === 'request' && (
              <>
                <h2>Request <span className="infl-accent">a beta code</span></h2>
                <p className="infl-lead">
                  We send codes to a small group of producers and creators
                  before launch. Tell us about you and we&rsquo;ll be in touch.
                </p>
                <form onSubmit={submitRequest} className="infl-form">
                  <label>
                    <span>Name</span>
                    <input type="text" value={name} onChange={(e) => setName(e.target.value)} required autoFocus />
                  </label>
                  <label>
                    <span>Email</span>
                    <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
                  </label>
                  <div className="infl-row">
                    <label className="infl-platform">
                      <span>Primary platform</span>
                      <select value={platform} onChange={(e) => setPlatform(e.target.value)}>
                        {PLATFORMS.map((p) => <option key={p} value={p}>{p}</option>)}
                      </select>
                    </label>
                    <label className="infl-handle">
                      <span>Handle / URL</span>
                      <input type="text" value={handle} onChange={(e) => setHandle(e.target.value)} placeholder="@yourhandle or full URL" required />
                    </label>
                  </div>
                  <button type="submit" className="infl-submit" disabled={!canRequest}>
                    <span>Request access</span>
                    <span>→</span>
                  </button>
                  <p className="infl-fineprint">
                    No spam — we&rsquo;ll only email you about your beta access
                    and the public launch.
                  </p>
                </form>
              </>
            )}
          </>
        )}

        {stage === 'redeemed' && redeemed && (
          <>
            <div className="infl-eyebrow">
              [ {redeemed.type === 'buyer' ? 'BUYER' : 'BETA TESTER'} · WELCOME ]
            </div>
            <h2>Code accepted — <span className="infl-accent">download starting.</span></h2>
            <p className="infl-lead">
              Your CLVSTER installer is on the way. Drop the resulting
              <code style={{ background: '#15130f', padding: '1px 6px', borderRadius: 4, margin: '0 4px' }}>
                CLVSTER-1.0.0-Win.exe
              </code>
              into your VST folder, restart your DAW, scan, done.
            </p>
            <ul className="infl-checklist">
              {redeemed.type === 'beta' ? (
                <>
                  <li>14-day trial activates automatically — no card needed</li>
                  <li>Tag <b>@xovnd.audio</b> if you post anything cool</li>
                  <li>Reply to the welcome email with bugs / wishes / wins</li>
                </>
              ) : (
                <>
                  <li>Your purchase activates the full version automatically</li>
                  <li>Free updates for the v1 lifecycle</li>
                  <li>Reply to your Moonbase receipt for any issues</li>
                </>
              )}
            </ul>
            <a className="infl-submit" href={INSTALLER_URL} download>
              <span>Re-download installer</span>
              <span>↓</span>
            </a>
          </>
        )}

        {stage === 'requested' && (
          <>
            <div className="infl-eyebrow">[ REQUEST SUBMITTED ]</div>
            <h2>Got it, <span className="infl-accent">{name.split(' ')[0]}</span>.</h2>
            <p className="infl-lead">
              We&rsquo;ll review and email your beta code soon. Keep an eye on
              your inbox — and tag <b>@xovnd.audio</b> if you post anything
              with CLVSTER.
            </p>
            <button className="infl-submit" onClick={onClose}>
              <span>Close</span>
              <span>✓</span>
            </button>
          </>
        )}
      </div>
    </div>
  );
}

export function useAccessModal() {
  const [open, setOpen] = useState(false);
  const [initialTab, setInitialTab] = useState('code');
  return {
    open,
    initialTab,
    openModal: (tab = 'code') => { setInitialTab(tab); setOpen(true); },
    closeModal: () => setOpen(false),
  };
}
