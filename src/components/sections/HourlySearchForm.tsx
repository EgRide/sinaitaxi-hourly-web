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
// Days-mode UX (this revision):
// instead of one pickup time + per-day hours, the customer can
// set a Date, a Start time, AND Hours for EVERY day independently.
// Two "Same … every day" toggles cover the common case — when
// they're on, editing any row applies to all rows.

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Calendar, Clock, ArrowRight, CheckCircle2, AlertCircle, ChevronDown, CalendarDays, Globe2, MapPin, Plus, X, GripVertical, Sparkles, Route } from 'lucide-react';
import { cn } from '@/lib/cn';
import { api, type ResolveAddressResult } from '@/lib/api';
import { GooglePlacesAddress, type ResolvedPlace } from '@/components/sections/GooglePlacesAddress';

type Mode = 'hours' | 'days';

interface PickedAddress {
  formattedAddress: string;
  lat: number;
  lng: number;
}

// One waypoint beyond the pickup. Keyed by a stable id so drag-reorder
// (and Places autocomplete state) survive array moves.
interface Stop {
  id: string;
  place: PickedAddress | null;
}

let _stopSeq = 0;
const newStop = (): Stop => ({ id: `stop-${++_stopSeq}`, place: null });

const MIN_HOURS = 4;

function haversineKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const la1 = (a.lat * Math.PI) / 180;
  const la2 = (b.lat * Math.PI) / 180;
  const x = Math.sin(dLat / 2) ** 2 + Math.cos(la1) * Math.cos(la2) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
}

// Rough itinerary estimate from straight-line legs — a SUGGESTION only.
// Real road distance/time comes from the Distance Matrix once the server
// key is enabled; until then this drives the recommended-hours nudge, and
// never a charge. Road factor 1.3, ~35 km/h city average, ~20 min dwell
// per stop.
function estimateItinerary(points: { lat: number; lng: number }[]): { km: number; driveMin: number } {
  if (points.length < 2) return { km: 0, driveMin: 0 };
  let straight = 0;
  for (let i = 1; i < points.length; i++) straight += haversineKm(points[i - 1]!, points[i]!);
  const roadKm = straight * 1.3;
  const driveMin = (roadKm / 35) * 60 + (points.length - 1) * 20;
  return { km: Math.round(roadKm), driveMin: Math.round(driveMin) };
}

interface DayRow {
  date: string;   // YYYY-MM-DD
  time: string;   // HH:MM (24h)
  hours: number;  // 1..23
}

const pad = (n: number) => String(n).padStart(2, '0');

