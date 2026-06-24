// Marketplace results page. Server-fetches /v1/offers and renders
// one card per (active rule × vehicle class) matching the query.
// "Select" links into checkout (Phase 2 will replace the placeholder).
import type { Metadata } from 'next';
import Link from 'next/link';
import { Car, Clock, MapPin, Gauge, ArrowRight, AlertCircle, Tag } from 'lucide-react';
import { SiteHeader } from '@/components/SiteHeader';
import { SiteFooter } from '@/components/SiteFooter';
import { WhatsAppFab } from '@/components/WhatsAppFab';
import { api, type OfferCard, type OffersResult } from '@/lib/api';
import { cn } from '@/lib/cn';

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
};
type Params = Promise<SP>;

export const metadata: Metadata = {
  title: 'Search results',
};

const formatPrice = (n: number, currency: string): string => {
  try {
    return new Intl.NumberFormat('en', { style: 'currency', currency }).format(n);
  } catch {
    return `${currency} ${n.toFixed(2)}`;
  }
};

export default async function SearchPage({ searchParams }: { searchParams: Params }) {
  const sp = await searchParams;

  const durationHours = sp.durationHours ? Number(sp.durationHours) : null;
  const hoursPerDay = sp.hoursPerDay
    ? sp.hoursPerDay.split(',').map(s => Number(s)).filter(n => Number.isFinite(n) && n > 0)
    : null;
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

  const durationLabel = durationHours
    ? hoursPerDay && days
      ? `${durationHours} hours across ${days} day${days === 1 ? '' : 's'}`
      : `${durationHours} hour${durationHours === 1 ? '' : 's'}`
    : '—';

  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-5xl px-6 py-12">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <span className="chip">Search results</span>
            <h1 className="mt-3 text-3xl font-extrabold tracking-tighter">
              Hourly rentals in <span className="text-brand-600">{polygonName}</span>
            </h1>
            <p className="mt-1 text-sm text-ink-500">
              {sp.pickupAddress ? <>Pickup at <span className="font-medium text-ink-800">{sp.pickupAddress}</span> · </> : null}
              {sp.pickupAt ? new Date(sp.pickupAt).toLocaleString() : '—'} · {durationLabel} · {countryName}
            </p>
          </div>
          <Link href="/" className="btn-secondary !py-2 !px-4 !text-sm">
            New search
          </Link>
        </div>

        {hoursPerDay && hoursPerDay.length > 1 ? (
          <div className="mt-6 rounded-3xl border border-ink-100 bg-white px-5 py-4 shadow-soft">
            <h2 className="text-[10px] font-bold uppercase tracking-wider text-ink-500">Per-day schedule</h2>
            <ul className="mt-2 flex flex-wrap gap-2 text-xs">
              {hoursPerDay.map((h, i) => (
                <li key={i} className="rounded-full bg-ink-100 px-3 py-1 font-medium text-ink-800">
                  Day {i + 1} · {h} {h === 1 ? 'hour' : 'hours'}
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        {fetchError ? (
          <ErrorPanel message={fetchError} />
        ) : offers.length === 0 ? (
          <EmptyState polygonName={polygonName} countryName={countryName} />
        ) : (
          <div className="mt-8 space-y-3">
            <p className="text-sm text-ink-500">
              {offers.length} {offers.length === 1 ? 'offer' : 'offers'} available · sorted by price
            </p>
            {offers.map(offer => (
              <Card key={offer.offerKey} offer={offer} searchParams={sp} />
            ))}
          </div>
        )}
      </main>
      <SiteFooter />
      <WhatsAppFab />
    </>
  );
}

const Card: React.FC<{ offer: OfferCard; searchParams: SP }> = ({ offer, searchParams }) => {
  // Keep the customer's full search context on the checkout link
  // so the next page can render summary + confirmation without
  // re-querying.
  const params = new URLSearchParams();
  for (const [k, v] of Object.entries(searchParams)) {
    if (v !== undefined) params.set(k, v);
  }
  params.set('offerKey', offer.offerKey);
  const checkoutHref = `/checkout?${params.toString()}`;

  return (
    <div className="grid items-center gap-4 rounded-3xl border border-ink-100 bg-white p-5 shadow-soft sm:grid-cols-[1fr_auto]">
      <div className="flex items-start gap-4">
        <div className={cn(
          'grid h-12 w-12 flex-shrink-0 place-items-center rounded-2xl',
          'bg-brand-50 text-brand-700',
        )}>
          <Car className="h-6 w-6" />
        </div>
        <div className="min-w-0">
          <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <h3 className="text-lg font-bold tracking-tight">{offer.vehicleClass.label}</h3>
            <span className="text-sm text-ink-500">{offer.vehicleClass.description} · {offer.vehicleClass.seats}</span>
          </div>
          {offer.ruleName ? (
            <p className="mt-1 inline-flex items-center gap-1.5 text-xs text-ink-500">
              <Tag className="h-3.5 w-3.5" />
              {offer.ruleName}
            </p>
          ) : null}
          <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-ink-600">
            <li className="inline-flex items-center gap-1.5">
              <Gauge className="h-3.5 w-3.5" />
              {offer.includedKm} km included
            </li>
            <li className="inline-flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5" />
              {offer.includedKmPerHour} km / hour
            </li>
            <li className="inline-flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5" />
              Overage {formatPrice(offer.overageRatePerKm, offer.currency)} / km
            </li>
          </ul>
        </div>
      </div>
      <div className="flex items-center justify-between gap-3 border-t border-ink-100 pt-4 sm:flex-col sm:items-end sm:border-0 sm:pt-0">
        <div className="text-right">
          <div className="text-3xl font-extrabold tracking-tightest">
            {formatPrice(offer.totalPrice, offer.currency)}
          </div>
          <div className="text-xs text-ink-500">total · paid in full at checkout</div>
        </div>
        <Link href={checkoutHref} className="btn-primary !px-5 !py-2.5 !text-sm">
          Select
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
};

const ErrorPanel: React.FC<{ message: string }> = ({ message }) => (
  <div className="mt-8 inline-flex w-full items-center gap-2 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
    <AlertCircle className="h-4 w-4" />
    {message}
  </div>
);

const EmptyState: React.FC<{ polygonName: string; countryName: string }> = ({ polygonName, countryName }) => (
  <div className="mt-8 rounded-3xl border border-dashed border-ink-200 bg-ink-50/50 p-8 text-center">
    <h2 className="text-lg font-bold tracking-tight">No partners available for this search yet</h2>
    <p className="mt-2 text-sm leading-relaxed text-ink-600">
      No partner is currently publishing prices for <strong>{polygonName}</strong> in {countryName}
      that match your pickup time and duration. Try adjusting the time, duration, or pickup area —
      or contact us via WhatsApp and we'll match you with a partner directly.
    </p>
    <div className="mt-5">
      <Link href="/" className="btn-primary">
        New search
      </Link>
    </div>
  </div>
);
