// Checkout (Phase 2). Customer arrives from /search with the full
// query context + offerKey. We re-fetch /v1/offers server-side
// to surface the chosen card's summary (price, included KM, class)
// next to the form. The CheckoutForm client component owns the
// Stripe Elements flow + redirects to /orders/[id] on success.
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Car, Clock, Gauge } from 'lucide-react';
import { SiteHeader } from '@/components/SiteHeader';
import { SiteFooter } from '@/components/SiteFooter';
import { WhatsAppFab } from '@/components/WhatsAppFab';
import { api, type OfferCard } from '@/lib/api';
import { classTier, ClassBadge } from '@/components/ClassBadge';
import { CheckoutForm } from './CheckoutForm';

type SP = {
  countryCode?: string;
  polygonId?: string;
  pickupAddress?: string;
  pickupAt?: string;
  durationHours?: string;
  pickupLat?: string;
  pickupLng?: string;
  days?: string;
  hoursPerDay?: string;
  daySchedule?: string;
  offerKey?: string;
};
type Params = Promise<SP>;

interface ScheduledDay { date: string; time: string; hours: number; }

const parseDaySchedule = (raw: string | undefined): ScheduledDay[] | null => {
  if (!raw) return null;
  const out: ScheduledDay[] = [];
  for (const entry of raw.split(';')) {
    const [dt, h] = entry.split(',');
    if (!dt || !h) continue;
    const [date, time] = dt.split('T');
    if (!date || !time) continue;
    const hours = Number(h);
    if (!Number.isFinite(hours) || hours <= 0) continue;
    out.push({ date, time, hours });
  }
  return out.length ? out : null;
};

const formatPrice = (n: number, currency: string): string => {
  try {
    return new Intl.NumberFormat('en', { style: 'currency', currency }).format(n);
  } catch {
    return `${currency} ${n.toFixed(2)}`;
  }
};

export default async function CheckoutPage({ searchParams }: { searchParams: Params }) {
  const sp = await searchParams;
  const offerKey = sp.offerKey;
  const polygonId = sp.polygonId;
  const pickupAt = sp.pickupAt;
  const durationHours = sp.durationHours ? Number(sp.durationHours) : null;
  const countryCode = sp.countryCode;
  const pickupAddress = sp.pickupAddress;
  const daySchedule = parseDaySchedule(sp.daySchedule);
  const hoursPerDay = daySchedule
    ? daySchedule.map(d => d.hours)
    : (sp.hoursPerDay
      ? sp.hoursPerDay.split(',').map(s => Number(s)).filter(n => Number.isFinite(n) && n > 0)
      : null);

  // Required inputs missing → bounce to /search so the customer
  // restarts the funnel rather than seeing a broken page.
  if (!offerKey || !polygonId || !pickupAt || !durationHours || !countryCode || !pickupAddress) {
    redirect('/');
  }

  // Re-fetch the offers list and find the chosen card by offerKey.
  // We deliberately don't trust query params for price/class — the
  // backend's /v1/checkout will re-resolve the same data, but
  // showing the card next to the form needs us to call /v1/offers
  // once. If the offer disappeared (rule deactivated mid-funnel)
  // we surface a clear restart prompt.
  let offer: OfferCard | null = null;
  let offersError: string | null = null;
  try {
    const r = await api.offers({ polygonId, durationHours, pickupAt });
    offer = r.offers.find(o => o.offerKey === offerKey) ?? null;
  } catch (e) {
    offersError = (e as Error).message;
  }

  return (
    <>
      <SiteHeader />
      <main className="relative isolate min-h-screen bg-[#070912] text-white">
        <div aria-hidden className="absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute right-[-10%] top-[-8%] h-[34rem] w-[34rem] rounded-full bg-violet-600/15 blur-[130px]" />
          <div className="absolute bottom-[-20%] left-[-8%] h-[30rem] w-[30rem] rounded-full bg-brand-500/15 blur-[130px]" />
        </div>
        <div className="mx-auto max-w-5xl px-6 py-12">
        <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-brand-300 backdrop-blur">Checkout</span>
        <h1 className="mt-3 text-3xl font-extrabold tracking-tighter text-white">Complete your booking</h1>
        <p className="mt-1 text-sm text-white/60">
          You're paying the partner directly — Sinai Taxi processes the payment securely via Stripe.
        </p>

        {offersError ? (
          <p className="mt-6 inline-flex items-center gap-2 rounded-2xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-300 backdrop-blur-xl">
            {offersError}
          </p>
        ) : !offer ? (
          <div className="mt-8 rounded-3xl border border-dashed border-white/15 bg-white/[0.04] p-8 text-center backdrop-blur-xl">
            <h2 className="text-lg font-bold tracking-tight text-white">The offer you picked is no longer available</h2>
            <p className="mt-2 text-sm text-white/65">
              The partner may have edited their rule or your pickup time has passed their notice window.
              Start a new search to see live offers.
            </p>
            <Link href="/" className="mt-5 inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-brand-500 via-violet-500 to-fuchsia-500 px-5 py-3 text-sm font-semibold text-white shadow-glow transition hover:brightness-110">Start a new search</Link>
          </div>
        ) : (
          <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_360px]">
            <div className="rounded-3xl border border-white/10 bg-white/[0.05] p-6 backdrop-blur-xl">
              <CheckoutForm
                offer={offer}
                countryCode={countryCode!}
                polygonId={polygonId!}
                pickupAt={pickupAt!}
                pickupAddress={pickupAddress!}
                pickupLat={sp.pickupLat ? Number(sp.pickupLat) : null}
                pickupLng={sp.pickupLng ? Number(sp.pickupLng) : null}
                durationHours={durationHours!}
                hoursPerDay={hoursPerDay}
                daySchedule={daySchedule}
              />
            </div>

            <aside>
              <OfferSummary offer={offer} pickupAt={pickupAt!} pickupAddress={pickupAddress!} hoursPerDay={hoursPerDay} daySchedule={daySchedule} />
            </aside>
          </div>
        )}
        </div>
      </main>
      <SiteFooter />
      <WhatsAppFab />
    </>
  );
}

