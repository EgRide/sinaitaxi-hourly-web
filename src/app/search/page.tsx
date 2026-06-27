// Marketplace results page. Server-fetches /v1/offers, renders a
// sticky context bar with the trip summary, then a list of offer
// cards with editorial polish — large class imagery, partner
// strip, expanded specs, prominent Select.
import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import {
  Car, Clock, MapPin, Gauge, ArrowRight, AlertCircle,
  Tag, ShieldCheck, Receipt, Star, Users, Briefcase,
} from 'lucide-react';
import { SiteHeader } from '@/components/SiteHeader';
import { SiteFooter } from '@/components/SiteFooter';
import { WhatsAppFab } from '@/components/WhatsAppFab';
import { api, type OfferCard, type OffersResult } from '@/lib/api';

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
  // CSV of "YYYY-MM-DDTHH:MM,H" tuples — one per day — carrying
  // the full per-day schedule from the search form into checkout.
  daySchedule?: string;
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

export const metadata: Metadata = {
  title: 'Search results',
};

// Generic road shot used when an offer's class doesn't carry its
// own photoUrl (rare — only happens if PHP exposes a new ride-type
// before our curated photo mapping is updated).
const FALLBACK_PHOTO = 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=800&q=70&auto=format';

const formatPrice = (n: number, currency: string): string => {
  try {
    return new Intl.NumberFormat('en', { style: 'currency', currency }).format(n);
  } catch {
    return `${currency} ${n.toFixed(2)}`;
  }
};

const formatDateTime = (iso: string): string => {
  const d = new Date(iso);
  return d.toLocaleString('en', {
    weekday: 'short', day: 'numeric', month: 'short',
    hour: 'numeric', minute: '2-digit',
  });
};

