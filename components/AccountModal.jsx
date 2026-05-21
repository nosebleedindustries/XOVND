'use client';
import { useState, useEffect } from 'react';
import { signOut } from 'next-auth/react';

/* Account popup shown when the user clicks their nav name while
   signed in. Read-only summary + a few destructive actions. All
   state is localStorage-only for the closed-beta phase; Supabase
   replaces the persistence + adds real subscription / billing in
   Phase 2B.3. */

const USER_KEY     = 'xovnd_user';
const COUPON_KEY   = 'xovnd_coupon';
const REDEEMED_KEY = 'xovnd_redeemed';
const PROFILE_KEY  = 'xovnd_profile';
const DL_KEY       = 'xovnd_downloads';
const MSG_KEY      = 'xovnd_user_messages';

function readJSON(k, fb) {
  if (typeof window === 'undefined') return fb;
  try { return JSON.parse(localStorage.getItem(k) || JSON.stringify(fb)); }
  catch { return fb; }
}
function writeJSON(k, v) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(k, JSON.stringify(v));
}

export function AccountModal({ open, onClose, user, onLogout }) {
  const [coupon, setCoupon] = useState('');
  const [storedCoupon, setStoredCoupon] = useState(null);
  const [couponMsg, setCouponMsg] = useState('');

  useEffect(() => {
    if (!open) return;
    setStoredCoupon(readJSON(COUPON_KEY, null));
    setCoupon('');
    setCouponMsg('');
  }, [open]);

  if (!open || !user) return null;

  // License summary
  const licenseLabel =
    user.code
      ? user.code
      : user.provider
        ? `${user.provider.charAt(0).toUpperCase()}${user.provider.slice(1)} account`
        : (user.email || 'Active');
  const licenseType =
    user.type === 'buyer' ? 'Full license · CLVSTER 1.0.0'
    : user.type === 'beta' ? 'Beta tester · CLVSTER 1.0.0'
    : user.provider ? 'OAuth account · CLVSTER access'
    : 'Active access';
  const since = user.redeemedAt
    ? new Date(user.redeemedAt).toLocaleDateString()
    : '—';

  const applyCoupon = (e) => {
    e.preventDefault();
    const c = coupon.trim().toUpperCase();
    if (c.length < 3) { setCouponMsg('Coupon too short.'); return; }
    writeJSON(COUPON_KEY, { code: c, appliedAt: new Date().toISOString() });
    setStoredCoupon({ code: c, appliedAt: new Date().toISOString() });
    setCouponMsg(`Coupon "${c}" saved — will apply at checkout when commerce is live.`);
    setCoupon('');
  };

  const removeCoupon = () => {
    if (typeof window !== 'undefined') localStorage.removeItem(COUPON_KEY);
    setStoredCoupon(null);
    setCouponMsg('Coupon removed.');
  };

  const deleteAccount = () => {
    if (!confirm('Delete account and erase all local data?\n\nThis removes your stored license, coupon, profile, downloads and message history from this browser. It does not contact a server (Phase 2B.3 backend not yet live).')) return;
    if (typeof window !== 'undefined') {
      [USER_KEY, COUPON_KEY, REDEEMED_KEY, PROFILE_KEY, DL_KEY, MSG_KEY].forEach((k) => localStorage.removeItem(k));
    }
    if (user.provider) signOut({ redirect: false }).catch(() => {});
    onLogout && onLogout();
    onClose();
  };

  const terminateSub = () => {
    alert('There\'s no active subscription on this account yet. The "Sub to own" billing path lands with the Moonbase / Stripe integration in Phase 2B.4.');
  };

  const logout = () => {
    if (!confirm('Sign out?')) return;
    onLogout && onLogout();
    onClose();
  };

  return (
    <div className="infl-overlay" onClick={onClose}>
      <div className="infl-modal acct-modal" onClick={(e) => e.stopPropagation()}>
        <button className="infl-close" onClick={onClose} aria-label="Close">✕</button>
        <div className="infl-eyebrow">[ ACCOUNT ]</div>
        <h2>{user.name || user.email || licenseLabel}</h2>

        <div className="acct-row">
          <div className="acct-label">Active license</div>
          <div className="acct-value">
            <div className="acct-license-code">{licenseLabel}</div>
            <div className="acct-license-type">{licenseType}</div>
            <div className="acct-license-since">since {since}</div>
          </div>
        </div>

        <div className="acct-row">
          <div className="acct-label">Discount coupon</div>
          <div className="acct-value">
            {storedCoupon ? (
              <div className="acct-coupon-active">
                <code>{storedCoupon.code}</code>
                <button className="acct-link" onClick={removeCoupon}>Remove</button>
              </div>
            ) : null}
            <form onSubmit={applyCoupon} className="acct-coupon-form">
              <input
                type="text"
                value={coupon}
                onChange={(e) => { setCoupon(e.target.value); setCouponMsg(''); }}
                placeholder="ENTER-CODE"
                autoComplete="off"
                spellCheck={false}
                style={{ fontFamily: "'Space Mono', monospace", letterSpacing: '0.06em', textTransform: 'uppercase' }}
              />
              <button type="submit" disabled={coupon.trim().length < 3}>Apply</button>
            </form>
            {couponMsg && <div className="acct-msg">{couponMsg}</div>}
          </div>
        </div>

        <div className="acct-actions">
          <button className="acct-btn ghost" onClick={logout}>Sign out</button>
          <button className="acct-btn warn" onClick={terminateSub}>Terminate subscription</button>
          <button className="acct-btn danger" onClick={deleteAccount}>Delete account</button>
        </div>
      </div>
    </div>
  );
}

export function useAccountModal() {
  const [open, setOpen] = useState(false);
  return {
    open,
    openModal: () => setOpen(true),
    closeModal: () => setOpen(false),
  };
}
