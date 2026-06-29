'use client';

// /admin/suppliers — list of every PHP polygon-provider with our
// hourly-marketplace overrides + insights.
//
// Layout: header KPI strip → search/filter row → expandable row per
// supplier. Each row shows the basics inline and an inline editor
// for hourly-active toggle, commission % override, and notes.

import { useEffect, useMemo, useState } from 'react';
import {
  Loader2, AlertCircle, Search, Users, Pencil, X, Save, CheckCircle2,
  Activity, DollarSign, TrendingUp, EyeOff, Building2, Phone, Mail, MessageCircle,
} from 'lucide-react';
import { adminApi, type AdminSupplier } from '@/lib/admin-api';
import { Pagination } from '@/components/Pagination';
import { AdminShell } from '../AdminShell';

const PAGE_SIZE = 20;

export default function SuppliersAdminPage() {
  return (
    <AdminShell>
      <SuppliersScreen />
    </AdminShell>
  );
}

type Scope = 'all' | 'active' | 'paused' | 'with-bookings';

const SuppliersScreen: React.FC = () => {
  const [rows, setRows] = useState<AdminSupplier[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [scope, setScope] = useState<Scope>('all');
  const [editingPhpId, setEditingPhpId] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  // Reset to first page when filters change.
  useEffect(() => { setPage(1); }, [query, scope]);

  const reload = () => {
    setRows(null);
    setError(null);
    return adminApi.suppliers()
      .then(r => setRows(r.suppliers))
      .catch(err => setError((err as Error).message));
  };
  useEffect(() => { void reload(); }, []);

  const filtered = useMemo(() => {
    if (!rows) return null;
    const q = query.trim().toLowerCase();
    return rows
      .filter(s => {
        if (scope === 'active' && !s.hourlyActive) return false;
        if (scope === 'paused' && s.hourlyActive) return false;
        if (scope === 'with-bookings' && s.bookingsCount === 0) return false;
        if (!q) return true;
        return (
          (s.companyName?.toLowerCase().includes(q) ?? false)
          || (s.email?.toLowerCase().includes(q) ?? false)
          || (s.firstName?.toLowerCase().includes(q) ?? false)
          || (s.lastName?.toLowerCase().includes(q) ?? false)
          || s.partnerPhpId.includes(q)
        );
      })
      .sort((a, b) => b.bookingsCount - a.bookingsCount);
  }, [rows, query, scope]);

  const kpis = useMemo(() => {
    if (!rows) return null;
    const totalRevenue = rows.reduce((s, r) => s + r.revenue, 0);
    return {
      total: rows.length,
      active: rows.filter(r => r.hourlyActive).length,
      paused: rows.filter(r => !r.hourlyActive).length,
      withBookings: rows.filter(r => r.bookingsCount > 0).length,
      revenue: totalRevenue,
    };
  }, [rows]);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-extrabold tracking-tightest text-ink-900">Suppliers</h1>
        <p className="mt-1 text-sm text-ink-500">
          Every PHP polygon-provider available to the marketplace. Pause a supplier or override
          their commission without touching the main Sinai Taxi system.
        </p>
      </header>

      {kpis ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Kpi icon={<Users className="h-4 w-4" />} label="Total" value={kpis.total} />
          <Kpi icon={<Activity className="h-4 w-4" />} label="Active in hourly" value={kpis.active} tone="emerald" />
          <Kpi icon={<EyeOff className="h-4 w-4" />} label="Paused in hourly" value={kpis.paused} tone="amber" />
          <Kpi icon={<TrendingUp className="h-4 w-4" />} label="With bookings" value={kpis.withBookings} />
        </div>
      ) : null}

      <div className="flex flex-wrap items-center gap-3">
        <label className="flex flex-1 items-center gap-2 rounded-2xl border border-ink-200 bg-white px-4 py-2.5 focus-within:border-brand-500">
          <Search className="h-4 w-4 text-ink-400" />
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search by company, name, email, or PHP id"
            className="w-full bg-transparent text-sm outline-none"
          />
        </label>
        <div className="flex gap-1 rounded-full bg-ink-100 p-1">
          {([
            { id: 'all',           label: 'All' },
            { id: 'active',        label: 'Active' },
            { id: 'paused',        label: 'Paused' },
            { id: 'with-bookings', label: 'Has bookings' },
          ] as { id: Scope; label: string }[]).map(s => (
            <button
              key={s.id}
              onClick={() => setScope(s.id)}
              className={`whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-semibold ${scope === s.id ? 'bg-white text-ink-900 shadow-sm' : 'text-ink-600 hover:text-ink-900'}`}>
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {error ? (
        <div className="inline-flex w-full items-start gap-2 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <AlertCircle className="h-4 w-4 mt-0.5" />
          {error}
        </div>
      ) : null}

      {!filtered ? (
        <div className="rounded-2xl border border-ink-100 bg-white p-8 text-center text-sm text-ink-500">
          <Loader2 className="mx-auto h-5 w-5 animate-spin" />
          <p className="mt-3">Loading suppliers from PHP…</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-ink-200 bg-white p-12 text-center">
          <Users className="mx-auto h-8 w-8 text-ink-300" />
          <p className="mt-3 text-base font-semibold text-ink-700">No suppliers match this filter.</p>
        </div>
      ) : (
        <>
          <p className="text-xs text-ink-500">{filtered.length} of {rows?.length ?? 0} suppliers.</p>
          <ul className="space-y-3">
            {filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE).map(s => (
              <SupplierRow
                key={s.partnerPhpId}
                supplier={s}
                editing={editingPhpId === s.partnerPhpId}
                onStartEdit={() => setEditingPhpId(s.partnerPhpId)}
                onCancelEdit={() => setEditingPhpId(null)}
                onSaved={() => { setEditingPhpId(null); void reload(); }}
              />
            ))}
          </ul>
          <Pagination
            page={page}
            pageSize={PAGE_SIZE}
            total={filtered.length}
            onChange={setPage}
          />
        </>
      )}
    </div>
  );
};

const Kpi: React.FC<{
  icon: React.ReactNode;
  label: string;
  value: number | string;
  tone?: 'emerald' | 'amber';
}> = ({ icon, label, value, tone }) => (
  <div className="rounded-2xl border border-ink-100 bg-white p-4 shadow-soft">
    <div className={`inline-flex h-7 w-7 items-center justify-center rounded-lg ${
      tone === 'emerald' ? 'bg-emerald-50 text-emerald-700'
      : tone === 'amber' ? 'bg-amber-50 text-amber-700'
      : 'bg-brand-50 text-brand-700'
    }`}>
      {icon}
    </div>
    <p className="mt-2 text-[10px] font-bold uppercase tracking-wider text-ink-500">{label}</p>
    <p className="mt-0.5 text-xl font-extrabold tracking-tight text-ink-900">{value}</p>
  </div>
);

const fmtMoney = (n: number): string => n.toLocaleString('en', { minimumFractionDigits: 0, maximumFractionDigits: 0 });

interface RowProps {
  supplier: AdminSupplier;
  editing: boolean;
  onStartEdit: () => void;
  onCancelEdit: () => void;
  onSaved: () => void;
}

const SupplierRow: React.FC<RowProps> = ({ supplier, editing, onStartEdit, onCancelEdit, onSaved }) => {
  const displayName = supplier.companyName
    ?? [supplier.firstName, supplier.lastName].filter(Boolean).join(' ')
    ?? `Supplier #${supplier.partnerPhpId}`;

  return (
    <li className={`rounded-2xl border bg-white shadow-soft transition ${supplier.hourlyActive ? 'border-ink-100' : 'border-amber-200 bg-amber-50/40'}`}>
      <div className="flex flex-wrap items-start gap-4 p-5">
        <div className="grid h-12 w-12 place-items-center rounded-xl bg-brand-50 text-brand-700">
          <Building2 className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-base font-bold text-ink-900">{displayName || `#${supplier.partnerPhpId}`}</h3>
            <span className="rounded-full bg-ink-100 px-2 py-0.5 font-mono text-[10px] font-semibold text-ink-600">#{supplier.partnerPhpId}</span>
            {!supplier.hourlyActive ? (
              <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-800">
                Paused in hourly
              </span>
            ) : null}
            {!supplier.phpActive ? (
              <span className="rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-red-700">
                Inactive on PHP
              </span>
            ) : null}
            {supplier.commissionPctOverride != null ? (
              <span className="rounded-full bg-violet-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-violet-700">
                {(supplier.commissionPctOverride * 100).toFixed(0)}% override
              </span>
            ) : null}
          </div>
          <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-ink-500">
            {supplier.email ? (
              <span className="inline-flex items-center gap-1"><Mail className="h-3 w-3" />{supplier.email}</span>
            ) : null}
            {supplier.phone ? (
              <span className="inline-flex items-center gap-1"><Phone className="h-3 w-3" />{supplier.phone}</span>
            ) : null}
            {supplier.whatsapp && supplier.whatsapp !== supplier.phone ? (
              <span className="inline-flex items-center gap-1"><MessageCircle className="h-3 w-3" />{supplier.whatsapp}</span>
            ) : null}
            {supplier.province ? <span>· {supplier.province}</span> : null}
          </div>
          {supplier.notes ? (
            <p className="mt-2 max-w-2xl rounded-xl bg-ink-50 px-3 py-2 text-xs italic text-ink-600">{supplier.notes}</p>
          ) : null}
        </div>

        {/* Inline insights */}
        <div className="flex flex-wrap items-center gap-4 text-right">
          <Stat label="Bookings" value={String(supplier.bookingsCount)} icon={<Activity className="h-3.5 w-3.5" />} />
          <Stat label="Revenue" value={fmtMoney(supplier.revenue)} icon={<DollarSign className="h-3.5 w-3.5" />} />
          <Stat label="Last" value={supplier.lastBookingAt ? new Date(supplier.lastBookingAt).toLocaleDateString() : '—'} />
        </div>

        <button
          onClick={editing ? onCancelEdit : onStartEdit}
          className="inline-flex items-center gap-1.5 rounded-xl bg-ink-50 px-3 py-1.5 text-xs font-bold text-ink-700 hover:bg-ink-100">
          {editing ? <X className="h-3.5 w-3.5" /> : <Pencil className="h-3.5 w-3.5" />}
          {editing ? 'Close' : 'Edit'}
        </button>
      </div>

      {editing ? (
        <div className="border-t border-ink-100 px-5 py-5">
          <SupplierEditor supplier={supplier} onSaved={onSaved} />
        </div>
      ) : null}
    </li>
  );
};

const Stat: React.FC<{ label: string; value: string; icon?: React.ReactNode }> = ({ label, value, icon }) => (
  <div className="text-right">
    <p className="text-[10px] font-bold uppercase tracking-wider text-ink-500">{label}</p>
    <p className="inline-flex items-center gap-1 text-sm font-bold text-ink-900">
      {icon}
      {value}
    </p>
  </div>
);

const SupplierEditor: React.FC<{ supplier: AdminSupplier; onSaved: () => void }> = ({ supplier, onSaved }) => {
  const [hourlyActive, setHourlyActive] = useState(supplier.hourlyActive);
  const [commissionInput, setCommissionInput] = useState(
    supplier.commissionPctOverride != null ? (supplier.commissionPctOverride * 100).toFixed(2) : '',
  );
  const [notes, setNotes] = useState(supplier.notes ?? '');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setSuccess(false);
    try {
      const commissionPctOverride = commissionInput.trim() === ''
        ? null
        : Number(commissionInput) / 100;
      await adminApi.updateSupplier(supplier.partnerPhpId, {
        hourlyActive,
        commissionPctOverride,
        notes: notes.trim() || null,
      });
      setSuccess(true);
      setTimeout(onSaved, 600);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {/* Active toggle — full width, clearly its own control. */}
      <label className="flex items-start gap-3 rounded-2xl border border-ink-100 bg-white px-4 py-3 cursor-pointer hover:border-ink-200 transition">
        <input
          type="checkbox"
          checked={hourlyActive}
          onChange={e => setHourlyActive(e.target.checked)}
          className="mt-0.5 h-4 w-4 rounded border-ink-300 text-brand-600"
        />
        <span className="text-sm">
          <span className="font-semibold text-ink-800">Active in hourly marketplace</span>
          <span className="mt-0.5 block text-xs text-ink-500">
            When unticked, this supplier's offers stop showing in /search and no new bookings
            can be made. The supplier stays untouched on the main PHP system.
          </span>
        </span>
      </label>

      {/* Commission override — same Field style as Country settings:
          standalone row with the label tied to the input. Leave empty
          to fall back to the country-level commission. */}
      <Field label="Commission % override">
        <input
          type="number" step="0.01" min="0" max="100"
          value={commissionInput}
          onChange={e => setCommissionInput(e.target.value)}
          placeholder="Leave empty to use the country default"
          className="w-full bg-transparent text-base outline-none"
        />
      </Field>

      <Field label="Internal notes (admin only)">
        <textarea
          value={notes}
          onChange={e => setNotes(e.target.value)}
          rows={3}
          maxLength={2000}
          placeholder="Account manager notes, escalation history, etc."
          className="w-full resize-none bg-transparent text-base outline-none"
        />
      </Field>

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

      <button
        type="submit"
        disabled={busy}
        className="inline-flex items-center gap-1.5 rounded-xl bg-brand-600 px-4 py-2 text-sm font-bold text-white hover:bg-brand-700 disabled:opacity-50">
        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
        Save changes
      </button>
    </form>
  );
};

const Field: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <label className="block rounded-2xl border border-ink-200 bg-white px-4 py-3 focus-within:border-brand-500">
    <span className="text-[10px] font-bold uppercase tracking-wider text-ink-500">{label}</span>
    <div className="mt-1">{children}</div>
  </label>
);
