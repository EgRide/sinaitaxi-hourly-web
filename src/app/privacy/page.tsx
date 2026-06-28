import type { Metadata } from 'next';
import { PolicyShell, type PolicySection } from '@/components/sections/PolicyShell';

export const metadata: Metadata = {
  title: 'Privacy Policy · Sinai Taxi Hourly',
  description: 'How Sinai Taxi collects, uses, and protects your data when you book chauffeur transportation.',
  alternates: { canonical: 'https://hourly.sinaitaxi.com/privacy' },
};

const SECTIONS: PolicySection[] = [
  {
    id: 'controller',
    title: '1. Who is the data controller',
    body: (
      <>
        <p>
          The data controller is <strong>Sinai Taxi Ltd</strong>, registered in
          England &amp; Wales (company number 14825809), 71-75 Shelton Street,
          Covent Garden, London WC2H 9JQ, United Kingdom.
        </p>
        <p>
          Privacy questions and data-subject requests can be sent to{' '}
          <a href="mailto:privacy@sinaitaxi.com" className="text-brand-600 hover:underline">
            privacy@sinaitaxi.com
          </a>.
        </p>
      </>
    ),
  },
  {
    id: 'what-we-collect',
    title: '2. What we collect',
    body: (
      <>
        <p>To run the marketplace we collect:</p>
        <ul>
          <li>Identity and contact: name, email, phone, and (optionally) WhatsApp number.</li>
          <li>Trip details: pickup address, pickup time, requested duration, comments and hotel-room number if you provide one.</li>
          <li>Payment details: tokenised card information held by our payment processor (Stripe). We never see your full card number.</li>
          <li>Account activity: bookings, support messages, and device-side analytics needed to operate the service.</li>
        </ul>
      </>
    ),
  },
  {
    id: 'why-we-collect',
    title: '3. Why we use it',
    body: (
      <>
        <p>
          We use your data to: process bookings; share the minimum necessary
          details with the assigned Partner so they can perform the trip; charge
          the original booking and any post-trip overage; send transactional
          notifications; and provide customer support.
        </p>
        <p>
          The legal bases are <strong>contract</strong> (to perform the booking),
          <strong>legitimate interests</strong> (operating and protecting the
          marketplace), and <strong>consent</strong> for any optional
          communications you opt in to.
        </p>
      </>
    ),
  },
  {
    id: 'sharing',
    title: '4. Who we share with',
    body: (
      <>
        <p>We share your data with:</p>
        <ul>
          <li><strong>Partners</strong> — your name, phone/WhatsApp, pickup details, comments, and hotel-room number so they can complete the trip.</li>
          <li><strong>Stripe</strong> — for payment processing under their own privacy notice.</li>
          <li><strong>ZeptoMail</strong> — for transactional email delivery.</li>
          <li><strong>Government authorities</strong> — only where we are legally required to.</li>
        </ul>
        <p>We do not sell your personal data, ever.</p>
      </>
    ),
  },
  {
    id: 'retention',
    title: '5. How long we keep it',
    body: (
      <>
        <p>
          Booking records are retained for <strong>7 years</strong> for tax,
          accounting and dispute-resolution purposes. Marketing data is retained
          until you withdraw consent. You can request deletion at any time and
          we will action it where we are not legally required to retain.
        </p>
      </>
    ),
  },
  {
    id: 'your-rights',
    title: '6. Your rights',
    body: (
      <>
        <p>Subject to local law, you have the right to:</p>
        <ul>
          <li>Access the personal data we hold about you.</li>
          <li>Correct inaccurate or incomplete data.</li>
          <li>Erase data we no longer need to hold.</li>
          <li>Restrict or object to certain processing.</li>
          <li>Receive a portable copy of your data.</li>
          <li>Lodge a complaint with a supervisory authority — in the UK, the ICO.</li>
        </ul>
      </>
    ),
  },
  {
    id: 'international',
    title: '7. International transfers',
    body: (
      <>
        <p>
          Our infrastructure is hosted in the European Union (Railway / Vercel
          regions). When data is transferred outside the UK/EEA (for example to
          Stripe or ZeptoMail in the United States), we rely on Standard
          Contractual Clauses or equivalent safeguards.
        </p>
      </>
    ),
  },
  {
    id: 'cookies',
    title: '8. Cookies',
    body: (
      <>
        <p>
          We use first-party cookies that are strictly necessary to keep you
          logged in and to remember your search. We do not use third-party
          tracking or advertising cookies.
        </p>
      </>
    ),
  },
  {
    id: 'updates',
    title: '9. Updates',
    body: (
      <>
        <p>
          We may update this policy from time to time. Material changes will be
          notified in-app or by email at least 30 days before they take effect.
        </p>
      </>
    ),
  },
];

export default function PrivacyPage() {
  return (
    <PolicyShell
      eyebrow="Legal"
      title="Privacy Policy."
      subtitle="Plain-English breakdown of what we collect, why, and what you can do about it. We collect the minimum we need to dispatch your driver and bill the trip, nothing more."
      lastUpdated="2026-06-28"
      sections={SECTIONS}
      cta={{ label: 'Email support', href: '/support' }}
    />
  );
}
