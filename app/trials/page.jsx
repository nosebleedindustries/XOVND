'use client';
import { useState } from 'react';
import { SiteHeader, SiteFooter, CartDrawer, useCart, useAuth } from '@/components/shared';
import { AccessModal, useAccessModal } from '@/components/AccessModal';
import { AccountModal, useAccountModal } from '@/components/AccountModal';

const WinLogo = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M3 5.5L10.5 4.45V11.4H3V5.5z" />
    <path d="M11.5 4.3L21 3v8.4H11.5V4.3z" />
    <path d="M3 12.6h7.5v6.95L3 18.5V12.6z" />
    <path d="M11.5 12.6H21V21l-9.5-1.3v-7.1z" />
  </svg>
);

const TRIALS = [
  {
    id: 'clvster-demo',
    name: 'CLVSTER',
    edition: 'Demo',
    tag: 'Demo · 14 days',
    tagClass: '',
    lede: 'The full multi-algorithmic sequencer — every Cluster, every Algo Modifier, every voice — unlocked for two weeks. Silences every 90s after day 14.',
    specs: [
      { k: 'Formats', v: 'VST3 · AU · AAX' },
      { k: 'Size',    v: '184 MB' },
      { k: 'Build',   v: '1.0.2' },
    ],
    cta: 'Download CLVSTER Demo',
    meta: 'Windows 10/11 · 64-bit · No account required',
  },
  {
    id: 'kantian-free',
    name: 'KANTIAN',
    edition: 'Free (M4L)',
    tag: 'Free forever',
    tagClass: 'free',
    lede: 'Our Max for Live transcendental sequencer — free and unrestricted. Just drop it into an Ableton MIDI track and go.',
    specs: [
      { k: 'Format', v: 'Max for Live' },
      { k: 'Size',   v: '12 MB' },
      { k: 'Req.',   v: 'Live 11 · Max 8.5+' },
    ],
    cta: 'Download KANTIAN',
    meta: 'Windows 10/11 · 64-bit · Ableton Suite required',
  },
];

function Pillow({ p }) {
  return (
    <article className="pillow">
      <span className={'tag ' + p.tagClass}>{p.tag}</span>
      <h2>{p.name}<span className="sub">{p.edition}</span></h2>
      <p className="lede">{p.lede}</p>
      <div className="specs">
        {p.specs.map((s, i) => (
          <span key={i}>{s.k} <b>{s.v}</b></span>
        ))}
      </div>
      <div className="dl-row">
        <button className="dl-btn" onClick={() => alert('Download for ' + p.name + ' (' + p.edition + ') starting…')}>
          <span>{p.cta}</span>
          <span className="arrow">↓</span>
        </button>
        <button className="os" title="Windows installer" aria-label="Windows installer">
          <WinLogo />
        </button>
      </div>
      <div className="meta">{p.meta}</div>
    </article>
  );
}

export default function TrialsPage() {
  const { cart, cartOpen, openCart, closeCart, removeAt, toast } = useCart();
  const auth = useAuth();
  const access = useAccessModal();
  const accountModal = useAccountModal();

  const onAccountClick = () => {
    if (auth.user) {
      accountModal.openModal();
    } else {
      access.openModal('code');
    }
  };

  return (
    <>
      <SiteHeader cartCount={cart.length} onOpenCart={openCart}
        current="trials" user={auth.user} onAccountClick={onAccountClick} />
      <div className="sub-shell">
        <div className="tr-head">
          <div className="eyebrow">[ Trials · 02 ]</div>
          <h1>Try before<br/>you <span className="stamp">commit.</span></h1>
          <p>Free downloads of the instruments we want you to actually live with. No emails, no credit cards — just unzip and load.</p>
        </div>

        <div className="tr-grid">
          {TRIALS.map((p) => <Pillow key={p.id} p={p} />)}
        </div>

        <div className="tr-note">
          <span className="dot"></span>
          <span className="msg"><b>macOS builds</b> · coming with v1.1 — sign up to the newsletter for a heads-up.</span>
          <span className="right">XOVND · 2026.05.19</span>
        </div>
      </div>

      <SiteFooter />
      <CartDrawer open={cartOpen} onClose={closeCart} items={cart} onRemove={removeAt} />
      <AccessModal open={access.open} initialTab={access.initialTab} onClose={access.closeModal} />
      <AccountModal open={accountModal.open} onClose={accountModal.closeModal} user={auth.user} onLogout={auth.logout} />
      <div className={'toast' + (toast ? ' show' : '')}>{toast}</div>
    </>
  );
}
