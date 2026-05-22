'use client';
import { SiteHeader, SiteFooter, CartDrawer, useCart, useAuth } from '@/components/shared';
import { AccessModal, useAccessModal } from '@/components/AccessModal';
import { AccountModal, useAccountModal } from '@/components/AccountModal';

/* GDPR-aligned privacy policy for the closed-beta phase. Plain language,
   no dark patterns. Update the "last reviewed" line whenever processors
   or retention windows change. */

export default function PrivacyPage() {
  const { cart, cartOpen, openCart, closeCart, removeAt } = useCart();
  const auth = useAuth();
  const access = useAccessModal();
  const accountModal = useAccountModal();

  const onAccountClick = () => {
    if (auth.user) { accountModal.openModal(); }
    else { access.openModal('code'); }
  };

  return (
    <>
      <SiteHeader cartCount={cart.length} onOpenCart={openCart} current="" user={auth.user} onAccountClick={onAccountClick} />
      <main className="legal-shell">
        <div className="legal-eyebrow">[ LEGAL · PRIVACY ]</div>
        <h1>Privacy &amp; data protection</h1>
        <p className="legal-meta">Last reviewed: 22 May 2026 · Controller: Joan Raventós (XOVND), Spain · Contact: <a href="mailto:joan@xovnd.com">joan@xovnd.com</a></p>

        <h2>What this is</h2>
        <p>
          XOVND is run by Joan Raventós, a sole-trader audio-software studio
          based in Spain. This page explains what personal data we collect
          when you visit <b>xovnd.com</b> or use the CLVSTER plugin, why we
          collect it, how long we keep it, and how you ask us to delete it.
        </p>
        <p>
          This policy is written to comply with the EU General Data
          Protection Regulation (GDPR) and Spain&rsquo;s LOPDGDD. If anything
          here is unclear, email <a href="mailto:joan@xovnd.com">joan@xovnd.com</a> and we&rsquo;ll
          explain in plain language.
        </p>

        <h2>What we collect</h2>
        <ul>
          <li>
            <b>When you fill the &ldquo;Request access&rdquo; form</b> on the
            site: your <b>name</b>, <b>email</b>, <b>preferred social
            platform</b> and your <b>public handle / URL</b>. We use it to
            send you a beta code and the occasional update.
          </li>
          <li>
            <b>When you redeem a code</b>: the <b>code</b>, the redemption
            <b>timestamp</b> and your browser&rsquo;s <b>user-agent string</b>.
            We use it to spot abuse (codes shared widely) and to count
            uptake.
          </li>
          <li>
            <b>When you sign in with Google</b>: your <b>email</b>,
            <b>name</b> and <b>profile picture URL</b>, supplied by Google
            via OAuth. We never see your Google password.
          </li>
          <li>
            <b>When you buy CLVSTER</b>: your <b>billing details</b>
            (name, country, optionally tax/VAT ID) and <b>payment
            instrument</b> are collected by our payment processor Moonbase
            (see <i>Processors</i> below). We receive the resulting
            <b>order id</b>, <b>amount</b>, and <b>license key</b> we issue
            you.
          </li>
        </ul>

        <h2>What we do not collect</h2>
        <ul>
          <li>We do not run third-party advertising or fingerprinting trackers.</li>
          <li>We do not sell, rent or trade your contact details to anyone.</li>
          <li>The CLVSTER plugin itself does not phone home with telemetry — it only contacts Moonbase to verify your license, on launch and at activation time.</li>
        </ul>

        <h2>Legal basis</h2>
        <p>We process the data above on the following GDPR Art. 6 grounds:</p>
        <ul>
          <li><b>Consent (Art. 6(1)(a))</b> — for the lead-capture form, the cookie banner choice, and the optional newsletter when we ship it.</li>
          <li><b>Contract (Art. 6(1)(b))</b> — for delivering the plugin, license keys and support to people who buy it.</li>
          <li><b>Legitimate interest (Art. 6(1)(f))</b> — for logging code redemptions so we can detect abuse, and for short-lived server logs for security and debugging.</li>
          <li><b>Legal obligation (Art. 6(1)(c))</b> — for retaining invoices and accounting records as required by Spanish tax law.</li>
        </ul>

        <h2>Processors (third-parties who store data on our behalf)</h2>
        <ul>
          <li><b>Vercel Inc.</b> (USA, with EU edge) — site hosting, request logs (~30 days).</li>
          <li><b>Supabase Inc.</b> (eu-central-1 / Germany) — database for leads and redemptions.</li>
          <li><b>Google LLC</b> — Sign-in with Google (only if you choose to use it).</li>
          <li><b>Moonbase</b> — payments, license issuing, customer dashboard for buyers. Moonbase acts as Merchant of Record and as such is the data controller for payment-card data; we never see your card number.</li>
        </ul>
        <p>
          All these processors are GDPR-aligned and we use Standard
          Contractual Clauses where data leaves the EEA.
        </p>

        <h2>How long we keep your data</h2>
        <ul>
          <li><b>Lead form submissions:</b> 24 months after submission, then deleted unless you become a customer.</li>
          <li><b>Code redemptions:</b> 24 months after redemption.</li>
          <li><b>Customer + invoice records:</b> 6 years after the last purchase (Spanish accounting law minimum), then anonymised or deleted.</li>
          <li><b>Server logs (Vercel):</b> ~30 days, then rotated.</li>
        </ul>

        <h2>Your rights under GDPR</h2>
        <p>You can ask us, free of charge, to:</p>
        <ul>
          <li><b>Access</b> the personal data we hold about you (Art. 15)</li>
          <li><b>Correct</b> it if it&rsquo;s wrong (Art. 16)</li>
          <li><b>Delete</b> it (Art. 17, the &ldquo;right to be forgotten&rdquo;)</li>
          <li><b>Restrict</b> or <b>object</b> to processing (Art. 18, 21)</li>
          <li><b>Receive</b> a portable copy (Art. 20)</li>
          <li><b>Withdraw consent</b> at any time without affecting prior processing</li>
        </ul>
        <p>
          Email <a href="mailto:joan@xovnd.com">joan@xovnd.com</a> with
          your request. We&rsquo;ll respond within 30 days (usually much
          sooner). You can also delete your local account state any time
          from the <b>Account</b> popup → <b>Delete account</b>.
        </p>
        <p>
          You always have the right to file a complaint with the Spanish
          data protection authority (Agencia Española de Protección de
          Datos, <a href="https://www.aepd.es" target="_blank" rel="noopener noreferrer">aepd.es</a>).
        </p>

        <h2>Cookies &amp; local storage</h2>
        <p>The site only uses storage that is strictly necessary or that you explicitly accept:</p>
        <ul>
          <li><b>Essential cookies</b> — Sign-in session (NextAuth), CSRF token. Always on; the site won&rsquo;t work without them.</li>
          <li><b>Preferences (localStorage)</b> — your redeemed license, your applied coupon. Only written after you click <b>Accept</b> on the cookie banner.</li>
          <li><b>Analytics</b> — none today. If we add Vercel Analytics later, it will be IP-anonymised and listed here first.</li>
        </ul>

        <h2>Children</h2>
        <p>
          XOVND is not directed at children under 16. If you believe a
          child has signed up, contact us and we&rsquo;ll delete the record.
        </p>

        <h2>Changes to this policy</h2>
        <p>
          We update this page when our processors, retention windows or
          legal basis change. The <i>Last reviewed</i> date at the top
          tells you when. Material changes will also be announced in the
          marquee at the top of the home page and (where we have your
          email) by email.
        </p>

        <h2>Contact</h2>
        <p>
          Joan Raventós — <a href="mailto:joan@xovnd.com">joan@xovnd.com</a>
        </p>
      </main>
      <SiteFooter />
      <CartDrawer open={cartOpen} onClose={closeCart} items={cart} onRemove={removeAt} />
      <AccessModal open={access.open} initialTab={access.initialTab} onClose={access.closeModal} />
      <AccountModal open={accountModal.open} onClose={accountModal.closeModal} user={auth.user} onLogout={auth.logout} />
    </>
  );
}
