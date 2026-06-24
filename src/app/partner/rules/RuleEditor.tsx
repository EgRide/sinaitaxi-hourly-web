'use client';

// Shared form for creating + editing a HourlyPriceRule.
//
// Sections:
//   1. Identity      — name + currency + active toggle
//   2. Validity      — optional from/to dates
//   3. Margins       — marginHours, minHours, maxHours
//   4. Coverage      — multi-select polygons (country dropdown narrows the list)
//   5. Price matrix  — one row per vehicle class with hourlyRate + km/h
//
// Submit calls partnerApi.createRule or .updateRule based on which
// id is passed in; on success the parent route bumps to /partner/rules.

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Save, Trash2, AlertCircle, Loader2, Check, X } from 'lucide-react';
import { api, type Country, type Polygon, type VehicleClass } from '@/lib/api';
import { partnerApi, type PartnerRule, type PartnerRulePrice } from '@/lib/partner-api';

interface Props {
  initial?: PartnerRule;
  mode: 'create' | 'edit';
}

const CURRENCIES = ['EUR', 'USD', 'GBP', 'EGP', 'AED', 'SAR'];

export const RuleEditor: React.FC<Props> = ({ initial, mode }) => {
  const router = useRouter();

  const [name, setName] = useState(initial?.name ?? '');
  const [currency, setCurrency] = useState(initial?.currency ?? 'EUR');
  const [active, setActive] = useState(initial?.active ?? true);
  const [validFrom, setValidFrom] = useState(initial?.validFrom?.slice(0, 10) ?? '');
  const [validTo,   setValidTo]   = useState(initial?.validTo?.slice(0, 10) ?? '');
  const [marginHours, setMarginHours] = useState(initial?.marginHours ?? 24);
  const [minHours,    setMinHours]    = useState(initial?.minHours ?? 1);
  const [maxHours,    setMaxHours]    = useState(initial?.maxHours ?? 168);

  // Polygon picker: load all PHP operating countries → polygons.
  // Partner picks a country to narrow the list, then ticks polygons
  // to cover. Selection persists across country switches so they
  // can publish a multi-country rule.
  const [countries, setCountries] = useState<Country[] | null>(null);
  const [pickedCountry, setPickedCountry] = useState<string>('');
  const [polygonsByCountry, setPolygonsByCountry] = useState<Record<string, Polygon[]>>({});
  const [polygonNames, setPolygonNames] = useState<Record<string, string>>({});
  const [selectedPolygonIds, setSelectedPolygonIds] = useState<string[]>(initial?.polygonPhpIds ?? []);
  const [polygonsLoading, setPolygonsLoading] = useState(false);

  // Vehicle-class matrix: load class list once, prefill prices
  // from initial, render an enabled/disabled row per class.
  const [classes, setClasses] = useState<VehicleClass[] | null>(null);
  type PriceState = { enabled: boolean; hourlyRate: string; includedKmPerHour: number };
  const [priceMap, setPriceMap] = useState<Record<string, PriceState>>({});

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void api.countries().then(r => {
      setCountries(r.countries);
      if (r.countries[0] && !pickedCountry) setPickedCountry(r.countries[0].code);
    }).catch((e: Error) => setError(e.message));
    void api.vehicleClasses().then(r => {
      setClasses(r.classes);
      const map: Record<string, PriceState> = {};
      for (const c of r.classes) {
        const existing = initial?.prices.find(p => p.vehicleClass === c.slug);
        map[c.slug] = existing
          ? { enabled: true, hourlyRate: existing.hourlyRate.toFixed(2), includedKmPerHour: existing.includedKmPerHour }
          : { enabled: false, hourlyRate: '', includedKmPerHour: 50 };
      }
      setPriceMap(map);
    }).catch((e: Error) => setError(e.message));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!pickedCountry) return;
    if (polygonsByCountry[pickedCountry]) return;
    setPolygonsLoading(true);
    api.polygons(pickedCountry)
      .then(r => {
        setPolygonsByCountry(prev => ({ ...prev, [pickedCountry]: r.polygons }));
        setPolygonNames(prev => {
          const next = { ...prev };
          for (const p of r.polygons) next[p.id] = p.name;
          return next;
        });
      })
      .catch((e: Error) => setError(e.message))
      .finally(() => setPolygonsLoading(false));
  }, [pickedCountry, polygonsByCountry]);

  const togglePolygon = (id: string) => {
    setSelectedPolygonIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const setPriceField = (slug: string, patch: Partial<PriceState>) => {
    setPriceMap(prev => ({ ...prev, [slug]: { ...prev[slug]!, ...patch } }));
  };

  const finalPrices: PartnerRulePrice[] = useMemo(() => {
    if (!classes) return [];
    const out: PartnerRulePrice[] = [];
    for (const c of classes) {
      const p = priceMap[c.slug];
      if (!p?.enabled) continue;
      const rate = Number(p.hourlyRate);
      if (!Number.isFinite(rate) || rate <= 0) continue;
      out.push({ vehicleClass: c.slug, hourlyRate: rate, includedKmPerHour: p.includedKmPerHour });
    }
    return out;
  }, [classes, priceMap]);

  const canSave = name.length === 0 || (
    selectedPolygonIds.length > 0 &&
    finalPrices.length > 0 &&
    minHours > 0 && maxHours >= minHours
  );

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedPolygonIds.length === 0) {
      setError('Pick at least one polygon to cover.');
      return;
    }
    if (finalPrices.length === 0) {
      setError('Publish a price for at least one vehicle class.');
      return;
    }
    if (minHours > maxHours) {
      setError('Min hours must not be above max hours.');
      return;
    }
    setError(null);
    setSaving(true);
    try {
      const payload = {
        name: name || null,
        currency,
        active,
        validFrom: validFrom || null,
        validTo:   validTo   || null,
        marginHours, minHours, maxHours,
        polygonPhpIds: selectedPolygonIds,
        prices: finalPrices,
      };
      if (mode === 'edit' && initial) {
        await partnerApi.updateRule(initial.id, payload);
      } else {
        await partnerApi.createRule(payload);
      }
      router.push('/partner/rules');
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const onDelete = async () => {
    if (!initial) return;
    if (!confirm('Pause this rule? It will stop appearing in customer searches.')) return;
    try {
      await partnerApi.deleteRule(initial.id);
      router.push('/partner/rules');
    } catch (e) {
      setError((e as Error).message);
    }
  };

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      {/* 1. Identity */}
      <Section title="1. Name &amp; currency" subtitle="A short label for yourself; the customer never sees this.">
        <div className="grid gap-3 sm:grid-cols-[1fr_auto_auto]">
          <Field label="Rule name">
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. Summer 2026 — Sharm"
              className="w-full bg-transparent text-base outline-none"
            />
          </Field>
          <Field label="Currency">
            <select value={currency} onChange={e => setCurrency(e.target.value)} className="bg-transparent text-base outline-none">
              {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </Field>
          <Field label="Active">
            <label className="flex items-center gap-2 text-sm font-medium">
              <input
                type="checkbox"
                checked={active}
                onChange={e => setActive(e.target.checked)}
                className="h-4 w-4 rounded border-ink-300 text-brand-500"
              />
              {active ? 'Visible to customers' : 'Paused'}
            </label>
          </Field>
        </div>
      </Section>

      {/* 2. Validity */}
      <Section title="2. Validity (optional)" subtitle="Leave blank if the rule should always apply. Useful for seasonal pricing.">
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Valid from">
            <input type="date" value={validFrom} onChange={e => setValidFrom(e.target.value)} className="w-full bg-transparent text-base outline-none" />
          </Field>
          <Field label="Valid to">
            <input type="date" value={validTo} onChange={e => setValidTo(e.target.value)} className="w-full bg-transparent text-base outline-none" />
          </Field>
        </div>
      </Section>

      {/* 3. Margins */}
      <Section title="3. Booking window" subtitle="Control how much notice you need + the booking length you'll accept.">
        <div className="grid gap-3 sm:grid-cols-3">
          <Field label="Notice required (hours)">
            <input type="number" min={0} max={720} value={marginHours} onChange={e => setMarginHours(Number(e.target.value))} className="w-full bg-transparent text-base outline-none" />
          </Field>
          <Field label="Min booking (hours)">
            <input type="number" min={1} max={168} value={minHours} onChange={e => setMinHours(Number(e.target.value))} className="w-full bg-transparent text-base outline-none" />
          </Field>
          <Field label="Max booking (hours)">
            <input type="number" min={1} max={168} value={maxHours} onChange={e => setMaxHours(Number(e.target.value))} className="w-full bg-transparent text-base outline-none" />
          </Field>
        </div>
      </Section>

      {/* 4. Coverage */}
      <Section title="4. Coverage" subtitle="Pick every polygon you can service under this rule. Mix countries if you operate multi-region.">
        {countries ? (
          <>
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-ink-500">Show polygons in</span>
              <select value={pickedCountry} onChange={e => setPickedCountry(e.target.value)} className="rounded-xl border border-ink-200 bg-white px-3 py-1.5 text-sm">
                {countries.map(c => <option key={c.code} value={c.code}>{c.name}</option>)}
              </select>
              <span className="text-xs text-ink-500">
                {selectedPolygonIds.length} polygon{selectedPolygonIds.length === 1 ? '' : 's'} selected total
              </span>
            </div>
            {polygonsLoading ? (
              <div className="text-sm text-ink-500 inline-flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" /> Loading polygons…</div>
            ) : polygonsByCountry[pickedCountry]?.length ? (
              <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {polygonsByCountry[pickedCountry]!.map(p => {
                  const checked = selectedPolygonIds.includes(p.id);
                  return (
                    <li key={p.id}>
                      <label className={`flex items-center justify-between gap-2 rounded-xl border px-3 py-2 text-sm cursor-pointer ${checked ? 'border-brand-500 bg-brand-50' : 'border-ink-200 hover:border-ink-300'}`}>
                        <span className="font-medium text-ink-800 truncate">{p.name}</span>
                        <input type="checkbox" checked={checked} onChange={() => togglePolygon(p.id)} className="h-4 w-4 rounded border-ink-300 text-brand-500" />
                      </label>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="text-sm text-ink-500">No polygons in this country yet.</p>
            )}

            {selectedPolygonIds.length > 0 ? (
              <div className="mt-4 rounded-2xl border border-ink-100 bg-white p-3">
                <h3 className="text-[10px] font-bold uppercase tracking-wider text-ink-500">Selected ({selectedPolygonIds.length})</h3>
                <ul className="mt-2 flex flex-wrap gap-2">
                  {selectedPolygonIds.map(id => (
                    <li key={id} className="inline-flex items-center gap-1 rounded-full bg-brand-100 px-3 py-1 text-xs font-medium text-brand-800">
                      {polygonNames[id] ?? id}
                      <button type="button" onClick={() => togglePolygon(id)} aria-label="Remove" className="text-brand-700 hover:text-brand-900">
                        <X className="h-3 w-3" />
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </>
        ) : (
          <div className="text-sm text-ink-500 inline-flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" /> Loading countries…</div>
        )}
      </Section>

      {/* 5. Prices */}
      <Section title="5. Price per vehicle class" subtitle={`Hourly rate is what you receive in ${currency}. The marketplace adds the country commission on top.`}>
        {classes ? (
          <ul className="space-y-2">
            {classes.map(c => {
              const ps = priceMap[c.slug];
              if (!ps) return null;
              return (
                <li key={c.slug} className="rounded-2xl border border-ink-100 bg-white p-3">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={ps.enabled}
                        onChange={e => setPriceField(c.slug, { enabled: e.target.checked })}
                        className="h-4 w-4 rounded border-ink-300 text-brand-500"
                      />
                      <div>
                        <div className="font-bold text-ink-900">{c.label}</div>
                        <div className="text-xs text-ink-500">{c.description} · {c.seats}</div>
                      </div>
                    </label>
                    {ps.enabled ? (
                      <div className="flex flex-wrap items-center gap-3">
                        <label className="text-sm">
                          <span className="block text-[10px] font-bold uppercase tracking-wider text-ink-500">{currency} / hour</span>
                          <input
                            type="number" step="0.01" min={0}
                            value={ps.hourlyRate}
                            onChange={e => setPriceField(c.slug, { hourlyRate: e.target.value })}
                            className="mt-1 w-28 rounded-lg border border-ink-200 bg-white px-2 py-1 outline-none focus:border-brand-500"
                            required={ps.enabled}
                          />
                        </label>
                        <label className="text-sm">
                          <span className="block text-[10px] font-bold uppercase tracking-wider text-ink-500">km / hour</span>
                          <input
                            type="number" step="1" min={0} max={500}
                            value={ps.includedKmPerHour}
                            onChange={e => setPriceField(c.slug, { includedKmPerHour: Number(e.target.value) })}
                            className="mt-1 w-24 rounded-lg border border-ink-200 bg-white px-2 py-1 outline-none focus:border-brand-500"
                          />
                        </label>
                      </div>
                    ) : (
                      <span className="text-xs text-ink-400">Not published</span>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        ) : (
          <div className="text-sm text-ink-500 inline-flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" /> Loading classes…</div>
        )}
      </Section>

      {error ? (
        <div className="inline-flex w-full items-start gap-2 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
          {error}
        </div>
      ) : null}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link href="/partner/rules" className="text-sm font-semibold text-ink-600 hover:text-ink-900">← Cancel</Link>
        <div className="flex items-center gap-3">
          {mode === 'edit' ? (
            <button type="button" onClick={onDelete} className="inline-flex items-center gap-1.5 rounded-2xl border border-ink-200 px-4 py-2 text-sm font-semibold text-ink-700 hover:text-red-700 hover:border-red-200">
              <Trash2 className="h-4 w-4" /> Pause rule
            </button>
          ) : null}
          <button type="submit" disabled={saving || !canSave} className="btn-primary !py-2.5 !px-4 !text-sm disabled:opacity-50">
            {saving ? (<><Loader2 className="h-4 w-4 animate-spin" /> Saving…</>) : (<><Save className="h-4 w-4" /> {mode === 'create' ? 'Publish rule' : 'Save changes'}</>)}
          </button>
        </div>
      </div>

      {selectedPolygonIds.length > 0 && finalPrices.length > 0 ? (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-xs text-emerald-800">
          <Check className="inline h-3.5 w-3.5 mr-1" />
          Customers in the selected polygons will see this rule when they search with {minHours}-{maxHours} hour duration and at least {marginHours}h notice.
        </div>
      ) : null}
    </form>
  );
};

const Section: React.FC<{ title: string; subtitle?: string; children: React.ReactNode }> = ({ title, subtitle, children }) => (
  <section className="rounded-3xl border border-ink-100 bg-white p-6 shadow-soft">
    <h2 className="text-lg font-bold tracking-tight">{title}</h2>
    {subtitle ? <p className="mt-1 text-sm text-ink-500">{subtitle}</p> : null}
    <div className="mt-4">{children}</div>
  </section>
);

const Field: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <label className="block rounded-2xl border border-ink-200 bg-white px-4 py-3 focus-within:border-brand-500">
    <span className="text-[10px] font-bold uppercase tracking-wider text-ink-500">{label}</span>
    <div className="mt-1">{children}</div>
  </label>
);
