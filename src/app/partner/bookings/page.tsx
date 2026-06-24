'use client';

import { useEffect, useMemo, useState } from 'react';
import { Loader2, Car, MapPin, Calendar, Phone, Mail, AlertCircle } from 'lucide-react';
import { partnerApi, type PartnerBookingRow } from '@/lib/partner-api';
import { PartnerShell } from '../PartnerShell';
import { cn } from '@/lib/cn';

type Filter = 'all' | 'upcoming' | 'today' | 'past' | 'cancelled';

const FILTERS: { value: Filter; label: string }[] = [
  { value: 'all',       label: 'All' },
  { value: 'today',     label: 'Today' },
  { value: 'upcoming',  label: 'Upcoming' },
  { value: 'past',      label: 'Past' },
  { value: 'cancelled', label: 'Cancelled' },
];

const STATUS_LABEL: Record<string, { label: string; tone: string }> = {
  pending:    { label: 'Awaiting payment', tone: 'bg-amber-100 text-amber-800' },
  confirmed:  { label: 'Confirmed',        tone: 'bg-emerald-100 text-emerald-700' },
  started:    { label: 'In progress',      tone: 'bg-brand-100 text-brand-700' },
  completed:  { label: 'Completed',        tone: 'bg-emerald-50 text-emerald-700' },
  settled:    { label: 'Settled',          tone: 'bg-ink-100 text-ink-700' },
  cancelled:  { label: 'Cancelled',        tone: 'bg-ink-100 text-ink-500' },
  refunded:   { label: 'Refunded',         tone: 'bg-rose-100 text-rose-700' },
  no_show:    { label: 'No-show',          tone: 'bg-rose-100 text-rose-700' },
};

const formatPrice = (n: number, currency: string): string => {
  try {
    return new Intl.NumberFormat('en', { style: 'currency', currency }).format(n);
  } catch {
    return `${currency} ${n.toFixed(2)}`;
  }
};

export default function PartnerBookingsPage() {
  return (
    <PartnerShell>
      <BookingsList />
    </PartnerShell>
  );
}

const BookingsList: React.FC = () => {
  const [bookings, setBookings] = useState<PartnerBookingRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<Filter>('upcoming');

  useEffect(() => {
    partnerApi.bookings()
      .then(r => setBookings(r.bookings))
      .catch((e: Error) => setError(e.message));
  }, []);

  const filtered = useMemo(() => {
    if (!bookings) return [];
    const now = new Date();
    const today = now.toDateString();
    return bookings.filter(b => {
      const d = new Date(b.pickupAt);
      switch (filter) {
        case 'today':     return d.toDateString() === today && b.status !== 'cancelled';
        case 'upcoming':  return d > now && b.status !== 'cancelled';
        case 'past':      return d <= now && b.status !== 'cancelled';
        case 'cancelled': return b.status === 'cancelled' || b.status === 'no_show' || b.status === 'refunded';
        default:          return true;
      }
    });
  }, [bookings, filter]);

  return (
    <div>
      <h1 className="text-3xl font-extrabold tracking-tighter">Bookings</h1>
      <p className="mt-1 text-sm text-ink-500">Every booking the marketplace routed to you. Confirmed bookings cannot be cancelled by you — contact ops via WhatsApp for emergencies.</p>

      <div className="mt-6 flex flex-wrap gap-2">
        {FILTERS.map(f => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={cn(
              'rounded-full px-3 py-1.5 text-xs font-semibold',
              filter === f.value ? 'bg-ink-900 text-white' : 'bg-ink-100 text-ink-700 hover:text-ink-900',
            )}>
            {f.label}
          </button>
        ))}
      </div>

      {error ? (
        <p className="mt-6 inline-flex items-center gap-2 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <AlertCircle className="h-4 w-4" /> {error}
        </p>
      ) : null}

      {!bookings ? (
        <div className="mt-6 inline-flex items-center gap-2 text-sm text-ink-500">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading bookings…
        </div>
      ) : filtered.length === 0 ? (
        <div className="mt-6 rounded-3xl border border-dashed border-ink-200 bg-ink-50/40 p-8 text-center text-sm text-ink-600">
          No bookings in this view yet.
        </div>
      ) : (
        <ul className="mt-6 space-y-3">
          {filtered.map(b => <BookingRow key={b.id} booking={b} />)}
        </ul>
      )}
    </div>
  );
};

const BookingRow: React.FC<{ booking: PartnerBookingRow }> = ({ booking }) => {
  const status = STATUS_LABEL[booking.status] ?? { label: booking.status, tone: 'bg-ink-100 text-ink-700' };
  return (
    <li className="rounded-3xl border border-ink-100 bg-white p-5 shadow-soft">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <Car className="h-4 w-4 text-brand-600" />
            <span className="font-bold text-ink-900">{booking.vehicleClass.toUpperCase()}</span>
            <span className={cn('rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider', status.tone)}>{status.label}</span>
            {booking.ruleName ? <span className="text-xs text-ink-500">· {booking.ruleName}</span> : null}
          </div>
          <ul className="mt-3 space-y-1.5 text-sm text-ink-700">
            <li className="inline-flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5 text-ink-400" /> {new Date(booking.pickupAt).toLocaleString()}</li>
            <li className="inline-flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5 text-ink-400" /> {booking.polygonName} · {booking.pickupAddress}</li>
            <li className="inline-flex items-center gap-1.5 text-xs text-ink-500">
              {booking.durationHours}h
              {booking.hoursPerDay && booking.hoursPerDay.length > 1 ? ` across ${booking.hoursPerDay.length} days` : ''}
              {' · '}{booking.includedKm} km included
            </li>
          </ul>
        </div>
        <div className="text-right">
          <div className="text-xs text-ink-500">You receive</div>
          <div className="text-xl font-extrabold tracking-tightest">{formatPrice(booking.wholesalePrice, booking.currency)}</div>
          <div className="text-[10px] text-ink-400">Customer pays {formatPrice(booking.retailPrice, booking.currency)}</div>
        </div>
      </div>

      <div className="mt-4 grid gap-2 border-t border-ink-100 pt-3 text-sm sm:grid-cols-2">
        <div className="inline-flex items-center gap-1.5 text-ink-700">
          <span className="font-medium">{booking.customerName ?? '—'}</span>
        </div>
        <div className="flex flex-wrap items-center gap-3 text-xs">
          <a href={`mailto:${booking.customerEmail}`} className="inline-flex items-center gap-1 text-brand-600 hover:text-brand-700">
            <Mail className="h-3.5 w-3.5" /> {booking.customerEmail}
          </a>
          {booking.customerPhone ? (
            <a href={`tel:${booking.customerPhone}`} className="inline-flex items-center gap-1 text-brand-600 hover:text-brand-700">
              <Phone className="h-3.5 w-3.5" /> {booking.customerPhone}
            </a>
          ) : null}
          <span className="text-ink-500 font-mono text-[10px]">{booking.id}</span>
        </div>
      </div>

      {booking.hoursPerDay && booking.hoursPerDay.length > 1 ? (
        <div className="mt-3">
          <ul className="flex flex-wrap gap-2 text-xs">
            {booking.hoursPerDay.map((h, i) => (
              <li key={i} className="rounded-full bg-ink-100 px-3 py-1 font-medium text-ink-800">Day {i + 1} · {h}h</li>
            ))}
          </ul>
        </div>
      ) : null}
    </li>
  );
};
