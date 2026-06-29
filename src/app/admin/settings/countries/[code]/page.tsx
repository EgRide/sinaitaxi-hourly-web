'use client';

// Per-country drill-down. KPI strip + chart + funnel + leaderboard
// + recent bookings + inline settings panel. All in one route, one
// round-trip per period switch.

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import {
  Loader2, AlertCircle, ArrowLeft, RefreshCw, DollarSign,
  ShoppingBag, BarChart3, TrendingUp, Users, MapPin, Save, CheckCircle2,
  Activity,
} from 'lucide-react';
import { adminApi, type AdminCountryDetail } from '@/lib/admin-api';
import {
  KpiCard, PeriodChips, RevenueChart, Leaderboard, Funnel,
} from '@/components/dashboard/DashboardKit';
import { Flag } from '@/components/Flag';
import { AdminShell } from '../../../AdminShell';

const PERIODS = [
  { id: '7d',  label: '7d',  days: 7  },
  { id: '30d', label: '30d', days: 30 },
  { id: '90d', label: '90d', days: 90 },
];

const fmtMoney = (n: number, currency = 'EUR'): string =>
  `${currency} ${n.toLocaleString('en', { maximumFractionDigits: 0 })}`;
const fmtCount = (n: number): string => n.toLocaleString('en');

export default function CountryDetailPage() {
  return (
    <AdminShell>
      <CountryDetail />
    </AdminShell>
  );
}