function defaultPickupAt(): string {
  const d = new Date(Date.now() + 30 * 60 * 1000);
  d.setSeconds(0, 0);
  d.setMinutes(d.getMinutes() >= 30 ? 30 : 0);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function defaultDay(): { date: string; time: string } {
  const d = new Date(Date.now() + 24 * 60 * 60 * 1000);
  d.setHours(9, 0, 0, 0);
  return {
    date: `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`,
    time: '09:00',
  };
}

function addDays(yyyymmdd: string, n: number): string {
  // YYYY-MM-DD → +n days → YYYY-MM-DD. Hand-rolled to dodge TZ shifts
  // that come from `new Date('YYYY-MM-DD')` interpreting as UTC.
  const [y, m, d] = yyyymmdd.split('-').map(Number);
  const dt = new Date(y!, (m ?? 1) - 1, d ?? 1);
  dt.setDate(dt.getDate() + n);
  return `${dt.getFullYear()}-${pad(dt.getMonth() + 1)}-${pad(dt.getDate())}`;
}

function buildInitialSchedule(days: number, base?: { date: string; time: string }, hours = 4): DayRow[] {
  const b = base ?? defaultDay();
  return Array.from({ length: days }, (_, i) => ({
    date: addDays(b.date, i),
    time: b.time,
    hours,
  }));
}

export const HourlySearchForm: React.FC = () => {
  const router = useRouter();
  const [address, setAddress] = useState<PickedAddress | null>(null);
  const [resolution, setResolution] = useState<ResolveAddressResult | null>(null);
  const [resolving, setResolving] = useState(false);
  const [resolveError, setResolveError] = useState<string | null>(null);
  const [overridePolygonId, setOverridePolygonId] = useState<string | null>(null);
  const [changing, setChanging] = useState(false);

  // Multi-stop itinerary (beyond the pickup) + live estimates.
  const [stops, setStops] = useState<Stop[]>([]);
  const [decideLater, setDecideLater] = useState(false);
  const [manualHours, setManualHours] = useState(false); // user overrode the recommendation
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [priceEstimate, setPriceEstimate] = useState<{ total: number; currency: string } | null>(null);

  // Mode
  const [mode, setMode] = useState<Mode>('hours');

  // Hours mode — single pickup time + total hours.
  const [pickupAt, setPickupAt] = useState(defaultPickupAt());
  const [hours, setHours] = useState(4);

  // Days mode — full per-day schedule.
  const initialDays = 2;
  const [days, setDays] = useState(initialDays);
  const [daySchedule, setDaySchedule] = useState<DayRow[]>(() => buildInitialSchedule(initialDays));
  const [sameHoursEveryDay, setSameHoursEveryDay] = useState(true);
  const [sameStartTimeEveryDay, setSameStartTimeEveryDay] = useState(true);

  // Keep the schedule length in sync with the day count.
  useEffect(() => {
    setDaySchedule(prev => {
      if (prev.length === days) return prev;
      if (prev.length < days) {
        const last = prev[prev.length - 1] ?? { date: defaultDay().date, time: '09:00', hours: 4 };
        const added: DayRow[] = Array.from({ length: days - prev.length }, (_, i) => ({
          date: addDays(last.date, i + 1),
          time: sameStartTimeEveryDay ? last.time : '09:00',
          hours: sameHoursEveryDay ? last.hours : 4,
        }));
        return [...prev, ...added];
      }
      return prev.slice(0, days);
    });
  }, [days, sameStartTimeEveryDay, sameHoursEveryDay]);

  // When a "same" toggle flips ON, replicate row-0 across all rows.
  useEffect(() => {
    if (!sameHoursEveryDay) return;
    setDaySchedule(prev => prev.map(r => ({ ...r, hours: prev[0]?.hours ?? 4 })));
  }, [sameHoursEveryDay]);

  useEffect(() => {
    if (!sameStartTimeEveryDay) return;
    setDaySchedule(prev => prev.map(r => ({ ...r, time: prev[0]?.time ?? '09:00' })));
  }, [sameStartTimeEveryDay]);

  const setDay = (i: number, patch: Partial<DayRow>) => {
    setDaySchedule(prev => prev.map((r, idx) => {
      if (idx !== i) return r;
      return { ...r, ...patch };
    }));
    // If the user is editing row-0 and the "same" toggle is on, replicate.
    if (i === 0) {
      if (patch.hours !== undefined && sameHoursEveryDay) {
        setDaySchedule(prev => prev.map(r => ({ ...r, hours: patch.hours! })));
      }
      if (patch.time !== undefined && sameStartTimeEveryDay) {
        setDaySchedule(prev => prev.map(r => ({ ...r, time: patch.time! })));
      }
      // Day-0 date change → re-base subsequent rows that weren't manually edited.
      // For simplicity we always re-base sequentially when Day 1 changes.
      if (patch.date !== undefined) {
        setDaySchedule(prev => prev.map((r, idx) => idx === 0 ? r : ({ ...r, date: addDays(patch.date!, idx) })));
      }
    }
  };

  const totalHours = mode === 'hours' ? hours : daySchedule.reduce((s, r) => s + (r.hours || 0), 0);

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
        administrativeArea: place.administrativeArea,
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

  const effectivePolygonId = useMemo<string | null>(() => {
    if (overridePolygonId) return overridePolygonId;
    if (resolution && !resolution.notServiced && resolution.polygon) return resolution.polygon.id;
    return null;
  }, [resolution, overridePolygonId]);

  // ── Multi-stop handlers ──
  const handleStopResolve = useCallback((place: ResolvedPlace, id?: string) => {
    if (!id) return;
    setStops(prev => prev.map(s => (s.id === id
      ? { ...s, place: { formattedAddress: place.formattedAddress, lat: place.lat, lng: place.lng } }
      : s)));
  }, []);
  const addStop = () => setStops(prev => (prev.length >= 6 ? prev : [...prev, newStop()]));
  const removeStop = (id: string) => setStops(prev => prev.filter(s => s.id !== id));
  const reorderStops = (from: number, to: number) => setStops(prev => {
    if (from === to || from < 0 || to < 0 || from >= prev.length || to >= prev.length) return prev;
    const next = [...prev];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved!);
    return next;
  });
  const handleHoursChange = (h: number) => { setManualHours(true); setHours(h); };
  const handleDecideLater = (v: boolean) => {
    setDecideLater(v);
    if (v) { setManualHours(false); if (mode === 'hours') setHours(MIN_HOURS); }
  };

  // ── Itinerary geometry → recommended hours (estimate, not a charge) ──
  const itineraryPoints = useMemo(() => {
    const pts: { lat: number; lng: number }[] = [];
    if (address) pts.push({ lat: address.lat, lng: address.lng });
    for (const s of stops) if (s.place) pts.push({ lat: s.place.lat, lng: s.place.lng });
    return pts;
  }, [address, stops]);
  const estimate = useMemo(() => estimateItinerary(itineraryPoints), [itineraryPoints]);
  const recommendedHours = useMemo(
    () => Math.min(23, Math.max(MIN_HOURS, Math.ceil(estimate.driveMin / 60))),
    [estimate.driveMin],
  );
  const hasItinerary = !decideLater && itineraryPoints.length >= 2;

  // Auto-apply the recommendation (hours mode) until the user overrides.
  useEffect(() => {
    if (mode !== 'hours' || decideLater || manualHours) return;
    if (itineraryPoints.length >= 2 && recommendedHours !== hours) setHours(recommendedHours);
  }, [recommendedHours, mode, decideLater, manualHours, itineraryPoints.length, hours]);

  // Debounced live "estimated from" price via the central engine.
  useEffect(() => {
    if (!effectivePolygonId) { setPriceEstimate(null); return; }
    const pickupIso = mode === 'hours'
      ? pickupAt
      : (daySchedule[0] ? `${daySchedule[0].date}T${daySchedule[0].time}` : pickupAt);
    // NOTE: no distanceKm here on purpose. Offers + checkout price
    // by-the-hour (distance-free), so the hero estimate must too, or it
    // would show a higher "from" than the very next page. The itinerary
    // still moves this price — via recommended HOURS (more stops → more
    // hours → higher base). Distance re-enters all three together when
    // the Distance Matrix key + extra-km charging land.
    const t = setTimeout(() => {
      api.quote({
        polygonId: effectivePolygonId,
        vehicleClass: 'economy-sedan',
        pickupAt: pickupIso,
        durationHours: totalHours,
      })
        .then(r => setPriceEstimate({ total: r.quote.total, currency: r.quote.currency }))
        .catch(() => setPriceEstimate(null));
    }, 400);
    return () => clearTimeout(t);
  }, [effectivePolygonId, totalHours, pickupAt, mode, daySchedule]);

  const canSubmit = Boolean(
    address && effectivePolygonId && (
      mode === 'hours' ? pickupAt :
      daySchedule.length > 0 && daySchedule.every(r => r.date && r.time && r.hours > 0)
    ),
  );

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
      durationHours: String(totalHours),
    });

    if (mode === 'hours') {
      params.set('pickupAt', pickupAt);
    } else {
      // Earliest pickup is Day 1 — used for the offer-search margin
      // check. The full per-day schedule travels alongside.
      const first = daySchedule[0]!;
      params.set('pickupAt', `${first.date}T${first.time}`);
      params.set('days', String(daySchedule.length));
      // hoursPerDay is kept for downstream pages that only read hours.
      params.set('hoursPerDay', daySchedule.map(r => r.hours).join(','));
      // daySchedule encodes the full {date,time,hours} per day as
      // "YYYY-MM-DDTHH:MM,H" tuples separated by semicolons.
      params.set(
        'daySchedule',
        daySchedule.map(r => `${r.date}T${r.time},${r.hours}`).join(';'),
      );
    }
    // Itinerary → downstream. The engine price already reflects the
    // duration; the estimated distance is a hint, never a charge.
    if (decideLater) {
      params.set('openItinerary', '1');
    } else {
      const placed = stops.filter(s => s.place);
      if (placed.length) {
        params.set('stops', JSON.stringify(placed.map(s => ({
          address: s.place!.formattedAddress, lat: s.place!.lat, lng: s.place!.lng,
        }))));
        if (estimate.km > 0) params.set('estDistanceKm', String(estimate.km));
      }
    }
    router.push(`/search?${params.toString()}`);
  };

  return (
    <form
      id="search"
      onSubmit={onSubmit}
      className="rounded-[22px] bg-white p-4 sm:p-5">
      <GooglePlacesAddress onResolve={onPlaceResolved} />

      {!resolution && !resolving ? (
        <p className="mt-2 flex items-center gap-1.5 px-1 text-xs text-ink-500">
          <Globe2 className="h-3.5 w-3.5 shrink-0 text-brand-500" />
          Covered in 60+ countries — start typing your pickup to see partners near you.
        </p>
      ) : null}

      <ResolutionPanel
        resolution={resolution}
        resolving={resolving}
        error={resolveError}
        candidatesOpen={changing}
        onChangeClick={() => setChanging(true)}
        overridePolygonId={overridePolygonId}
        onOverridePolygon={id => { setOverridePolygonId(id); setChanging(false); }}
      />

      <StopsEditor
        stops={stops}
        decideLater={decideLater}
        onDecideLater={handleDecideLater}
        onResolve={handleStopResolve}
        onAdd={addStop}
        onRemove={removeStop}
        onReorder={reorderStops}
        dragIndex={dragIndex}
        setDragIndex={setDragIndex}
      />

      {hasItinerary ? (
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-violet-200 bg-violet-50 px-4 py-3 text-sm">
          <div className="flex items-center gap-2 text-violet-900">
            <Route className="h-4 w-4 shrink-0 text-violet-600" />
            <span>
              ~<strong>{estimate.km} km</strong> · {itineraryPoints.length} stops · suggested{' '}
              <strong>{recommendedHours}h</strong>
            </span>
          </div>
          {mode === 'hours' && recommendedHours !== hours ? (
            <button
              type="button"
              onClick={() => { setManualHours(false); setHours(recommendedHours); }}
              className="inline-flex items-center gap-1 rounded-full bg-violet-600 px-3 py-1 text-xs font-bold text-white transition hover:bg-violet-700">
              <Sparkles className="h-3 w-3" /> Use {recommendedHours}h
            </button>
          ) : null}
        </div>
      ) : null}

      {mode === 'hours' ? (
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
      ) : null}

      <DurationPicker
        mode={mode}
        onModeChange={setMode}
        hours={hours}
        onHoursChange={handleHoursChange}
        days={days}
        onDaysChange={setDays}
        sameHoursEveryDay={sameHoursEveryDay}
        onSameHoursEveryDayChange={setSameHoursEveryDay}
        sameStartTimeEveryDay={sameStartTimeEveryDay}
        onSameStartTimeEveryDayChange={setSameStartTimeEveryDay}
        daySchedule={daySchedule}
        onSetDay={setDay}
        totalHours={totalHours}
      />

      {priceEstimate ? (
        <p className="mt-3 text-center text-xs text-ink-500">
          Estimated from{' '}
          <strong className="text-ink-900">
            {new Intl.NumberFormat(undefined, { style: 'currency', currency: priceEstimate.currency, maximumFractionDigits: 0 }).format(priceEstimate.total)}
          </strong>{' '}
          · economy · you pick the class next
        </p>
      ) : null}

      <button
        type="submit"
        disabled={!canSubmit}
        className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-brand-500 via-violet-500 to-fuchsia-500 px-5 py-4 text-sm font-bold text-white shadow-[0_14px_40px_-12px_rgba(124,58,237,0.65)] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50">
        See cars
        <ArrowRight className="h-4 w-4" />
      </button>
    </form>
  );
};

