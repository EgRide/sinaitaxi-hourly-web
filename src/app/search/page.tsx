// Phase 0 stub for the offer results page. Customer lands here
// from the homepage search form; Phase 3 wires the real
// `/v1/offers` call and renders offer cards.
import { SiteHeader } from '@/components/SiteHeader';
import { SiteFooter } from '@/components/SiteFooter';
import { WhatsAppFab } from '@/components/WhatsAppFab';

type Params = Promise<{ pickup?: string; pickupAt?: string; durationHours?: string }>;

export default async function SearchPage({ searchParams }: { searchParams: Params }) {
  const sp = await searchParams;
  const pickup = sp.pickup ?? '—';
  const pickupAt = sp.pickupAt ?? '—';
  const durationHours = sp.durationHours ?? '—';

  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-4xl px-6 py-16">
        <h1 className="text-3xl font-extrabold tracking-tighter">Search results</h1>
        <p className="mt-1 text-sm text-ink-500">
          Phase 0 placeholder — real offer cards land in Phase 3.
        </p>
        <dl className="mt-8 grid gap-4 rounded-3xl border border-ink-100 bg-white p-6 shadow-soft sm:grid-cols-3">
          <Row label="Pickup" value={pickup} />
          <Row label="Pickup at" value={pickupAt} />
          <Row label="Duration (hours)" value={durationHours} />
        </dl>
      </main>
      <SiteFooter />
      <WhatsAppFab />
    </>
  );
}

const Row: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div>
    <dt className="text-[10px] font-bold uppercase tracking-wider text-ink-500">{label}</dt>
    <dd className="mt-1 text-base font-semibold text-ink-900 break-words">{value}</dd>
  </div>
);
