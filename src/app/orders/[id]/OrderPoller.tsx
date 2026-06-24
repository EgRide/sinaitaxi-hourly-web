'use client';

// Client-side poller that watches a booking transition from
// pending → confirmed after the Stripe webhook fires. Renders the
// final state inline.
//
// Resume-pay support: if the booking comes back with a
// stripeClientSecret while still pending, we re-mount Stripe
// Elements so the customer can retry payment without bouncing
// back through /search.

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { loadStripe, type Stripe as StripeJS } from '@stripe/stripe-js';
import { Elements, PaymentElement, useElements, useStripe } from '@stripe/react-stripe-js';
import { CheckCircle2, Clock, Car, AlertCircle, Lock, RefreshCw, Gauge } from 'lucide-react';
import { api, type BookingDetail } from '@/lib/api';
import { cn } from '@/lib/cn';

interface Props {
  initial: BookingDetail;
}

let _stripe: Promise<StripeJS | null> | null = null;
const stripePromise = (): Promise<StripeJS | null> => {
  if (_stripe) return _stripe;
  const key = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
  if (!key) { _stripe = Promise.resolve(null); return _stripe; }
  _stripe = loadStripe(key);
  return _stripe;
};

const formatPrice = (n: number, currency: string): string => {
  try {
    return new Intl.NumberFormat('en', { style: 'currency', currency }).format(n);
  } catch {
    return `${currency} ${n.toFixed(2)}`;
  }
};

export const OrderPoller: React.FC<Props> = ({ initial }) => {
  const [booking, setBooking] = useState<BookingDetail>(initial);
  const [polling, setPolling] = useState(initial.status === 'pending');

  // Poll once a second while pending; back off once confirmed.
  useEffect(() => {
    if (booking.status !== 'pending') {
      setPolling(false);
      return;
    }
    setPolling(true);
    let cancelled = false;
    const tick = async () => {
      try {
        const next = await api.booking(booking.id);
        if (cancelled) return;
        setBooking(next);
      } catch { /* ignore — next tick retries */ }
    };
    const interval = window.setInterval(() => { void tick(); }, 2500);
    return () => { cancelled = true; window.clearInterval(interval); };
  }, [booking.id, booking.status]);

  // 1. Confirmed (success): show the booked-trip summary.
  if (booking.status === 'confirmed' || booking.status === 'started' || booking.status === 'completed' || booking.status === 'settled') {
    return <ConfirmedView booking={booking} />;
  }

  // 2. Cancelled / refunded / no_show: show a final-state explainer.
  if (booking.status === 'cancelled' || booking.status === 'refunded' || booking.status === 'no_show') {
    return <ClosedView booking={booking} />;
  }

  // 3. Pending — two sub-modes:
  //    a) resume-pay (we have a clientSecret) → re-mount Stripe Elements
  //    b) the webhook hasn't landed yet → show a loader
  if (booking.stripeClientSecret) {
    return <ResumePayView booking={booking} />;
  }
  return <PollingView booking={booking} polling={polling} />;
};

const PollingView: React.FC<{ booking: BookingDetail; polling: boolean }> = ({ booking, polling }) => (
  <div className="rounded-3xl border border-ink-100 bg-white p-8 text-center shadow-soft">
    <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-brand-50 text-brand-700">
      <RefreshCw className={cn('h-6 w-6', polling && 'animate-spin')} />
    </div>
    <h2 className="mt-4 text-xl font-bold tracking-tight">Confirming your booking…</h2>
    <p className="mt-2 text-sm text-ink-600">
      We just need a second to finalise the booking with Stripe. This page refreshes automatically.
    </p>
    <p className="mt-4 inline-flex items-center gap-1.5 text-xs text-ink-500">
      <Clock className="h-3.5 w-3.5" />
      Reference: {booking.id}
    </p>
  </div>
);

const ResumePayView: React.FC<{ booking: BookingDetail }> = ({ booking }) => {
  const options = useMemo(() => booking.stripeClientSecret
    ? { clientSecret: booking.stripeClientSecret, appearance: { theme: 'stripe' as const, variables: { colorPrimary: '#1E5EFF', borderRadius: '12px' } } }
    : undefined, [booking.stripeClientSecret]);

  return (
    <div className="rounded-3xl border border-ink-100 bg-white p-6 shadow-soft">
      <h2 className="text-xl font-bold tracking-tight">Finish your booking</h2>
      <p className="mt-1 text-sm text-ink-600">
        We saved your booking but didn't see a payment yet. Complete it below — same offer, same price.
      </p>
      <div className="mt-5">
        <Elements stripe={stripePromise()} options={options}>
          <ResumePayInner bookingId={booking.id} total={formatPrice(booking.retailPrice, booking.currency)} />
        </Elements>
      </div>
    </div>
  );
};

const ResumePayInner: React.FC<{ bookingId: string; total: string }> = ({ bookingId, total }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const onPay = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;
    setSubmitting(true); setError(null);
    const result = await stripe.confirmPayment({
      elements,
      confirmParams: { return_url: `${window.location.origin}/orders/${bookingId}` },
      redirect: 'if_required',
    });
    setSubmitting(false);
    if (result.error) setError(result.error.message ?? 'Payment failed.');
  };
  return (
    <form onSubmit={onPay} className="space-y-3">
      <PaymentElement />
      {error ? <p className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">{error}</p> : null}
      <button type="submit" disabled={!stripe || submitting} className="btn-primary w-full !py-3.5">
        <Lock className="h-4 w-4" />
        {submitting ? 'Processing…' : `Pay ${total}`}
      </button>
    </form>
  );
};

