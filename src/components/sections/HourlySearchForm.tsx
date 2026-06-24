'use client';

// Address-first search form (Mozio shape, adapted for our PHP
// constraint).
//
// One input: pickup address (Google Places autocomplete). When
// the customer picks a place we send the address_components to
// /v1/resolve-address; server figures out the country + best-
// guess polygon. The customer sees the resolved polygon inline
// and can override via a small "change" link.
//
// PHP doesn't expose polygon geometry, so the server uses a
// fuzzy locality/sublocality → polygon-name match instead of
// pure point-in-polygon. If we can't match we render the country's
// polygon list as a fallback dropdown.

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Calendar, Clock, ArrowRight, CheckCircle2, AlertCircle, ChevronDown, CalendarDays } from 'lucide-react';
import { cn } from '@/lib/cn';
import { api, type ResolveAddressResult } from '@/lib/api';
import { GooglePlacesAddress, type ResolvedPlace } from '@/components/sections/GooglePlacesAddress';

type Mode = 'hours' | 'days';

interface PickedAddress {
  formattedAddress: string;
  lat: number;
  lng: number;
}

export const HourlySearchForm: React.FC = () => {
  const router = useRouter();
  const [address, setAddress] = useState<PickedAddress | null>(null);
  const [resolution, setResolution] = useState<ResolveAddressResult | null>(null);
  const [resolving, setResolving] = useState(false);
  const [resolveError, setResolveError] = useState<string | null>(null);
  // If the auto-match is wrong, customer can override.
  const [overridePolygonId, setOverridePolygonId] = useState<string | null>(null);
  const [changing, setChanging] = useState(false);

  const [pickupAt, setPickupAt] = useState(defaultPickupAt());
  const [mode, setMode] = useState<Mode>('hours');
  const [hours, setHours] = useState(4);
  // Multi-day bookings are an ARRAY of hours-per-day instead of N × 24.
  // The customer can keep all days the same (sameHoursEveryDay = true)
  // or set a different value for each day. Total chargeable time is
  // the sum across days.
  const [days, setDays] = useState(2);
  const [sameHoursEveryDay, setSameHoursEveryDay] = useState(true);
  const [hoursPerDay, setHoursPerDay] = useState<number[]>([4, 4]);
  const [uniformHours, setUniformHours] = useState(4);

  // Keep the hoursPerDay array length in sync with the days count.
  // Growing → append the current uniform value; shrinking → truncate.
  useEffect(() => {
    setHoursPerDay(prev => {
      if (prev.length === days) return prev;
      if (prev.length < days) {
        const fill = sameHoursEveryDay ? uniformHours : (prev[prev.length - 1] ?? 4);
        return [...prev, ...Array.from({ length: days - prev.length }, () => fill)];
      }
      return prev.slice(0, days);
    });
  }, [days, sameHoursEveryDay, uniformHours]);

  // When "Same hours every day" is on, the uniform value is the
  // source of truth — push it into the array on every change.
  useEffect(() => {
    if (!sameHoursEveryDay) return;
    setHoursPerDay(Array.from({ length: days }, () => uniformHours));
  }, [sameHoursEveryDay, uniformHours, days]);

  const totalHours = mode === 'hours' ? hours : hoursPerDay.reduce((s, h) => s + h, 0);

  const onPlaceResolved = useCallback(async (place: ResolvedPlace) => {
    setAddress({
      formattedAddress: place.formattedAddress,
      lat: place.lat,
      lng: place.lng,
    });
    setResolution(null);
    setResolveError(null);
    setOverridePolygonId(null);
    setChanging(false);
    setResolving(true);
    try {
      const r = await api.resolveAddress({
        countryCode: place.countryCode,
        locality: place.locality,
        sublocality: place.sublocality,
        lat: place.lat,
        lng: place.lng,
        address: place.formattedAddress,
      });
      setResolution(r);
    } catch (e) {
      setResolveError((e as Error).message);
    } finally {
      setResolving(false);
    }
  }, []);

  // The polygon ID we'll actually submit with — either the matched
  // one or the customer's override.
  const effectivePolygonId = useMemo<string | null>(() => {
    if (overridePolygonId) return overridePolygonId;
    if (resolution && !resolution.notServiced && resolution.polygon) return resolution.polygon.id;
    return null;
  }, [resolution, overridePolygonId]);

  const canSubmit = Boolean(address && effectivePolygonId && pickupAt);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit || !address || !effectivePolygonId) return;
    if (!resolution || resolution.notServiced) return;
    const params = new URLSearchParams({
      countryCode: resolution.country.code,
      polygonId: effectivePolygonId,
      pickupAddress: address.formattedAddress,
      pickupLat: String(address.lat),
      pickupLng: String(address.lng),
      pickupAt,
      durationHours: String(totalHours),
    });
    if (mode === 'days') {
      // hoursPerDay is a CSV like "4,4,5,4,4" — total chargeable
      // time is the sum, but the partner needs the per-day shape
      // so they know when to dispatch the driver each morning.
      params.set('days', String(days));
      params.set('hoursPerDay', hoursPerDay.join(','));
    }
    router.push(`/search?${params.toString()}`);
  };

  return (
    <form
      onSubmit={onSubmit}
      className="rounded-3xl border border-ink-100 bg-white p-4 shadow-soft sm:p-5">
      <GooglePlacesAddress onResolve={onPlaceResolved} />

      <ResolutionPanel
        resolution={resolution}
        resolving={resolving}
        error={resolveError}
        candidatesOpen={changing}
        onChangeClick={() => setChanging(true)}
        overridePolygonId={overridePolygonId}
        onOverridePolygon={id => { setOverridePolygonId(id); setChanging(false); }}
      />

      <div className="mt-3">
        <Field label="Pickup date &amp; time" icon={<Calendar className="h-4 w-4" />}>
          <input
            type="datetime-local"
            value={pickupAt}
            onChange={e => setPickupAt(e.target.value)}
            className="w-full bg-transparent text-base outline-none"
            required
          />
        </Field>
      </div>

      <DurationPicker
        mode={mode}
        onModeChange={setMode}
        hours={hours}
        onHoursChange={setHours}
        days={days}
        onDaysChange={setDays}
        sameHoursEveryDay={sameHoursEveryDay}
        onSameHoursEveryDayChange={setSameHoursEveryDay}
        uniformHours={uniformHours}
        onUniformHoursChange={setUniformHours}
        hoursPerDay={hoursPerDay}
        onHoursPerDayChange={setHoursPerDay}
        totalHours={totalHours}
      />

      <button
        type="submit"
        disabled={!canSubmit}
        className="btn-primary mt-3 w-full py-3.5">
        Search hourly options
        <ArrowRight className="h-4 w-4" />
      </button>
    </form>
  );
};

