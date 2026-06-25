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
import { CheckCircle2, Clock, Car, AlertCircle, Lock, RefreshCw, Gauge, Phone, X, Loader2, User } from 'lucide-react';
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
          <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">
            {booking.status === 'started' ? 'In progress' : booking.status === 'completed' || booking.status === 'settled' ? 'Trip complete' : 'Confirmed'}
          </div>
          <div className="text-lg font-bold tracking-tight text-emerald-900">
            {booking.status === 'started' ? 'Your trip is underway' : booking.status === 'completed' || booking.status === 'settled' ? 'Thanks for travelling' : 'Your driver is booked'}
          </div>
        </div>
      </div>
      <p className="mt-3 text-sm leading-relaxed text-emerald-800">
        {booking.driverName
          ? <>Driver contact details are below — you'll get an SMS too.</>
          : <>We sent a confirmation email to <span className="font-medium">{booking.customerEmail}</span>. The driver's contact details will appear here when assigned.</>}
      </p>
    </div>

    {booking.driverName ? <DriverCard booking={booking} /> : null}

    {booking.status === 'confirmed' && new Date(booking.pickupAt) > new Date() ? (
      <CancelPanel booking={booking} />
    ) : null}

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
      {booking.daySchedule && booking.daySchedule.length > 1 ? (
        <div className="mt-5">
          <h3 className="text-[10px] font-bold uppercase tracking-wider text-ink-500">Per-day schedule</h3>
          <ul className="mt-2 space-y-1.5 text-xs">
            {booking.daySchedule.map((d, i) => {
              const dt = new Date(`${d.date}T${d.time}`);
              const label = dt.toLocaleString('en', {
                weekday: 'short', day: 'numeric', month: 'short',
                hour: 'numeric', minute: '2-digit',
              });
              return (
                <li key={i} className="flex items-center justify-between gap-3 rounded-xl bg-ink-100 px-3 py-1.5 font-medium text-ink-800">
                  <span>Day {i + 1} · {label}</span>
                  <span className="font-bold">{d.hours}h</span>
                </li>
              );
            })}
          </ul>
        </div>
      ) : booking.hoursPerDay && booking.hoursPerDay.length > 1 ? (
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

const DriverCard: React.FC<{ booking: BookingDetail }> = ({ booking }) => (
  <div className="rounded-3xl border border-brand-200 bg-brand-50 p-5">
    <div className="flex items-center gap-3 border-b border-brand-100 pb-3">
      <div className="grid h-10 w-10 place-items-center rounded-2xl bg-white text-brand-700">
        <User className="h-5 w-5" />
      </div>
      <div>
        <div className="text-[10px] font-bold uppercase tracking-wider text-brand-700">Your driver</div>
        <div className="text-lg font-bold text-brand-900">{booking.driverName}</div>
      </div>
    </div>
    <dl className="mt-3 space-y-2 text-sm">
      <div className="flex items-start justify-between gap-3">
        <dt className="text-[10px] font-bold uppercase tracking-wider text-brand-700">Phone</dt>
        <dd className="text-right">
          {booking.driverPhone ? (
            <a href={`tel:${booking.driverPhone}`} className="inline-flex items-center gap-1 font-bold text-brand-700 hover:text-brand-900">
              <Phone className="h-3.5 w-3.5" />
              {booking.driverPhone}
            </a>
          ) : '—'}
        </dd>
      </div>
      <div className="flex items-start justify-between gap-3">
        <dt className="text-[10px] font-bold uppercase tracking-wider text-brand-700">Vehicle</dt>
        <dd className="text-right text-sm font-medium text-brand-900">{booking.vehicleLabel ?? '—'}</dd>
      </div>
      {booking.kmDriven !== null ? (
        <div className="flex items-start justify-between gap-3 border-t border-brand-100 pt-2">
          <dt className="text-[10px] font-bold uppercase tracking-wider text-brand-700">Km driven</dt>
          <dd className="text-right text-sm font-medium text-brand-900">{booking.kmDriven} km</dd>
        </div>
      ) : null}
      {(booking.overageAmount ?? 0) > 0 ? (
        <div className="flex items-start justify-between gap-3">
          <dt className="text-[10px] font-bold uppercase tracking-wider text-brand-700">Overage charged</dt>
          <dd className="text-right text-sm font-bold text-brand-900">
            {new Intl.NumberFormat('en', { style: 'currency', currency: booking.currency }).format(booking.overageAmount!)}
          </dd>
        </div>
      ) : null}
    </dl>
  </div>
);

const CancelPanel: React.FC<{ booking: BookingDetail }> = ({ booking }) => {
  const [open, setOpen] = useState(false);
  const hoursUntilPickup = (new Date(booking.pickupAt).getTime() - Date.now()) / (60 * 60 * 1000);
  const eligibleForRefund = hoursUntilPickup > 24;

  return (
    <>
      <div className="rounded-3xl border border-ink-100 bg-white p-5 shadow-soft">
        <h3 className="text-[10px] font-bold uppercase tracking-wider text-ink-500">Need to cancel?</h3>
        <p className="mt-2 text-sm text-ink-700">
          {eligibleForRefund
            ? <><strong>Free cancellation</strong> — you're more than 24 hours from pickup, so you'll get a full refund.</>
            : <><strong>Non-refundable</strong> — pickup is in less than 24 hours. Cancelling now means you won't get your money back.</>}
        </p>
        <button
          onClick={() => setOpen(true)}
          className="mt-3 inline-flex items-center gap-1.5 rounded-2xl border border-ink-200 bg-white px-4 py-2 text-sm font-semibold text-ink-700 transition hover:border-red-200 hover:text-red-700">
          Cancel booking
        </button>
      </div>
      {open ? <CancelModal booking={booking} onClose={() => setOpen(false)} /> : null}
    </>
  );
};

const CancelModal: React.FC<{ booking: BookingDetail; onClose: () => void }> = ({ booking, onClose }) => {
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const hoursUntilPickup = (new Date(booking.pickupAt).getTime() - Date.now()) / (60 * 60 * 1000);
  const refundAmount = hoursUntilPickup > 24 ? booking.retailPrice : 0;
  const refundLabel = refundAmount > 0
    ? new Intl.NumberFormat('en', { style: 'currency', currency: booking.currency }).format(refundAmount)
    : 'No refund';

  const onConfirm = async () => {
    setBusy(true); setError(null);
    try {
      await api.cancelBooking(booking.id, reason || undefined);
      // Reload the page so the poller picks up the new state.
      if (typeof window !== 'undefined') window.location.reload();
    } catch (e) {
      setError((e as Error).message);
      setBusy(false);
    }
  };

  return (
    <div role="dialog" aria-modal="true" className="fixed inset-0 z-50 grid place-items-center bg-black/40 px-4 py-8">
      <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-glow">
        <div className="flex items-start justify-between gap-3">
          <h2 className="text-xl font-bold tracking-tight">Cancel booking?</h2>
          <button onClick={onClose} aria-label="Close" className="rounded-xl p-1 text-ink-500 hover:bg-ink-100">
            <X className="h-5 w-5" />
          </button>
        </div>
        <p className="mt-3 text-sm text-ink-600">
          {refundAmount > 0
            ? <>You'll be refunded <strong>{refundLabel}</strong> to the original payment method within 2–10 business days.</>
            : <>Pickup is in <strong>less than 24 hours</strong>. This cancellation is <strong>non-refundable</strong> per our policy.</>}
        </p>

        <label className="mt-4 block text-sm">
          <span className="text-[10px] font-bold uppercase tracking-wider text-ink-500">Reason (optional)</span>
          <textarea
            value={reason}
            onChange={e => setReason(e.target.value)}
            rows={3}
            placeholder="Tell us what changed — helps us learn"
            className="mt-1 w-full rounded-2xl border border-ink-200 bg-white px-3 py-2 text-sm outline-none focus:border-brand-500"
          />
        </label>

        {error ? (
          <div className="mt-3 inline-flex w-full items-start gap-2 rounded-2xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
            {error}
          </div>
        ) : null}

        <div className="mt-5 flex items-center justify-end gap-3">
          <button onClick={onClose} className="text-sm font-semibold text-ink-600 hover:text-ink-900">Keep booking</button>
          <button
            onClick={onConfirm}
            disabled={busy}
            className="inline-flex items-center gap-1.5 rounded-2xl bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60">
            {busy ? (<><Loader2 className="h-4 w-4 animate-spin" /> Cancelling…</>) : refundAmount > 0 ? `Cancel & refund ${refundLabel}` : 'Cancel without refund'}
          </button>
        </div>
      </div>
    </div>
  );
};
