'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { LayoutDashboard, BookOpen, Settings, ScrollText, LogOut, Loader2, Tag, MapPin, Users, ListTree } from 'lucide-react';
import { adminApi, adminSession, type AdminIdentity, AdminApiError } from '@/lib/admin-api';
import { cn } from '@/lib/cn';

interface Props { children: React.ReactNode; }

export const AdminShell: React.FC<Props> = ({ children }) => {
  const router = useRouter();
  const pathname = usePathname();
  const [admin, setAdmin] = useState<AdminIdentity | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!adminSession.token) { router.replace('/admin/login'); return; }
    adminApi.me()
      .then(r => { setAdmin(r.admin); setLoading(false); })
      .catch((e: AdminApiError) => {
        if (e.status === 401 || e.status === 403) {
          adminSession.clear();
          router.replace('/admin/login');
        } else {
          setLoading(false);
        }
      });
  }, [router]);

  const onLogout = () => { adminSession.clear(); router.replace('/admin/login'); };

  if (loading) {
    return (
      <div className="min-h-[40vh] grid place-items-center">
        <div className="inline-flex items-center gap-2 text-ink-500">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading admin workspace…
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto grid max-w-6xl gap-6 px-6 py-10 lg:grid-cols-[220px_1fr]">
      <aside className="hidden lg:block">
        <div className="sticky top-24 space-y-2">
          <div className="rounded-2xl border border-ink-100 bg-white p-4 shadow-soft">
            <div className="text-[10px] font-bold uppercase tracking-wider text-ink-500">Ops</div>
            <div className="mt-1 text-sm font-bold text-ink-900 break-words">{admin?.fullName ?? '—'}</div>
            <div className="text-xs text-ink-500 break-words">{admin?.email}</div>
            <button onClick={onLogout} className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-ink-600 hover:text-ink-900">
              <LogOut className="h-3.5 w-3.5" />
              Sign out
            </button>
          </div>
          <nav className="rounded-2xl border border-ink-100 bg-white p-2 shadow-soft">
            <NavLink href="/admin" pathname={pathname} icon={<LayoutDashboard className="h-4 w-4" />}>Dashboard</NavLink>
            <NavLink href="/admin/bookings" pathname={pathname} icon={<BookOpen className="h-4 w-4" />}>Bookings</NavLink>
            <NavLink href="/admin/suppliers" pathname={pathname} icon={<Users className="h-4 w-4" />}>Suppliers</NavLink>
            <NavLink href="/admin/price-rules" pathname={pathname} icon={<ListTree className="h-4 w-4" />}>Price rules</NavLink>
            <NavLink href="/admin/promo-codes" pathname={pathname} icon={<Tag className="h-4 w-4" />}>Promo codes</NavLink>
            <NavLink href="/admin/destinations" pathname={pathname} icon={<MapPin className="h-4 w-4" />}>Destinations</NavLink>
            <NavLink href="/admin/audit-log" pathname={pathname} icon={<ScrollText className="h-4 w-4" />}>Audit log</NavLink>
            <NavLink href="/admin/settings/countries" pathname={pathname} icon={<Settings className="h-4 w-4" />}>Countries</NavLink>
          </nav>
        </div>
      </aside>

      <main className="min-w-0">
        <div className="mb-5 flex items-center justify-between gap-2 lg:hidden">
          <nav className="flex gap-2 overflow-auto">
            <NavLink href="/admin" pathname={pathname} compact>Dashboard</NavLink>
            <NavLink href="/admin/bookings" pathname={pathname} compact>Bookings</NavLink>
            <NavLink href="/admin/suppliers" pathname={pathname} compact>Suppliers</NavLink>
            <NavLink href="/admin/price-rules" pathname={pathname} compact>Rules</NavLink>
            <NavLink href="/admin/promo-codes" pathname={pathname} compact>Promos</NavLink>
            <NavLink href="/admin/destinations" pathname={pathname} compact>Destinations</NavLink>
            <NavLink href="/admin/audit-log" pathname={pathname} compact>Audit</NavLink>
            <NavLink href="/admin/settings/countries" pathname={pathname} compact>Countries</NavLink>
          </nav>
          <button onClick={onLogout} className="rounded-xl bg-ink-100 px-3 py-1.5 text-xs font-semibold text-ink-700">
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
  const active = pathname === href || (href !== '/admin' && pathname?.startsWith(href));
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
