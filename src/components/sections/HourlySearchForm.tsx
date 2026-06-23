'use client';

// The marketplace search form (Mozio shape):
//   • Pickup location  → Google Places autocomplete (wired in Phase 1)
//   • Pickup date+time → native datetime-local
//   • Duration         → toggle Hours (1-23) | Days (1-14)
// Submits to `/search?lat=…&lng=…&pickupAt=…&durationHours=…`.
//
// Phase 0 ships this as a non-functional sketch (autocomplete is
// a plain text input). Phase 1 swaps in @react-google-maps/api or
// the bare Google Maps JS Loader against NEXT_PUBLIC_GOOGLE_MAPS_API_KEY.

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { MapPin, Calendar, Clock, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/cn';

type Mode = 'hours' | 'days';

export const HourlySearchForm: React.FC = () => {
  const router = useRouter();
  const [pickup, setPickup] = useState('');
  const [pickupAt, setPickupAt] = useState(defaultPickupAt());
  const [mode, setMode] = useState<Mode>('hours');
  const [hours, setHours] = useState(4);
  const [days, setDays] = useState(1);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const durationHours = mode === 'hours' ? hours : days * 24;
    const params = new URLSearchParams({
      pickup,
      pickupAt,
      durationHours: String(durationHours),
    });
    router.push(`/search?${params.toString()}`);
  };

  return (
    <form
      onSubmit={onSubmit}
      className="rounded-3xl border border-ink-100 bg-white p-4 shadow-soft sm:p-5">
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Pickup location" icon={<MapPin className="h-4 w-4" />}>
          <input
            value={pickup}
            onChange={e => setPickup(e.target.value)}
            placeholder="Hotel, address, or landmark"
            className="w-full bg-transparent text-base outline-none placeholder:text-ink-400"
            required
          />
        </Field>
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

      <div className="mt-3 rounded-2xl border border-ink-100 bg-ink-50/40 p-3">
        <div className="flex items-center justify-between gap-3">
          <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-ink-500">
            <Clock className="h-3.5 w-3.5" />
            Duration
          </div>
          <div className="inline-flex rounded-full border border-ink-200 bg-white p-0.5 text-xs">
            <ModeBtn active={mode === 'hours'} onClick={() => setMode('hours')}>Hours</ModeBtn>
            <ModeBtn active={mode === 'days'} onClick={() => setMode('days')}>Days</ModeBtn>
          </div>
        </div>
        <div className="mt-3">
          {mode === 'hours' ? (
            <select
              value={hours}
              onChange={e => setHours(Number(e.target.value))}
              className="w-full rounded-xl border border-ink-200 bg-white px-3 py-2.5 text-base outline-none focus:border-brand-500">
              {Array.from({ length: 23 }, (_, i) => i + 1).map(h => (
                <option key={h} value={h}>{h} {h === 1 ? 'hour' : 'hours'}</option>
              ))}
            </select>
          ) : (
            <select
              value={days}
              onChange={e => setDays(Number(e.target.value))}
              className="w-full rounded-xl border border-ink-200 bg-white px-3 py-2.5 text-base outline-none focus:border-brand-500">
              {Array.from({ length: 14 }, (_, i) => i + 1).map(d => (
                <option key={d} value={d}>{d} {d === 1 ? 'day' : 'days'}</option>
              ))}
            </select>
          )}
        </div>
      </div>

      <button type="submit" className="btn-primary mt-3 w-full py-3.5">
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

// Round "now" up to the next half-hour, formatted for datetime-local.
function defaultPickupAt(): string {
  const d = new Date(Date.now() + 30 * 60 * 1000);
  d.setSeconds(0, 0);
  d.setMinutes(d.getMinutes() >= 30 ? 30 : 0);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
