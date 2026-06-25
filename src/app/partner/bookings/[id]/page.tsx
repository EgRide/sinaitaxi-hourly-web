'use client';

import { use, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Loader2, ArrowLeft, User, Car, Calendar, MapPin, Phone, Mail, Save, Play, CheckSquare, UserX, AlertCircle, Clock } from 'lucide-react';
import { partnerApi, type PartnerBookingDetail } from '@/lib/partner-api';
import { PartnerShell } from '../../PartnerShell';
import { cn } from '@/lib/cn';

interface Props {
  params: Promise<{ id: string }>;
}

const formatPrice = (n: number, currency: string): string => {
  try {
    return new Intl.NumberFormat('en', { style: 'currency', currency }).format(n);
  } catch {
    return `${currency} ${n.toFixed(2)}`;
  }
};

const STATUS_TONE: Record<string, string> = {
  pending:   'bg-amber-100 text-amber-800',
  confirmed: 'bg-emerald-100 text-emerald-700',
  started:   'bg-brand-100 text-brand-700',
  completed: 'bg-emerald-50 text-emerald-700',
  settled:   'bg-ink-100 text-ink-700',
  cancelled: 'bg-ink-100 text-ink-500',
  refunded:  'bg-rose-100 text-rose-700',
  no_show:   'bg-rose-100 text-rose-700',
};

export default function PartnerBookingDetailPage({ params }: Props) {
  return (
    <PartnerShell>
      <Inner id={use(params).id} />
    </PartnerShell>
  );
}

const Inner: React.FC<{ id: string }> = ({ id }) => {
  const [booking, setBooking] = useState<PartnerBookingDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [refreshTick, setRefreshTick] = useState(0);

  useEffect(() => {
    partnerApi.bookingDetail(id)
      .then(r => { setBooking(r.booking); setError(null); })
      .catch((e: Error) => setError(e.message));
  }, [id, refreshTick]);

  const refresh = () => setRefreshTick(t => t + 1);

  if (error) return <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>;
  if (!booking) return (
    <div className="inline-flex items-center gap-2 text-sm text-ink-500">
      <Loader2 className="h-4 w-4 animate-spin" /> Loading booking…
    </div>
  );

  const tone = STATUS_TONE[booking.status] ?? 'bg-ink-100 text-ink-700';
  const pickupDate = new Date(booking.pickupAt);
  const now = new Date();
  const minutesUntilPickup = (pickupDate.getTime() - now.getTime()) / 60000;
  const tooEarlyForNoShow = minutesUntilPickup > -60;
  const noShowAllowedAt = new Date(pickupDate.getTime() + 60 * 60 * 1000);

  return (
    <div>
      <Link href="/partner/bookings" className="inline-flex items-center gap-1.5 text-sm font-semibold text-ink-600 hover:text-ink-900">
        <ArrowLeft className="h-4 w-4" /> All bookings
      </Link>
      <div className="mt-3 flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-3xl font-extrabold tracking-tighter">{booking.vehicleClass.toUpperCase()} booking</h1>
            <span className={cn('rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider', tone)}>
              {booking.status.replace('_', ' ')}
            </span>
          </div>
          <p className="mt-1 text-sm text-ink-500 font-mono">{booking.id}</p>
        </div>
        <div className="text-right">
          <div className="text-xs text-ink-500">You receive</div>
          <div className="text-2xl font-extrabold tracking-tightest">{formatPrice(booking.wholesalePrice, booking.currency)}</div>
        </div>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <Card title="Trip details" icon={<Car className="h-5 w-5" />}>
          <Row label="Pickup at" value={pickupDate.toLocaleString()} />
          <Row label="Service area" value={booking.polygonName} />
          <Row label="Address" value={booking.pickupAddress} />
          <Row label="Duration" value={
            booking.hoursPerDay && booking.hoursPerDay.length > 1
              ? `${booking.durationHours} hours across ${booking.hoursPerDay.length} days`
              : `${booking.durationHours} hour${booking.durationHours === 1 ? '' : 's'}`
          } />
          <Row label="Included" value={`${booking.includedKm} km`} />
          {booking.ruleName ? <Row label="Rule" value={booking.ruleName} /> : null}
          {booking.hoursPerDay && booking.hoursPerDay.length > 1 ? (
            <div className="mt-3 flex flex-wrap gap-2 text-xs">
              {booking.hoursPerDay.map((h, i) => (
                <span key={i} className="rounded-full bg-ink-100 px-3 py-1 font-medium text-ink-800">Day {i + 1} · {h}h</span>
              ))}
            </div>
          ) : null}
        </Card>

        <Card title="Customer" icon={<User className="h-5 w-5" />}>
          <Row label="Name" value={booking.customerName ?? '—'} />
          <Row label="Email" value={
            <a href={`mailto:${booking.customerEmail}`} className="inline-flex items-center gap-1 text-brand-600 hover:text-brand-700">
              <Mail className="h-3.5 w-3.5" /> {booking.customerEmail}
            </a>
          } />
          {booking.customerPhone ? (
            <Row label="Phone" value={
              <a href={`tel:${booking.customerPhone}`} className="inline-flex items-center gap-1 text-brand-600 hover:text-brand-700">
                <Phone className="h-3.5 w-3.5" /> {booking.customerPhone}
              </a>
            } />
          ) : null}
        </Card>
      </div>

      {/* Lifecycle controls */}
      <div className="mt-6 space-y-4">
        {(booking.status === 'confirmed' || booking.status === 'started') ? (
          <AssignDriverPanel booking={booking} onSaved={refresh} />
        ) : null}

        {booking.status === 'confirmed' && booking.driverName ? (
          <StartTripPanel booking={booking} onSaved={refresh} />
        ) : null}

        {booking.status === 'started' ? (
          <CompleteTripPanel booking={booking} onSaved={refresh} />
        ) : null}

        {booking.status === 'confirmed' ? (
          <NoShowPanel booking={booking} noShowAllowedAt={noShowAllowedAt} tooEarly={tooEarlyForNoShow} onSaved={refresh} />
        ) : null}

        {(booking.status === 'completed' || booking.status === 'settled') ? (
          <CompletedSummary booking={booking} />
        ) : null}

        {booking.status === 'no_show' ? (
          <div className="rounded-3xl border border-rose-200 bg-rose-50 p-5 text-sm text-rose-800">
            Marked as no-show. Booking is non-refundable; the wholesale stays with you.
          </div>
        ) : null}
      </div>
    </div>
  );
};

