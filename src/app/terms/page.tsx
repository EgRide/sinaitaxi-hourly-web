import type { Metadata } from 'next';
import { PolicyShell, type PolicySection } from '@/components/sections/PolicyShell';

export const metadata: Metadata = {
  title: 'Terms of Service · Sinai Taxi Hourly',
  description: 'The rules of the road for Sinai Taxi Hourly customers, partners, and drivers.',
  alternates: { canonical: 'https://hourly.sinaitaxi.com/terms' },
};

const SECTIONS: PolicySection[] = [
  {
    id: 'who-we-are',
    title: '1. Who we are',
    body: (
      <>
        <p>
          Sinai Taxi Hourly (&ldquo;<strong>we</strong>&rdquo;, &ldquo;<strong>us</strong>&rdquo;,
          &ldquo;<strong>Sinai Taxi</strong>&rdquo;) is operated by{' '}
          <strong>Sinai Taxi Ltd</strong>, a company registered in England &amp; Wales
          under company number <strong>14825809</strong>, with its registered office
          at 71-75 Shelton Street, Covent Garden, London WC2H 9JQ, United Kingdom.
        </p>
        <p>
          We run an online marketplace at <strong>hourly.sinaitaxi.com</strong>{' '}
          (the &ldquo;Marketplace&rdquo;) that lets travellers (&ldquo;<strong>Customers</strong>&rdquo;)
          book chauffeured ground transportation by the hour, half-day, full-day,
          or multi-day from third-party transportation providers
          (&ldquo;<strong>Partners</strong>&rdquo;).
        </p>
      </>
    ),
  },
  {
    id: 'acceptance',
    title: '2. Accepting these Terms',
    body: (
      <>
        <p>
          By creating a booking on the Marketplace, you confirm that you have read,
          understood, and agree to be bound by these Terms of Service together with
          our <a href="/privacy" className="text-brand-300 hover:underline">Privacy Policy</a>{' '}
          and <a href="/refunds" className="text-brand-300 hover:underline">Refund and Cancellation Policy</a>.
        </p>
        <p>
          You must be at least 18 years old and able to enter into a legally binding
          contract in your jurisdiction. If you are booking on behalf of an
          organisation, you confirm you have authority to bind that organisation.
        </p>
      </>
    ),
  },
  {
    id: 'role',
    title: '3. Our role as marketplace',
    body: (
      <>
        <p>
          Sinai Taxi is a technology platform. We connect Customers and Partners and
          handle payment, dispatch coordination, and customer support. We do not own
          or operate vehicles, do not employ drivers, and are not the carrier on
          your trip.
        </p>
        <p>
          The transportation contract is between you and the assigned Partner. The
          Partner is solely responsible for performing the trip in accordance with
          all applicable laws, including licensing, insurance, vehicle
          roadworthiness, and driver conduct.
        </p>
      </>
    ),
  },
  {
    id: 'pricing',
    title: '4. Pricing and payment',
    body: (
      <>
        <p>
          The price shown at checkout is the total you pay. It includes the partner&rsquo;s
          wholesale rate, our marketplace commission, and applicable taxes where
          required. Payment is taken at the time of booking via Stripe.
        </p>
        <p>
          Each rental includes a kilometre allowance that scales with the booked
          duration. Distance driven beyond the included allowance is charged
          automatically after the trip at the country&rsquo;s posted overage rate, using
          the payment method on file.
        </p>
      </>
    ),
  },
  {
    id: 'changes',
    title: '5. Changes, cancellations, and no-shows',
    body: (
      <>
        <p>
          Cancellation rules are detailed in the{' '}
          <a href="/refunds" className="text-brand-300 hover:underline">Refund and Cancellation Policy</a>.
          In summary: cancellations more than 24 hours before pickup are fully
          refunded; within 24 hours they are non-refundable. The same rule applies
          if you are more than <strong>60 minutes late</strong> to the pickup point
          (treated as a no-show).
        </p>
        <p>
          A Partner who cancels after payment will be replaced where possible. If no
          replacement is available, the booking is refunded in full.
        </p>
      </>
    ),
  },
  {
    id: 'customer-conduct',
    title: '6. Your obligations',
    body: (
      <>
        <p>You agree to:</p>
        <ul>
          <li>Provide accurate booking details, including a working phone number.</li>
          <li>Treat the driver and vehicle with respect; smoking and illegal substances are prohibited.</li>
          <li>Cover damage you cause to the vehicle beyond fair wear and tear.</li>
          <li>Comply with local laws throughout the trip.</li>
        </ul>
        <p>
          We reserve the right to suspend or terminate your access if you breach
          these obligations or our Acceptable Use rules.
        </p>
      </>
    ),
  },
  {
    id: 'liability',
    title: '7. Limitation of liability',
    body: (
      <>
        <p>
          To the maximum extent permitted by law, Sinai Taxi&rsquo;s aggregate liability
          arising out of or in connection with your booking is limited to the
          amount you paid for that booking. We are not liable for indirect or
          consequential losses, including lost profits, missed connections, or
          delays caused by third parties.
        </p>
        <p>
          Nothing in these Terms limits our liability for death or personal injury
          caused by our negligence, fraud, or any other liability that cannot be
          excluded under applicable law.
        </p>
      </>
    ),
  },
  {
    id: 'governing-law',
    title: '8. Governing law and disputes',
    body: (
      <>
        <p>
          These Terms are governed by the laws of England &amp; Wales. The courts of
          England &amp; Wales have exclusive jurisdiction over any dispute,
          subject to any non-waivable consumer protections in your country of
          residence.
        </p>
      </>
    ),
  },
  {
    id: 'changes-to-terms',
    title: '9. Changes to these Terms',
    body: (
      <>
        <p>
          We may update these Terms from time to time. The current version always
          lives at this URL, with the &ldquo;Last updated&rdquo; date at the top.
          Material changes will be highlighted at checkout for at least 30 days.
        </p>
      </>
    ),
  },
  {
    id: 'contact',
    title: '10. Contact',
    body: (
      <>
        <p>
          Questions about these Terms? Email{' '}
          <a href="mailto:sales@sinaitaxi.com" className="text-brand-300 hover:underline">
            sales@sinaitaxi.com
          </a>{' '}
          or use the WhatsApp button at the bottom of every page.
        </p>
      </>
    ),
  },
];

export default function TermsPage() {
  return (
    <PolicyShell
      eyebrow="Legal"
      title="Terms of Service."
      subtitle="The contract between you, your driver-partner, and Sinai Taxi when you book through this marketplace. Designed to be readable rather than impenetrable."
      lastUpdated="2026-06-28"
      sections={SECTIONS}
      cta={{ label: 'Email support', href: '/support' }}
    />
  );
}