const CountryDetail: React.FC = () => {
  const params = useParams<{ code: string }>();
  const router = useRouter();
  const code = (params?.code ?? '').toUpperCase();
  const [days, setDays] = useState(30);
  const [data, setData] = useState<AdminCountryDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = (d: number) => {
    if (!code) return Promise.resolve();
    setLoading(true);
    return adminApi.countryDetail(code, d)
      .then(r => { setData(r); setError(null); })
      .catch(err => setError((err as Error).message))
      .finally(() => setLoading(false));
  };
  useEffect(() => { void reload(days); }, [code, days]);

  if (error && !data) {
    return (
      <div className="space-y-4">
        <Link href="/admin/settings/countries" className="inline-flex items-center gap-1.5 text-xs font-semibold text-ink-500 hover:text-ink-800">
          <ArrowLeft className="h-3.5 w-3.5" /> All countries
        </Link>
        <div className="inline-flex w-full items-start gap-2 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <AlertCircle className="h-4 w-4 mt-0.5" /> {error}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Link href="/admin/settings/countries" className="inline-flex items-center gap-1.5 text-xs font-semibold text-ink-500 hover:text-ink-800">
        <ArrowLeft className="h-3.5 w-3.5" /> All countries
      </Link>

      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex items-center gap-3">
          <Flag code={code} size="xl" />
          <div>
            <h1 className="text-3xl font-extrabold tracking-tightest text-ink-900">{data?.country.name ?? code}</h1>
            <p className="mt-1 text-xs text-ink-500">
              {data ? (
                <>
                  {data.coverage.activePolygons}/{data.coverage.totalPolygons} active polygons ·{' '}
                  {data.coverage.activeSuppliers} active supplier{data.coverage.activeSuppliers === 1 ? '' : 's'}
                </>
              ) : 'Loading…'}
            </p>
          </div>
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

      {!data && loading ? (
        <div className="rounded-2xl border border-ink-100 bg-white p-12 text-center text-sm text-ink-500">
          <Loader2 className="mx-auto h-6 w-6 animate-spin" />
          <p className="mt-3">Loading analytics…</p>
        </div>
      ) : data ? (
        <>
          {/* KPI strip */}
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <KpiCard
              label="Revenue"
              icon={<DollarSign className="h-4 w-4" />}
              value={fmtMoney(data.kpis.revenue.current, data.country.currency)}
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
              value={fmtMoney(data.kpis.commission.current, data.country.currency)}
              delta={data.kpis.commission}
              tone="emerald"
            />
            <KpiCard
              label="AOV"
              icon={<BarChart3 className="h-4 w-4" />}
              value={fmtMoney(data.kpis.aov.current, data.country.currency)}
              delta={data.kpis.aov}
              tone="amber"
            />
          </div>

          {/* Settings inline panel */}
          <SettingsPanel country={data.country} onSaved={() => void reload(days)} />

          {/* Chart + funnel */}
          <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
            <RevenueChart data={data.series} currency={data.country.currency} />
            <Funnel funnel={data.funnel} />
          </div>

          {/* Top suppliers + recent bookings */}
          <div className="grid gap-4 lg:grid-cols-[1fr_1.4fr]">
            <Leaderboard
              title="Top suppliers in this country"
              icon={<Users className="h-4 w-4" />}
              currency={data.country.currency}
              emptyHint="No bookings yet in this window."
              rows={data.topSuppliers.map(s => ({
                key: s.partnerPhpId,
                label: `#${s.partnerPhpId}`,
                bookings: s.bookings,
                revenue: s.revenue,
              }))}
            />
            <RecentBookings rows={data.recentBookings} routerPush={router.push} />
          </div>

          {/* Quick links */}
          <div className="grid gap-3 sm:grid-cols-2">
            <Link href={`/admin/bookings?country=${code}`} className="group flex items-center gap-3 rounded-2xl border border-ink-100 bg-white p-5 shadow-soft transition hover:border-brand-300 hover:shadow-glow">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-brand-50 text-brand-700">
                <ShoppingBag className="h-5 w-5" />
              </span>
              <div className="min-w-0">
                <p className="text-base font-bold text-ink-900">All bookings in {data.country.name}</p>
                <p className="text-xs text-ink-500">Filterable list with refund / cancel actions.</p>
              </div>
            </Link>
            <Link href={`/admin/suppliers`} className="group flex items-center gap-3 rounded-2xl border border-ink-100 bg-white p-5 shadow-soft transition hover:border-brand-300 hover:shadow-glow">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-brand-50 text-brand-700">
                <Users className="h-5 w-5" />
              </span>
              <div className="min-w-0">
                <p className="text-base font-bold text-ink-900">Suppliers</p>
                <p className="text-xs text-ink-500">Override commission or pause a supplier in hourly.</p>
              </div>
            </Link>
          </div>
        </>
      ) : null}
    </div>
  );
};

const SettingsPanel: React.FC<{ country: AdminCountryDetail['country']; onSaved: () => void }> = ({ country, onSaved }) => {
  const [commission, setCommission] = useState((country.commissionPct * 100).toFixed(2));
  const [overage, setOverage]       = useState(country.overageRatePerKm.toFixed(2));
  const [currency, setCurrency]     = useState(country.currency);
  const [active, setActive]         = useState(country.active);
  const [busy, setBusy]   = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSave = async () => {
    setBusy(true); setError(null); setSaved(false);
    try {
      await adminApi.updateCountry(country.code, {
        commissionPct: Number(commission) / 100,
        overageRatePerKm: Number(overage),
        currency: currency.toUpperCase(),
        active,
      });
      setSaved(true);
      onSaved();
      setTimeout(() => setSaved(false), 2500);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="rounded-3xl border border-ink-100 bg-white p-6 shadow-soft">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-bold text-ink-900">Country settings</h2>
        <span className="text-[10px] text-ink-500">Updated {new Date(country.updatedAt).toLocaleString()}</span>
      </div>
      <p className="mt-1 text-xs text-ink-500">Changes apply to new bookings in {country.name}.</p>

      <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_1fr_1fr_auto_auto] sm:items-end">
        <Field label="Commission %">
          <input type="number" step="0.01" min="0" max="100" value={commission} onChange={e => setCommission(e.target.value)}
            className="w-full bg-transparent text-base outline-none" />
        </Field>
        <Field label={`Overage per km (${currency || country.currency})`}>
          <input type="number" step="0.01" min="0" value={overage} onChange={e => setOverage(e.target.value)}
            className="w-full bg-transparent text-base outline-none" />
        </Field>
        <Field label="Currency (ISO-3)">
          <input maxLength={3} value={currency} onChange={e => setCurrency(e.target.value.toUpperCase())}
            className="w-full bg-transparent text-base outline-none uppercase" />
        </Field>
        <label className="inline-flex h-[58px] items-center gap-2 rounded-2xl border border-ink-200 bg-white px-3 text-sm">
          <input type="checkbox" checked={active} onChange={e => setActive(e.target.checked)}
            className="h-4 w-4 rounded border-ink-300 text-brand-500" />
          {active ? 'Active' : 'Disabled'}
        </label>
        <button onClick={onSave} disabled={busy}
          className="inline-flex h-[58px] items-center gap-2 rounded-2xl bg-brand-600 px-4 text-sm font-bold text-white hover:bg-brand-700 disabled:opacity-50">
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Save
        </button>
      </div>

      {error ? (
        <div className="mt-3 inline-flex w-full items-start gap-2 rounded-2xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" /> {error}
        </div>
      ) : null}
      {saved ? (
        <p className="mt-3 inline-flex items-center gap-2 text-xs font-semibold text-emerald-700">
          <CheckCircle2 className="h-3.5 w-3.5" /> Saved.
        </p>
      ) : null}
    </section>
  );
};

const RecentBookings: React.FC<{
  rows: AdminCountryDetail['recentBookings'];
  routerPush: (href: string) => void;
}> = ({ rows, routerPush }) => (
  <div className="rounded-3xl border border-ink-100 bg-white p-6 shadow-soft">
    <div className="mb-4 flex items-center gap-2">
      <span className="grid h-7 w-7 place-items-center rounded-lg bg-brand-50 text-brand-700">
        <Activity className="h-4 w-4" />
      </span>
      <h3 className="text-base font-bold text-ink-900">Recent bookings</h3>
    </div>
    {rows.length === 0 ? (
      <p className="rounded-2xl border border-dashed border-ink-200 px-4 py-6 text-center text-xs text-ink-500">
        No bookings yet.
      </p>
    ) : (
      <ul className="space-y-2">
        {rows.slice(0, 12).map(b => (
          <li key={b.id}>
            <button
              type="button"
              onClick={() => routerPush(`/admin/bookings/${b.id}`)}
              className="block w-full rounded-2xl border border-ink-100 bg-white p-3 text-left transition hover:border-brand-300 hover:shadow-soft">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <p className="truncate text-sm font-bold text-ink-900">
                  {b.customerName ?? b.customerEmail}
                </p>
                <span className="text-sm font-bold text-ink-900">
                  {b.currency} {b.retailPrice.toFixed(2)}
                </span>
              </div>
              <p className="mt-0.5 truncate text-[11px] text-ink-500">
                <span className="font-mono">#{b.id.slice(0, 8)}</span>
                {' · '}
                <span className="font-mono uppercase">{b.status}</span>
                {' · '}
                {b.polygonName}
                {' · '}
                {b.vehicleClass}
                {b.partnerPhpId ? <> · supplier #{b.partnerPhpId}</> : null}
                {' · '}
                {new Date(b.pickupAt).toLocaleString()}
              </p>
            </button>
          </li>
        ))}
      </ul>
    )}
  </div>
);

const Field: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <label className="block rounded-2xl border border-ink-200 bg-white px-4 py-3 focus-within:border-brand-500">
    <span className="text-[10px] font-bold uppercase tracking-wider text-ink-500">{label}</span>
    <div className="mt-1">{children}</div>
  </label>
);