const Card: React.FC<{ title: string; icon: React.ReactNode; children: React.ReactNode }> = ({ title, icon, children }) => (
  <section className="rounded-3xl border border-ink-100 bg-white p-5 shadow-soft">
    <div className="flex items-center gap-2 border-b border-ink-100 pb-3">
      <span className="grid h-9 w-9 place-items-center rounded-2xl bg-brand-50 text-brand-700">{icon}</span>
      <h2 className="text-base font-bold tracking-tight">{title}</h2>
    </div>
    <dl className="mt-3 space-y-2 text-sm">{children}</dl>
  </section>
);

const Row: React.FC<{ label: string; value: React.ReactNode }> = ({ label, value }) => {
  if (value === null || value === undefined || value === '') return null;
  return (
    <div className="flex items-start justify-between gap-3">
      <dt className="text-[10px] font-bold uppercase tracking-wider text-ink-500">{label}</dt>
      <dd className="text-right text-sm font-medium text-ink-800 break-words max-w-[60%]">{value}</dd>
    </div>
  );
};

const AssignDriverPanel: React.FC<{ booking: PartnerBookingDetail; onSaved: () => void }> = ({ booking, onSaved }) => {
  const [driverName, setDriverName] = useState(booking.driverName ?? '');
  const [driverPhone, setDriverPhone] = useState(booking.driverPhone ?? '');
  const [vehicleLabel, setVehicleLabel] = useState(booking.vehicleLabel ?? '');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const previouslyAssigned = Boolean(booking.driverName);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true); setError(null);
    try {
      await partnerApi.assignDriver(booking.id, { driverName, driverPhone, vehicleLabel });
      onSaved();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={onSubmit} className="rounded-3xl border border-ink-100 bg-white p-5 shadow-soft">
      <h2 className="text-base font-bold tracking-tight">
        {previouslyAssigned ? 'Assigned driver + vehicle' : 'Assign driver + vehicle'}
      </h2>
      <p className="mt-1 text-sm text-ink-500">
        {previouslyAssigned ? 'Edits notify the customer by email.' : 'Customer sees these details on their receipt and gets an email.'}
      </p>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <Field label="Driver name" value={driverName} onChange={setDriverName} placeholder="e.g. Mohamed Ali" required />
        <Field label="Driver phone" value={driverPhone} onChange={setDriverPhone} placeholder="+44 ..." required type="tel" />
        <div className="sm:col-span-2">
          <Field label="Vehicle (make + colour + plate)" value={vehicleLabel} onChange={setVehicleLabel} placeholder="Toyota Camry · black · 1A2B3C" required />
        </div>
      </div>
      {error ? <p className="mt-3 rounded-2xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}
      <button type="submit" disabled={busy} className="btn-primary mt-4 !py-2.5 !px-4 !text-sm">
        {busy ? (<><Loader2 className="h-4 w-4 animate-spin" /> Saving…</>) : (<><Save className="h-4 w-4" /> {previouslyAssigned ? 'Update' : 'Assign & notify customer'}</>)}
      </button>
    </form>
  );
};

