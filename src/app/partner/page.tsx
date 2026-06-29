'use client';

// Partner analytics dashboard. Same primitives as the admin one,
// scoped to the calling partner's bookings.

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Loader2, AlertCircle, ListPlus, BookOpen, Calendar, DollarSign,
  ShoppingBag, BarChart3, RefreshCw, Wallet,
  MapPin, Car, Award, Phone, Clock, AlertTriangle,
} from 'lucide-react';
import { partnerApi, type PartnerDashboard } from '@/lib/partner-api';
import {
  KpiCard, PeriodChips, RevenueChart, Leaderboard, Funnel,
} from '@/components/dashboard/DashboardKit';
import { PartnerShell } from './PartnerShell';

const PERIODS = [
  { id: '7d',  label: '7d',  days: 7  },
  { id: '30d', label: '30d', days: 30 },
  { id: '90d', label: '90d', days: 90 },
];

const fmtMoney = (n: number): string => `EUR ${n.toLocaleString('en', { maximumFractionDigits: 0 })}`;
const fmtCount = (n: number): string => n.toLocaleString('en');

export default function PartnerDashboardPage() {
  return (
    <PartnerShell>
      <Dashboard />
    </PartnerShell>
  );
}

const Dashboard: React.FC = () => {
  const [days, setDays] = useState(30);
  const [data, setData] = useState<PartnerDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = (d: number) => {
    setLoading(true);
    return partnerApi.dashboard(d)
      .then(r => { setData(r); setError(null); })
      .catch(err => setError((err as Error).message))
      .finally(() => setLoading(false));
  };
  useEffect(() => { void reload(days); }, [days]);

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tightest text-ink-900">Your dashboard</h1>
          <p className="mt-1 text-sm text-ink-500">
            Earnings, upcoming trips, and how you compare to peers in your market.
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
              label="Your earnings"
              icon={<DollarSign className="h-4 w-4" />}
              value={fmtMoney(data.kpis.earnings.current)}
              delta={data.kpis.earnings}
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
              label="Avg booking value"
              icon={<BarChart3 className="h-4 w-4" />}
              value={fmtMoney(data.kpis.avgBookingValue.current)}
              delta={data.kpis.avgBookingValue}
              tone="emerald"
            />
            <SettlementCard
              monthToDate={data.settlement.monthToDateWholesale}
              bookings={data.settlement.monthToDateBookings}
              nextOn={data.settlement.nextSettlementOn}
            />
          </div>

          {/* Quick pulse */}
          <div className="grid gap-3 sm:grid-cols-3">
            <PulseCard
              icon={<Calendar className="h-4 w-4" />}
              label="Pickups today"
              value={data.kpis.todayPickups}
              href="/partner/bookings"
            />
            <PulseCard
              icon={<Calendar className="h-4 w-4" />}
              label="Pickups tomorrow"
              value={data.kpis.tomorrowPickups}
              href="/partner/bookings"
            />
            <PulseCard
              icon={<AlertTriangle className="h-4 w-4" />}
              label="Drivers to assign"
              value={data.driversToAssign.length}
              href="/partner/bookings"
              tone={data.driversToAssign.length > 0 ? 'amber' : 'ink'}
            />
          </div>

          {/* Chart + Funnel */}
          <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
            <RevenueChart data={data.series} currency="EUR" />
            <Funnel funnel={data.funnel} />
          </div>

          {/* Trips today + drivers-to-assign */}
          <div className="grid gap-4 lg:grid-cols-2">
            <TripsCard title="Trips today" trips={data.tripsToday} />
            <ActionQueueCard items={data.driversToAssign} />
          </div>

          {/* Leaderboards + benchmark */}
          <div className="grid gap-4 lg:grid-cols-3">
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
            <PeerBenchmarkCard data={data.peerBenchmark} />
          </div>

          {/* Quick links */}
          <div className="grid gap-3 sm:grid-cols-2">
            <Link href="/partner/rules" className="group flex items-center gap-3 rounded-2xl border border-ink-100 bg-white p-5 shadow-soft transition hover:border-brand-300 hover:shadow-glow">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-brand-50 text-brand-700">
                <ListPlus className="h-5 w-5" />
              </span>
              <div className="min-w-0">
                <p className="text-base font-bold text-ink-900">Manage your rules</p>
                <p className="text-xs text-ink-500">Price per class, polygons covered, margin hours.</p>
              </div>
            </Link>
            <Link href="/partner/bookings" className="group flex items-center gap-3 rounded-2xl border border-ink-100 bg-white p-5 shadow-soft transition hover:border-brand-300 hover:shadow-glow">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-brand-50 text-brand-700">
                <BookOpen className="h-5 w-5" />
              </span>
              <div className="min-w-0">
                <p className="text-base font-bold text-ink-900">All bookings</p>
                <p className="text-xs text-ink-500">Search, assign drivers, complete trips.</p>
              </div>
            </Link>
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

const SettlementCard: React.FC<{ monthToDate: number; bookings: number; nextOn: string }> = ({ monthToDate, bookings, nextOn }) => (
  <div className="relative overflow-hidden rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50 to-white p-5 shadow-soft">
    <div className="flex items-center justify-between">
      <span className="grid h-9 w-9 place-items-center rounded-xl bg-emerald-100 text-emerald-700">
        <Wallet className="h-4 w-4" />
      </span>
      <span className="rounded-full bg-white/80 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-700">
        Next settlement
      </span>
    </div>
    <p className="mt-3 text-[10px] font-bold uppercase tracking-wider text-emerald-700">Month to date</p>
    <p className="mt-0.5 truncate text-2xl font-extrabold tracking-tight text-ink-900">{fmtMoney(monthToDate)}</p>
    <p className="mt-2 text-xs text-ink-600">
      {bookings} {bookings === 1 ? 'booking' : 'bookings'} · settles {new Date(nextOn).toLocaleDateString('en', { month: 'short', day: 'numeric' })}
    </p>
  </div>
);

const TripsCard: React.FC<{ title: string; trips: PartnerDashboard['tripsToday'] }> = ({ title, trips }) => (
  <div className="rounded-3xl border border-ink-100 bg-white p-6 shadow-soft">
    <div className="mb-4 flex items-center justify-between gap-2">
      <h3 className="text-base font-bold text-ink-900">{title}</h3>
      <span className="text-xs font-semibold text-ink-500">{trips.length} {trips.length === 1 ? 'trip' : 'trips'}</span>
    </div>
    {trips.length === 0 ? (
      <p className="rounded-2xl border border-dashed border-ink-200 px-4 py-6 text-center text-xs text-ink-500">
        Nothing scheduled.
      </p>
    ) : (
      <ul className="max-h-96 space-y-2 overflow-auto pr-1">
        {trips.map(t => (
          <li key={t.id} className="rounded-2xl border border-ink-100 bg-white p-3">
            <div className="flex items-baseline justify-between gap-2">
              <p className="text-sm font-bold text-ink-900">
                <Clock className="mr-1 inline h-3.5 w-3.5 text-ink-400" />
                {new Date(t.pickupAt).toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit' })}
              </p>
              <span className="rounded-full bg-ink-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-ink-600">
                {t.vehicleClass}
              </span>
            </div>
            <p className="mt-1 truncate text-xs text-ink-700">{t.pickupAddress}</p>
            <p className="mt-1 inline-flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11px] text-ink-500">
              {t.customerName ? <span>{t.customerName}</span> : null}
              {t.customerPhone ? <span className="inline-flex items-center gap-1"><Phone className="h-3 w-3" />{t.customerPhone}</span> : null}
              {t.driverName ? <span className="inline-flex items-center gap-1 font-semibold text-emerald-700">Driver: {t.driverName}</span> : <span className="font-semibold text-amber-700">No driver yet</span>}
            </p>
          </li>
        ))}
      </ul>
    )}
  </div>
);

const ActionQueueCard: React.FC<{ items: PartnerDashboard['driversToAssign'] }> = ({ items }) => (
  <div className="rounded-3xl border border-ink-100 bg-white p-6 shadow-soft">
    <div className="mb-4 flex items-center justify-between gap-2">
      <h3 className="text-base font-bold text-ink-900">Drivers to assign</h3>
      <span className="text-xs font-semibold text-ink-500">{items.length} pending</span>
    </div>
    {items.length === 0 ? (
      <p className="rounded-2xl border border-dashed border-ink-200 px-4 py-6 text-center text-xs text-ink-500">
        All upcoming trips have a driver assigned.
      </p>
    ) : (
      <ul className="max-h-96 space-y-2 overflow-auto pr-1">
        {items.map(b => (
          <li key={b.id}>
            <Link href={`/partner/bookings/${b.id}`} className="block rounded-2xl border border-amber-200 bg-amber-50/40 p-3 transition hover:border-amber-300">
              <div className="flex items-baseline justify-between gap-2">
                <p className="text-sm font-bold text-ink-900">
                  {new Date(b.pickupAt).toLocaleString('en', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </p>
                <span className="rounded-full bg-white px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-700">
                  Assign driver
                </span>
              </div>
              <p className="mt-1 truncate text-xs text-ink-700">{b.pickupAddress}</p>
              {b.customerName ? <p className="text-[11px] text-ink-500">{b.customerName}</p> : null}
            </Link>
          </li>
        ))}
      </ul>
    )}
  </div>
);

const PeerBenchmarkCard: React.FC<{ data: PartnerDashboard['peerBenchmark'] }> = ({ data }) => {
  const ratio = data.median > 0 ? data.myEarnings / data.median : 0;
  return (
    <div className="rounded-3xl border border-ink-100 bg-white p-6 shadow-soft">
      <div className="mb-4 flex items-center gap-2">
        <span className="grid h-7 w-7 place-items-center rounded-lg bg-violet-50 text-violet-700">
          <Award className="h-4 w-4" />
        </span>
        <h3 className="text-base font-bold text-ink-900">Peer benchmark</h3>
      </div>
      {!data.countryCode || data.peerCount === 0 ? (
        <p className="rounded-2xl border border-dashed border-ink-200 px-4 py-6 text-center text-xs text-ink-500">
          Not enough peer data yet. Once a few more suppliers are active in your market this card will show how you compare.
        </p>
      ) : (
        <>
          <p className="text-xs text-ink-600">
            {data.peerCount} supplier{data.peerCount === 1 ? '' : 's'} compete in {data.countryCode}.
            {data.percentile != null ? (
              <> You earn more than <strong className="text-ink-900">{data.percentile}%</strong> of them.</>
            ) : null}
          </p>
          <div className="mt-4 space-y-3 text-xs">
            <BenchmarkBar label="Market median" value={data.median} relativeTo={Math.max(data.median, data.myEarnings)} tone="ink" />
            <BenchmarkBar label="You"           value={data.myEarnings} relativeTo={Math.max(data.median, data.myEarnings)} tone={ratio >= 1 ? 'emerald' : 'amber'} />
          </div>
        </>
      )}
    </div>
  );
};

const BenchmarkBar: React.FC<{ label: string; value: number; relativeTo: number; tone: 'emerald' | 'amber' | 'ink' }> = ({ label, value, relativeTo, tone }) => {
  const pct = relativeTo > 0 ? (value / relativeTo) * 100 : 0;
  const cls = tone === 'emerald' ? 'bg-emerald-500'
    : tone === 'amber' ? 'bg-amber-500'
    : 'bg-ink-400';
  return (
    <div>
      <div className="flex items-center justify-between text-xs">
        <span className="font-semibold text-ink-700">{label}</span>
        <span className="font-bold text-ink-900">{fmtMoney(value)}</span>
      </div>
      <div className="mt-1 h-2 overflow-hidden rounded-full bg-ink-100">
        <div className={`h-full ${cls}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
};
