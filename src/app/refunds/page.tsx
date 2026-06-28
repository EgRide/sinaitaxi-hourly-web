import type { Metadata } from 'next';
import { PolicyShell, type PolicySection } from '@/components/sections/PolicyShell';

export const metadata: Metadata = {
  title: 'Refund and Cancellation Policy · Sinai Taxi Hourly',
  description: 'When you can cancel a booking, what happens to your money, and how no-shows and partner cancellations are handled.',
  alternates: { canonical: 'https://hourly.sinaitaxi.com/refunds' },
};

const SECTIONS: PolicySection[] = [
  {
    id: 'overview',
    title: 'The short version',
    body: (
      <>
        <p>
          More than <strong>24 hours</strong> before pickup: cancel for any reason,
          full refund. Within 24 hours of pickup, or any time after the trip has
          started: no refund.
        </p>
        <p>
          Same rule applies to no-shows (more than 60 minutes late) and to
          customer cancellations after the partner has dispatched a driver.
        </p>
      </>
    ),
  },
  {
    id: 'customer-cancellations',
    title: 'Customer cancellations',
    body: (
      <>
        <ul>
          <li>
            <strong>More than 24 hours before pickup.</strong> Cancel from{' '}
            <a href="/account" className="text-brand-600 hover:underline">My Rentals</a>{' '}
            for a full refund to the original payment method. Refunds reach your
            card within 5-10 business days.
          </li>
          <li>
            <strong>Within 24 hours of pickup, or trip in progress.</strong> The
            booking is non-refundable. You may still cancel for record-keeping
            purposes but no money is returned.
          </li>
        </ul>
      </>
    ),
  },
  {
    id: 'no-shows',
    title: 'No-shows',
    body: (
      <>
        <p>
          A no-show is when the customer is more than <strong>60 minutes</strong>{' '}
          late to the pickup point and unreachable on the phone/WhatsApp number
          provided at checkout. After 60 minutes the partner may release the
          driver and the booking is treated as completed for billing purposes.
        </p>
        <p>
          If you are delayed for a reason within our control (e.g. dispatch
          error), this rule does not apply &mdash; contact us and we will sort it.
        </p>
      </>
    ),
  },
  {
    id: 'partner-cancellations',
    title: 'Partner cancellations',
    body: (
      <>
        <p>
          Partners commit to a margin buffer when they publish prices, so
          cancellations from their side are rare. If a partner does cancel after
          payment:
        </p>
        <ul>
          <li>We attempt to re-dispatch with another partner in the same area, transparently to you.</li>
          <li>If no re-dispatch is possible we refund the booking in full immediately.</li>
          <li>You can also choose to cancel and request a full refund regardless.</li>
        </ul>
      </>
    ),
  },
  {
    id: 'overage',
    title: 'Distance overage and damage',
    body: (
      <>
        <p>
          Each rental includes a kilometre allowance that scales with the booked
          duration. Distance driven beyond the allowance is charged automatically
          after the trip at the country&rsquo;s posted overage rate. We notify you by
          email when the overage charge is taken.
        </p>
        <p>
          Damage to the vehicle beyond fair wear and tear may be charged to the
          card on file with itemised evidence shared in advance.
        </p>
      </>
    ),
  },
  {
    id: 'chargebacks',
    title: 'Disputes and chargebacks',
    body: (
      <>
        <p>
          If you believe a charge is wrong, email{' '}
          <a href="mailto:sales@sinaitaxi.com" className="text-brand-600 hover:underline">
            sales@sinaitaxi.com
          </a>{' '}
          before opening a chargeback. We resolve most disputes within two
          business days and a chargeback can delay the resolution by weeks.
        </p>
      </>
    ),
  },
  {
    id: 'force-majeure',
    title: 'Force majeure',
    body: (
      <>
        <p>
          Where a booking cannot be performed due to extraordinary events outside
          our or the partner&rsquo;s control (e.g. natural disaster, civil unrest,
          government-ordered shutdown), we refund the customer in full regardless
          of how close to pickup the cancellation occurs.
        </p>
      </>
    ),
  },
];

export default function RefundsPage() {
  return (
    <PolicyShell
      eyebrow="Legal"
      title="Refunds &amp; cancellations."
      subtitle="The full schedule of when bookings can be cancelled, refunded, or adjusted &mdash; for customers and partners alike."
      lastUpdated="2026-06-28"
      sections={SECTIONS}
      cta={{ label: 'Email support', href: '/support' }}
    />
  );
}
