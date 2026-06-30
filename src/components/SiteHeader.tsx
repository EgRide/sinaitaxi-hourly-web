'use client';

// Refined sticky masthead. Dark translucent glass — sits on the
// 2026 near-black canvas, the wordmark + nav read in white, and the
// primary CTA carries the signature vivid gradient.

import Link from 'next/link';
import Image from 'next/image';
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
    <header className="sticky top-0 z-30 border-b border-white/10 bg-[#070912]/80 backdrop-blur supports-[backdrop-filter]:bg-[#070912]/70">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-6 px-6">
        <Link href="/" className="inline-flex items-center gap-2.5" aria-label="SinaiTaxi Hourly">
          <Image
            src="/sinaitaxi-logo-light.png"
            alt="SinaiTaxi"
            width={132}
            height={24}
            priority
            className="h-6 w-auto"
          />
          <span className="rounded-full border border-white/15 bg-white/10 px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.15em] text-white/80">
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
                  active ? 'text-white' : 'text-white/70 hover:text-white',
                )}>
                {item.label}
              </Link>
            );
          })}
          <Link
            href="/#search"
            className="rounded-full bg-gradient-to-r from-brand-500 via-violet-500 to-fuchsia-500 px-4 py-2 text-xs font-bold uppercase tracking-[0.12em] text-white shadow-sm transition hover:opacity-90">
            Book now
          </Link>
        </nav>
      </div>
    </header>
  );
};
