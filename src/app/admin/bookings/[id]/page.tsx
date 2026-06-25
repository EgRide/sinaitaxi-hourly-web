'use client';

import { use, useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Loader2, RefreshCcw, Ban, ScrollText, Wallet, AlertCircle } from 'lucide-react';
import { adminApi, type AdminBookingDetail, type AdminAuditEntry } from '@/lib/admin-api';
import { AdminShell } from '../../AdminShell';
import { cn } from '@/lib/cn';

const formatPrice = (n: number, currency: string): string => {
  try { return new Intl.NumberFormat('en', { style: 'currency', currency }).format(n); }
  catch { return `${currency} ${n.toFixed(2)}`; }
};

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

export default function AdminBookingDetailPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <AdminShell>
      <Inner id={use(params).id} />
    </AdminShell>
  );
}

const Inner: React.FC<{ id: string }> = ({ id }) => {
  const [booking, setBooking] = useState<AdminBookingDetail | null>(null);
  const [auditLog, setAuditLog] = useState<AdminAuditEntry[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [bumpTick, setBumpTick] = useState(0);
  const [refundOpen, setRefundOpen] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);

  useEffect(() => {
    adminApi.booking(id)
      .then(r => { setBooking(r.booking); setAuditLog(r.auditLog); setError(null); })
      .catch((e: Error) => setError(e.message));
  }, [id, bumpTick]);

  const refresh = () => setBumpTick(t => t + 1);

  if (error) return <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>;
  if (!booking) return (
    <div className="inline-flex items-center gap-2 text-sm text-ink-500">
      <Loader2 className="h-4 w-4 animate-spin" /> Loading…
    </div>
  );

  const tone = STATUS_TONE[booking.status] ?? 'bg-ink-100 text-ink-700';
  const canRefund = !['pending', 'cancelled', 'refunded'].includes(booking.status);
  const canCancel = !['cancelled', 'refunded', 'completed', 'settled'].includes(booking.status);

  return (
    <div>
      <Link href="/admin/bookings" className="inline-flex items-center gap-1.5 text-sm font-semibold text-ink-600 hover:text-ink-900">
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
          <div className="text-xs text-ink-500">Retail / Wholesale</div>
          <div className="text-xl font-extrabold tracking-tightest">{formatPrice(booking.retailPrice, booking.currency)}</div>
          <div className="text-xs text-ink-400">{formatPrice(booking.wholesalePrice, booking.currency)}</div>
        </div>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <Card title="Trip">
          <Row label="Pickup at"    value={new Date(booking.pickupAt).toLocaleString()} />
          <Row label="Country"      value={booking.countryCode} />
          <Row label="Service area" value={booking.polygonName} />
          <Row label="Address"      value={booking.pickupAddress} />
          <Row label="Duration"     value={`${booking.durationHours}h${booking.hoursPerDay && booking.hoursPerDay.length > 1 ? ` across ${booking.hoursPerDay.length} days` : ''}`} />
          <Row label="Included"     value={`${booking.includedKm} km`} />
          <Row label="Rule"         value={booking.ruleName ?? '—'} />
          <Row label="Partner ID"   value={booking.assignedPartnerId ?? '—'} mono />
        </Card>

        <Card title="Customer">
          <Row label="Name" value={booking.customerName ?? '—'} />
          <Row label="Email" value={<a href={`mailto:${booking.customerEmail}`} className="text-brand-600 hover:text-brand-700">{booking.customerEmail}</a>} />
          <Row label="Phone" value={booking.customerPhone ?? '—'} />
          <Row label="Stripe customer" value={booking.stripeCustomerId ?? '—'} mono />
          <Row label="PaymentIntent" value={booking.stripePaymentIntent} mono />
        </Card>

        {booking.driverName ? (
          <Card title="Driver + vehicle">
            <Row label="Driver"  value={booking.driverName} />
            <Row label="Phone"   value={booking.driverPhone ?? '—'} />
            <Row label="Vehicle" value={booking.vehicleLabel ?? '—'} />
            <Row label="Assigned" value={booking.driverAssignedAt ? new Date(booking.driverAssignedAt).toLocaleString() : '—'} />
          </Card>
        ) : null}

        {booking.startedAt || booking.completedAt ? (
          <Card title="Trip log">
            <Row label="Started"   value={booking.startedAt ? new Date(booking.startedAt).toLocaleString() : '—'} />
            <Row label="Completed" value={booking.completedAt ? new Date(booking.completedAt).toLocaleString() : '—'} />
            <Row label="KM driven"
              value={booking.odometerStart != null && booking.odometerEnd != null
                ? `${booking.odometerEnd - booking.odometerStart} km`
                : '—'} />
            <Row label="Overage"       value={booking.overageKm != null ? `${booking.overageKm} km` : '—'} />
            <Row label="Overage charge"
              value={booking.overageAmount != null
                ? `${formatPrice(booking.overageAmount, booking.currency)}${booking.overageChargeId ? ` · ${booking.overageChargeId}` : ' · billing failed'}`
                : '—'} />
          </Card>
        ) : null}

        {(booking.cancelledAt || booking.refundId) ? (
          <Card title="Cancellation / refund">
            <Row label="Cancelled at" value={booking.cancelledAt ? new Date(booking.cancelledAt).toLocaleString() : '—'} />
            <Row label="Reason"       value={booking.cancelReason ?? '—'} />
            <Row label="Refund amount" value={booking.refundAmount != null ? formatPrice(booking.refundAmount, booking.currency) : '—'} />
            <Row label="Refund id"    value={booking.refundId ?? '—'} mono />
          </Card>
        ) : null}
      </div>

      {/* Ops actions */}
      <div className="mt-6 flex flex-wrap gap-3">
        <button onClick={() => setRefundOpen(true)} disabled={!canRefund}
          className="inline-flex items-center gap-1.5 rounded-2xl border border-ink-200 bg-white px-4 py-2 text-sm font-semibold text-ink-800 hover:border-rose-200 hover:text-rose-700 disabled:opacity-50">
          <Wallet className="h-4 w-4" /> Issue refund
        </button>
        <button onClick={() => setCancelOpen(true)} disabled={!canCancel}
          className="inline-flex items-center gap-1.5 rounded-2xl border border-ink-200 bg-white px-4 py-2 text-sm font-semibold text-ink-800 hover:border-rose-200 hover:text-rose-700 disabled:opacity-50">
          <Ban className="h-4 w-4" /> Admin cancel (overrides 24h policy)
        </button>
        <button onClick={refresh} className="inline-flex items-center gap-1.5 rounded-2xl border border-ink-200 bg-white px-4 py-2 text-sm font-semibold text-ink-700 hover:text-ink-900">
          <RefreshCcw className="h-4 w-4" /> Refresh
        </button>
      </div>

      {/* Audit log */}
      <div className="mt-8 rounded-3xl border border-ink-100 bg-white p-5 shadow-soft">
        <h2 className="text-[10px] font-bold uppercase tracking-wider text-ink-500 inline-flex items-center gap-1.5">
          <ScrollText className="h-3.5 w-3.5" /> Audit log
        </h2>
        <ul className="mt-3 divide-y divide-ink-100">
          {auditLog.map(a => (
            <li key={a.id} className="py-3 text-sm">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <div>
                  <span className="font-semibold text-ink-900">{a.action}</span>
                  {a.fromStatus && a.toStatus ? <span className="text-xs text-ink-500"> · {a.fromStatus} → {a.toStatus}</span> : null}
                </div>
                <span className="text-[10px] font-mono text-ink-500">{new Date(a.createdAt).toLocaleString()}</span>
              </div>
              <p className="text-xs text-ink-500 mt-0.5">by {a.actor}</p>
              {a.meta ? <pre className="mt-2 overflow-auto rounded-xl bg-ink-50 px-3 py-2 text-[10px] text-ink-700">{JSON.stringify(a.meta, null, 2)}</pre> : null}
            </li>
          ))}
        </ul>
      </div>

      {refundOpen ? <RefundModal booking={booking} onClose={() => setRefundOpen(false)} onDone={() => { setRefundOpen(false); refresh(); }} /> : null}
      {cancelOpen ? <CancelModal booking={booking} onClose={() => setCancelOpen(false)} onDone={() => { setCancelOpen(false); refresh(); }} /> : null}
    </div>
  );
};

