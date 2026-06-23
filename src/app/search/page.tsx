// Phase 1 placeholder — the real offer search lands in Phase 3.
// For now this page proves the search form actually round-trips
// country / polygon / address / duration data.
import { SiteHeader } from '@/components/SiteHeader';
import { SiteFooter } from '@/components/SiteFooter';
import { WhatsAppFab } from '@/components/WhatsAppFab';
import { api } from '@/lib/api';

type SP = {
  countryCode?: string;
  polygonId?: string;
  pickupAddress?: string;
  pickupAt?: string;
  durationHours?: string;
  pickupLat?: string;
  pickupLng?: string;
};
type Params = Promise<SP>;

export default async function SearchPage({ searchParams }: { searchParams: Params }) {
  const sp = await searchParams;

  // Resolve human-readable country + polygon names. We hit our
  // own catalog so the polygon-name → ID join happens server-side
  // and the page renders the named fields even on first paint.
  let countryName: string | null = null;
  let polygonName: string | null = null;
  if (sp.countryCode) {
    try {
      const r = await api.countries();
      countryName = r.countries.find(c => c.code === sp.countryCode)?.name ?? sp.countryCode;
    } catch { countryName = sp.countryCode; }
  }
  if (sp.countryCode && sp.polygonId) {
    try {
      const r = await api.polygons(sp.countryCode);
      polygonName = r.polygons.find(p => p.id === sp.polygonId)?.name ?? sp.polygonId;
    } catch { polygonName = sp.polygonId; }
  }

  const durationHours = sp.durationHours ? Number(sp.durationHours) : null;
  const durationLabel = durationHours
    ? durationHours % 24 === 0 && durationHours >= 24
      ? `${durationHours / 24} day${durationHours === 24 ? '' : 's'}`
      : `${durationHours} hour${durationHours === 1 ? '' : 's'}`
    : '—';

  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-6 py-16">
        <span className="chip">Search results</span>
        <h1 className="mt-3 text-3xl font-extrabold tracking-tighter">
          {polygonName ? <>Hourly rentals in <span className="text-brand-600">{polygonName}</span></> : 'Hourly rentals'}
        </h1>
        <p className="mt-1 text-sm text-ink-500">
          Phase 1 placeholder. Real offer cards land in Phase 3 once partner rules + offer search are wired.
        </p>

        <dl className="mt-8 grid gap-5 rounded-3xl border border-ink-100 bg-white p-6 shadow-soft sm:grid-cols-2">
          <Row label="Country" value={countryName ?? '—'} />
          <Row label="City / pickup area" value={polygonName ?? '—'} />
          <Row label="Pickup address" value={sp.pickupAddress || '—'} />
          <Row label="Pickup at" value={sp.pickupAt ? new Date(sp.pickupAt).toLocaleString() : '—'} />
          <Row label="Duration" value={durationLabel} />
          {sp.pickupLat && sp.pickupLng ? (
            <Row label="Pickup coords" value={`${Number(sp.pickupLat).toFixed(5)}, ${Number(sp.pickupLng).toFixed(5)}`} />
          ) : null}
        </dl>

        <div className="mt-8 rounded-3xl border border-dashed border-ink-200 bg-ink-50/50 p-6 text-center text-sm text-ink-600">
          <p className="font-semibold text-ink-900">Offers will appear here.</p>
          <p className="mt-1">Every partner rule covering this polygon × duration × pickup time will surface as a card, sorted by price ascending.</p>
        </div>
      </main>
      <SiteFooter />
      <WhatsAppFab />
    </>
  );
}

const Row: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div>
    <dt className="text-[10px] font-bold uppercase tracking-wider text-ink-500">{label}</dt>
    <dd className="mt-1 break-words text-base font-semibold text-ink-900">{value}</dd>
  </div>
);
