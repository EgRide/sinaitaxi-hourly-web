// Instant skeleton while /search server-fetches /v1/offers. Next renders
// this the moment the user taps "Search", so the jump from the form to
// results feels immediate instead of a blank pause.
import { SiteHeader } from '@/components/SiteHeader';

const CardSkeleton: React.FC = () => (
  <li className="overflow-hidden rounded-3xl border border-white/10 bg-white/[0.05] backdrop-blur-xl">
    <div className="grid gap-0 md:grid-cols-[280px_1fr_auto]">
      <div className="aspect-[4/3] animate-pulse bg-white/10 md:aspect-auto md:h-full" />
      <div className="space-y-3 px-6 py-6">
        <div className="h-7 w-44 animate-pulse rounded-lg bg-white/10" />
        <div className="h-4 w-60 animate-pulse rounded bg-white/10" />
        <div className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-4 w-28 animate-pulse rounded bg-white/10" />
          ))}
        </div>
      </div>
      <div className="flex flex-col items-end justify-between gap-4 border-t border-white/10 px-6 py-6 md:border-l md:border-t-0">
        <div className="h-9 w-24 animate-pulse rounded-lg bg-white/10" />
        <div className="h-10 w-28 animate-pulse rounded-full bg-white/10" />
      </div>
    </div>
  </li>
);

export default function SearchLoading() {
  return (
    <>
      <SiteHeader />
      <main className="min-h-screen bg-[#070912] text-white">
        <div className="mx-auto max-w-5xl px-6 py-10">
          <div className="h-5 w-36 animate-pulse rounded bg-white/10" />
          <div className="mt-3 h-8 w-72 animate-pulse rounded-lg bg-white/10" />
          <p className="mt-8 inline-flex items-center gap-2 text-sm font-medium text-white/60">
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/20 border-t-brand-400" />
            Finding the best partner prices near you…
          </p>
          <ol className="mt-5 space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <CardSkeleton key={i} />
            ))}
          </ol>
        </div>
      </main>
    </>
  );
}
