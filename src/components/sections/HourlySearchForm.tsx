'use client';

// The marketplace search form (Mozio shape, polygon-bound).
//
// Why dropdowns instead of pure address autocomplete?
// PHP exposes polygon names + slugs but NOT geometry on any
// public endpoint, so we can't resolve an arbitrary lat/lng to a
// polygon. Customer picks country + polygon explicitly; the
// pickup address is a separate Google Places field used by the
// driver to find the exact pickup point. The search submits to
// /search?countryCode=…&polygonId=…&pickupAt=…&durationHours=…
// (+pickupAddress, pickupLat, pickupLng if entered).
//
// Country + polygon lists come from /v1/catalog/* — cached 1h.

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { MapPin, Calendar, Clock, ArrowRight, Globe2, Loader2 } from 'lucide-react';
import { cn } from '@/lib/cn';
import { api, type Country, type Polygon } from '@/lib/api';
import { GooglePlacesAddress } from '@/components/sections/GooglePlacesAddress';

type Mode = 'hours' | 'days';

export const HourlySearchForm: React.FC = () => {
  const router = useRouter();
  const [countries, setCountries] = useState<Country[] | null>(null);
  const [polygons, setPolygons] = useState<Polygon[] | null>(null);
  const [countryCode, setCountryCode] = useState<string>('');
  const [polygonId, setPolygonId] = useState<string>('');
  const [pickupAddress, setPickupAddress] = useState('');
  const [pickupLatLng, setPickupLatLng] = useState<{ lat: number; lng: number } | null>(null);
  const [pickupAt, setPickupAt] = useState(defaultPickupAt());
  const [mode, setMode] = useState<Mode>('hours');
  const [hours, setHours] = useState(4);
  const [days, setDays] = useState(1);
  const [error, setError] = useState<string | null>(null);

  // Load countries once. Use the same API client as the rest of
  // the app so server-side preferences (revalidate) are honored.
  useEffect(() => {
    void api.countries()
      .then(r => {
        setCountries(r.countries);
        // Pin Egypt as the default — primary launch market.
        const eg = r.countries.find(c => c.code === 'EG');
        if (eg) setCountryCode(eg.code);
        else if (r.countries[0]) setCountryCode(r.countries[0].code);
      })
      .catch((e: Error) => setError(e.message));
  }, []);

  // Re-fetch polygons when the country changes.
  useEffect(() => {
    if (!countryCode) return;
    setPolygons(null);
    setPolygonId('');
    void api.polygons(countryCode)
      .then(r => {
        setPolygons(r.polygons);
        if (r.polygons[0]) setPolygonId(r.polygons[0].id);
      })
      .catch((e: Error) => setError(e.message));
  }, [countryCode]);

  const canSubmit = useMemo(
    () => Boolean(countryCode && polygonId && pickupAt),
    [countryCode, polygonId, pickupAt],
  );

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    const durationHours = mode === 'hours' ? hours : days * 24;
    const params = new URLSearchParams({
      countryCode,
      polygonId,
      pickupAt,
      durationHours: String(durationHours),
    });
    if (pickupAddress) params.set('pickupAddress', pickupAddress);
    if (pickupLatLng) {
      params.set('pickupLat', String(pickupLatLng.lat));
      params.set('pickupLng', String(pickupLatLng.lng));
    }
    router.push(`/search?${params.toString()}`);
  };

  return (
    <form
      onSubmit={onSubmit}
      className="rounded-3xl border border-ink-100 bg-white p-4 shadow-soft sm:p-5">
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Country" icon={<Globe2 className="h-4 w-4" />}>
          {countries ? (
            <select
              value={countryCode}
              onChange={e => setCountryCode(e.target.value)}
              required
              className="w-full bg-transparent text-base outline-none">
              {countries.map(c => (
                <option key={c.code} value={c.code}>{c.name}</option>
              ))}
            </select>
          ) : (
            <Placeholder text={error ?? 'Loading countries…'} />
          )}
        </Field>
        <Field label="City / pickup area" icon={<MapPin className="h-4 w-4" />}>
          {polygons === null ? (
            <Placeholder text="Loading…" />
          ) : polygons.length === 0 ? (
            <Placeholder text="No service areas here yet" />
          ) : (
            <select
              value={polygonId}
              onChange={e => setPolygonId(e.target.value)}
              required
              className="w-full bg-transparent text-base outline-none">
              {polygons.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          )}
        </Field>
      </div>

      <div className="mt-3">
        <GooglePlacesAddress
          countryCode={countryCode || undefined}
          onChange={(addr, latLng) => {
            setPickupAddress(addr);
            setPickupLatLng(latLng);
          }}
        />
      </div>

      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <Field label="Pickup date &amp; time" icon={<Calendar className="h-4 w-4" />}>
          <input
            type="datetime-local"
            value={pickupAt}
            onChange={e => setPickupAt(e.target.value)}
            className="w-full bg-transparent text-base outline-none"
            required
          />
        </Field>
        <div className="rounded-2xl border border-ink-200 bg-white p-2">
          <div className="flex items-center justify-between gap-2 px-2">
            <div className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-ink-500">
              <Clock className="h-3.5 w-3.5" />
              Duration
            </div>
            <div className="inline-flex rounded-full border border-ink-200 bg-white p-0.5 text-xs">
              <ModeBtn active={mode === 'hours'} onClick={() => setMode('hours')}>Hours</ModeBtn>
              <ModeBtn active={mode === 'days'} onClick={() => setMode('days')}>Days</ModeBtn>
            </div>
          </div>
          <div className="mt-1.5 px-2">
            {mode === 'hours' ? (
              <select
                value={hours}
                onChange={e => setHours(Number(e.target.value))}
                className="w-full bg-transparent text-base outline-none">
                {Array.from({ length: 23 }, (_, i) => i + 1).map(h => (
                  <option key={h} value={h}>{h} {h === 1 ? 'hour' : 'hours'}</option>
                ))}
              </select>
            ) : (
              <select
                value={days}
                onChange={e => setDays(Number(e.target.value))}
                className="w-full bg-transparent text-base outline-none">
                {Array.from({ length: 14 }, (_, i) => i + 1).map(d => (
                  <option key={d} value={d}>{d} {d === 1 ? 'day' : 'days'}</option>
                ))}
              </select>
            )}
          </div>
        </div>
      </div>

      {error ? (
        <p className="mt-3 text-xs font-medium text-red-600">{error}</p>
      ) : null}

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

const Field: React.FC<{ label: string; icon: React.ReactNode; children: React.ReactNode }> = ({ label, icon, children }) => (
  <label className="block rounded-2xl border border-ink-200 bg-white px-4 py-3 focus-within:border-brand-500">
    <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-ink-500">
      {icon}
      {label}
    </span>
    <div className="mt-1">{children}</div>
  </label>
);

const Placeholder: React.FC<{ text: string }> = ({ text }) => (
  <div className="inline-flex items-center gap-2 text-sm text-ink-400">
    <Loader2 className="h-3.5 w-3.5 animate-spin" />
    {text}
  </div>
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