const ResolutionPanel: React.FC<{
  resolution: ResolveAddressResult | null;
  resolving: boolean;
  error: string | null;
  candidatesOpen: boolean;
  onChangeClick: () => void;
  overridePolygonId: string | null;
  onOverridePolygon: (id: string) => void;
}> = ({ resolution, resolving, error, candidatesOpen, onChangeClick, overridePolygonId, onOverridePolygon }) => {
  if (resolving) {
    return (
      <div className="mt-3 rounded-2xl border border-ink-100 bg-ink-50/60 px-4 py-3 text-sm text-ink-500">
        Looking up your service area…
      </div>
    );
  }
  if (error) {
    return (
      <div className="mt-3 inline-flex items-center gap-2 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
        <AlertCircle className="h-4 w-4" />
        {error}
      </div>
    );
  }
  if (!resolution) return null;

  if (resolution.notServiced) {
    return (
      <div className="mt-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
        <div className="font-semibold">We don't service this location yet</div>
        <p className="mt-1 text-xs leading-relaxed">
          {resolution.reason === 'country_not_operated'
            ? `Sinai Taxi Hourly isn't live in ${resolution.country?.name ?? resolution.countryCode} yet.`
            : `We're working on adding service areas in ${resolution.country?.name ?? resolution.countryCode}.`}
        </p>
      </div>
    );
  }

  const candidates = resolution.candidates;
  const matchedId = overridePolygonId ?? resolution.polygon?.id ?? null;
  const matched = candidates.find(c => c.id === matchedId) ?? resolution.polygon;

  // No candidates at all in this country.
  if (candidates.length === 0) {
    return (
      <div className="mt-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
        <div className="font-semibold">No service areas in {resolution.country.name} yet</div>
      </div>
    );
  }

  // Auto-matched (or overridden) → show "Service area: X" with change link.
  if (matched && !candidatesOpen) {
    const overridden = Boolean(overridePolygonId);
    return (
      <div className="mt-3 flex items-center justify-between gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3">
        <div className="flex items-center gap-2 text-sm text-emerald-800">
          <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          <span>
            Service area: <strong>{matched.name}</strong>
            <span className="ml-1 text-emerald-700/70">· {resolution.country.name}</span>
          </span>
        </div>
        {candidates.length > 1 ? (
          <button
            type="button"
            onClick={onChangeClick}
            className="text-xs font-semibold text-emerald-700 underline-offset-2 hover:underline">
            {overridden ? 'Change' : 'Change'}
          </button>
        ) : null}
      </div>
    );
  }

  // Manual pick mode — either user clicked "Change" or auto-match failed.
  return (
    <div className="mt-3 rounded-2xl border border-ink-200 bg-white px-4 py-3">
      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-ink-500">
        <ChevronDown className="h-3.5 w-3.5" />
        Pick a service area in {resolution.country.name}
      </div>
      <select
        value={matchedId ?? ''}
        onChange={e => onOverridePolygon(e.target.value)}
        className="mt-1 w-full bg-transparent text-base outline-none">
        <option value="" disabled>Select…</option>
        {candidates.map(p => (
          <option key={p.id} value={p.id}>{p.name}</option>
        ))}
      </select>
    </div>
  );
};

