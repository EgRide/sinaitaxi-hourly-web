'use client';

// Admin analytics dashboard. One screen, one query window. KPIs
// across the top → revenue/bookings chart + funnel side-by-side →
// 3 leaderboards → activity feed + pending actions.

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Loader2, AlertCircle, BookOpen, Users, MapPin, Car, Receipt,
  DollarSign, ShoppingBag, BarChart3, TrendingUp, Calendar,
  AlertTriangle, RefreshCw, Activity,
} from 'lucide-react';
import { adminApi, type AdminDashboard } from '@/lib/admin-api';
import {
  KpiCard, PeriodChips, RevenueChart, Leaderboard, Funnel, ActivityFeed,
} from '@/components/dashboard/DashboardKit';
import { AdminShell } from './AdminShell';

const PERIODS = [
  { id: '7d',  label: '7d',  days: 7  },
  { id: '30d', label: '30d', days: 30 },
  { id: '90d', label: '90d', days: 90 },
];

const fmtMoney = (n: number): string => `EUR ${n.toLocaleString('en', { maximumFractionDigits: 0 })}`;
const fmtCount = (n: number): string => n.toLocaleString('en');

export default function AdminDashboardPage() {
  return (
    <AdminShell>
      <Dashboard />
    </AdminShell>
  );
}

const Dashboard: React.FC = () => {
  const [days, setDays] = useState(30);
  const [data, setData] = useState<AdminDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = (d: number) => {
    setLoading(true);
    return adminApi.dashboard(d)
      .then(r => { setData(r); setError(null); })
      .catch(err => setError((err as Error).message))
      .finally(() => setLoading(false));
  };
  useEffect(() => { void reload(days); }, [days]);

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tightest text-ink-900">Ops dashboard</h1>
          <p className="mt-1 text-sm text-ink-500">
            Real-time view across all suppliers, polygons and bookings.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <PeriodChips options={PERIODS} value={days} onChange={setDays} />
          <button
            onClick={() => void reload(days)}
            disabled={loading}
            className="inline-flex items-center gap-1.5 rounded-full bg-ink-100 px-3 py-1.5 text-xs font-bold text-ink-700 hover:bg-ink-200 disabled:opacity-50">
            {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
          </button>
        </div>
      </header>

      {error ? (
        <div className="inline-flex w-full items-start gap-2 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <AlertCircle className="h-4 w-4 mt-0.5" />
          {error}
        </div>
      ) : null}

      {!data && loading ? (
        <div className="rounded-2xl border border-ink-100 bg-white p-12 text-center text-sm text-ink-500">
          <Loader2 className="mx-auto h-6 w-6 animate-spin" />
          <p className="mt-3">Loading dashboard…</p>
        </div>
      ) : data ? (
        <>
          {/* KPI strip */}
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <KpiCard
              label="Revenue"
              icon={<DollarSign className="h-4 w-4" />}
              value={fmtMoney(data.kpis.revenue.current)}
              delta={data.kpis.revenue}
              series={data.series.map(s => s.revenue)}
              tone="brand"
            />
            <KpiCard
              label="Bookings"
              icon={<ShoppingBag className="h-4 w-4" />}
              value={fmtCount(data.kpis.bookings.current)}
              delta={data.kpis.bookings}
              series={data.series.map(s => s.bookings)}
              tone="violet"
            />
            <KpiCard
              label="Commission"
              icon={<TrendingUp className="h-4 w-4" />}
              value={fmtMoney(data.kpis.commission.current)}
              delta={data.kpis.commission}
              series={data.series.map(s => s.revenue * 0.2)}
              tone="emerald"
            />
            <KpiCard
              label="AOV"
              icon={<BarChart3 className="h-4 w-4" />}
              value={fmtMoney(data.kpis.aov.current)}
              delta={data.kpis.aov}
              tone="amber"
            />
          </div>

          {/* Quick pulse + actions */}
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <PulseCard
              icon={<Calendar className="h-4 w-4" />}
              label="Pickups today"
              value={data.kpis.todayPickups}
              href="/admin/bookings"
            />
            <PulseCard
              icon={<Calendar className="h-4 w-4" />}
              label="Pickups tomorrow"
              value={data.kpis.tomorrowPickups}
              href="/admin/bookings"
            />
            <PulseCard
              icon={<AlertTriangle className="h-4 w-4" />}
              label="Stuck pending"
              value={data.pending.bookingsStuck}
              href="/admin/bookings?status=pending"
              tone={data.pending.bookingsStuck > 0 ? 'rose' : 'ink'}
            />
            <PulseCard
              icon={<Receipt className="h-4 w-4" />}
              label="Refunds pending"
              value={data.pending.refundsPending}
              href="/admin/bookings?status=cancelled"
              tone={data.pending.refundsPending > 0 ? 'amber' : 'ink'}
            />
          </div>

          {/* Chart + Funnel */}
          <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
            <RevenueChart data={data.series} currency="EUR" />
            <Funnel funnel={data.funnel} />
          </div>

          {/* Leaderboards */}
          <div className="grid gap-4 lg:grid-cols-3">
            <Leaderboard
              title="Top suppliers"
              icon={<Users className="h-4 w-4" />}
              currency="EUR"
              rows={data.leaderboards.suppliers.map(s => ({
                key: s.partnerPhpId,
                label: `#${s.partnerPhpId}`,
                bookings: s.bookings,
                revenue: s.revenue,
              }))}
            />
            <Leaderboard
              title="Top destinations"
              icon={<MapPin className="h-4 w-4" />}
              currency="EUR"
              rows={data.leaderboards.polygons.map(p => ({
                key: p.phpId,
                label: p.name,
                sub: p.countryCode ?? undefined,
                bookings: p.bookings,
                revenue: p.revenue,
              }))}
            />
            <Leaderboard
              title="Top vehicle classes"
              icon={<Car className="h-4 w-4" />}
              currency="EUR"
              rows={data.leaderboards.vehicleClasses.map(c => ({
                key: c.slug,
                label: c.name,
                bookings: c.bookings,
                revenue: c.revenue,
              }))}
            />
          </div>

          {/* Activity + quick links */}
          <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
            <ActivityFeed items={data.activity} />
            <QuickLinks />
          </div>
        </>
      ) : null}
    </div>
  );
};

