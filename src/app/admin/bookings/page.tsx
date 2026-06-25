'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Filter, Download, ArrowRight, Loader2 } from 'lucide-react';
import { adminApi, type AdminBookingRow, type AdminBookingsFilters } from '@/lib/admin-api';
import { AdminShell } from '../AdminShell';
import { cn } from '@/lib/cn';

const STATUS_OPTIONS = ['', 'pending', 'confirmed', 'started', 'completed', 'settled', 'cancelled', 'refunded', 'no_show'];

const STATUS_TONE: Record<string, string> = {
  pending:    'bg-amber-100 text-amber-800',
  confirmed:  'bg-emerald-100 text-emerald-700',
  started:    'bg-brand-100 text-brand-700',
  completed:  'bg-emerald-50 text-emerald-700',
  settled:    'bg-ink-100 text-ink-700',
  cancelled:  'bg-ink-100 text-ink-500',
  refunded:   'bg-rose-100 text-rose-700',
  no_show:    'bg-rose-100 text-rose-700',
};

const formatPrice = (n: number, currency: string): string => {
  try { return new Intl.NumberFormat('en', { style: 'currency', currency }).format(n); }
  catch { return `${currency} ${n.toFixed(2)}`; }
};

export default function AdminBookingsPage() {
  return (
    <AdminShell>
      <BookingsList />
    </AdminShell>
  );
}

const BookingsList: React.FC = () => {
  const [filters, setFilters] = useState<AdminBookingsFilters>({});
  const [draft, setDraft] = useState<AdminBookingsFilters>({});
  const [bookings, setBookings] = useState<AdminBookingRow[] | null>(null);
  const [count, setCount] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    adminApi.bookings(filters)
      .then(r => { setBookings(r.bookings); setCount(r.count); setError(null); })
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, [filters]);

  const csvUrl = useMemo(() => {
    const token = typeof window !== 'undefined' ? window.localStorage.getItem('sinaitaxi-hourly:admin-jwt') : null;
    return token ? null : null; // we don't pre-build the URL; use the button handler below
  }, []);

  const downloadCsv = async () => {
    try {
      const token = window.localStorage.getItem('sinaitaxi-hourly:admin-jwt');
      if (!token) return;
      const url = adminApi.csvDownloadUrl(filters);
      const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) throw new Error(`Download failed (${res.status})`);
      const blob = await res.blob();
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `bookings-${new Date().toISOString().slice(0, 10)}.csv`;
      link.click();
      URL.revokeObjectURL(link.href);
    } catch (e) {
      setError((e as Error).message);
    }
  };

  const applyFilters = (e: React.FormEvent) => {
    e.preventDefault();
    setFilters(draft);
  };

  const resetFilters = () => { setDraft({}); setFilters({}); };

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tighter">All bookings</h1>
          <p className="mt-1 text-sm text-ink-500">{count} {count === 1 ? 'booking' : 'bookings'} match your filters.</p>
        </div>
        <button onClick={downloadCsv} className="btn-secondary !py-2.5 !px-4 !text-sm">
          <Download className="h-4 w-4" /> Export CSV
        </button>
      </div>

      <form onSubmit={applyFilters} className="mt-6 rounded-3xl border border-ink-100 bg-white p-5 shadow-soft">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Field label="Status">
            <select value={draft.status ?? ''} onChange={e => setDraft({ ...draft, status: e.target.value || undefined })}
              className="w-full bg-transparent text-base outline-none">
              {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s || 'Any status'}</option>)}
            </select>
          </Field>
          <Field label="Country (ISO-2)">
            <input value={draft.country ?? ''} onChange={e => setDraft({ ...draft, country: e.target.value.toUpperCase() || undefined })}
              maxLength={2} className="w-full bg-transparent text-base outline-none" placeholder="EG" />
          </Field>
          <Field label="Partner ID">
            <input value={draft.partnerId ?? ''} onChange={e => setDraft({ ...draft, partnerId: e.target.value || undefined })}
              className="w-full bg-transparent text-base outline-none" placeholder="e.g. seed_partner_tirana_fleet" />
          </Field>
          <Field label="Customer email">
            <input value={draft.customerEmail ?? ''} onChange={e => setDraft({ ...draft, customerEmail: e.target.value || undefined })}
              className="w-full bg-transparent text-base outline-none" placeholder="contains…" />
          </Field>
          <Field label="From (pickup)">
            <input type="datetime-local" value={draft.from ?? ''} onChange={e => setDraft({ ...draft, from: e.target.value || undefined })}
              className="w-full bg-transparent text-base outline-none" />
          </Field>
          <Field label="To (pickup)">
            <input type="datetime-local" value={draft.to ?? ''} onChange={e => setDraft({ ...draft, to: e.target.value || undefined })}
              className="w-full bg-transparent text-base outline-none" />
          </Field>
        </div>
        <div className="mt-3 flex items-center gap-3">
          <button type="submit" className="btn-primary !py-2.5 !px-4 !text-sm">
            <Filter className="h-4 w-4" /> Apply
          </button>
          <button type="button" onClick={resetFilters} className="text-sm font-semibold text-ink-600 hover:text-ink-900">Reset</button>
        </div>
      </form>

      {error ? <p className="mt-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p> : null}

      {loading || !bookings ? (
        <div className="mt-6 inline-flex items-center gap-2 text-sm text-ink-500">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading…
        </div>
      ) : bookings.length === 0 ? (
        <div className="mt-6 rounded-3xl border border-dashed border-ink-200 bg-ink-50/40 p-8 text-center text-sm text-ink-600">
          No bookings match.
        </div>
      ) : (
        <ul className="mt-6 space-y-3">
          {bookings.map(b => <Row key={b.id} booking={b} />)}
        </ul>
      )}
    </div>
  );
};

const Field: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <label className="block rounded-2xl border border-ink-200 bg-white px-3 py-2 focus-within:border-brand-500">
    <span className="text-[10px] font-bold uppercase tracking-wider text-ink-500">{label}</span>
    <div className="mt-1">{children}</div>
  </label>
);

const Row: React.FC<{ booking: AdminBookingRow }> = ({ booking }) => {
  const tone = STATUS_TONE[booking.status] ?? 'bg-ink-100 text-ink-700';
  return (
    <li className="rounded-3xl border border-ink-100 bg-white p-5 shadow-soft">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-bold text-ink-900">{booking.vehicleClass.toUpperCase()}</span>
            <span className={cn('rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider', tone)}>{booking.status.replace('_', ' ')}</span>
            <span className="text-xs text-ink-500">{booking.countryCode} · {booking.polygonName}</span>
          </div>
          <p className="mt-1 text-sm text-ink-700">
            {new Date(booking.pickupAt).toLocaleString()} · {booking.durationHours}h
          </p>
          <p className="mt-1 text-xs text-ink-500 break-words">
            {booking.customerName ?? '—'} · {booking.customerEmail}
            {booking.ruleName ? ` · ${booking.ruleName}` : ''}
          </p>
          <p className="mt-1 font-mono text-[10px] text-ink-500">{booking.id}</p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <div className="text-right">
            <div className="text-xs text-ink-500">Retail</div>
            <div className="text-lg font-extrabold tracking-tightest">{formatPrice(booking.retailPrice, booking.currency)}</div>
            <div className="text-[10px] text-ink-400">Wholesale {formatPrice(booking.wholesalePrice, booking.currency)}</div>
          </div>
          <Link href={`/admin/bookings/${booking.id}`} className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-600 hover:text-brand-700">
            Open <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </li>
  );
};
