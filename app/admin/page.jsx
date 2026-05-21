'use client';
import { useState, useEffect, useCallback } from 'react';
import { SiteHeader, SiteFooter, CartDrawer, useCart, useAuth } from '@/components/shared';

/* Minimal admin dashboard for the closed-beta phase.
   - Top table: access requests (people who used the "Request access"
     form in <AccessModal /> but don't yet have a code).
   - Bottom strip: code redemption counter so we can see beta uptake.
   Phase 2B.9 replaces all of this with a Supabase-backed admin. */

const INFL_KEY = 'xovnd_influencers';
const REDEEMED_KEY = 'xovnd_redeemed';

function readList() {
  if (typeof window === 'undefined') return [];
  try { return JSON.parse(localStorage.getItem(INFL_KEY) || '[]'); }
  catch { return []; }
}
function writeList(list) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(INFL_KEY, JSON.stringify(list));
}

function toCSV(rows) {
  if (rows.length === 0) return 'name,email,platform,handle,signedAt\n';
  const headers = ['name', 'email', 'platform', 'handle', 'signedAt'];
  const escape = (v) => {
    const s = String(v ?? '');
    return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
  };
  return [headers.join(',')]
    .concat(rows.map((r) => headers.map((h) => escape(r[h])).join(',')))
    .join('\n');
}

function downloadBlob(name, content, type) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = name;
  document.body.appendChild(a); a.click();
  setTimeout(() => { URL.revokeObjectURL(url); a.remove(); }, 100);
}

function readRedeemed() {
  if (typeof window === 'undefined') return [];
  try { return JSON.parse(localStorage.getItem(REDEEMED_KEY) || '[]'); }
  catch { return []; }
}

