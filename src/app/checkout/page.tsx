// Phase 2 placeholder. Customer arrives here from the Select
// button on /search with the full query context + offerKey. The
// real Stripe Elements flow lands in Phase 2.
import Link from 'next/link';
import { SiteHeader } from '@/components/SiteHeader';
import { SiteFooter } from '@/components/SiteFooter';
import { WhatsAppFab } from '@/components/WhatsAppFab';

type Params = Promise<Record<string, string | undefined>>;

export default async function CheckoutPage({ searchParams }: { searchParams: Params }) {
  const sp = await searchParams;
  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-6 py-16">
        <span className="chip">Checkout</span>
        <h1 className="mt-3 text-3xl font-extrabold tracking-tighter">Almost there</h1>
        <p className="mt-1 text-sm text-ink-500">
          Phase 2 (Stripe checkout) is next. The selected offer key and your full search context
          travel here on the URL, so the real flow can be wired without changing anything upstream.
        </p>

        <div className="mt-8 rounded-3xl border border-ink-100 bg-white p-6 shadow-soft">
          <h2 className="text-[10px] font-bold uppercase tracking-wider text-ink-500">Selected offer</h2>
          <p className="mt-2 font-mono text-xs break-all text-ink-700">{sp.offerKey ?? '—'}</p>
        </div>

        <Link href="/" className="btn-secondary mt-6">
          Start a new search
        </Link>
      </main>
      <SiteFooter />
      <WhatsAppFab />
    </>
  );
}