const StopsEditor: React.FC<{
  stops: Stop[];
  decideLater: boolean;
  onDecideLater: (v: boolean) => void;
  onResolve: (place: ResolvedPlace, id?: string) => void;
  onAdd: () => void;
  onRemove: (id: string) => void;
  onReorder: (from: number, to: number) => void;
  dragIndex: number | null;
  setDragIndex: (i: number | null) => void;
}> = ({ stops, decideLater, onDecideLater, onResolve, onAdd, onRemove, onReorder, dragIndex, setDragIndex }) => (
  <div className="mt-3">
    <div className="flex items-center justify-between px-1">
      <span className="text-[10px] font-bold uppercase tracking-wider text-ink-500">
        Stops <span className="text-ink-400">· optional</span>
      </span>
      <label className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-ink-600">
        <input
          type="checkbox"
          checked={decideLater}
          onChange={e => onDecideLater(e.target.checked)}
          className="h-3.5 w-3.5 rounded border-ink-300 text-brand-500 focus:ring-brand-500"
        />
        I&apos;ll decide later
      </label>
    </div>

    {decideLater ? (
      <div className="mt-2 rounded-2xl border border-dashed border-ink-200 bg-ink-50/50 px-4 py-3 text-xs leading-relaxed text-ink-500">
        Open itinerary — book the car by the hour and direct the driver as you go. Starts at the {MIN_HOURS}-hour minimum; add stops anytime.
      </div>
    ) : (
      <>
        {stops.length > 0 ? (
          <ul className="mt-2 space-y-2">
            {stops.map((s, i) => (
              <li
                key={s.id}
                onDragOver={e => e.preventDefault()}
                onDrop={() => { if (dragIndex !== null) onReorder(dragIndex, i); setDragIndex(null); }}
                className={cn('transition', dragIndex === i ? 'opacity-40' : '')}>
                <GooglePlacesAddress
                  id={s.id}
                  onResolve={onResolve}
                  label={`Stop ${i + 1}`}
                  placeholder="Add a stop — hotel, address, or landmark"
                  trailing={
                    <span className="flex items-center gap-0.5">
                      <span
                        draggable
                        onDragStart={() => setDragIndex(i)}
                        onDragEnd={() => setDragIndex(null)}
                        onClick={e => e.preventDefault()}
                        title="Drag to reorder"
                        className="cursor-grab p-1 text-ink-300 hover:text-ink-500 active:cursor-grabbing">
                        <GripVertical className="h-4 w-4" />
                      </span>
                      <button
                        type="button"
                        onClick={e => { e.preventDefault(); e.stopPropagation(); onRemove(s.id); }}
                        title="Remove stop"
                        className="p-1 text-ink-300 hover:text-red-500">
                        <X className="h-4 w-4" />
                      </button>
                    </span>
                  }
                />
              </li>
            ))}
          </ul>
        ) : null}
        {stops.length < 6 ? (
          <button
            type="button"
            onClick={onAdd}
            className="mt-2 inline-flex items-center gap-1.5 rounded-xl border border-dashed border-brand-300 bg-brand-50/60 px-3 py-2 text-xs font-bold text-brand-700 transition hover:bg-brand-50">
            <Plus className="h-3.5 w-3.5" /> Add stop
          </button>
        ) : null}
      </>
    )}
  </div>
);

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
        <div className="font-semibold">We don&apos;t service this location yet</div>
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

  if (candidates.length === 0) {
    return (
      <div className="mt-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
        <div className="font-semibold">No service areas in {resolution.country.name} yet</div>
      </div>
    );
  }

  if (matched && !candidatesOpen) {
    return (
      <div className="mt-3 flex items-center justify-between gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3">
        <div className="flex items-start gap-2 text-sm text-emerald-800">
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
          <span>
            <span className="font-semibold">Covered</span> — vetted partners in{' '}
            <strong>{matched.name}</strong>
            <span className="text-emerald-700/70">, {resolution.country.name}</span>
          </span>
        </div>
        {candidates.length > 1 ? (
          <button
            type="button"
            onClick={onChangeClick}
            className="shrink-0 text-xs font-semibold text-emerald-700 underline-offset-2 hover:underline">
            Change
          </button>
        ) : null}
      </div>
    );
  }

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
  // Hours mode
  hours: number;
  onHoursChange: (h: number) => void;
  // Days mode
  days: number;
  onDaysChange: (d: number) => void;
  sameHoursEveryDay: boolean;
  onSameHoursEveryDayChange: (v: boolean) => void;
  sameStartTimeEveryDay: boolean;
  onSameStartTimeEveryDayChange: (v: boolean) => void;
  daySchedule: DayRow[];
  onSetDay: (i: number, patch: Partial<DayRow>) => void;
  totalHours: number;
}

