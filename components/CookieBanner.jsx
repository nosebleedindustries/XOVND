'use client';
import { useState, useEffect } from 'react';

/* GDPR-aligned cookie / localStorage consent banner.
   - Shown on first visit only (persists choice to localStorage).
   - Accept  → site stores license/coupon/etc as usual.
   - Decline → essential cookies only (auth session still works,
     but AccessModal localStorage writes will get short-circuited
     by the helpers in AccessModal). */

const KEY = 'xovnd_cookie_consent';

export function getCookieConsent() {
  if (typeof window === 'undefined') return null;
  try { return localStorage.getItem(KEY); } catch { return null; }
}

export default function CookieBanner() {
  const [choice, setChoice] = useState('loading');

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try { setChoice(localStorage.getItem(KEY) || 'unset'); } catch { setChoice('unset'); }
  }, []);

  const set = (v) => {
    try { localStorage.setItem(KEY, v); } catch {}
    setChoice(v);
  };

  if (choice === 'loading' || choice === 'accepted' || choice === 'declined') return null;

  return (
    <div className="cookie-banner" role="dialog" aria-label="Cookie consent">
      <div className="cookie-shell">
        <p>
          XOVND uses essential cookies (sign-in) and, if you accept, browser
          storage to remember your license and coupon between visits. No
          ads, no third-party tracking. Read our{' '}
          <a href="/privacy">privacy policy</a>.
        </p>
        <div className="cookie-actions">
          <button className="cookie-btn ghost" onClick={() => set('declined')}>Decline</button>
          <button className="cookie-btn primary" onClick={() => set('accepted')}>Accept</button>
        </div>
      </div>
    </div>
  );
}
