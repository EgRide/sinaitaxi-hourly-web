'use client';

// Admin-side rule editor — mirrors the partner version but with a
// supplier picker at the top. All other sections (identity, margins,
// coverage, price matrix) follow the same layout patterns as the
// rest of the admin UI.

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft, Save, Trash2, Loader2, AlertCircle, CheckCircle2,
  Plus, X, Building2,
} from 'lucide-react';
import { adminApi, type AdminPriceRule, type AdminPriceRuleInput, type AdminSupplier } from '@/lib/admin-api';
import { api, type Country, type Polygon, type VehicleClass } from '@/lib/api';

interface Props {
  mode: 'create' | 'edit';
  initial?: AdminPriceRule;
}

type PriceState = { enabled: boolean; hourlyRate: string; includedKmPerHour: number };

export const AdminRuleEditor: React.FC<Props> = ({ mode, initial }) => {
  const router = useRouter();

  // ── Identity ─────────────────────────────────────────────
  const [partnerPhpId, setPartnerPhpId] = useState(initial?.partnerPhpId ?? '');
  const [name, setName]                 = useState(initial?.name ?? '');
  const [currency, setCurrency]         = useState(initial?.currency ?? 'EUR');
  const [active, setActive]             = useState(initial?.active ?? true);

  // ── Validity ─────────────────────────────────────────────
  const [validFrom, setValidFrom] = useState(initial?.validFrom?.slice(0, 10) ?? '');
  const [validTo,   setValidTo]   = useState(initial?.validTo?.slice(0, 10) ?? '');

  // ── Margins ──────────────────────────────────────────────
  const [marginHours, setMarginHours] = useState(String(initial?.marginHours ?? 6));
  const [minHours,    setMinHours]    = useState(String(initial?.minHours    ?? 1));
  const [maxHours,    setMaxHours]    = useState(String(initial?.maxHours    ?? 168));

  // ── Coverage ─────────────────────────────────────────────
  const [country, setCountry] = useState<string>('');                    // ISO-2; filters polygon list
  const [countries, setCountries] = useState<Country[] | null>(null);
  const [polygons, setPolygons] = useState<Polygon[] | null>(null);
  const [selectedPolygons, setSelectedPolygons] = useState<string[]>(initial?.polygonPhpIds ?? []);

  // ── Price matrix ─────────────────────────────────────────
  const [classes, setClasses] = useState<VehicleClass[] | null>(null);
  const [priceMap, setPriceMap] = useState<Record<string, PriceState>>(() => {
    const out: Record<string, PriceState> = {};
    for (const p of initial?.prices ?? []) {
      out[p.vehicleClass] = {
        enabled: true,
        hourlyRate: p.hourlyRate.toFixed(2),
        includedKmPerHour: p.includedKmPerHour,
      };
    }
    return out;
  });

  // ── Supplier picker ──────────────────────────────────────
  const [supplierQuery, setSupplierQuery] = useState('');
  const [suppliers, setSuppliers] = useState<AdminSupplier[] | null>(null);
  const [suppliersOpen, setSuppliersOpen] = useState(false);

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Load supporting catalogues.
  useEffect(() => {
    void api.countries().then(r => setCountries(r.countries)).catch(() => null);
    void api.vehicleClasses().then(r => setClasses(r.classes)).catch(() => null);
    void adminApi.suppliers().then(r => setSuppliers(r.suppliers)).catch(() => null);
  }, []);

  useEffect(() => {
    if (!country) { setPolygons([]); return; }
    void api.polygons(country.toUpperCase())
      .then(r => setPolygons(r.polygons))
      .catch(() => setPolygons([]));
  }, [country]);

  const supplierMatches = useMemo(() => {
    if (!suppliers) return [];
    const q = supplierQuery.trim().toLowerCase();
    return suppliers
      .filter(s => {
        if (!q) return true;
        return (
          (s.companyName?.toLowerCase().includes(q) ?? false)
          || (s.email?.toLowerCase().includes(q) ?? false)
          || s.partnerPhpId.includes(q)
          || (s.firstName?.toLowerCase().includes(q) ?? false)
          || (s.lastName?.toLowerCase().includes(q) ?? false)
        );
      })
      .slice(0, 8);
  }, [suppliers, supplierQuery]);

  const selectedSupplier = useMemo(
    () => suppliers?.find(s => s.partnerPhpId === partnerPhpId) ?? null,
    [suppliers, partnerPhpId],
  );

  const togglePolygon = (id: string) =>
    setSelectedPolygons(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id]);

  const setPriceField = (slug: string, patch: Partial<PriceState>) =>
    setPriceMap(m => {
      const existing = m[slug] ?? { enabled: false, hourlyRate: '0.00', includedKmPerHour: 50 };
      return { ...m, [slug]: { ...existing, ...patch } };
    });

  const onSave = async () => {
    setError(null); setSuccess(false);
    if (!partnerPhpId) { setError('Pick a supplier first.'); return; }
    if (selectedPolygons.length === 0) { setError('Select at least one polygon.'); return; }
    const enabledClasses = Object.entries(priceMap).filter(([, v]) => v.enabled);
    if (enabledClasses.length === 0) { setError('Set a price for at least one class.'); return; }
    if (Number(minHours) > Number(maxHours)) { setError('Min hours can\'t exceed max hours.'); return; }

    setBusy(true);
    try {
      const payload: AdminPriceRuleInput = {
        partnerPhpId,
        name: name.trim() || null,
        currency: currency.toUpperCase(),
        active,
        validFrom: validFrom ? new Date(`${validFrom}T00:00:00Z`).toISOString() : null,
        validTo:   validTo   ? new Date(`${validTo}T23:59:59Z`).toISOString()   : null,
        marginHours: Number(marginHours) || 0,
        minHours: Number(minHours) || 1,
        maxHours: Number(maxHours) || 168,
        polygonPhpIds: selectedPolygons,
        prices: enabledClasses.map(([slug, v]) => ({
          vehicleClass: slug,
          hourlyRate: Number(v.hourlyRate) || 0,
          includedKmPerHour: v.includedKmPerHour,
        })),
      };
      if (mode === 'create') {
        const r = await adminApi.createPriceRule(payload);
        router.push(`/admin/price-rules/${r.id}`);
      } else if (initial) {
        await adminApi.updatePriceRule(initial.id, payload);
        setSuccess(true);
        setTimeout(() => setSuccess(false), 2500);
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const onDelete = async () => {
    if (!initial) return;
    if (!confirm(`Delete this rule? Bookings made under it stay intact, but no new bookings will reference it.`)) return;
    setBusy(true);
    try {
      await adminApi.deletePriceRule(initial.id);
      router.push('/admin/price-rules');
    } catch (err) {
      setError((err as Error).message);
      setBusy(false);
    }
  };

  return (
    <div className="space-y-6">
      <Link href="/admin/price-rules" className="inline-flex items-center gap-1.5 text-xs font-semibold text-ink-500 hover:text-ink-800">
        <ArrowLeft className="h-3.5 w-3.5" />
        All price rules
      </Link>

      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tightest text-ink-900">
            {mode === 'create' ? 'New price rule' : name || 'Edit price rule'}
          </h1>
          <p className="mt-1 text-sm text-ink-500">
            {mode === 'create'
              ? 'Create a rule on behalf of any supplier.'
              : `Editing rule for supplier #${partnerPhpId}.`}
          </p>
        </div>
      </header>

      {/* Supplier picker */}
      <Section title="0. Supplier" subtitle="Which polygon-provider does this rule belong to?">
        <div className="relative">
          <button
            type="button"
            onClick={() => setSuppliersOpen(o => !o)}
            disabled={mode === 'edit'}
            className="flex w-full items-center justify-between gap-3 rounded-2xl border border-ink-200 bg-white px-4 py-3 text-left transition hover:border-ink-300 disabled:opacity-60">
            <div className="flex items-center gap-3">
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-brand-50 text-brand-700">
                <Building2 className="h-4 w-4" />
              </span>
              <div>
                <p className="text-sm font-bold text-ink-900">
                  {selectedSupplier?.companyName
                    ?? selectedSupplier?.email
                    ?? (partnerPhpId ? `Supplier #${partnerPhpId}` : 'Pick a supplier…')}
                </p>
                {partnerPhpId ? (
                  <p className="text-[11px] font-mono text-ink-500">#{partnerPhpId}</p>
                ) : null}
              </div>
            </div>
            <span className="text-xs text-ink-500">{mode === 'edit' ? 'Locked' : 'Click to change'}</span>
          </button>
          {suppliersOpen && mode === 'create' ? (
            <div className="absolute z-10 mt-2 w-full overflow-hidden rounded-2xl border border-ink-100 bg-white shadow-glow">
              <input
                value={supplierQuery}
                onChange={e => setSupplierQuery(e.target.value)}
                placeholder="Search by company, name, email or PHP id"
                autoFocus
                className="w-full border-b border-ink-100 bg-white px-4 py-3 text-sm outline-none"
              />
              {!suppliers ? (
                <div className="px-4 py-3 text-xs text-ink-500">
                  <Loader2 className="mr-1 inline h-3 w-3 animate-spin" /> Loading suppliers…
                </div>
              ) : supplierMatches.length === 0 ? (
                <div className="px-4 py-6 text-center text-xs text-ink-500">No matches.</div>
              ) : (
                <ul className="max-h-72 overflow-auto">
                  {supplierMatches.map(s => (
                    <li key={s.partnerPhpId}>
                      <button
                        type="button"
                        onClick={() => { setPartnerPhpId(s.partnerPhpId); setSuppliersOpen(false); }}
                        className="flex w-full flex-col items-start gap-0.5 px-4 py-2.5 text-left hover:bg-ink-50">
                        <span className="text-sm font-bold text-ink-900">
                          {s.companyName ?? `Supplier #${s.partnerPhpId}`}
                        </span>
                        <span className="text-[11px] text-ink-500">
                          <span className="font-mono">#{s.partnerPhpId}</span>
                          {s.email ? <> · {s.email}</> : null}
                          {s.province ? <> · {s.province}</> : null}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ) : null}
        </div>
      </Section>

      {/* Identity */}
      <Section title="1. Identity" subtitle="Internal name + currency. Active rules surface in /search.">
        <div className="grid gap-3 sm:grid-cols-[2fr_1fr_auto] sm:items-end">
          <Field label="Rule name (internal)">
            <input value={name} onChange={e => setName(e.target.value)}
              placeholder="e.g. Tirana Fleet — all areas"
              className="w-full bg-transparent text-base outline-none" />
          </Field>
          <Field label="Currency (ISO-3)">
            <input value={currency} onChange={e => setCurrency(e.target.value.toUpperCase())}
              maxLength={3}
              className="w-full bg-transparent text-base outline-none uppercase" />
          </Field>
          <label className="inline-flex h-[58px] items-center gap-2 rounded-2xl border border-ink-200 bg-white px-3 text-sm">
            <input type="checkbox" checked={active} onChange={e => setActive(e.target.checked)}
              className="h-4 w-4 rounded border-ink-300 text-brand-500" />
            {active ? 'Active' : 'Paused'}
          </label>
        </div>
      </Section>

      {/* Validity */}
      <Section title="2. Validity (optional)" subtitle="Empty = always valid.">
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Valid from"><input type="date" value={validFrom} onChange={e => setValidFrom(e.target.value)} className="w-full bg-transparent text-base outline-none" /></Field>
          <Field label="Valid until"><input type="date" value={validTo}   onChange={e => setValidTo(e.target.value)} className="w-full bg-transparent text-base outline-none" /></Field>
        </div>
      </Section>

      {/* Margins */}
      <Section title="3. Margins" subtitle="How close to pickup customers can book + duration limits.">
        <div className="grid gap-3 sm:grid-cols-3">
          <Field label="Margin hours (lead time)">
            <input type="number" min={0} max={720} value={marginHours} onChange={e => setMarginHours(e.target.value)} className="w-full bg-transparent text-base outline-none" />
          </Field>
          <Field label="Min hours"><input type="number" min={1} max={168} value={minHours} onChange={e => setMinHours(e.target.value)} className="w-full bg-transparent text-base outline-none" /></Field>
          <Field label="Max hours"><input type="number" min={1} max={168} value={maxHours} onChange={e => setMaxHours(e.target.value)} className="w-full bg-transparent text-base outline-none" /></Field>
        </div>
      </Section>

      {/* Coverage */}
      <Section title="4. Coverage" subtitle="Select polygons in any country. You can mix countries on the same rule.">
        <div className="grid gap-3 sm:grid-cols-[200px_1fr] sm:items-start">
          <Field label="Country (filter)">
            <select value={country} onChange={e => setCountry(e.target.value)}
              className="w-full bg-transparent text-base outline-none">
              <option value="">— pick country —</option>
              {countries?.map(c => (
                <option key={c.code} value={c.code.toLowerCase()}>{c.name} ({c.code})</option>
              ))}
            </select>
          </Field>
          <div>
            {!country ? (
              <p className="text-xs text-ink-500">Pick a country to load its polygons.</p>
            ) : !polygons ? (
              <p className="inline-flex items-center gap-2 text-xs text-ink-500">
                <Loader2 className="h-3 w-3 animate-spin" /> Loading polygons…
              </p>
            ) : (
              <div className="grid gap-1.5 sm:grid-cols-2 lg:grid-cols-3">
                {polygons.map(p => {
                  const checked = selectedPolygons.includes(p.id);
                  return (
                    <label key={p.id} className={`flex items-center gap-2 rounded-xl border px-2.5 py-1.5 text-xs ${checked ? 'border-brand-300 bg-brand-50' : 'border-ink-100 bg-white hover:border-ink-200'}`}>
                      <input type="checkbox" checked={checked} onChange={() => togglePolygon(p.id)}
                        className="h-3.5 w-3.5 rounded border-ink-300 text-brand-500" />
                      <span className="truncate">{p.name}</span>
                    </label>
                  );
                })}
              </div>
            )}
            {selectedPolygons.length > 0 ? (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {selectedPolygons.map(id => (
                  <span key={id} className="inline-flex items-center gap-1 rounded-full bg-brand-100 px-2 py-0.5 text-[11px] font-semibold text-brand-700">
                    #{id}
                    <button type="button" onClick={() => togglePolygon(id)} className="hover:text-brand-900">
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            ) : null}
          </div>
        </div>
      </Section>

      {/* Price matrix */}
      <Section title="5. Price matrix" subtitle="Tick a class to publish a price for it. Empty rows are ignored.">
        {classes ? (
          <ul className="space-y-2">
            {classes.map(c => {
              const ps = priceMap[c.slug] ?? { enabled: false, hourlyRate: '0.00', includedKmPerHour: 50 };
              return (
                <li key={c.slug} className="rounded-2xl border border-ink-100 bg-white p-3">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <label className="flex cursor-pointer items-center gap-2">
                      <input type="checkbox" checked={ps.enabled}
                        onChange={e => setPriceField(c.slug, { enabled: e.target.checked })}
                        className="h-4 w-4 rounded border-ink-300 text-brand-500" />
                      <div>
                        <div className="text-sm font-bold text-ink-900">{c.name}</div>
                        <div className="text-[11px] text-ink-500">{c.description ?? c.vehicleTypeName}</div>
                      </div>
                    </label>
                    {ps.enabled ? (
                      <div className="flex flex-wrap items-center gap-3">
                        <label className="text-xs">
                          <span className="block text-[10px] font-bold uppercase tracking-wider text-ink-500">
                            {currency} / hour
                          </span>
                          <input type="number" step="0.01" min={0} value={ps.hourlyRate}
                            onChange={e => setPriceField(c.slug, { hourlyRate: e.target.value })}
                            className="mt-1 w-28 rounded-lg border border-ink-200 px-2 py-1 outline-none focus:border-brand-500" />
                        </label>
                        <label className="text-xs">
                          <span className="block text-[10px] font-bold uppercase tracking-wider text-ink-500">km / hour</span>
                          <input type="number" step="1" min={0} max={500} value={ps.includedKmPerHour}
                            onChange={e => setPriceField(c.slug, { includedKmPerHour: Number(e.target.value) })}
                            className="mt-1 w-24 rounded-lg border border-ink-200 px-2 py-1 outline-none focus:border-brand-500" />
                        </label>
                      </div>
                    ) : null}
                  </div>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="inline-flex items-center gap-2 text-xs text-ink-500">
            <Loader2 className="h-3 w-3 animate-spin" /> Loading vehicle classes…
          </p>
        )}
      </Section>

      {error ? (
        <div className="inline-flex w-full items-start gap-2 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <AlertCircle className="h-4 w-4 mt-0.5" />
          {error}
        </div>
      ) : null}
      {success ? (
        <div className="inline-flex w-full items-start gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          <CheckCircle2 className="h-4 w-4 mt-0.5" />
          Saved.
        </div>
      ) : null}

      <div className="sticky bottom-4 z-10 flex flex-wrap items-center justify-end gap-2 rounded-2xl border border-ink-100 bg-white p-3 shadow-soft">
        {mode === 'edit' ? (
          <button onClick={onDelete} disabled={busy}
            className="mr-auto inline-flex items-center gap-1.5 rounded-xl bg-red-50 px-3 py-2 text-xs font-bold text-red-700 hover:bg-red-100 disabled:opacity-50">
            <Trash2 className="h-3.5 w-3.5" />
            Delete rule
          </button>
        ) : null}
        <button onClick={onSave} disabled={busy}
          className="inline-flex items-center gap-1.5 rounded-xl bg-brand-600 px-4 py-2 text-sm font-bold text-white hover:bg-brand-700 disabled:opacity-50">
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          {mode === 'create' ? 'Create rule' : 'Save changes'}
        </button>
      </div>
    </div>
  );
};

const Section: React.FC<{ title: string; subtitle?: string; children: React.ReactNode }> = ({ title, subtitle, children }) => (
  <section className="space-y-3 rounded-3xl border border-ink-100 bg-white p-5 shadow-soft">
    <div>
      <h2 className="text-base font-bold text-ink-900">{title}</h2>
      {subtitle ? <p className="mt-0.5 text-xs text-ink-500">{subtitle}</p> : null}
    </div>
    {children}
  </section>
);

const Field: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <label className="block rounded-2xl border border-ink-200 bg-white px-4 py-3 focus-within:border-brand-500">
    <span className="text-[10px] font-bold uppercase tracking-wider text-ink-500">{label}</span>
    <div className="mt-1">{children}</div>
  </label>
);
