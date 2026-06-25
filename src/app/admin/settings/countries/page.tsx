'use client';

import { useEffect, useState } from 'react';
import { Loader2, Save, AlertCircle, CheckCircle2 } from 'lucide-react';
import { adminApi, type AdminCountry } from '@/lib/admin-api';
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

  useEffect(() => {
    adminApi.countries()
      .then(r => setCountries(r.countries))
      .catch((e: Error) => setError(e.message));
  }, []);

  return (
    <div>
      <h1 className="text-3xl font-extrabold tracking-tighter">Country settings</h1>
      <p className="mt-1 text-sm text-ink-500">Commission % and overage rate per country. Changes take effect immediately for new bookings.</p>

      {error ? <p className="mt-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p> : null}

      {!countries ? (
        <div className="mt-6 inline-flex items-center gap-2 text-sm text-ink-500">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading countries…
        </div>
      ) : (
        <ul className="mt-6 space-y-3">
          {countries.map(c => <CountryRow key={c.code} country={c} />)}
        </ul>
      )}
    </div>
  );
};

const CountryRow: React.FC<{ country: AdminCountry }> = ({ country }) => {
  const [commission, setCommission] = useState((country.commissionPct * 100).toFixed(2));
  const [overage, setOverage]       = useState(country.overageRatePerKm.toFixed(2));
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
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold tracking-tight">{country.name}</h2>
            <span className="rounded-full bg-ink-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-ink-700">{country.code}</span>
            <span className="text-xs text-ink-500">· Currency {country.currency}</span>
          </div>
          <p className="mt-1 text-xs text-ink-500">Updated {new Date(country.updatedAt).toLocaleString()}</p>
        </div>
        <label className="inline-flex items-center gap-2 text-sm">
          <input type="checkbox" checked={active} onChange={e => setActive(e.target.checked)}
            className="h-4 w-4 rounded border-ink-300 text-brand-500" />
          {active ? 'Active' : 'Disabled'}
        </label>
      </div>

      <div className="mt-3 grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
        <Field label="Commission %">
          <input type="number" step="0.01" min="0" max="100" value={commission} onChange={e => setCommission(e.target.value)}
            className="w-full bg-transparent text-base outline-none" />
        </Field>
        <Field label={`Overage per km (${country.currency})`}>
          <input type="number" step="0.01" min="0" value={overage} onChange={e => setOverage(e.target.value)}
            className="w-full bg-transparent text-base outline-none" />
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