const OfferSummary: React.FC<{
  offer: OfferCard;
  pickupAt: string;
  pickupAddress: string;
  hoursPerDay: number[] | null;
  daySchedule: ScheduledDay[] | null;
}> = ({ offer, pickupAt, pickupAddress, hoursPerDay, daySchedule }) => (
  <div className="rounded-3xl border border-white/10 bg-white/[0.05] p-6 backdrop-blur-xl">
    <div className="flex items-center gap-3 border-b border-white/10 pb-4">
      <div className="grid h-11 w-11 place-items-center rounded-2xl bg-brand-500/15 text-brand-300">
        <Car className="h-5 w-5" />
      </div>
      <div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="text-lg font-bold text-white">{offer.vehicleClass.label}</div>
          {(() => { const t = classTier(offer.vehicleClass.slug, offer.vehicleClass.label); return t ? <ClassBadge tier={t} /> : null; })()}
        </div>
        <div className="text-xs text-white/50">{offer.vehicleClass.description} · {offer.vehicleClass.seats}</div>
      </div>
    </div>
    {offer.ruleName ? (
      <p className="mt-3 text-xs text-white/45">
        Operated by <span className="font-medium text-white/70">{offer.ruleName}</span>
      </p>
    ) : null}
    <dl className="mt-4 space-y-3 text-sm">
      <Row label="Pickup" value={new Date(pickupAt).toLocaleString()} />
      <Row label="Address" value={pickupAddress} />
      <Row label="Duration" value={
        hoursPerDay && hoursPerDay.length > 1
          ? `${hoursPerDay.reduce((s,h)=>s+h,0)}h across ${hoursPerDay.length} days`
          : null
      } />
      <Row label="Included" value={
        <span className="inline-flex items-center gap-1.5">
          <Gauge className="h-3.5 w-3.5 text-brand-300" />
          {offer.includedKm} km
        </span>
      } />
      <Row label="Overage" value={`${formatPrice(offer.overageRatePerKm, offer.currency)} / km`} />
    </dl>
    <div className="mt-5 flex items-end justify-between border-t border-white/10 pt-4">
      <span className="inline-flex items-center gap-1.5 text-xs uppercase tracking-wider text-white/45">
        <Clock className="h-3.5 w-3.5 text-brand-300" />
        Total
      </span>
      <span className="text-2xl font-extrabold tracking-tightest text-white">
        {formatPrice(offer.totalPrice, offer.currency)}
      </span>
    </div>
    {daySchedule && daySchedule.length > 1 ? (
      <div className="mt-5">
        <h3 className="text-[10px] font-bold uppercase tracking-wider text-white/45">Per-day schedule</h3>
        <ul className="mt-2 space-y-1.5 text-xs">
          {daySchedule.map((d, i) => {
            const dt = new Date(`${d.date}T${d.time}`);
            const label = dt.toLocaleString('en', { weekday: 'short', day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' });
            return (
              <li key={i} className="flex items-center justify-between gap-3 rounded-xl bg-white/[0.06] px-3 py-1.5 font-medium text-white/80">
                <span>Day {i + 1} · {label}</span>
                <span className="font-bold text-white">{d.hours}h</span>
              </li>
            );
          })}
        </ul>
      </div>
    ) : hoursPerDay && hoursPerDay.length > 1 ? (
      <div className="mt-5">
        <h3 className="text-[10px] font-bold uppercase tracking-wider text-white/45">Per-day schedule</h3>
        <ul className="mt-2 flex flex-wrap gap-2 text-xs">
          {hoursPerDay.map((h, i) => (
            <li key={i} className="rounded-full bg-white/[0.06] px-3 py-1 font-medium text-white/80">
              Day {i + 1} · {h}h
            </li>
          ))}
        </ul>
      </div>
    ) : null}
  </div>
);

const Row: React.FC<{ label: string; value: React.ReactNode }> = ({ label, value }) => {
  if (value === null || value === undefined || value === '') return null;
  return (
    <div className="flex items-start justify-between gap-3">
      <dt className="text-[10px] font-bold uppercase tracking-wider text-white/45">{label}</dt>
      <dd className="text-right text-sm font-medium text-white/90">{value}</dd>
    </div>
  );
};
