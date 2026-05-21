'use client';
import { useState, useEffect } from 'react';

/* Beta-distribution funnel for influencers / pre-sale outreach.
   Captures name + email + social into localStorage under
   `xovnd_influencers` (objects: {name, email, platform, handle, signedAt}),
   then triggers a direct download of the bundled installer.
   The /admin page can export this list as CSV. */

const INFL_KEY = 'xovnd_influencers';
const INSTALLER_URL = '/assets/CLVSTER-1.0.0-Win.exe';
const PLATFORMS = ['Instagram', 'YouTube', 'TikTok', 'X / Twitter', 'Twitch', 'Other'];

function readList() {
  if (typeof window === 'undefined') return [];
  try { return JSON.parse(localStorage.getItem(INFL_KEY) || '[]'); }
  catch { return []; }
}
function writeList(list) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(INFL_KEY, JSON.stringify(list));
}

export function InfluencerModal({ open, onClose }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [platform, setPlatform] = useState(PLATFORMS[0]);
  const [handle, setHandle] = useState('');
  const [stage, setStage] = useState('form'); // form | done

  useEffect(() => {
    if (open) { setStage('form'); }
  }, [open]);

  const canSubmit = name.trim().length > 1 && email.includes('@') && handle.trim().length > 0;

  const submit = (e) => {
    e.preventDefault();
    if (!canSubmit) return;
    const list = readList();
    list.push({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      platform,
      handle: handle.trim(),
      signedAt: new Date().toISOString(),
    });
    writeList(list);
    // Trigger the installer download immediately
    const a = document.createElement('a');
    a.href = INSTALLER_URL;
    a.download = 'CLVSTER-1.0.0-Win.exe';
    document.body.appendChild(a);
    a.click();
    a.remove();
    setStage('done');
  };

  if (!open) return null;
  return (
    <div className="infl-overlay" onClick={onClose}>
      <div className="infl-modal" onClick={(e) => e.stopPropagation()}>
        <button className="infl-close" onClick={onClose} aria-label="Close">✕</button>
        {stage === 'form' ? (
          <>
            <div className="infl-eyebrow">[ INFLUENCER BETA · CLVSTER 1.0.0 ]</div>
            <h2>Get the <span className="infl-accent">private beta</span></h2>
            <p className="infl-lead">
              We&rsquo;re sending the build to a small group of producers and
              creators ahead of launch. Drop your details and grab the Windows
              installer below. macOS lands in the next round.
            </p>
            <form onSubmit={submit} className="infl-form">
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
              <button type="submit" className="infl-submit" disabled={!canSubmit}>
                <span>Download the beta</span>
                <span>↓</span>
              </button>
              <p className="infl-fineprint">
                We&rsquo;ll only email you about CLVSTER and the public launch.
                No spam, no list reselling.
              </p>
            </form>
          </>
        ) : (
          <>
            <div className="infl-eyebrow">[ DOWNLOAD STARTED ]</div>
            <h2>Thanks, <span className="infl-accent">{name.split(' ')[0]}</span> — you&rsquo;re in.</h2>
            <p className="infl-lead">
              Your download should be starting now. Install it like any other VST3:
              the file goes to your VST folder, restart your DAW, scan, done.
            </p>
            <ul className="infl-checklist">
              <li>Trial activates automatically — 14 days, no card needed</li>
              <li>Tag <b>@xovnd.audio</b> if you post anything cool with it</li>
              <li>Reply to our welcome email with bugs / wishes / wins</li>
            </ul>
            <a className="infl-submit" href={INSTALLER_URL} download>
              <span>Re-download installer</span>
              <span>↓</span>
            </a>
          </>
        )}
      </div>
    </div>
  );
}

export function useInfluencerModal() {
  const [open, setOpen] = useState(false);
  return {
    open,
    openModal: () => setOpen(true),
    closeModal: () => setOpen(false),
  };
}
