import Link from 'next/link';

export const SiteHeader: React.FC = () => (
  <header className="sticky top-0 z-30 border-b border-ink-100 bg-white/80 backdrop-blur">
    <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
      <Link href="/" className="flex items-center gap-2 text-lg font-extrabold tracking-tighter">
        <span className="grid h-8 w-8 place-items-center rounded-xl bg-brand-500 text-white shadow-glow">
          ST
        </span>
        Sinai<span className="text-brand-500">Taxi</span>
        <span className="ml-1 rounded-full bg-ink-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-ink-600">
          Hourly
        </span>
      </Link>
      <nav className="hidden gap-6 text-sm font-medium text-ink-700 md:flex">
        <Link href="/how-it-works" className="hover:text-ink-900">How it works</Link>
        <Link href="/account" className="hover:text-ink-900">My rentals</Link>
        <Link href="https://esim.sinaitaxi.com" className="hover:text-ink-900">eSIM</Link>
      </nav>
    </div>
  </header>
);
