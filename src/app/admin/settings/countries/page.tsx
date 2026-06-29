'use client';

// Country settings — compact row layout with search, scope filter,
// and pagination. Click any row to drill into the country detail
// page with full analytics.

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Loader2, AlertCircle, Search, Globe, ChevronRight, CheckCircle2, PauseCircle } from 'lucide-react';
import { adminApi, type AdminCountry } from '@/lib/admin-api';
import { Flag } from '@/components/Flag';
import { Pagination } from '@/components/Pagination';
import { AdminShell } from '../../AdminShell';

const PAGE_SIZE = 20;

export default function CountrySettingsPage() {
  return (
    <AdminShell>
      <CountriesList />
    </AdminShell>
  );
}

const CountriesList: React.FC = () => {
  const [countries, setCountries] = useState<AdminCountry[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [scope, setScope] = useState<'all' | 'active' | 'disabled'>('all');
  const [page, setPage] = useState(1);

  useEffect(() => {
    adminApi.countries()
      .then(r => setCountries(r.countries))
      .catch((e: Error) => setError(e.message));
  }, []);

  // Reset to page 1 whenever filters change.
  useEffect(() => { setPage(1); }, [query, scope]);

  const filtered = useMemo(() => {
    if (!countries) return null;
    const q = query.trim().toLowerCase();
    return countries
      .filter(c => {
        if (scope === 'active' && !c.active) return false;
        if (scope === 'disabled' && c.active) return false;
        if (!q) return true;
        return c.code.toLowerCase().includes(q) || c.name.toLowerCase().includes(q);
      })
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [countries, query, scope]);

  const visible = useMemo(() => {
    if (!filtered) return null;
    const start = (page - 1) * PAGE_SIZE;
    return filtered.slice(start, start + PAGE_SIZE);
  }, [filtered, page]);

  return (
    <div className="space-y-5">
      <header>
        <h1 className="text-3xl font-extrabold tracking-tightest text-ink-900">Country settings</h1>
        <p className="mt-1 text-sm text-ink-500">
          Every country PHP exposes is listed below. Click a row to drill in: live analytics, top
          suppliers, recent bookings, and commission settings.
        </p>
      </header>

      <div className="flex flex-wrap items-center gap-3">
        <label className="flex flex-1 items-center gap-2 rounded-2xl border border-ink-200 bg-white px-4 py-2.5 focus-within:border-brand-500">
          <Search className="h-4 w-4 text-ink-400" />
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search by name or code (EG, AE, GB…)"
            className="w-full bg-transparent text-sm outline-none"
          />
        </label>
        <div className="flex gap-1 rounded-full bg-ink-100 p-1">
          {(['all', 'active', 'disabled'] as const).map(s => (
            <button
              key={s}
              onClick={() => setScope(s)}
              className={`rounded-full px-3 py-1.5 text-xs font-semibold capitalize ${scope === s ? 'bg-white text-ink-900 shadow-sm' : 'text-ink-600 hover:text-ink-900'}`}>
              {s}
            </button>
          ))}
        </div>
      </div>

      {error ? (
        <div className="inline-flex w-full items-start gap-2 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <AlertCircle className="h-4 w-4 mt-0.5" />
          {error}
        </div>
      ) : null}

      {!visible ? (
        <div className="rounded-2xl border border-ink-100 bg-white p-8 text-center text-sm text-ink-500">
          <Loader2 className="mx-auto h-5 w-5 animate-spin" />
          <p className="mt-3">Loading countries…</p>
        </div>
      ) : visible.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-ink-200 bg-white p-10 text-center">
          <Globe className="mx-auto h-8 w-8 text-ink-300" />
          <p className="mt-3 text-sm font-semibold text-ink-700">No countries match this filter.</p>
        </div>
      ) : (
        <>
          {/* Compact rows. Header row only on lg+. */}
          <div className="hidden grid-cols-[1fr_auto_auto_auto_auto_24px] gap-4 rounded-2xl bg-ink-50/60 px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-ink-500 lg:grid">
            <span>Country</span>
            <span className="w-20 text-right">Commission</span>
            <span className="w-24 text-right">Overage / km</span>
            <span className="w-16 text-right">Currency</span>
            <span className="w-20 text-right">Status</span>
            <span />
          </div>
          <ul className="divide-y divide-ink-100 rounded-2xl border border-ink-100 bg-white shadow-soft">
            {visible.map(c => <CountryRow key={c.code} country={c} />)}
          </ul>
          <Pagination
            page={page}
            pageSize={PAGE_SIZE}
            total={filtered?.length ?? 0}
            onChange={setPage}
          />
        </>
      )}
    </div>
  );
};

const CountryRow: React.FC<{ country: AdminCountry }> = ({ country }) => (
  <li>
    <Link
      href={`/admin/settings/countries/${country.code}`}
      className="grid grid-cols-1 items-center gap-2 px-4 py-3 transition hover:bg-ink-50/60 lg:grid-cols-[1fr_auto_auto_auto_auto_24px] lg:gap-4">
      {/* Country */}
      <div className="flex items-center gap-3">
        <Flag code={country.code} size="md" />
        <div className="min-w-0">
          <p className="truncate text-sm font-bold text-ink-900">{country.name}</p>
          <p className="text-[10px] font-mono uppercase text-ink-500">{country.code}</p>
        </div>
      </div>
      <span className="w-20 text-right text-sm font-bold text-ink-900">
        {(country.commissionPct * 100).toFixed(1)}<span className="ml-0.5 text-xs text-ink-500">%</span>
      </span>
      <span className="w-24 text-right text-sm font-bold text-ink-900">
        {country.overageRatePerKm.toFixed(2)}<span className="ml-0.5 text-xs text-ink-500">{country.currency}</span>
      </span>
      <span className="w-16 text-right text-xs font-mono font-semibold text-ink-700">{country.currency}</span>
      <span className="inline-flex w-20 items-center justify-end gap-1 text-xs font-semibold">
        {country.active ? (
          <>
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
            <span className="text-emerald-700">Active</span>
          </>
        ) : (
          <>
            <PauseCircle className="h-3.5 w-3.5 text-amber-600" />
            <span className="text-amber-700">Disabled</span>
          </>
        )}
      </span>
      <ChevronRight className="hidden h-4 w-4 text-ink-400 lg:block" />
    </Link>
  </li>
);