const Card: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <section className="rounded-3xl border border-ink-100 bg-white p-5 shadow-soft">
    <h3 className="text-[10px] font-bold uppercase tracking-wider text-ink-500">{title}</h3>
    <dl className="mt-3 space-y-2 text-sm">{children}</dl>
  </section>
);

const Row: React.FC<{ label: string; value: React.ReactNode; mono?: boolean }> = ({ label, value, mono }) => {
  if (value === null || value === undefined || value === '') return null;
  return (
    <div className="flex items-start justify-between gap-3">
      <dt className="text-[10px] font-bold uppercase tracking-wider text-ink-500">{label}</dt>
      <dd className={`text-right text-sm font-medium text-ink-800 break-words max-w-[60%] ${mono ? 'font-mono text-xs' : ''}`}>{value}</dd>
    </div>
  );
};

const RefundModal: React.FC<{ booking: AdminBookingDetail; onClose: () => void; onDone: () => void }> = ({ booking, onClose, onDone }) => {
  const [amount, setAmount] = useState(booking.retailPrice.toFixed(2));
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true); setError(null);
    try {
      await adminApi.refund(booking.id, { amount: Number(amount), reason: reason || 'admin_override' });
      onDone();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };
  return (
    <ModalShell title="Issue refund" onClose={onClose}>
      <form onSubmit={onSubmit} className="space-y-3">
        <FieldRow label={`Amount (${booking.currency})`}>
          <input type="number" step="0.01" min="0" value={amount} onChange={e => setAmount(e.target.value)} required
            className="w-full bg-transparent text-base outline-none" />
        </FieldRow>
        <FieldRow label="Reason (audit log)">
          <textarea value={reason} onChange={e => setReason(e.target.value)} rows={2} required
            className="w-full bg-transparent text-base outline-none" placeholder="Customer complaint, driver issue, etc." />
        </FieldRow>
        {error ? <ErrorBox message={error} /> : null}
        <ModalActions onClose={onClose} busy={busy} label="Refund" tone="danger" />
      </form>
    </ModalShell>
  );
};

