'use client';

// Auth-aware shell for all /partner pages. Verifies the session
// by calling /v1/partner/me on mount. On unauth → redirect to
// /partner/login; on auth → render children + a left-rail nav.
// Pages that don't require auth (login itself) skip the shell.

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { LayoutDashboard, ListPlus, BookOpen, LogOut, Loader2 } from 'lucide-react';
import { partnerApi, partnerSession, type PartnerIdentity, PartnerApiError } from '@/lib/partner-api';
import { cn } from '@/lib/cn';

interface Props {
  children: React.ReactNode;
}

export const PartnerShell: React.FC<Props> = ({ children }) => {
  const router = useRouter();
  const pathname = usePathname();
  const [partner, setPartner] = useState<PartnerIdentity | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!partnerSession.token) {
      router.replace('/partner/login');
      return;
    }
    partnerApi.me()
      .then(r => { setPartner(r.partner); setLoading(false); })
      .catch((e: PartnerApiError) => {
        if (e.status === 401) {
          partnerSession.clear();
          router.replace('/partner/login');
        } else {
          setLoading(false);
        }
      });
  }, [router]);

  const onLogout = async () => {
    try { await partnerApi.logout(); } catch { /* ignore */ }
    partnerSession.clear();
    router.replace('/partner/login');
  };

  if (loading) {
    return (
      <div className="min-h-[40vh] grid place-items-center">
        <div className="inline-flex items-center gap-2 text-ink-500">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading partner workspace…
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto grid max-w-6xl gap-6 px-6 py-10 lg:grid-cols-[220px_1fr]">
      <aside className="hidden lg:block">
        <div className="sticky top-24 space-y-2">
          <div className="rounded-2xl border border-ink-100 bg-white p-4 shadow-soft">
            <div className="text-[10px] font-bold uppercase tracking-wider text-ink-500">Signed in as</div>
            <div className="mt-1 text-sm font-bold text-ink-900 break-words">{partner?.fullName ?? '—'}</div>
            <div className="text-xs text-ink-500 break-words">{partner?.email}</div>
            <button
              onClick={onLogout}
              className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-ink-600 hover:text-ink-900">
              <LogOut className="h-3.5 w-3.5" />
              Sign out
            </button>
          </div>
          <nav className="rounded-2xl border border-ink-100 bg-white p-2 shadow-soft">
            <NavLink href="/partner" pathname={pathname} icon={<LayoutDashboard className="h-4 w-4" />}>Dashboard</NavLink>
            <NavLink href="/partner/rules" pathname={pathname} icon={<ListPlus className="h-4 w-4" />}>Price rules</NavLink>
            <NavLink href="/partner/bookings" pathname={pathname} icon={<BookOpen className="h-4 w-4" />}>Bookings</NavLink>
          </nav>
        </div>
      </aside>

      <main className="min-w-0">
        {/* Compact top bar on mobile — full-width nav so user can switch tabs. */}
        <div className="mb-5 flex items-center justify-between gap-2 lg:hidden">
          <nav className="flex gap-2 overflow-auto">
            <NavLink href="/partner" pathname={pathname} compact>Dashboard</NavLink>
            <NavLink href="/partner/rules" pathname={pathname} compact>Rules</NavLink>
            <NavLink href="/partner/bookings" pathname={pathname} compact>Bookings</NavLink>
          </nav>
          <button
            onClick={onLogout}
            className="rounded-xl bg-ink-100 px-3 py-1.5 text-xs font-semibold text-ink-700">
            Sign out
          </button>
        </div>
        {children}
      </main>
    </div>
  );
};

const NavLink: React.FC<{
  href: string;
  pathname: string | null;
  icon?: React.ReactNode;
  compact?: boolean;
  children: React.ReactNode;
}> = ({ href, pathname, icon, compact, children }) => {
  const active = pathname === href || (href !== '/partner' && pathname?.startsWith(href));
  if (compact) {
    return (
      <Link href={href} className={cn(
        'whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-semibold',
        active ? 'bg-ink-900 text-white' : 'bg-ink-100 text-ink-700 hover:text-ink-900',
      )}>
        {children}
      </Link>
    );
  }
  return (
    <Link href={href} className={cn(
      'flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium',
      active ? 'bg-brand-50 text-brand-700' : 'text-ink-700 hover:bg-ink-50',
    )}>
      {icon}
      {children}
    </Link>
  );
};
