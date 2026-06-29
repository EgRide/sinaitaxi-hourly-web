'use client';

import { useEffect, useMemo, useState } from 'react';
import { Loader2, Save, AlertCircle, CheckCircle2, Search, Globe } from 'lucide-react';
import { adminApi, type AdminCountry } from '@/lib/admin-api';
import { Flag } from '@/components/Flag';
import { AdminShell } from '../../AdminShell';

export default function CountrySettingsPage() {
  return (
    <AdminShell>
      <CountriesEditor />
    </AdminShell>
  );
}

const CountriesEditor: React.FC = () => {
  const [countries, setCountries] = useState<AdminCountry[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [scope, setScope] = useState<'all' | 'active' | 'disabled'>('all');

  useEffect(() => {
    adminApi.countries()
      .then(r => setCountries(r.countries))
      .catch((e: Error) => setError(e.message));
  }, []);

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

  return (
    <div>
      <header>
        <h1 className="text-3xl font-extrabold tracking-tighter">Country settings</h1>
        <p className="mt-1 text-sm text-ink-500">
          Every country PHP exposes is listed below. Commission %, overage rate, and active state per country — changes take effect immediately for new bookings.
        </p>
      </header>

      <div className="mt-6 flex flex-wrap items-center gap-3">
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

      {error ? <p className="mt-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p> : null}

      {!filtered ? (
        <div className="mt-6 inline-flex items-center gap-2 text-sm text-ink-500">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading countries…
        </div>
      ) : filtered.length === 0 ? (
        <div className="mt-6 rounded-2xl border border-dashed border-ink-200 bg-white p-10 text-center">
          <Globe className="mx-auto h-8 w-8 text-ink-300" />
          <p className="mt-3 text-sm font-semibold text-ink-700">No countries match this filter.</p>
        </div>
      ) : (
        <>
          <p className="mt-4 text-xs text-ink-500">
            Showing {filtered.length} of {countries?.length ?? 0} countries.
          </p>
          <ul className="mt-3 space-y-3">
            {filtered.map(c => <CountryRow key={c.code} country={c} />)}
          </ul>
        </>
      )}
    </div>
  );
};

const CountryRow: React.FC<{ country: AdminCountry }> = ({ country }) => {
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
      setTimeout(() => setSaved(false), 2500);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <li className="rounded-3xl border border-ink-100 bg-white p-5 shadow-soft">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Flag code={country.code} size="lg" />
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold tracking-tight">{country.name}</h2>
              <span className="rounded-full bg-ink-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-ink-700">{country.code}</span>
            </div>
            <p className="mt-1 text-xs text-ink-500">Updated {new Date(country.updatedAt).toLocaleString()}</p>
          </div>
        </div>
        <label className="inline-flex items-center gap-2 text-sm">
          <input type="checkbox" checked={active} onChange={e => setActive(e.target.checked)}
            className="h-4 w-4 rounded border-ink-300 text-brand-500" />
          {active ? 'Active' : 'Disabled'}
        </label>
      </div>

      <div className="mt-3 grid gap-3 sm:grid-cols-[1fr_1fr_1fr_auto] sm:items-end">
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
        <button onClick={onSave} disabled={busy} className="btn-primary !py-2.5 !px-4 !text-sm">
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          {busy ? 'Saving…' : 'Save'}
        </button>
      </div>

      {error ? (
        <div className="mt-3 inline-flex w-full items-start gap-2 rounded-2xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" /> {error}
        </div>
      ) : null}

      {saved ? (
        <div className="mt-3 inline-flex items-center gap-2 text-xs font-semibold text-emerald-700">
          <CheckCircle2 className="h-3.5 w-3.5" /> Saved
        </div>
      ) : null}
    </li>
  );
};

const Field: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <label className="block rounded-2xl border border-ink-200 bg-white px-3 py-2 focus-within:border-brand-500">
    <span className="text-[10px] font-bold uppercase tracking-wider text-ink-500">{label}</span>
    <div className="mt-1">{children}</div>
  </label>
);