const CancelModal: React.FC<{ booking: AdminBookingDetail; onClose: () => void; onDone: () => void }> = ({ booking, onClose, onDone }) => {
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true); setError(null);
    try {
      await adminApi.adminCancel(booking.id, reason || undefined);
      onDone();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };
  return (
    <ModalShell title="Admin cancel" onClose={onClose}>
      <form onSubmit={onSubmit} className="space-y-3">
        <p className="text-sm text-ink-600">
          Bypasses the 24h customer policy. Paid bookings get a full refund automatically. Pending bookings have their PaymentIntent voided.
        </p>
        <FieldRow label="Reason (audit log)">
          <textarea value={reason} onChange={e => setReason(e.target.value)} rows={2}
            className="w-full bg-transparent text-base outline-none" placeholder="Partner unavailable, regulatory issue, etc." />
        </FieldRow>
        {error ? <ErrorBox message={error} /> : null}
        <ModalActions onClose={onClose} busy={busy} label="Cancel booking" tone="danger" />
      </form>
    </ModalShell>
  );
};

const ModalShell: React.FC<{ title: string; onClose: () => void; children: React.ReactNode }> = ({ title, onClose, children }) => (
  <div role="dialog" aria-modal="true" className="fixed inset-0 z-50 grid place-items-center bg-black/40 px-4 py-8">
    <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-glow">
      <div className="flex items-start justify-between gap-3 mb-3">
        <h2 className="text-xl font-bold tracking-tight">{title}</h2>
        <button onClick={onClose} aria-label="Close" className="rounded-xl p-1 text-ink-500 hover:bg-ink-100">×</button>
      </div>
      {children}
    </div>
  </div>
);

const FieldRow: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <label className="block rounded-2xl border border-ink-200 bg-white px-3 py-2 focus-within:border-brand-500">
    <span className="text-[10px] font-bold uppercase tracking-wider text-ink-500">{label}</span>
    <div className="mt-1">{children}</div>
  </label>
);

const ModalActions: React.FC<{ onClose: () => void; busy: boolean; label: string; tone?: 'danger' | 'default' }> = ({ onClose, busy, label, tone }) => (
  <div className="flex items-center justify-end gap-3 pt-1">
    <button type="button" onClick={onClose} className="text-sm font-semibold text-ink-600 hover:text-ink-900">Close</button>
    <button type="submit" disabled={busy} className={cn(
      'inline-flex items-center gap-1.5 rounded-2xl px-4 py-2 text-sm font-semibold text-white disabled:opacity-60',
      tone === 'danger' ? 'bg-red-600 hover:bg-red-700' : 'bg-brand-600 hover:bg-brand-700',
    )}>
      {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
      {busy ? 'Working…' : label}
    </button>
  </div>
);

const ErrorBox: React.FC<{ message: string }> = ({ message }) => (
  <div className="inline-flex w-full items-start gap-2 rounded-2xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
    <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
    {message}
  </div>
);
