'use client';

// Refined sticky masthead. Solid white with subtle blur — works
// against both the dark hero photograph on the homepage and the
// light surfaces on every other route.

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/cn';

const NAV = [
  { href: '/how-it-works',  label: 'How it works' },
  { href: '/why-us',        label: 'Why us' },
  { href: '/destinations',  label: 'Destinations' },
  { href: '/partner',       label: 'For partners' },
];

export const SiteHeader: React.FC = () => {
  const pathname = usePathname() ?? '/';
  return (
    <header className="sticky top-0 z-30 border-b border-ink-100/60 bg-white/85 backdrop-blur supports-[backdrop-filter]:bg-white/70">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-6 px-6">
        <Link href="/" className="group inline-flex items-center gap-2.5">
          <span className="relative grid h-8 w-8 place-items-center overflow-hidden rounded-xl bg-brand-900 text-white shadow-sm">
            <span className="absolute inset-0 bg-gradient-to-br from-brand-500/40 via-transparent to-transparent transition group-hover:opacity-80" />
            <span className="relative text-[11px] font-black tracking-tighter">ST</span>
          </span>
          <span className="text-base font-extrabold tracking-tightest text-ink-900">
            Sinai<span className="text-brand-600">Taxi</span>
          </span>
          <span className="ml-0.5 rounded-full border border-ink-200 bg-ink-50 px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.15em] text-ink-600">
            Hourly
          </span>
        </Link>
        <nav className="hidden items-center gap-7 text-sm md:flex">
          {NAV.map(item => {
            const active = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'font-semibold transition',
                  active ? 'text-ink-900' : 'text-ink-600 hover:text-ink-900',
                )}>
                {item.label}
              </Link>
            );
          })}
          <Link
            href="#search"
            className="rounded-full bg-brand-600 px-4 py-2 text-xs font-bold uppercase tracking-[0.12em] text-white shadow-sm transition hover:bg-brand-700">
            Book now
          </Link>
        </nav>
      </div>
    </header>
  );
};
