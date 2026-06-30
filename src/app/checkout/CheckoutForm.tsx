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

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { loadStripe, type Stripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useElements, useStripe } from '@stripe/react-stripe-js';
import { ArrowRight, Lock, ShieldCheck, AlertCircle, Tag, X, CheckCircle2, Plus, Minus, Sparkles } from 'lucide-react';
import { api, type CheckoutInput, type OfferCard, type CheckoutChildSeat, type CheckoutCustomExtra } from '@/lib/api';

type StripePromise = Promise<Stripe | null> | null;
let _stripe: StripePromise = null;
const stripePromise = (): Promise<Stripe | null> => {
  if (_stripe) return _stripe;
  const key = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
  if (!key) { _stripe = Promise.resolve(null); return _stripe; }
  _stripe = loadStripe(key);
  return _stripe;
};

interface ScheduledDay { date: string; time: string; hours: number; }

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
  daySchedule: ScheduledDay[] | null;
}

const formatPrice = (n: number, currency: string): string => {
  try {
    return new Intl.NumberFormat('en', { style: 'currency', currency }).format(n);
  } catch {
    return `${currency} ${n.toFixed(2)}`;
  }
};

// Two-step progress cue, shown in both phases so the customer always
// knows where they are (details → payment).
const StepDot: React.FC<{ n: number; label: string; current: number }> = ({ n, label, current }) => {
  const done = current > n;
  const active = current === n;
  return (
    <div className={`inline-flex items-center gap-1.5 ${active ? 'text-brand-300' : done ? 'text-emerald-400' : 'text-white/40'}`}>
      <span className={`grid h-5 w-5 place-items-center rounded-full text-[10px] font-bold ${done ? 'bg-emerald-500 text-white' : active ? 'bg-brand-500 text-white' : 'bg-white/10 text-white/50'}`}>
        {done ? '✓' : n}
      </span>
      {label}
    </div>
  );
};

const StepProgress: React.FC<{ current: 1 | 2 }> = ({ current }) => (
  <div className="mb-5 flex items-center gap-3 text-xs font-semibold">
    <StepDot n={1} label="Your details" current={current} />
    <div className={`h-px w-8 ${current > 1 ? 'bg-emerald-400' : 'bg-white/15'}`} />
    <StepDot n={2} label="Payment" current={current} />
  </div>
);