export default function AdminPage() {
  const { cart, cartOpen, openCart, closeCart, removeAt } = useCart();
  const auth = useAuth();
  const [rows, setRows] = useState([]);
  const [redeemed, setRedeemed] = useState([]);

  const refresh = useCallback(() => {
    setRows(readList());
    setRedeemed(readRedeemed());
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const buyerCount = redeemed.filter(r => r.type === 'buyer').length;
  const betaCount  = redeemed.filter(r => r.type === 'beta').length;

  const onExport = () => {
    const stamp = new Date().toISOString().slice(0, 10);
    downloadBlob(`xovnd-influencers-${stamp}.csv`, toCSV(rows), 'text/csv;charset=utf-8');
  };
  const onClear = () => {
    if (rows.length === 0) return;
    if (!confirm(`Delete all ${rows.length} captured leads? This cannot be undone.`)) return;
    writeList([]);
    refresh();
  };
  const onDeleteRow = (idx) => {
    const next = rows.slice();
    next.splice(idx, 1);
    writeList(next);
    setRows(next);
  };

  return (
    <>
      <SiteHeader cartCount={cart.length} onOpenCart={openCart} current="" user={auth.user} />
      <main style={{ padding: '48px 28px 96px', maxWidth: 1100, margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 24 }}>
          <div>
            <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 11, letterSpacing: '0.18em', color: 'var(--yellow)', marginBottom: 6 }}>
              [ ADMIN · INFLUENCER BETA ]
            </div>
            <h1 style={{ fontFamily: "'Archivo Black', sans-serif", fontSize: 36, lineHeight: 1, margin: 0 }}>
              Captured leads <span style={{ color: 'var(--yellow)' }}>· {rows.length}</span>
            </h1>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={refresh}
              style={{ padding: '10px 16px', borderRadius: 999, background: 'transparent', color: '#d7d3c5', border: '1px solid #2a2722', cursor: 'pointer', fontFamily: 'inherit', fontSize: 13 }}
            >Refresh</button>
            <button
              onClick={onExport}
              disabled={rows.length === 0}
              style={{ padding: '10px 16px', borderRadius: 999, background: 'var(--yellow)', color: '#000', border: 'none', cursor: rows.length ? 'pointer' : 'not-allowed', fontWeight: 700, fontSize: 13, opacity: rows.length ? 1 : 0.4 }}
            >Export CSV ↓</button>
            <button
              onClick={onClear}
              disabled={rows.length === 0}
              style={{ padding: '10px 16px', borderRadius: 999, background: 'transparent', color: '#D4A8AE', border: '1px solid #2a2722', cursor: rows.length ? 'pointer' : 'not-allowed', fontFamily: 'inherit', fontSize: 13, opacity: rows.length ? 1 : 0.4 }}
            >Clear all</button>
          </div>
        </div>

        <p style={{ color: '#807a6c', fontSize: 13, margin: '0 0 20px' }}>
          Captured locally in <code style={{ background: '#15130f', padding: '2px 6px', borderRadius: 4 }}>localStorage[&quot;{INFL_KEY}&quot;]</code> —
          per-browser only. Export to CSV to move them into Mailchimp / a
          spreadsheet / your CRM. Supabase migration in Phase 2B.9 will
          centralise this server-side.
        </p>

        <div style={{ display: 'flex', gap: 12, marginBottom: 28 }}>
          <div style={{ flex: 1, padding: 16, border: '1px solid #2a2722', borderRadius: 10, background: '#0d0c0a' }}>
            <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 10, letterSpacing: '0.14em', color: '#807a6c', textTransform: 'uppercase' }}>Beta codes redeemed</div>
            <div style={{ fontFamily: "'Archivo Black', sans-serif", fontSize: 28, color: 'var(--yellow)', marginTop: 4 }}>{betaCount}</div>
          </div>
          <div style={{ flex: 1, padding: 16, border: '1px solid #2a2722', borderRadius: 10, background: '#0d0c0a' }}>
            <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 10, letterSpacing: '0.14em', color: '#807a6c', textTransform: 'uppercase' }}>Buyer codes redeemed</div>
            <div style={{ fontFamily: "'Archivo Black', sans-serif", fontSize: 28, color: 'var(--pink)', marginTop: 4 }}>{buyerCount}</div>
          </div>
          <div style={{ flex: 1, padding: 16, border: '1px solid #2a2722', borderRadius: 10, background: '#0d0c0a' }}>
            <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 10, letterSpacing: '0.14em', color: '#807a6c', textTransform: 'uppercase' }}>Access requests</div>
            <div style={{ fontFamily: "'Archivo Black', sans-serif", fontSize: 28, color: 'var(--white)', marginTop: 4 }}>{rows.length}</div>
          </div>
        </div>

        {rows.length === 0 ? (
          <div style={{ padding: 48, textAlign: 'center', border: '1px dashed #2a2722', borderRadius: 12, color: '#6a6557' }}>
            No leads yet. Share a link to the homepage and have an
            influencer click <b>Get the influencer beta</b>.
          </div>
        ) : (
          <div style={{ overflowX: 'auto', border: '1px solid #2a2722', borderRadius: 12 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ background: '#15130f', textAlign: 'left' }}>
                  {['Name', 'Email', 'Platform', 'Handle / URL', 'Signed at', ''].map((h, i) =>
                    <th key={i} style={{ padding: '12px 14px', color: '#807a6c', fontFamily: "'Space Mono', monospace", fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase' }}>{h}</th>
                  )}
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => (
                  <tr key={i} style={{ borderTop: '1px solid #2a2722' }}>
                    <td style={{ padding: '12px 14px', color: 'var(--white)' }}>{r.name}</td>
                    <td style={{ padding: '12px 14px' }}><a href={`mailto:${r.email}`} style={{ color: 'var(--yellow)' }}>{r.email}</a></td>
                    <td style={{ padding: '12px 14px' }}>{r.platform}</td>
                    <td style={{ padding: '12px 14px', color: '#b4b0a3', wordBreak: 'break-all' }}>{r.handle}</td>
                    <td style={{ padding: '12px 14px', color: '#807a6c', fontFamily: "'Space Mono', monospace", fontSize: 11 }}>{new Date(r.signedAt).toLocaleString()}</td>
                    <td style={{ padding: '12px 14px', textAlign: 'right' }}>
                      <button onClick={() => onDeleteRow(i)} style={{ background: 'transparent', border: 'none', color: '#6a6557', cursor: 'pointer', fontSize: 14 }} title="Delete row">✕</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
      <SiteFooter />
      <CartDrawer open={cartOpen} onClose={closeCart} items={cart} onRemove={removeAt} />
    </>
  );
}