const StartTripPanel: React.FC<{ booking: PartnerBookingDetail; onSaved: () => void }> = ({ booking, onSaved }) => {
  const [odometer, setOdometer] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const valid = useMemo(() => {
    const n = Number(odometer);
    return Number.isFinite(n) && n >= 0;
  }, [odometer]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true); setError(null);
    try {
      await partnerApi.startTrip(booking.id, { odometerStart: Number(odometer) });
      onSaved();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={onSubmit} className="rounded-3xl border border-ink-100 bg-white p-5 shadow-soft">
      <h2 className="text-base font-bold tracking-tight">Start the trip</h2>
      <p className="mt-1 text-sm text-ink-500">
        Tap when you're with the customer and ready to drive. Record the car's current odometer reading.
      </p>
      <div className="mt-3 grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
        <Field label="Odometer (km)" type="number" value={odometer} onChange={setOdometer} placeholder="e.g. 124350" required />
        <button type="submit" disabled={busy || !valid} className="btn-primary !py-2.5 !px-4 !text-sm">
          {busy ? (<><Loader2 className="h-4 w-4 animate-spin" /> Starting…</>) : (<><Play className="h-4 w-4" /> Mark started</>)}
        </button>
      </div>
      {error ? <p className="mt-3 rounded-2xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}
    </form>
  );
};

const CompleteTripPanel: React.FC<{ booking: PartnerBookingDetail; onSaved: () => void }> = ({ booking, onSaved }) => {
  const [odometer, setOdometer] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const start = booking.odometerStart ?? 0;
  const end = Number(odometer);
  const km = Number.isFinite(end) && end >= start ? end - start : null;
  const overageKm = km !== null ? Math.max(0, km - booking.includedKm) : null;

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (km === null) return;
    setBusy(true); setError(null);
    try {
      await partnerApi.completeTrip(booking.id, { odometerEnd: end });
      onSaved();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={onSubmit} className="rounded-3xl border border-ink-100 bg-white p-5 shadow-soft">
      <h2 className="text-base font-bold tracking-tight">Complete the trip</h2>
      <p className="mt-1 text-sm text-ink-500">
        Started at <strong>{start.toLocaleString()}</strong> km. Enter the final reading.
      </p>
      <div className="mt-3 grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
        <Field label="Final odometer (km)" type="number" value={odometer} onChange={setOdometer} placeholder={`> ${start}`} required />
        <button type="submit" disabled={busy || km === null} className="btn-primary !py-2.5 !px-4 !text-sm">
          {busy ? (<><Loader2 className="h-4 w-4 animate-spin" /> Completing…</>) : (<><CheckSquare className="h-4 w-4" /> Mark complete</>)}
        </button>
      </div>

      {km !== null ? (
        <div className="mt-4 rounded-2xl bg-ink-50/60 px-4 py-3 text-xs">
          <div className="grid grid-cols-3 gap-3">
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-ink-500">Driven</div>
              <div className="text-base font-bold">{km} km</div>
            </div>
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-ink-500">Included</div>
              <div className="text-base font-bold">{booking.includedKm} km</div>
            </div>
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-ink-500">Overage</div>
              <div className="text-base font-bold text-brand-700">{overageKm} km</div>
            </div>
          </div>
          {overageKm! > 0 ? (
            <p className="mt-2 text-xs text-ink-600">
              Customer will be auto-charged for the overage at the country's per-km rate after you complete.
            </p>
          ) : null}
        </div>
      ) : null}

      {error ? <p className="mt-3 rounded-2xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}
    </form>
  );
};

const NoShowPanel: React.FC<{ booking: PartnerBookingDetail; noShowAllowedAt: Date; tooEarly: boolean; onSaved: () => void }> = ({ booking, noShowAllowedAt, tooEarly, onSaved }) => {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const onClick = async () => {
    if (!confirm('Mark the customer as a no-show? Booking will be non-refundable; you keep the wholesale.')) return;
    setBusy(true); setError(null);
    try {
      await partnerApi.declareNoShow(booking.id);
      onSaved();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="rounded-3xl border border-ink-100 bg-white p-5 shadow-soft">
      <h2 className="text-base font-bold tracking-tight">Customer didn't show?</h2>
      <p className="mt-1 text-sm text-ink-500">
        {tooEarly
          ? <>You can declare a no-show <strong>after {noShowAllowedAt.toLocaleString()}</strong> (60 min past pickup).</>
          : <>You waited 60+ minutes past pickup time. You can now mark the customer as a no-show.</>}
      </p>
      <button
        onClick={onClick}
        disabled={busy || tooEarly}
        className="mt-3 inline-flex items-center gap-1.5 rounded-2xl border border-ink-200 bg-white px-4 py-2 text-sm font-semibold text-ink-700 transition hover:border-rose-200 hover:text-rose-700 disabled:opacity-50 disabled:cursor-not-allowed">
        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserX className="h-4 w-4" />}
        Declare no-show
      </button>
      {error ? <p className="mt-3 rounded-2xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}
    </div>
  );
};

const CompletedSummary: React.FC<{ booking: PartnerBookingDetail }> = ({ booking }) => {
  const km = booking.odometerStart != null && booking.odometerEnd != null
    ? booking.odometerEnd - booking.odometerStart
    : null;
  return (
    <div className="rounded-3xl border border-emerald-200 bg-emerald-50 p-5 text-emerald-900">
      <h2 className="text-base font-bold tracking-tight">Trip complete</h2>
      <dl className="mt-2 grid gap-2 text-sm sm:grid-cols-2">
        {km !== null ? (
          <div className="flex items-center justify-between gap-3">
            <dt className="text-[10px] font-bold uppercase tracking-wider">KM driven</dt>
            <dd className="font-bold">{km}</dd>
          </div>
        ) : null}
        {booking.overageKm !== null ? (
          <div className="flex items-center justify-between gap-3">
            <dt className="text-[10px] font-bold uppercase tracking-wider">Overage</dt>
            <dd className="font-bold">{booking.overageKm} km</dd>
          </div>
        ) : null}
        {booking.overageAmount !== null ? (
          <div className="flex items-center justify-between gap-3">
            <dt className="text-[10px] font-bold uppercase tracking-wider">Overage charged</dt>
            <dd className="font-bold">{formatPrice(booking.overageAmount, booking.currency)}</dd>
          </div>
        ) : null}
        {booking.completedAt ? (
          <div className="flex items-center justify-between gap-3">
            <dt className="text-[10px] font-bold uppercase tracking-wider">Completed at</dt>
            <dd>{new Date(booking.completedAt).toLocaleString()}</dd>
          </div>
        ) : null}
      </dl>
    </div>
  );
};

interface FieldProps {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  required?: boolean;
  type?: string;
}
const Field: React.FC<FieldProps> = ({ label, value, onChange, placeholder, required, type = 'text' }) => (
  <label className="block rounded-2xl border border-ink-200 bg-white px-3 py-2 focus-within:border-brand-500">
    <span className="text-[10px] font-bold uppercase tracking-wider text-ink-500">{label}</span>
    <input
      type={type}
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      required={required}
      className="w-full bg-transparent text-base outline-none"
    />
  </label>
);