const PulseCard: React.FC<{
  icon: React.ReactNode;
  label: string;
  value: number;
  href: string;
  tone?: 'ink' | 'rose' | 'amber';
}> = ({ icon, label, value, href, tone = 'ink' }) => (
  <Link
    href={href}
    className={`group flex items-center gap-3 rounded-2xl border bg-white p-4 shadow-soft transition hover:shadow-glow ${
      tone === 'rose' ? 'border-rose-200 hover:border-rose-300'
      : tone === 'amber' ? 'border-amber-200 hover:border-amber-300'
      : 'border-ink-100 hover:border-brand-300'
    }`}>
    <span className={`grid h-9 w-9 place-items-center rounded-xl ${
      tone === 'rose' ? 'bg-rose-50 text-rose-700'
      : tone === 'amber' ? 'bg-amber-50 text-amber-700'
      : 'bg-brand-50 text-brand-700'
    }`}>
      {icon}
    </span>
    <div className="min-w-0">
      <p className="text-[10px] font-bold uppercase tracking-wider text-ink-500">{label}</p>
      <p className="text-2xl font-extrabold tracking-tight text-ink-900">{value}</p>
    </div>
  </Link>
);

const QuickLinks: React.FC = () => (
  <div className="rounded-3xl border border-ink-100 bg-white p-6 shadow-soft">
    <h3 className="text-base font-bold text-ink-900">Quick links</h3>
    <ul className="mt-4 space-y-2 text-sm">
      <QuickItem href="/admin/bookings" icon={<BookOpen className="h-4 w-4" />} label="All bookings" />
      <QuickItem href="/admin/suppliers" icon={<Users className="h-4 w-4" />} label="Suppliers" />
      <QuickItem href="/admin/destinations" icon={<MapPin className="h-4 w-4" />} label="Destinations content" />
      <QuickItem href="/admin/promo-codes" icon={<Activity className="h-4 w-4" />} label="Promo codes" />
      <QuickItem href="/admin/settings/countries" icon={<BarChart3 className="h-4 w-4" />} label="Country settings" />
    </ul>
  </div>
);

const QuickItem: React.FC<{ href: string; icon: React.ReactNode; label: string }> = ({ href, icon, label }) => (
  <li>
    <Link href={href} className="flex items-center gap-3 rounded-xl px-3 py-2 text-ink-700 transition hover:bg-ink-50 hover:text-ink-900">
      <span className="grid h-7 w-7 place-items-center rounded-lg bg-ink-50 text-ink-600">{icon}</span>
      <span className="font-semibold">{label}</span>
    </Link>
  </li>
);
