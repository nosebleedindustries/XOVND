'use client';
import { useState, useEffect, useCallback } from 'react';
import { SiteHeader, SiteFooter, CartDrawer, useCart, useAuth } from '@/components/shared';
import { AccessModal, useAccessModal } from '@/components/AccessModal';
import { AccountModal, useAccountModal } from '@/components/AccountModal';

/* Admin dashboard for the closed-beta phase.
   - Reads leads + redemptions from /api/admin/data (Supabase, service-role,
     auth-gated on session.user.email === ADMIN_EMAIL env var).
   - CSV export of either dataset.
   - Falls back to a clear "not authorized" state if your Google account
     isn't the configured admin email. */

function toCSV(rows, columns) {
  const escape = (v) => {
    const s = String(v ?? '');
    return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
  };
  return [columns.join(',')]
    .concat(rows.map((r) => columns.map((c) => escape(r[c])).join(',')))
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

export default function AdminPage() {
  const { cart, cartOpen, openCart, closeCart, removeAt } = useCart();
  const auth = useAuth();
  const access = useAccessModal();
  const accountModal = useAccountModal();
  const [leads, setLeads] = useState([]);
  const [redemptions, setRedemptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const refresh = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const r = await fetch('/api/admin/data', { cache: 'no-store' });
      if (r.status === 401) {
        setError('Sign in with the admin Google account (the one configured in ADMIN_EMAIL).');
        setLeads([]); setRedemptions([]);
        return;
      }
      if (!r.ok) {
        const j = await r.json().catch(() => ({}));
        throw new Error(j.error || `HTTP ${r.status}`);
      }
      const j = await r.json();
      setLeads(j.leads || []);
      setRedemptions(j.redemptions || []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const exportLeads = () => {
    const stamp = new Date().toISOString().slice(0, 10);
    downloadBlob(
      `xovnd-leads-${stamp}.csv`,
      toCSV(leads, ['name', 'email', 'platform', 'handle', 'signed_at']),
      'text/csv;charset=utf-8'
    );
  };
  const exportRedemptions = () => {
    const stamp = new Date().toISOString().slice(0, 10);
    downloadBlob(
      `xovnd-redemptions-${stamp}.csv`,
      toCSV(redemptions, ['code', 'type', 'user_email', 'user_name', 'redeemed_at']),
      'text/csv;charset=utf-8'
    );
  };

  const buyerCount = redemptions.filter(r => r.type === 'buyer').length;
  const betaCount  = redemptions.filter(r => r.type === 'beta').length;

  const onAccountClick = () => {
    if (auth.user) { accountModal.openModal(); }
    else { access.openModal('code'); }
  };

  return (
    <>
      <SiteHeader cartCount={cart.length} onOpenCart={openCart} current="" user={auth.user} onAccountClick={onAccountClick} />
      <main style={{ padding: '48px 28px 96px', maxWidth: 1180, margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
          <div>
            <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 11, letterSpacing: '0.18em', color: 'var(--yellow)', marginBottom: 6 }}>
              [ ADMIN · CLOSED BETA ]
            </div>
            <h1 style={{ fontFamily: "'Archivo Black', sans-serif", fontSize: 36, lineHeight: 1, margin: 0 }}>
              Operations
            </h1>
          </div>
          <button
            onClick={refresh}
            disabled={loading}
            style={{ padding: '10px 16px', borderRadius: 999, background: 'transparent', color: '#d7d3c5', border: '1px solid #2a2722', cursor: 'pointer', fontFamily: 'inherit', fontSize: 13 }}
          >{loading ? 'Loading…' : 'Refresh'}</button>
        </div>

        {error && (
          <div style={{ padding: 16, marginBottom: 24, background: 'rgba(212,168,174,0.10)', border: '1px solid rgba(212,168,174,0.35)', borderRadius: 10, color: 'var(--pink)' }}>
            {error}
          </div>
        )}

        <div style={{ display: 'flex', gap: 12, marginBottom: 28, flexWrap: 'wrap' }}>
          <Stat label="Access requests"  value={leads.length}        color="var(--white)"  />
          <Stat label="Beta redeemed"    value={betaCount}            color="var(--yellow)" />
          <Stat label="Buyer redeemed"   value={buyerCount}           color="var(--pink)"   />
        </div>

        <Section
          title={`Access requests · ${leads.length}`}
          empty="No access requests yet. Share xovnd.com with influencers and the 'Request access' tab will start filling this up."
          rows={leads}
          columns={[
            { key: 'name', label: 'Name' },
            { key: 'email', label: 'Email', cell: (v) => <a href={`mailto:${v}`} style={{ color: 'var(--yellow)' }}>{v}</a> },
            { key: 'platform', label: 'Platform' },
            { key: 'handle', label: 'Handle / URL', cell: (v) => <span style={{ color: '#b4b0a3', wordBreak: 'break-all' }}>{v}</span> },
            { key: 'signed_at', label: 'When', cell: (v) => <span style={{ color: '#807a6c', fontFamily: "'Space Mono', monospace", fontSize: 11 }}>{new Date(v).toLocaleString()}</span> },
          ]}
          exportLabel="Export leads CSV ↓"
          onExport={exportLeads}
        />

        <div style={{ height: 32 }} />

        <Section
          title={`Code redemptions · ${redemptions.length}`}
          empty="Nobody has redeemed a code yet."
          rows={redemptions}
          columns={[
            { key: 'code', label: 'Code', cell: (v) => <code style={{ color: 'var(--yellow)', fontFamily: "'Space Mono', monospace", fontSize: 12 }}>{v}</code> },
            { key: 'type', label: 'Type', cell: (v) => <span style={{ color: v === 'buyer' ? 'var(--pink)' : 'var(--yellow)' }}>{v}</span> },
            { key: 'user_email', label: 'Email', cell: (v) => v ? <a href={`mailto:${v}`} style={{ color: 'var(--white)' }}>{v}</a> : <span style={{ color: '#6a6557' }}>—</span> },
            { key: 'redeemed_at', label: 'When', cell: (v) => <span style={{ color: '#807a6c', fontFamily: "'Space Mono', monospace", fontSize: 11 }}>{new Date(v).toLocaleString()}</span> },
          ]}
          exportLabel="Export redemptions CSV ↓"
          onExport={exportRedemptions}
        />
      </main>
      <SiteFooter />
      <CartDrawer open={cartOpen} onClose={closeCart} items={cart} onRemove={removeAt} />
      <AccessModal open={access.open} initialTab={access.initialTab} onClose={access.closeModal} />
      <AccountModal open={accountModal.open} onClose={accountModal.closeModal} user={auth.user} onLogout={auth.logout} />
    </>
  );
}

function Stat({ label, value, color }) {
  return (
    <div style={{ flex: '1 1 200px', padding: 16, border: '1px solid #2a2722', borderRadius: 10, background: '#0d0c0a' }}>
      <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 10, letterSpacing: '0.14em', color: '#807a6c', textTransform: 'uppercase' }}>{label}</div>
      <div style={{ fontFamily: "'Archivo Black', sans-serif", fontSize: 28, color, marginTop: 4 }}>{value}</div>
    </div>
  );
}

function Section({ title, empty, rows, columns, exportLabel, onExport }) {
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 10 }}>
        <h2 style={{ fontFamily: "'Archivo Black', sans-serif", fontSize: 18, margin: 0, color: 'var(--white)' }}>{title}</h2>
        <button
          onClick={onExport}
          disabled={rows.length === 0}
          style={{ padding: '8px 14px', borderRadius: 999, background: 'var(--yellow)', color: '#000', border: 'none', cursor: rows.length ? 'pointer' : 'not-allowed', fontWeight: 700, fontSize: 12, opacity: rows.length ? 1 : 0.4 }}
        >{exportLabel}</button>
      </div>
      {rows.length === 0 ? (
        <div style={{ padding: 32, textAlign: 'center', border: '1px dashed #2a2722', borderRadius: 10, color: '#6a6557', fontSize: 13 }}>
          {empty}
        </div>
      ) : (
        <div style={{ overflowX: 'auto', border: '1px solid #2a2722', borderRadius: 10 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: '#15130f', textAlign: 'left' }}>
                {columns.map((c) =>
                  <th key={c.key} style={{ padding: '12px 14px', color: '#807a6c', fontFamily: "'Space Mono', monospace", fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase' }}>{c.label}</th>
                )}
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} style={{ borderTop: '1px solid #2a2722' }}>
                  {columns.map((c) => (
                    <td key={c.key} style={{ padding: '12px 14px', color: 'var(--white)' }}>
                      {c.cell ? c.cell(r[c.key]) : r[c.key]}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