const ConfirmedView: React.FC<{ booking: BookingDetail }> = ({ booking }) => (
  <div className="space-y-6">
    <div className="rounded-3xl border border-emerald-200 bg-emerald-50 p-6">
      <div className="flex items-center gap-3">
        <div className="grid h-12 w-12 place-items-center rounded-2xl bg-white text-emerald-600">
          <CheckCircle2 className="h-6 w-6" />
        </div>
        <div>
          <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">Confirmed</div>
          <div className="text-lg font-bold tracking-tight text-emerald-900">Your driver is booked</div>
        </div>
      </div>
      <p className="mt-3 text-sm leading-relaxed text-emerald-800">
        We sent a confirmation email to <span className="font-medium">{booking.customerEmail}</span>.
        You'll get the driver's contact details closer to pickup.
      </p>
    </div>

    <div className="rounded-3xl border border-ink-100 bg-white p-6 shadow-soft">
      <div className="flex items-center gap-3 border-b border-ink-100 pb-4">
        <div className="grid h-11 w-11 place-items-center rounded-2xl bg-brand-50 text-brand-700">
          <Car className="h-5 w-5" />
        </div>
        <div>
          <div className="text-lg font-bold">{booking.vehicleClass.label}</div>
          <div className="text-xs text-ink-500">{booking.vehicleClass.description} · {booking.vehicleClass.seats}</div>
        </div>
      </div>
      {booking.ruleName ? (
        <p className="mt-3 text-xs text-ink-500">
          Operated by <span className="font-medium text-ink-700">{booking.ruleName}</span>
        </p>
      ) : null}
      <dl className="mt-4 space-y-3 text-sm">
        <Row label="Pickup" value={new Date(booking.pickupAt).toLocaleString()} />
        <Row label="Address" value={booking.pickupAddress} />
        <Row label="Service area" value={booking.polygonName} />
        <Row label="Duration" value={
          booking.hoursPerDay && booking.hoursPerDay.length > 1
            ? `${booking.durationHours}h across ${booking.hoursPerDay.length} days`
            : `${booking.durationHours} hour${booking.durationHours === 1 ? '' : 's'}`
        } />
        <Row label="Included" value={<span className="inline-flex items-center gap-1.5"><Gauge className="h-3.5 w-3.5" />{booking.includedKm} km</span>} />
        <Row label="Reference" value={<span className="font-mono">{booking.id}</span>} />
        <Row label="Total paid" value={<span className="font-bold text-brand-700">{formatPrice(booking.retailPrice, booking.currency)}</span>} />
      </dl>
      {booking.hoursPerDay && booking.hoursPerDay.length > 1 ? (
        <div className="mt-5">
          <h3 className="text-[10px] font-bold uppercase tracking-wider text-ink-500">Per-day schedule</h3>
          <ul className="mt-2 flex flex-wrap gap-2 text-xs">
            {booking.hoursPerDay.map((h, i) => (
              <li key={i} className="rounded-full bg-ink-100 px-3 py-1 font-medium text-ink-800">
                Day {i + 1} · {h}h
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>

    <div className="rounded-3xl border border-ink-100 bg-white p-6 shadow-soft">
      <h3 className="text-[10px] font-bold uppercase tracking-wider text-ink-500">Good to know</h3>
      <ul className="mt-3 space-y-2 text-sm leading-relaxed text-ink-700">
        <li>• Free cancellation up to 24 hours before pickup. After that, non-refundable.</li>
        <li>• More than 60 minutes late at pickup = no-show, non-refundable.</li>
        <li>• Extra kilometres beyond {booking.includedKm} km are billed automatically after the trip.</li>
      </ul>
      <div className="mt-4 flex flex-wrap gap-3">
        <Link href="/refund-policy" target="_blank" className="text-xs font-semibold text-brand-600 hover:text-brand-700">Refund policy →</Link>
        <a href={`mailto:sales@sinaitaxi.com?subject=Booking%20${booking.id}`} className="text-xs font-semibold text-brand-600 hover:text-brand-700">Email support →</a>
      </div>
    </div>
  </div>
);

const ClosedView: React.FC<{ booking: BookingDetail }> = ({ booking }) => {
  const label = booking.status === 'cancelled' ? 'Cancelled' : booking.status === 'refunded' ? 'Refunded' : 'No-show';
  const explainer = booking.status === 'cancelled'
    ? 'This booking was cancelled — either by you, by the partner, or because it expired before payment.'
    : booking.status === 'refunded'
    ? 'This booking was refunded. Money should be back in your account within 2-10 business days.'
    : 'The driver waited at pickup for over 60 minutes — this booking is marked as a no-show and is non-refundable.';
  return (
    <div className="rounded-3xl border border-amber-200 bg-amber-50 p-6">
      <div className="flex items-start gap-3">
        <AlertCircle className="mt-0.5 h-5 w-5 text-amber-600" />
        <div>
          <div className="text-[10px] font-bold uppercase tracking-wider text-amber-700">{label}</div>
          <div className="text-lg font-bold tracking-tight text-amber-900">Booking {label.toLowerCase()}</div>
          <p className="mt-2 text-sm leading-relaxed text-amber-800">{explainer}</p>
          <Link href="/" className="btn-primary mt-4">Start a new search</Link>
        </div>
      </div>
    </div>
  );
};

const Row: React.FC<{ label: string; value: React.ReactNode }> = ({ label, value }) => {
  if (value === null || value === undefined || value === '') return null;
  return (
    <div className="flex items-start justify-between gap-3">
      <dt className="text-[10px] font-bold uppercase tracking-wider text-ink-500">{label}</dt>
      <dd className="text-right text-sm font-medium text-ink-800">{value}</dd>
    </div>
  );
};