export const CheckoutForm: React.FC<Props> = (props) => {
  const [bookingId, setBookingId] = useState<string | null>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  // WhatsApp defaults to phone via a checkbox. When ticked we
  // submit `customerWhatsapp: null` and the backend treats it as
  // "same as phone".
  const [whatsappSameAsPhone, setWhatsappSameAsPhone] = useState(true);
  const [whatsapp, setWhatsapp] = useState('');
  const [hotelRoom, setHotelRoom] = useState('');
  const [comments, setComments] = useState('');
  const [agreed, setAgreed] = useState(false);

  // Promo code: customer-typed `promoInput`, server-confirmed `promo`.
  // Once `promo` is set we show the discount line item and use it
  // when computing the total displayed on the Continue button.
  const [promoInput, setPromoInput] = useState('');
  const [promoBusy, setPromoBusy] = useState(false);
  const [promoError, setPromoError] = useState<string | null>(null);
  const [promo, setPromo] = useState<{ code: string; discount: number } | null>(null);

  // Booking extras (child seats from PHP + admin-managed custom
  // add-ons). Fetched once per offer; the quantity / selected
  // state lives client-side, the total is recomputed live.
  const [extrasCatalog, setExtrasCatalog] = useState<{
    childSeats: CheckoutChildSeat[];
    customExtras: CheckoutCustomExtra[];
  } | null>(null);
  const [extraQty, setExtraQty] = useState<Record<string, number>>({});
  useEffect(() => {
    void api.extras(props.offer.partnerPhpId)
      .then(r => setExtrasCatalog(r))
      .catch(() => setExtrasCatalog({ childSeats: [], customExtras: [] }));
  }, [props.offer.partnerPhpId]);

  const setQty = (key: string, n: number) =>
    setExtraQty(m => ({ ...m, [key]: Math.max(0, Math.min(3, n)) }));

  const selectedExtras = useMemo(() => {
    const out: { type: 'child_seat' | 'custom'; id: string; quantity: number; name: string; unitPrice: number }[] = [];
    if (!extrasCatalog) return out;
    for (const s of extrasCatalog.childSeats) {
      const q = extraQty[`child:${s.id}`] ?? 0;
      if (q > 0) out.push({ type: 'child_seat', id: s.id, quantity: q, name: s.name, unitPrice: s.price });
    }
    for (const e of extrasCatalog.customExtras) {
      const q = extraQty[`custom:${e.id}`] ?? 0;
      if (q > 0) out.push({ type: 'custom', id: e.id, quantity: q, name: e.name, unitPrice: e.price });
    }
    return out;
  }, [extrasCatalog, extraQty]);

  const extrasTotal = useMemo(
    () => Math.round(selectedExtras.reduce((s, e) => s + e.unitPrice * e.quantity, 0) * 100) / 100,
    [selectedExtras],
  );

  const subtotal = props.offer.totalPrice;
  const total = Math.max(0, Math.round((subtotal - (promo?.discount ?? 0) + extrasTotal) * 100) / 100);

  const onApplyPromo = async () => {
    const code = promoInput.trim();
    if (!code) return;
    setPromoBusy(true);
    setPromoError(null);
    try {
      const r = await api.applyPromoCode({ code, subtotal, currency: props.offer.currency });
      if (r.ok) {
        setPromo({ code: r.code, discount: r.discount });
      } else {
        setPromo(null);
        const messages: Record<string, string> = {
          not_found: 'We don’t recognise that code.',
          inactive: 'That code is no longer active.',
          expired: 'That code has expired.',
          not_yet_valid: 'That code isn’t valid yet.',
          min_amount: 'Your booking doesn’t meet the minimum amount.',
          currency_mismatch: 'That code can’t be used in this currency.',
          max_uses: 'That code has been fully redeemed.',
        };
        setPromoError(messages[r.error] ?? 'Promo code unavailable.');
      }
    } catch (err) {
      setPromoError((err as Error).message);
    } finally {
      setPromoBusy(false);
    }
  };

  const onClearPromo = () => {
    setPromo(null);
    setPromoInput('');
    setPromoError(null);
  };

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
        daySchedule: props.daySchedule,
        pickupAddress: props.pickupAddress,
        pickupLat: props.pickupLat,
        pickupLng: props.pickupLng,
        customerEmail: email.trim(),
        customerName: `${firstName.trim()} ${lastName.trim()}`.trim(),
        customerPhone: phone.trim(),
        customerWhatsapp: whatsappSameAsPhone ? null : (whatsapp.trim() || null),
        customerComments: comments.trim() || null,
        hotelRoomNumber: hotelRoom.trim() || null,
        promoCode: promo?.code ?? null,
        extras: selectedExtras.length
          ? selectedExtras.map(e => ({ type: e.type, id: e.id, quantity: e.quantity }))
          : null,
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
      ? { clientSecret, appearance: { theme: 'night' as const, variables: { colorPrimary: '#1E5EFF', borderRadius: '12px' } } }
      : undefined,
    [clientSecret],
  );

  if (clientSecret && bookingId) {
    return (
      <div>
        <StepProgress current={2} />
        <Elements stripe={stripePromise()} options={elementsOptions}>
          <PayStep bookingId={bookingId} totalLabel={formatPrice(props.offer.totalPrice, props.offer.currency)} />
        </Elements>
      </div>
    );
  }

  return (
    <form onSubmit={onStart} className="space-y-4">
      {/* Mobile-only sticky summary — the offer summary sidebar drops
          below the fold on mobile, so keep the total + trip in view
          while the customer fills the form. Sits just under the
          sticky site header (h-16). */}
      <div className="sticky top-[72px] z-20 mb-1 flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-[#0B0E1A]/85 px-4 py-2.5 shadow-glow backdrop-blur-xl lg:hidden">
        <div className="min-w-0">
          <div className="truncate text-sm font-bold text-white">{props.offer.vehicleClass.label}</div>
          <div className="text-[11px] text-white/60">{props.durationHours}h · {props.offer.includedKm} km included</div>
        </div>
        <div className="shrink-0 text-right">
          <div className="text-[10px] font-bold uppercase tracking-wider text-white/45">Total</div>
          <div className="text-lg font-extrabold leading-tight text-white">{formatPrice(total, props.offer.currency)}</div>
        </div>
      </div>

      <StepProgress current={1} />

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

      <Field label="Phone — driver will text or call you">
        <input
          type="tel"
          value={phone}
          onChange={e => setPhone(e.target.value)}
          required
          placeholder="+20 100 123 4567"
          autoComplete="tel"
          className="w-full bg-transparent text-base outline-none"
        />
      </Field>

      <label className="-mt-1 flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 cursor-pointer backdrop-blur-xl hover:border-white/20 transition">
        <input
          type="checkbox"
          checked={whatsappSameAsPhone}
          onChange={e => setWhatsappSameAsPhone(e.target.checked)}
          className="h-4 w-4 rounded border-white/30 text-brand-500 focus:ring-brand-400 focus:ring-2 cursor-pointer"
        />
        <span className="text-sm text-white/70">
          My WhatsApp is the same as my phone number
        </span>
      </label>

      {!whatsappSameAsPhone ? (
        <Field label="WhatsApp number">
          <input
            type="tel"
            value={whatsapp}
            onChange={e => setWhatsapp(e.target.value)}
            placeholder="+20 100 123 4567"
            className="w-full bg-transparent text-base outline-none"
          />
        </Field>
      ) : null}

      <Field label="Hotel & room number (optional)">
        <input
          type="text"
          value={hotelRoom}
          onChange={e => setHotelRoom(e.target.value)}
          placeholder="Room 402"
          className="w-full bg-transparent text-base outline-none"
        />
      </Field>

      <Field label="Notes for the driver (optional)">
        <textarea
          value={comments}
          onChange={e => setComments(e.target.value)}
          rows={3}
          placeholder="Flight number, child seat, special requests…"
          className="w-full resize-none bg-transparent text-base outline-none"
        />
      </Field>

      {/* Booking extras (child seats + custom add-ons) */}
      {extrasCatalog && (extrasCatalog.childSeats.length + extrasCatalog.customExtras.length > 0) ? (
        <section className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 backdrop-blur-xl">
          <div className="mb-3 flex items-center gap-2">
            <span className="grid h-7 w-7 place-items-center rounded-lg bg-brand-500/15 text-brand-300">
              <Sparkles className="h-4 w-4" />
            </span>
            <h3 className="text-sm font-bold text-white">Add-ons</h3>
          </div>

          {extrasCatalog.childSeats.length > 0 ? (
            <>
              <p className="text-[10px] font-bold uppercase tracking-wider text-white/45">Child seats</p>
              <ul className="mt-2 space-y-2">
                {extrasCatalog.childSeats.map(s => {
                  const key = `child:${s.id}`;
                  const q = extraQty[key] ?? 0;
                  return (
                    <ExtraRowControl
                      key={key}
                      title={s.name}
                      subtitle={`${formatPrice(s.price, s.currency)} each`}
                      quantity={q}
                      onChange={n => setQty(key, n)}
                    />
                  );
                })}
              </ul>
            </>
          ) : null}

          {extrasCatalog.customExtras.length > 0 ? (
            <>
              <p className={`${extrasCatalog.childSeats.length > 0 ? 'mt-4' : ''} text-[10px] font-bold uppercase tracking-wider text-white/45`}>
                Other add-ons
              </p>
              <ul className="mt-2 space-y-2">
                {extrasCatalog.customExtras.map(e => {
                  const key = `custom:${e.id}`;
                  const q = extraQty[key] ?? 0;
                  return (
                    <ExtraRowControl
                      key={key}
                      title={e.name}
                      subtitle={e.description ?? `${formatPrice(e.price, e.currency)} per booking`}
                      quantity={q}
                      onChange={n => setQty(key, n)}
                      mode="toggle"
                    />
                  );
                })}
              </ul>
            </>
          ) : null}

          {selectedExtras.length > 0 ? (
            <p className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-brand-500/15 px-3 py-1 text-xs font-bold text-brand-200">
              <CheckCircle2 className="h-3.5 w-3.5" />
              Add-ons total · {formatPrice(extrasTotal, props.offer.currency)}
            </p>
          ) : null}
        </section>
      ) : null}

      {/* Promo code */}
      {promo ? (
        <div className="flex items-center justify-between rounded-2xl border border-emerald-400/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200 backdrop-blur-xl">
          <span className="inline-flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4" />
            <strong className="font-mono">{promo.code}</strong> applied — saves {formatPrice(promo.discount, props.offer.currency)}
          </span>
          <button type="button" onClick={onClearPromo} className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-300 hover:text-emerald-100">
            <X className="h-3.5 w-3.5" />
            Remove
          </button>
        </div>
      ) : (
        <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 backdrop-blur-xl">
          <span className="text-[10px] font-bold uppercase tracking-wider text-white/45">Promo code (optional)</span>
          <div className="mt-1.5 flex items-center gap-2">
            <div className="flex w-full items-center gap-2 rounded-xl bg-white px-3 py-2">
              <Tag className="h-4 w-4 text-ink-400 flex-shrink-0" />
              <input
                value={promoInput}
                onChange={e => setPromoInput(e.target.value.toUpperCase())}
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); void onApplyPromo(); } }}
                placeholder="WELCOME10"
                className="w-full bg-transparent font-mono text-base outline-none uppercase"
              />
            </div>
            <button
              type="button"
              onClick={onApplyPromo}
              disabled={promoBusy || !promoInput.trim()}
              className="shrink-0 rounded-xl bg-brand-500 px-3 py-1.5 text-xs font-bold text-white hover:bg-brand-600 disabled:opacity-40">
              {promoBusy ? 'Checking…' : 'Apply'}
            </button>
          </div>
          {promoError ? (
            <p className="mt-2 text-xs text-red-300">{promoError}</p>
          ) : null}
        </div>
      )}

      <label className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 cursor-pointer backdrop-blur-xl hover:border-white/20 transition">
        <input
          type="checkbox"
          checked={agreed}
          onChange={e => setAgreed(e.target.checked)}
          className="mt-0.5 h-4 w-4 rounded border-white/30 text-brand-500 focus:ring-brand-400 focus:ring-2 cursor-pointer flex-shrink-0"
        />
        <span className="text-xs leading-relaxed text-white/70">
          I have read and agree to the{' '}
          <Link href="/terms" target="_blank" className="font-semibold text-brand-300 hover:text-brand-200 underline-offset-2 hover:underline">Terms of Service</Link>
          {' '}and{' '}
          <Link href="/refunds" target="_blank" className="font-semibold text-brand-300 hover:text-brand-200 underline-offset-2 hover:underline">Refund Policy</Link>.
          I understand that <strong className="text-white">cancellations within 24 hours of pickup are non-refundable</strong>, and that
          customer no-show (more than 60 minutes late) is treated the same way.
        </span>
      </label>

      {error ? (
        <div className="inline-flex w-full items-start gap-2 rounded-2xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-300 backdrop-blur-xl">
          <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
          {error}
        </div>
      ) : null}

      <button
        type="submit"
        disabled={busy || !agreed}
        className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-brand-500 via-violet-500 to-fuchsia-500 px-5 py-3.5 text-sm font-semibold text-white shadow-glow transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50">
        {busy ? 'Preparing payment…' : (
          <>
            Continue to payment · {formatPrice(total, props.offer.currency)}
            <ArrowRight className="h-4 w-4" />
          </>
        )}
      </button>

      <p className="inline-flex items-center gap-1.5 text-xs text-white/45">
        <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
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
        <p className="rounded-lg border border-red-400/30 bg-red-500/10 px-3 py-2 text-xs text-red-300">{error}</p>
      ) : null}
      <button
        type="submit"
        disabled={!stripe || submitting}
        className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-brand-500 via-violet-500 to-fuchsia-500 px-5 py-3.5 text-sm font-semibold text-white shadow-glow transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50">
        <Lock className="h-4 w-4" />
        {submitting ? 'Processing…' : `Pay ${totalLabel}`}
      </button>
    </form>
  );
};

