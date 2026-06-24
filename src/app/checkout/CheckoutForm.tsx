'use client';

// Two-step checkout:
//   1. Customer enters first/last name, email, phone, and ticks
//      the Terms + Refund Policy consent box. We call /v1/checkout,
//      receive { bookingId, clientSecret }, and switch to step 2.
//   2. Stripe Elements mounts with the clientSecret. confirmPayment
//      sends them to /orders/[bookingId] for the receipt poller.
//
// Pricing is always re-resolved server-side — the UI shows the
// price from /v1/checkout's response, never from a client-side
// calculation, so any rule edits in flight are honoured.

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { loadStripe, type Stripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useElements, useStripe } from '@stripe/react-stripe-js';
import { ArrowRight, Lock, ShieldCheck, AlertCircle } from 'lucide-react';
import { api, type CheckoutInput, type OfferCard } from '@/lib/api';

type StripePromise = Promise<Stripe | null> | null;
let _stripe: StripePromise = null;
const stripePromise = (): Promise<Stripe | null> => {
  if (_stripe) return _stripe;
  const key = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
  if (!key) { _stripe = Promise.resolve(null); return _stripe; }
  _stripe = loadStripe(key);
  return _stripe;
};

interface Props {
  offer: OfferCard;
  // Search context passed through from /search.
  countryCode: string;
  polygonId: string;
  pickupAt: string;
  pickupAddress: string;
  pickupLat: number | null;
  pickupLng: number | null;
  durationHours: number;
  hoursPerDay: number[] | null;
}

const formatPrice = (n: number, currency: string): string => {
  try {
    return new Intl.NumberFormat('en', { style: 'currency', currency }).format(n);
  } catch {
    return `${currency} ${n.toFixed(2)}`;
  }
};

export const CheckoutForm: React.FC<Props> = (props) => {
  const [bookingId, setBookingId] = useState<string | null>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [agreed, setAgreed] = useState(false);

  const onStart = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!agreed) {
      setError('Please accept the Terms of Service and Refund Policy to continue.');
      return;
    }
    setError(null);
    setBusy(true);
    try {
      const input: CheckoutInput = {
        offerKey: props.offer.offerKey,
        countryCode: props.countryCode,
        polygonId: props.polygonId,
        pickupAt: props.pickupAt,
        durationHours: props.durationHours,
        hoursPerDay: props.hoursPerDay,
        pickupAddress: props.pickupAddress,
        pickupLat: props.pickupLat,
        pickupLng: props.pickupLng,
        customerEmail: email.trim(),
        customerName: `${firstName.trim()} ${lastName.trim()}`.trim(),
        customerPhone: phone.trim() || null,
        agreedToTerms: true,
      };
      const res = await api.checkout(input);
      setBookingId(res.bookingId);
      setClientSecret(res.clientSecret);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const elementsOptions = useMemo(
    () => clientSecret
      ? { clientSecret, appearance: { theme: 'stripe' as const, variables: { colorPrimary: '#1E5EFF', borderRadius: '12px' } } }
      : undefined,
    [clientSecret],
  );

  if (clientSecret && bookingId) {
    return (
      <Elements stripe={stripePromise()} options={elementsOptions}>
        <PayStep bookingId={bookingId} totalLabel={formatPrice(props.offer.totalPrice, props.offer.currency)} />
      </Elements>
    );
  }

  return (
    <form onSubmit={onStart} className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="First name">
          <input
            value={firstName}
            onChange={e => setFirstName(e.target.value)}
            required
            autoComplete="given-name"
            className="w-full bg-transparent text-base outline-none"
          />
        </Field>
        <Field label="Last name">
          <input
            value={lastName}
            onChange={e => setLastName(e.target.value)}
            required
            autoComplete="family-name"
            className="w-full bg-transparent text-base outline-none"
          />
        </Field>
      </div>

      <Field label="Email">
        <input
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
          autoComplete="email"
          className="w-full bg-transparent text-base outline-none"
        />
      </Field>

      <Field label="Phone (optional — driver may text or call)">
        <input
          type="tel"
          value={phone}
          onChange={e => setPhone(e.target.value)}
          autoComplete="tel"
          className="w-full bg-transparent text-base outline-none"
        />
      </Field>

      <label className="flex items-start gap-3 rounded-2xl border border-ink-100 bg-white px-4 py-3 cursor-pointer hover:border-ink-200 transition">
        <input
          type="checkbox"
          checked={agreed}
          onChange={e => setAgreed(e.target.checked)}
          className="mt-0.5 h-4 w-4 rounded border-ink-300 text-brand-600 focus:ring-brand-500 focus:ring-2 cursor-pointer flex-shrink-0"
        />
        <span className="text-xs leading-relaxed text-ink-700">
          I have read and agree to the{' '}
          <Link href="/terms" target="_blank" className="font-semibold text-brand-600 hover:text-brand-700 underline-offset-2 hover:underline">Terms of Service</Link>
          {' '}and{' '}
          <Link href="/refund-policy" target="_blank" className="font-semibold text-brand-600 hover:text-brand-700 underline-offset-2 hover:underline">Refund Policy</Link>.
          I understand that <strong>cancellations within 24 hours of pickup are non-refundable</strong>, and that
          customer no-show (more than 60 minutes late) is treated the same way.
        </span>
      </label>

      {error ? (
        <div className="inline-flex w-full items-start gap-2 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
          {error}
        </div>
      ) : null}

      <button
        type="submit"
        disabled={busy || !agreed}
        className="btn-primary w-full !py-3.5 disabled:bg-ink-300 disabled:cursor-not-allowed">
        {busy ? 'Preparing payment…' : (
          <>
            Continue to payment · {formatPrice(props.offer.totalPrice, props.offer.currency)}
            <ArrowRight className="h-4 w-4" />
          </>
        )}
      </button>

      <p className="inline-flex items-center gap-1.5 text-xs text-ink-500">
        <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
        Stripe-secured · We never store card details
      </p>
    </form>
  );
};

const PayStep: React.FC<{ bookingId: string; totalLabel: string }> = ({ bookingId, totalLabel }) => {
  const stripe = useStripe();
  const elements = useElements();
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onPay = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;
    setError(null);
    setSubmitting(true);
    const result = await stripe.confirmPayment({
      elements,
      confirmParams: { return_url: `${window.location.origin}/orders/${bookingId}` },
      redirect: 'if_required',
    });
    setSubmitting(false);
    if (result.error) {
      setError(result.error.message ?? 'Payment failed.');
      return;
    }
    router.push(`/orders/${bookingId}`);
  };

  return (
    <form onSubmit={onPay} className="space-y-4">
      <PaymentElement />
      {error ? (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">{error}</p>
      ) : null}
      <button
        type="submit"
        disabled={!stripe || submitting}
        className="btn-primary w-full !py-3.5 disabled:bg-ink-300 disabled:cursor-not-allowed">
        <Lock className="h-4 w-4" />
        {submitting ? 'Processing…' : `Pay ${totalLabel}`}
      </button>
    </form>
  );
};

const Field: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <label className="block rounded-2xl border border-ink-200 bg-white px-4 py-3 focus-within:border-brand-500">
    <span className="text-[10px] font-bold uppercase tracking-wider text-ink-500">{label}</span>
    <div className="mt-1">{children}</div>
  </label>
);