interface DurationPickerProps {
  mode: Mode;
  onModeChange: (m: Mode) => void;
  hours: number;
  onHoursChange: (h: number) => void;
  days: number;
  onDaysChange: (d: number) => void;
  sameHoursEveryDay: boolean;
  onSameHoursEveryDayChange: (v: boolean) => void;
  uniformHours: number;
  onUniformHoursChange: (h: number) => void;
  hoursPerDay: number[];
  onHoursPerDayChange: (arr: number[]) => void;
  totalHours: number;
}

const DurationPicker: React.FC<DurationPickerProps> = ({
  mode, onModeChange,
  hours, onHoursChange,
  days, onDaysChange,
  sameHoursEveryDay, onSameHoursEveryDayChange,
  uniformHours, onUniformHoursChange,
  hoursPerDay, onHoursPerDayChange,
  totalHours,
}) => {
  const setOneDay = (i: number, value: number) => {
    const next = [...hoursPerDay];
    next[i] = value;
    onHoursPerDayChange(next);
  };

  return (
    <div className="mt-3 rounded-2xl border border-ink-200 bg-white p-3">
      <div className="flex items-center justify-between gap-2">
        <div className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-ink-500">
          <Clock className="h-3.5 w-3.5" />
          Duration
        </div>
        <div className="inline-flex rounded-full border border-ink-200 bg-white p-0.5 text-xs">
          <ModeBtn active={mode === 'hours'} onClick={() => onModeChange('hours')}>Hours</ModeBtn>
          <ModeBtn active={mode === 'days'} onClick={() => onModeChange('days')}>Days</ModeBtn>
        </div>
      </div>

      {mode === 'hours' ? (
        <div className="mt-3">
          <select
            value={hours}
            onChange={e => onHoursChange(Number(e.target.value))}
            className="w-full rounded-xl border border-ink-200 bg-white px-3 py-2.5 text-base outline-none focus:border-brand-500">
            {Array.from({ length: 23 }, (_, i) => i + 1).map(h => (
              <option key={h} value={h}>{h} {h === 1 ? 'hour' : 'hours'}</option>
            ))}
          </select>
        </div>
      ) : (
        <div className="mt-3 space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl border border-ink-100 bg-ink-50/40 px-3 py-2">
              <span className="block text-[10px] font-bold uppercase tracking-wider text-ink-500">
                Number of days
              </span>
              <select
                value={days}
                onChange={e => onDaysChange(Number(e.target.value))}
                className="mt-1 w-full bg-transparent text-base outline-none">
                {Array.from({ length: 14 }, (_, i) => i + 1).map(d => (
                  <option key={d} value={d}>{d} {d === 1 ? 'day' : 'days'}</option>
                ))}
              </select>
            </div>
            <div className="rounded-xl border border-ink-100 bg-ink-50/40 px-3 py-2">
              <label className="flex items-center justify-between gap-2 text-[10px] font-bold uppercase tracking-wider text-ink-500">
                <span>Same hours every day</span>
                <input
                  type="checkbox"
                  checked={sameHoursEveryDay}
                  onChange={e => onSameHoursEveryDayChange(e.target.checked)}
                  className="h-4 w-4 rounded border-ink-300 text-brand-500 focus:ring-brand-500"
                />
              </label>
              {sameHoursEveryDay ? (
                <select
                  value={uniformHours}
                  onChange={e => onUniformHoursChange(Number(e.target.value))}
                  className="mt-1 w-full bg-transparent text-base outline-none">
                  {Array.from({ length: 23 }, (_, i) => i + 1).map(h => (
                    <option key={h} value={h}>{h} {h === 1 ? 'hour' : 'hours'} / day</option>
                  ))}
                </select>
              ) : (
                <p className="mt-1 text-xs text-ink-500">Pick hours per day below.</p>
              )}
            </div>
          </div>

          {!sameHoursEveryDay ? (
            <div className="rounded-xl border border-ink-100 bg-white">
              <div className="flex items-center gap-1.5 border-b border-ink-100 px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-ink-500">
                <CalendarDays className="h-3.5 w-3.5" />
                Per-day schedule
              </div>
              <ul className="max-h-64 divide-y divide-ink-100 overflow-auto">
                {hoursPerDay.map((h, i) => (
                  <li key={i} className="flex items-center justify-between gap-3 px-3 py-2">
                    <span className="text-sm font-medium text-ink-700">Day {i + 1}</span>
                    <select
                      value={h}
                      onChange={e => setOneDay(i, Number(e.target.value))}
                      className="rounded-lg border border-ink-200 bg-white px-2 py-1 text-sm outline-none focus:border-brand-500">
                      {Array.from({ length: 23 }, (_, x) => x + 1).map(opt => (
                        <option key={opt} value={opt}>{opt} {opt === 1 ? 'hour' : 'hours'}</option>
                      ))}
                    </select>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          <div className="flex items-center justify-between rounded-xl bg-brand-50 px-3 py-2 text-sm">
            <span className="font-semibold text-brand-800">Total chargeable time</span>
            <span className="font-bold text-brand-900">{totalHours} {totalHours === 1 ? 'hour' : 'hours'}</span>
          </div>
        </div>
      )}
    </div>
  );
};

const Field: React.FC<{ label: string; icon: React.ReactNode; children: React.ReactNode }> = ({ label, icon, children }) => (
  <label className="block rounded-2xl border border-ink-200 bg-white px-4 py-3 focus-within:border-brand-500">
    <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-ink-500">
      {icon}
      {label}
    </span>
    <div className="mt-1">{children}</div>
  </label>
);

const ModeBtn: React.FC<{ active: boolean; onClick: () => void; children: React.ReactNode }> = ({ active, onClick, children }) => (
  <button
    type="button"
    onClick={onClick}
    className={cn(
      'rounded-full px-3 py-1.5 font-semibold transition',
      active ? 'bg-ink-900 text-white' : 'text-ink-600 hover:text-ink-900',
    )}>
    {children}
  </button>
);

function defaultPickupAt(): string {
  const d = new Date(Date.now() + 30 * 60 * 1000);
  d.setSeconds(0, 0);
  d.setMinutes(d.getMinutes() >= 30 ? 30 : 0);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