// Single add-on row. `mode='counter'` shows a +/− stepper (used
// for child seats where quantity matters); `mode='toggle'` shows
// a check pill (WiFi / water / etc. are typically yes-no).
const ExtraRowControl: React.FC<{
  title: string;
  subtitle?: string;
  quantity: number;
  onChange: (n: number) => void;
  mode?: 'counter' | 'toggle';
}> = ({ title, subtitle, quantity, onChange, mode = 'counter' }) => {
  const active = quantity > 0;
  return (
    <li className={`flex items-center justify-between gap-3 rounded-xl border px-3 py-2.5 transition ${active ? 'border-brand-400/40 bg-brand-500/10' : 'border-white/10 bg-white/[0.03]'}`}>
      <div className="min-w-0">
        <p className="truncate text-sm font-bold text-white">{title}</p>
        {subtitle ? <p className="truncate text-[11px] text-white/45">{subtitle}</p> : null}
      </div>
      {mode === 'toggle' ? (
        <button
          type="button"
          onClick={() => onChange(active ? 0 : 1)}
          className={`inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-bold transition ${active ? 'bg-brand-500 text-white hover:bg-brand-600' : 'bg-white/10 text-white/70 hover:bg-white/20'}`}>
          {active ? (<><CheckCircle2 className="h-3.5 w-3.5" /> Added</>) : (<><Plus className="h-3.5 w-3.5" /> Add</>)}
        </button>
      ) : (
        <div className="inline-flex items-center gap-1.5 rounded-full bg-white/5 p-1 ring-1 ring-white/15">
          <button
            type="button"
            onClick={() => onChange(quantity - 1)}
            disabled={quantity === 0}
            aria-label="Decrease"
            className="grid h-7 w-7 place-items-center rounded-full bg-white/10 text-white/70 hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-40">
            <Minus className="h-3.5 w-3.5" />
          </button>
          <span className="w-6 text-center text-sm font-bold tabular-nums text-white">{quantity}</span>
          <button
            type="button"
            onClick={() => onChange(quantity + 1)}
            disabled={quantity >= 3}
            aria-label="Increase"
            className="grid h-7 w-7 place-items-center rounded-full bg-brand-500 text-white hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-40">
            <Plus className="h-3.5 w-3.5" />
          </button>
        </div>
      )}
    </li>
  );
};

const Field: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <label className="block rounded-2xl border border-white/10 bg-white/[0.04] px-3.5 py-3 backdrop-blur-xl transition focus-within:border-brand-400/50">
    <span className="text-[10px] font-bold uppercase tracking-wider text-white/70">{label}</span>
    {/* Inputs forced to ink-900 by globals; the inner pill keeps a
        white surface under the control so the dark form stays legible. */}
    <div className="mt-1.5 rounded-xl bg-white px-3 py-2">{children}</div>
  </label>
);