export default async function SearchPage({ searchParams }: { searchParams: Params }) {
  const sp = await searchParams;

  const durationHours = sp.durationHours ? Number(sp.durationHours) : null;
  const daySchedule = parseDaySchedule(sp.daySchedule);
  const hoursPerDay = daySchedule
    ? daySchedule.map(d => d.hours)
    : (sp.hoursPerDay
      ? sp.hoursPerDay.split(',').map(s => Number(s)).filter(n => Number.isFinite(n) && n > 0)
      : null);
  const days = sp.days ? Number(sp.days) : (hoursPerDay?.length ?? null);

  let offersResult: OffersResult | null = null;
  let fetchError: string | null = null;
  if (sp.polygonId && durationHours && sp.pickupAt) {
    try {
      offersResult = await api.offers({
        polygonId: sp.polygonId,
        durationHours,
        pickupAt: sp.pickupAt,
      });
    } catch (e) {
      fetchError = (e as Error).message;
    }
  }

  const polygonName = offersResult?.query.polygonName ?? '—';
  const countryName = offersResult?.query.countryName ?? offersResult?.query.countryCode ?? '—';
  const offers = offersResult?.offers ?? [];

  return (
    <>
      <SiteHeader />
      <main className="bg-ink-50/40 min-h-[60vh]">
        {/* Context bar */}
        <section className="border-b border-ink-100 bg-white">
          <div className="mx-auto max-w-6xl px-6 py-7">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="min-w-0">
                <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-brand-600">Marketplace</span>
                <h1 className="mt-2 truncate text-3xl font-extrabold tracking-tightest sm:text-4xl">
                  Offers in <span className="text-brand-700">{polygonName}</span>
                </h1>
                <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-ink-600">
                  {sp.pickupAddress ? (
                    <span className="inline-flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5 text-ink-400" /> {sp.pickupAddress}</span>
                  ) : null}
                  {sp.pickupAt ? (
                    <span className="inline-flex items-center gap-1.5"><Clock className="h-3.5 w-3.5 text-ink-400" /> {formatDateTime(sp.pickupAt)}</span>
                  ) : null}
                  <span className="inline-flex items-center gap-1.5">
                    <Receipt className="h-3.5 w-3.5 text-ink-400" />
                    {durationHours} {durationHours === 1 ? 'hour' : 'hours'}
                    {hoursPerDay && days ? ` · ${days} days` : ''}
                  </span>
                  <span className="hidden text-ink-400 lg:inline">·</span>
                  <span className="inline-flex items-center gap-1.5"><ShieldCheck className="h-3.5 w-3.5 text-ink-400" /> {countryName}</span>
                </div>
              </div>
              <Link href="/" className="inline-flex items-center gap-1.5 self-start rounded-full border border-ink-200 bg-white px-4 py-2 text-xs font-bold uppercase tracking-[0.12em] text-ink-700 transition hover:border-ink-300 hover:text-ink-900 lg:self-auto">
                Edit search
              </Link>
            </div>

            {daySchedule && daySchedule.length > 1 ? (
              <ul className="mt-5 flex flex-wrap gap-2">
                {daySchedule.map((d, i) => {
                  const dt = new Date(`${d.date}T${d.time}`);
                  const label = dt.toLocaleString('en', {
                    weekday: 'short', day: 'numeric', month: 'short',
                    hour: 'numeric', minute: '2-digit',
                  });
                  return (
                    <li key={i} className="rounded-full bg-ink-100 px-3 py-1 text-xs font-semibold text-ink-800">
                      Day {i + 1} · {label} · {d.hours}h
                    </li>
                  );
                })}
              </ul>
            ) : hoursPerDay && hoursPerDay.length > 1 ? (
              <ul className="mt-5 flex flex-wrap gap-2">
                {hoursPerDay.map((h, i) => (
                  <li key={i} className="rounded-full bg-ink-100 px-3 py-1 text-xs font-semibold text-ink-800">
                    Day {i + 1} · {h} {h === 1 ? 'hour' : 'hours'}
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        </section>

        {/* Offers list */}
        <section className="mx-auto max-w-6xl px-6 py-10 lg:py-14">
          {fetchError ? (
            <ErrorPanel message={fetchError} />
          ) : offers.length === 0 ? (
            <EmptyState polygonName={polygonName} countryName={countryName} />
          ) : (
            <>
              <div className="flex flex-wrap items-center justify-between gap-3 pb-5">
                <p className="text-sm text-ink-600">
                  <span className="font-bold text-ink-900">{offers.length}</span>
                  {' '}{offers.length === 1 ? 'offer' : 'offers'} from the partner network · sorted by total price
                </p>
                <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-ink-500">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  Total shown = total at checkout
                </span>
              </div>

              <ol className="space-y-4">
                {offers.map((offer, idx) => (
                  <OfferRow key={offer.offerKey} offer={offer} rank={idx + 1} searchParams={sp} />
                ))}
              </ol>
            </>
          )}
        </section>
      </main>
      <SiteFooter />
      <WhatsAppFab />
    </>
  );
}

const OfferRow: React.FC<{ offer: OfferCard; rank: number; searchParams: SP }> = ({ offer, rank, searchParams }) => {
  const params = new URLSearchParams();
  for (const [k, v] of Object.entries(searchParams)) if (v !== undefined) params.set(k, v);
  params.set('offerKey', offer.offerKey);
  const checkoutHref = `/checkout?${params.toString()}`;
  const photo = offer.vehicleClass.photoUrl ?? FALLBACK_PHOTO;

  return (
    <li className="overflow-hidden rounded-3xl border border-ink-100 bg-white shadow-soft transition hover:shadow-glow">
      <div className="grid gap-0 md:grid-cols-[280px_1fr_auto]">
        {/* Photo — PHP serves car illustrations on transparent
            backgrounds, so use object-contain with padding to
            avoid cropping the wheels/body. */}
        <div className="relative aspect-[4/3] md:aspect-auto md:h-full bg-gradient-to-br from-ink-50 to-white">
          <Image
            src={photo}
            alt={`${offer.vehicleClass.label} class`}
            fill
            sizes="(min-width: 768px) 280px, 100vw"
            className="object-contain p-5"
            unoptimized
          />
          {rank === 1 ? (
            <span className="absolute left-4 top-4 inline-flex items-center gap-1 rounded-full bg-white/95 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.15em] text-brand-700 shadow-sm backdrop-blur">
              <Star className="h-3 w-3 fill-current" />
              Best price
            </span>
          ) : null}
        </div>

        {/* Body */}
        <div className="px-6 py-6">
          <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <h3 className="text-2xl font-extrabold tracking-tighter">{offer.vehicleClass.label}</h3>
            <span className="text-sm text-ink-500">{offer.vehicleClass.description} · {offer.vehicleClass.seats}</span>
          </div>
          {offer.ruleName ? (
            <p className="mt-1 inline-flex items-center gap-1.5 text-xs font-medium uppercase tracking-[0.12em] text-ink-500">
              <Tag className="h-3.5 w-3.5" />
              {offer.ruleName}
            </p>
          ) : null}

          <ul className="mt-5 grid gap-x-6 gap-y-2 text-sm text-ink-700 sm:grid-cols-2 lg:grid-cols-3">
            <li className="inline-flex items-center gap-1.5">
              <Gauge className="h-3.5 w-3.5 text-ink-400" />
              {offer.includedKm} km included
            </li>
            <li className="inline-flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5 text-ink-400" />
              {offer.includedKmPerHour} km / hour
            </li>
            <li className="inline-flex items-center gap-1.5">
              <Receipt className="h-3.5 w-3.5 text-ink-400" />
              Overage {formatPrice(offer.overageRatePerKm, offer.currency)}/km
            </li>
            <li className="inline-flex items-center gap-1.5">
              <Users className="h-3.5 w-3.5 text-ink-400" />
              {offer.vehicleClass.seats}
            </li>
            <li className="inline-flex items-center gap-1.5">
              <Briefcase className="h-3.5 w-3.5 text-ink-400" />
              Luggage room
            </li>
            <li className="inline-flex items-center gap-1.5">
              <ShieldCheck className="h-3.5 w-3.5 text-ink-400" />
              Free cancel 24h+
            </li>
          </ul>
        </div>

        {/* Price + CTA */}
        <div className="flex flex-col items-stretch justify-between gap-4 border-t border-ink-100 px-6 py-6 md:items-end md:border-l md:border-t-0">
          <div className="text-right">
            <div className="text-xs font-bold uppercase tracking-[0.12em] text-ink-500">Total</div>
            <div className="mt-1 text-3xl font-extrabold tracking-tightest text-ink-900">
              {formatPrice(offer.totalPrice, offer.currency)}
            </div>
            <div className="mt-1 text-[10px] uppercase tracking-[0.15em] text-ink-500">Paid in full at checkout</div>
          </div>
          <Link
            href={checkoutHref}
            className="inline-flex items-center justify-center gap-1.5 rounded-full bg-brand-600 px-5 py-3 text-sm font-bold uppercase tracking-[0.1em] text-white transition hover:bg-brand-700">
            Select
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </li>
  );
};

const ErrorPanel: React.FC<{ message: string }> = ({ message }) => (
  <div className="inline-flex w-full items-center gap-2 rounded-3xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
    <AlertCircle className="h-4 w-4" />
    {message}
  </div>
);

const EmptyState: React.FC<{ polygonName: string; countryName: string }> = ({ polygonName, countryName }) => (
  <div className="rounded-3xl border border-dashed border-ink-200 bg-white p-10 text-center">
    <span className="inline-flex items-center gap-2 rounded-full bg-ink-100 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-ink-700">
      No matches
    </span>
    <h2 className="mt-5 text-2xl font-extrabold tracking-tighter">No partners available for this search</h2>
    <p className="mt-3 mx-auto max-w-lg text-sm leading-relaxed text-ink-600">
      No partner is currently publishing prices for <strong>{polygonName}</strong> in {countryName}
      that match your pickup time and duration. Try a different time or area — or contact us via
      WhatsApp and we'll match you with a partner directly.
    </p>
    <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
      <Link href="/" className="inline-flex items-center gap-1.5 rounded-full bg-brand-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-brand-700">
        New search
        <ArrowRight className="h-4 w-4" />
      </Link>
      <a href="https://wa.me/441908380111" target="_blank" rel="noreferrer" className="text-sm font-semibold text-ink-700 hover:text-ink-900">
        WhatsApp support →
      </a>
    </div>
  </div>
);
