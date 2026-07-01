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
import { classTier, ClassBadge, tierBorderClass } from '@/components/ClassBadge';
import { Reveal } from '@/components/Reveal';

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
      <main className="relative isolate min-h-[60vh] bg-[#070912] text-white">
        <div aria-hidden className="absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute right-[-10%] top-[-10%] h-[34rem] w-[34rem] rounded-full bg-violet-600/15 blur-[130px]" />
          <div className="absolute bottom-[-25%] left-[-8%] h-[30rem] w-[30rem] rounded-full bg-brand-500/15 blur-[130px]" />
        </div>
        {/* Context bar */}
        <section className="border-b border-white/10 bg-white/[0.04] backdrop-blur-xl">
          <div className="mx-auto max-w-6xl px-6 py-7">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="min-w-0">
                <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-brand-300">Marketplace</span>
                <h1 className="mt-2 truncate text-3xl font-extrabold tracking-tightest text-white sm:text-4xl">
                  Offers in <span className="text-gradient">{polygonName}</span>
                </h1>
                <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-white/65">
                  {sp.pickupAddress ? (
                    <span className="inline-flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5 text-brand-300" /> {sp.pickupAddress}</span>
                  ) : null}
                  {sp.pickupAt ? (
                    <span className="inline-flex items-center gap-1.5"><Clock className="h-3.5 w-3.5 text-brand-300" /> {formatDateTime(sp.pickupAt)}</span>
                  ) : null}
                  <span className="inline-flex items-center gap-1.5">
                    <Receipt className="h-3.5 w-3.5 text-brand-300" />
                    {durationHours} {durationHours === 1 ? 'hour' : 'hours'}
                    {hoursPerDay && days ? ` · ${days} days` : ''}
                  </span>
                  <span className="hidden text-white/30 lg:inline">·</span>
                  <span className="inline-flex items-center gap-1.5"><ShieldCheck className="h-3.5 w-3.5 text-brand-300" /> {countryName}</span>
                </div>
              </div>
              <Link href="/" className="inline-flex items-center gap-1.5 self-start rounded-full border border-white/15 bg-white/5 px-4 py-2 text-xs font-bold uppercase tracking-[0.12em] text-white/80 backdrop-blur transition hover:border-white/30 hover:text-white lg:self-auto">
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
                    <li key={i} className="rounded-full border border-white/10 bg-white/[0.06] px-3 py-1 text-xs font-semibold text-white/80">
                      Day {i + 1} · {label} · {d.hours}h
                    </li>
                  );
                })}
              </ul>
            ) : hoursPerDay && hoursPerDay.length > 1 ? (
              <ul className="mt-5 flex flex-wrap gap-2">
                {hoursPerDay.map((h, i) => (
                  <li key={i} className="rounded-full border border-white/10 bg-white/[0.06] px-3 py-1 text-xs font-semibold text-white/80">
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
                <p className="text-sm text-white/65">
                  <span className="font-bold text-white">{offers.length}</span>
                  {' '}{offers.length === 1 ? 'vehicle option' : 'vehicle options'} ·{' '}
                  <span className="font-semibold text-emerald-400">one clear price per class</span>
                </p>
                <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-white/45">
                  <ShieldCheck className="h-3.5 w-3.5 text-brand-300" />
                  Total shown = total at checkout
                </span>
              </div>

              <div className="space-y-4">
                {offers.map((offer, idx) => (
                  <Reveal key={offer.offerKey} delay={Math.min(idx, 6) * 70}>
                    <OfferRow offer={offer} rank={idx + 1} searchParams={sp} />
                  </Reveal>
                ))}
              </div>
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
  const tier = classTier(offer.vehicleClass.slug, offer.vehicleClass.label);

  return (
    <article className={`group overflow-hidden rounded-3xl border ${tierBorderClass(tier)} bg-white/[0.05] backdrop-blur-xl transition hover:-translate-y-1 hover:bg-white/[0.07]`}>
      <div className="grid gap-0 md:grid-cols-[280px_1fr_auto]">
        {/* Photo — PHP serves car illustrations on transparent
            backgrounds, so use object-contain with padding to avoid
            cropping the wheels/body. The plate stays light so the
            transparent PNG reads against the dark card. */}
        <div className="relative aspect-[4/3] overflow-hidden bg-gradient-to-br from-white to-ink-100 md:aspect-auto md:h-full">
          <Image
            src={photo}
            alt={`${offer.vehicleClass.label} class`}
            fill
            sizes="(min-width: 768px) 280px, 100vw"
            className="object-contain p-5 transition duration-700 group-hover:scale-[1.04]"
            unoptimized
          />
          {rank === 1 ? (
            <span className="absolute left-4 top-4 inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-brand-500 via-violet-500 to-fuchsia-500 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.15em] text-white shadow-sm">
              <Star className="h-3 w-3 fill-current" />
              Best price
            </span>
          ) : null}
        </div>

        {/* Body */}
        <div className="px-6 py-6">
          <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <h3 className="text-2xl font-extrabold tracking-tighter text-white">{offer.vehicleClass.label}</h3>
            {tier ? <ClassBadge tier={tier} className="self-center" /> : null}
            <span className="text-sm text-white/45">{offer.vehicleClass.description} · {offer.vehicleClass.seats}</span>
          </div>
          {offer.ruleName ? (
            <p className="mt-1 inline-flex items-center gap-1.5 text-xs font-medium uppercase tracking-[0.12em] text-white/45">
              <Tag className="h-3.5 w-3.5 text-brand-300" />
              {offer.ruleName}
            </p>
          ) : null}

          <ul className="mt-5 grid gap-x-6 gap-y-2 text-sm text-white/65 sm:grid-cols-2 lg:grid-cols-3">
            <li className="inline-flex items-center gap-1.5">
              <Gauge className="h-3.5 w-3.5 text-brand-300" />
              {offer.includedKm} km included
            </li>
            <li className="inline-flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5 text-brand-300" />
              {offer.includedKmPerHour} km / hour
            </li>
            <li className="inline-flex items-center gap-1.5">
              <Receipt className="h-3.5 w-3.5 text-brand-300" />
              Overage {formatPrice(offer.overageRatePerKm, offer.currency)}/km
            </li>
            <li className="inline-flex items-center gap-1.5">
              <Users className="h-3.5 w-3.5 text-brand-300" />
              {offer.vehicleClass.seats}
            </li>
            <li className="inline-flex items-center gap-1.5">
              <Briefcase className="h-3.5 w-3.5 text-brand-300" />
              Luggage room
            </li>
            <li className="inline-flex items-center gap-1.5">
              <ShieldCheck className="h-3.5 w-3.5 text-brand-300" />
              Free cancel 24h+
            </li>
          </ul>
        </div>

        {/* Price + CTA */}
        <div className="flex flex-col items-stretch justify-between gap-4 border-t border-white/10 px-6 py-6 md:items-end md:border-l md:border-t-0">
          <div className="text-right">
            <div className="text-xs font-bold uppercase tracking-[0.12em] text-white/45">Total</div>
            <div className="mt-1 text-3xl font-extrabold tracking-tightest text-white">
              {formatPrice(offer.totalPrice, offer.currency)}
            </div>
            {offer.partnerCount > 1 ? (
              <div className="mt-1 text-[10px] font-bold uppercase tracking-[0.12em] text-emerald-400">
                {offer.partnerCount} partners available
              </div>
            ) : null}
            <div className="mt-1 text-[10px] uppercase tracking-[0.15em] text-white/45">Paid in full at checkout</div>
          </div>
          <Link
            href={checkoutHref}
            className="inline-flex items-center justify-center gap-1.5 rounded-full bg-gradient-to-r from-brand-500 via-violet-500 to-fuchsia-500 px-5 py-3 text-sm font-bold uppercase tracking-[0.1em] text-white shadow-glow transition hover:brightness-110">
            Select
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </article>
  );
};

const ErrorPanel: React.FC<{ message: string }> = ({ message }) => (
  <div className="inline-flex w-full items-center gap-2 rounded-3xl border border-red-400/30 bg-red-500/10 px-5 py-4 text-sm text-red-300 backdrop-blur-xl">
    <AlertCircle className="h-4 w-4" />
    {message}
  </div>
);

const EmptyState: React.FC<{ polygonName: string; countryName: string }> = ({ polygonName, countryName }) => (
  <div className="rounded-3xl border border-dashed border-white/15 bg-white/[0.04] p-10 text-center backdrop-blur-xl">
    <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-white/70">
      No matches
    </span>
    <h2 className="mt-5 text-2xl font-extrabold tracking-tighter text-white">No partners available for this search</h2>
    <p className="mt-3 mx-auto max-w-lg text-sm leading-relaxed text-white/65">
      No partner is currently publishing prices for <strong className="text-white">{polygonName}</strong> in {countryName}
      that match your pickup time and duration. Try a different time or area — or contact us via
      WhatsApp and we'll match you with a partner directly.
    </p>
    <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
      <Link href="/" className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-brand-500 via-violet-500 to-fuchsia-500 px-5 py-3 text-sm font-bold text-white shadow-glow transition hover:brightness-110">
        New search
        <ArrowRight className="h-4 w-4" />
      </Link>
      <a href="https://wa.me/441908380111" target="_blank" rel="noreferrer" className="text-sm font-semibold text-white/70 hover:text-white">
        WhatsApp support →
      </a>
    </div>
  </div>
);
