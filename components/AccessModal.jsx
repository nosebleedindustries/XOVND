'use client';
import { useState, useEffect } from 'react';
import { signIn } from 'next-auth/react';

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
  const [providers, setProviders] = useState({ google: false, apple: false });

  useEffect(() => {
    if (!open) return;
    // Discover which OAuth providers are configured server-side so we
    // can light up only the ones with credentials in env.
    fetch('/api/auth/providers')
      .then((r) => r.json())
      .then(setProviders)
      .catch(() => {});
  }, [open]);

  const onOAuth = (provider) => {
    if (!providers[provider]) {
      alert(
        provider === 'google'
          ? 'Google sign-in is not configured yet. Set GOOGLE_CLIENT_ID + GOOGLE_CLIENT_SECRET in Vercel env vars to enable.'
          : 'Apple sign-in is not configured yet. Set APPLE_ID + APPLE_SECRET in Vercel env vars to enable.'
      );
      return;
    }
    signIn(provider, { callbackUrl: window.location.href });
  };

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
    // Fire-and-forget log to Supabase (don't block the download on it)
    fetch('/api/redemptions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: hit.code, type: hit.type }),
    }).catch(() => {});
    triggerDownload();
    setRedeemed(user);
    setStage('redeemed');
  };

  const canRequest = name.trim().length > 1 && email.includes('@') && handle.trim().length > 0;
  const submitRequest = async (e) => {
    e.preventDefault();
    if (!canRequest) return;
    const payload = {
      name: name.trim(),
      email: email.trim().toLowerCase(),
      platform,
      handle: handle.trim(),
    };
    // localStorage fallback (Phase 2A behaviour kept while we transition)
    const list = readJSON(REQUESTS_KEY, []);
    list.push({ ...payload, signedAt: new Date().toISOString() });
    writeJSON(REQUESTS_KEY, list);
    // Persist server-side too (Supabase). Don't block the UX if it fails.
    try {
      await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
    } catch {}
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

            <div className="oauth-row">
              <button type="button" className="oauth-btn google" onClick={() => onOAuth('google')} aria-label="Continue with Google">
                <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
                  <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3c-1.6 4.6-6 8-11.3 8-6.6 0-12-5.4-12-12s5.4-12 12-12c3 0 5.8 1.1 7.9 3l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z"/>
                  <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 16 19 13 24 13c3 0 5.8 1.1 7.9 3l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.6 8.4 6.3 14.7z"/>
                  <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5c-2 1.4-4.6 2.2-7.2 2.2-5.3 0-9.7-3.4-11.3-8L6 32.6C9.2 39.1 16 44 24 44z"/>
                  <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.1-4.1 5.5l6.2 5C41.4 35.4 44 30.1 44 24c0-1.3-.1-2.4-.4-3.5z"/>
                </svg>
                <span>Continue with Google</span>
              </button>
              <button type="button" className="oauth-btn apple" onClick={() => onOAuth('apple')} aria-label="Continue with Apple">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M17.04 12.61c-.02-2.06 1.68-3.05 1.76-3.1-.96-1.4-2.46-1.6-2.99-1.62-1.27-.13-2.48.75-3.12.75-.66 0-1.65-.74-2.71-.72-1.39.02-2.69.81-3.41 2.06-1.46 2.52-.37 6.24 1.03 8.29.69 1 1.5 2.12 2.57 2.08 1.03-.04 1.42-.66 2.67-.66 1.24 0 1.6.66 2.69.64 1.11-.02 1.81-1.01 2.49-2.02.79-1.16 1.11-2.29 1.13-2.35-.03-.01-2.16-.83-2.18-3.3zM15.06 5.97c.57-.7.96-1.66.85-2.62-.83.03-1.83.55-2.42 1.24-.53.61-.99 1.59-.87 2.53.92.07 1.87-.46 2.44-1.15z"/>
                </svg>
                <span>Continue with Apple</span>
              </button>
            </div>
            <div className="oauth-sep"><span>or</span></div>

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