const DurationPicker: React.FC<DurationPickerProps> = ({
  mode, onModeChange,
  hours, onHoursChange,
  days, onDaysChange,
  sameHoursEveryDay, onSameHoursEveryDayChange,
  sameStartTimeEveryDay, onSameStartTimeEveryDayChange,
  daySchedule, onSetDay,
  totalHours,
}) => (
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
        <div className="grid gap-3 sm:grid-cols-[auto_1fr_1fr]">
          <div className="rounded-xl border border-ink-100 bg-ink-50/40 px-3 py-2">
            <span className="block text-[10px] font-bold uppercase tracking-wider text-ink-500">
              Days
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
          <label className="flex items-center justify-between gap-2 rounded-xl border border-ink-100 bg-ink-50/40 px-3 py-2 text-[11px] font-semibold text-ink-700">
            <span>Same start time</span>
            <input
              type="checkbox"
              checked={sameStartTimeEveryDay}
              onChange={e => onSameStartTimeEveryDayChange(e.target.checked)}
              className="h-4 w-4 rounded border-ink-300 text-brand-500 focus:ring-brand-500"
            />
          </label>
          <label className="flex items-center justify-between gap-2 rounded-xl border border-ink-100 bg-ink-50/40 px-3 py-2 text-[11px] font-semibold text-ink-700">
            <span>Same hours / day</span>
            <input
              type="checkbox"
              checked={sameHoursEveryDay}
              onChange={e => onSameHoursEveryDayChange(e.target.checked)}
              className="h-4 w-4 rounded border-ink-300 text-brand-500 focus:ring-brand-500"
            />
          </label>
        </div>

        <div className="rounded-xl border border-ink-100 bg-white">
          <div className="flex items-center gap-1.5 border-b border-ink-100 px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-ink-500">
            <CalendarDays className="h-3.5 w-3.5" />
            Per-day schedule
          </div>
          <ul className="max-h-72 divide-y divide-ink-100 overflow-auto">
            {daySchedule.map((row, i) => (
              <li key={i} className="grid grid-cols-[auto_1fr_auto_auto] items-center gap-2 px-3 py-2 text-sm sm:grid-cols-[60px_1.2fr_0.9fr_1.1fr]">
                <span className="text-[10px] font-bold uppercase tracking-wider text-ink-500">
                  Day {i + 1}
                </span>
                <input
                  type="date"
                  value={row.date}
                  onChange={e => onSetDay(i, { date: e.target.value })}
                  className="w-full rounded-lg border border-ink-200 bg-white px-2 py-1.5 text-sm outline-none focus:border-brand-500"
                />
                <input
                  type="time"
                  value={row.time}
                  onChange={e => onSetDay(i, { time: e.target.value })}
                  className="w-full rounded-lg border border-ink-200 bg-white px-2 py-1.5 text-sm outline-none focus:border-brand-500"
                />
                <select
                  value={row.hours}
                  onChange={e => onSetDay(i, { hours: Number(e.target.value) })}
                  className="w-full rounded-lg border border-ink-200 bg-white px-2 py-1.5 text-sm outline-none focus:border-brand-500">
                  {Array.from({ length: 23 }, (_, x) => x + 1).map(opt => (
                    <option key={opt} value={opt}>{opt}h</option>
                  ))}
                </select>
              </li>
            ))}
          </ul>
        </div>

        <div className="flex items-center justify-between rounded-xl bg-brand-50 px-3 py-2 text-sm">
          <span className="font-semibold text-brand-800">Total chargeable time</span>
          <span className="font-bold text-brand-900">{totalHours} {totalHours === 1 ? 'hour' : 'hours'}</span>
        </div>
      </div>
    )}
  </div>
);

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
