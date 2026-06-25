'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { BookOpen, Settings, ScrollText, ArrowRight, Loader2 } from 'lucide-react';
import { adminApi, type AdminStats } from '@/lib/admin-api';
import { AdminShell } from './AdminShell';

export default function AdminDashboardPage() {
  return (
    <AdminShell>
      <Dashboard />
    </AdminShell>
  );
}

const formatPrice = (n: number, currency = 'EUR'): string => {
  try { return new Intl.NumberFormat('en', { style: 'currency', currency }).format(n); }
  catch { return `${currency} ${n.toFixed(2)}`; }
};

const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    adminApi.stats()
      .then(setStats)
      .catch((e: Error) => setError(e.message));
  }, []);

  return (
    <div>
      <h1 className="text-3xl font-extrabold tracking-tighter">Ops dashboard</h1>
      <p className="mt-1 text-sm text-ink-500">Real-time view across all partners and customers.</p>

      {error ? <p className="mt-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p> : null}

      {!stats ? (
        <div className="mt-6 inline-flex items-center gap-2 text-sm text-ink-500">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading stats…
        </div>
      ) : (
        <>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Stat label="Pickups today"      value={stats.todayPickups} />
            <Stat label="Confirmed"          value={stats.statusCounts.confirmed} />
            <Stat label="In progress"        value={stats.statusCounts.started} />
            <Stat label="Cancelled / refunded" value={stats.statusCounts.cancelled} />
          </div>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Stat label="Pending payment" value={stats.statusCounts.pending} />
            <Stat label="This month bookings" value={stats.monthBookings} />
            <Stat label="This month gross" value={formatPrice(stats.monthGrossRevenue)} text />
          </div>
        </>
      )}

      <div className="mt-8 grid gap-4 lg:grid-cols-3">
        <ActionCard href="/admin/bookings"
          icon={<BookOpen className="h-5 w-5" />}
          title="All bookings"
          body="Search, filter, export. Issue refunds. Override cancellations." />
        <ActionCard href="/admin/audit-log"
          icon={<ScrollText className="h-5 w-5" />}
          title="Audit log"
          body="Every state change with actor + timestamp." />
        <ActionCard href="/admin/settings/countries"
          icon={<Settings className="h-5 w-5" />}
          title="Country settings"
          body="Commission % and overage rate per country." />
      </div>
    </div>
  );
};

const Stat: React.FC<{ label: string; value: number | string; text?: boolean }> = ({ label, value, text }) => (
  <div className="rounded-3xl border border-ink-100 bg-white p-5 shadow-soft">
    <div className="text-[10px] font-bold uppercase tracking-wider text-ink-500">{label}</div>
    <div className={text ? 'mt-1 text-xl font-extrabold tracking-tightest' : 'mt-1 text-3xl font-extrabold tracking-tightest'}>{value}</div>
  </div>
);

const ActionCard: React.FC<{ href: string; icon: React.ReactNode; title: string; body: string }> = ({ href, icon, title, body }) => (
  <Link href={href} className="block rounded-3xl border border-ink-100 bg-white p-5 shadow-soft transition hover:border-brand-200 hover:shadow-glow">
    <div className="grid h-10 w-10 place-items-center rounded-2xl bg-brand-50 text-brand-700">{icon}</div>
    <h3 className="mt-4 text-lg font-bold">{title}</h3>
    <p className="mt-1 text-sm leading-relaxed text-ink-600">{body}</p>
    <span className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-brand-600">
      Open <ArrowRight className="h-3.5 w-3.5" />
    </span>
  </Link>
);
