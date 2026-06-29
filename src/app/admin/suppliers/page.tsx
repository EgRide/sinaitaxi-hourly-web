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
  Plus, Trash2,
} from 'lucide-react';
import { adminApi, type AdminSupplier, type AdminSupplierExtra } from '@/lib/admin-api';
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

      {/* Booking extras — hourly-only add-ons + read-only view of
          PHP child seats so the admin can see both surfaces. */}
      <SupplierExtrasPanel partnerPhpId={supplier.partnerPhpId} />
    </form>
  );
};

const SupplierExtrasPanel: React.FC<{ partnerPhpId: string }> = ({ partnerPhpId }) => {
  const [data, setData] = useState<{
    customExtras: AdminSupplierExtra[];
    childSeats: AdminSupplierExtra[];
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);

  // Draft for the inline "Add extra" form.
  const [newKind, setNewKind] = useState<'general' | 'child_seat'>('general');
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newPrice, setNewPrice] = useState('5.00');
  const [newCurrency, setNewCurrency] = useState('EUR');
  const [creating, setCreating] = useState(false);

  const reload = () => {
    setLoading(true);
    return adminApi.supplierExtras(partnerPhpId)
      .then(r => { setData(r); setError(null); })
      .catch(err => setError((err as Error).message))
      .finally(() => setLoading(false));
  };
  useEffect(() => { void reload(); }, [partnerPhpId]);

  const onCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    setCreating(true);
    setError(null);
    try {
      await adminApi.createSupplierExtra(partnerPhpId, {
        name: newName.trim(),
        description: newDesc.trim() || null,
        price: Number(newPrice) || 0,
        currency: newCurrency.toUpperCase(),
        kind: newKind,
      });
      setNewName(''); setNewDesc(''); setNewPrice('5.00'); setNewKind('general');
      setAdding(false);
      await reload();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setCreating(false);
    }
  };

  return (
    <section className="mt-4 rounded-2xl border border-ink-100 bg-ink-50/40 p-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <div>
          <h4 className="text-sm font-bold text-ink-900">Booking extras</h4>
          <p className="text-[11px] text-ink-500">
            Add-ons and child seats are managed here per supplier. Child seats show in the storefront's
            "Child seats" section (0–3 each); add-ons are a toggle.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setAdding(a => !a)}
          className="inline-flex items-center gap-1 rounded-full bg-brand-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-brand-700">
          {adding ? <X className="h-3 w-3" /> : <Plus className="h-3 w-3" />}
          {adding ? 'Cancel' : 'Add extra'}
        </button>
      </div>

      {error ? (
        <div className="mt-3 inline-flex w-full items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
          <AlertCircle className="h-3.5 w-3.5 mt-0.5" /> {error}
        </div>
      ) : null}

      {/* Add form */}
      {adding ? (
        <form onSubmit={onCreate} className="mt-3 flex flex-col gap-2 rounded-xl border border-ink-200 bg-white p-3">
          {/* Type toggle: child seat vs general add-on */}
          <div className="flex gap-1.5">
            {([
              { k: 'general' as const, label: 'Add-on' },
              { k: 'child_seat' as const, label: 'Child seat' },
            ]).map(({ k, label }) => (
              <button
                key={k}
                type="button"
                onClick={() => setNewKind(k)}
                className={`rounded-lg px-3 py-1 text-xs font-bold ${newKind === k ? 'bg-brand-600 text-white' : 'bg-ink-100 text-ink-700 hover:bg-ink-200'}`}>
                {label}
              </button>
            ))}
          </div>
          <div className="grid gap-2 sm:grid-cols-[2fr_1fr_80px_auto]">
          <input
            value={newName}
            onChange={e => setNewName(e.target.value)}
            placeholder={newKind === 'child_seat' ? 'Seat name (e.g. Infant 0–3y)' : 'Add-on name (e.g. In-car WiFi)'}
            className="rounded-lg border border-ink-200 px-3 py-1.5 text-sm outline-none focus:border-brand-500"
            required
          />
          <input
            value={newDesc}
            onChange={e => setNewDesc(e.target.value)}
            placeholder="Short description (optional)"
            className="rounded-lg border border-ink-200 px-3 py-1.5 text-sm outline-none focus:border-brand-500"
          />
          <input
            type="number" step="0.01" min={0}
            value={newPrice}
            onChange={e => setNewPrice(e.target.value)}
            className="rounded-lg border border-ink-200 px-3 py-1.5 text-sm outline-none focus:border-brand-500"
            required
          />
          <div className="flex gap-1.5">
            <input
              value={newCurrency}
              onChange={e => setNewCurrency(e.target.value.toUpperCase())}
              maxLength={3}
              placeholder="EUR"
              className="w-16 rounded-lg border border-ink-200 px-2 py-1.5 text-sm uppercase outline-none focus:border-brand-500"
              required
            />
            <button
              type="submit"
              disabled={creating}
              className="inline-flex items-center gap-1 rounded-lg bg-brand-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-brand-700 disabled:opacity-50">
              {creating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
              Save
            </button>
          </div>
          </div>
        </form>
      ) : null}

      {/* Custom extras list */}
      <div className="mt-3 space-y-2">
        <h5 className="text-[10px] font-bold uppercase tracking-wider text-ink-500">Custom (hourly-only)</h5>
        {loading ? (
          <p className="inline-flex items-center gap-2 text-xs text-ink-500">
            <Loader2 className="h-3 w-3 animate-spin" /> Loading…
          </p>
        ) : !data || data.customExtras.length === 0 ? (
          <p className="rounded-lg border border-dashed border-ink-200 px-3 py-3 text-xs text-ink-500">
            No custom extras yet. Use “Add extra” above to publish one (WiFi, water, etc.).
          </p>
        ) : (
          <ul className="space-y-1.5">
            {data.customExtras.map(ex => (
              <ExtraRow key={ex.id} partnerPhpId={partnerPhpId} extra={ex} onChanged={reload} />
            ))}
          </ul>
        )}

        {/* Child seats */}
        <h5 className="mt-4 text-[10px] font-bold uppercase tracking-wider text-ink-500">Child seats</h5>
        {loading ? null : !data || data.childSeats.length === 0 ? (
          <p className="rounded-lg border border-dashed border-ink-200 px-3 py-3 text-xs text-ink-500">
            No child seats yet. Use “Add extra” → Child seat to publish one (Infant, Forward-facing, Booster…).
          </p>
        ) : (
          <ul className="space-y-1.5">
            {data.childSeats.map(ex => (
              <ExtraRow key={ex.id} partnerPhpId={partnerPhpId} extra={ex} onChanged={reload} />
            ))}
          </ul>
        )}
      </div>
    </section>
  );
};

const ExtraRow: React.FC<{
  partnerPhpId: string;
  extra: AdminSupplierExtra;
  onChanged: () => void;
}> = ({ partnerPhpId, extra, onChanged }) => {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(extra.name);
  const [desc, setDesc] = useState(extra.description ?? '');
  const [price, setPrice] = useState(extra.price.toFixed(2));
  const [currency, setCurrency] = useState(extra.currency);
  const [active, setActive] = useState(extra.active);
  const [busy, setBusy] = useState(false);

  const onSave = async () => {
    setBusy(true);
    try {
      await adminApi.updateSupplierExtra(partnerPhpId, extra.id, {
        name: name.trim(),
        description: desc.trim() || null,
        price: Number(price) || 0,
        currency: currency.toUpperCase(),
        active,
      });
      setEditing(false);
      onChanged();
    } catch { /* surfaced upstream */ }
    finally { setBusy(false); }
  };

  const onDelete = async () => {
    if (!confirm(`Delete "${extra.name}"? Customers won't see it on new bookings.`)) return;
    setBusy(true);
    try {
      await adminApi.deleteSupplierExtra(partnerPhpId, extra.id);
      onChanged();
    } catch { /* surfaced upstream */ }
    finally { setBusy(false); }
  };

  if (editing) {
    return (
      <li className="rounded-lg border border-brand-200 bg-white p-2 text-xs">
        <div className="grid gap-1.5 sm:grid-cols-[2fr_1fr_70px_60px_auto]">
          <input value={name} onChange={e => setName(e.target.value)} placeholder="Name"
            className="rounded border border-ink-200 px-2 py-1 outline-none focus:border-brand-500" />
          <input value={desc} onChange={e => setDesc(e.target.value)} placeholder="Description"
            className="rounded border border-ink-200 px-2 py-1 outline-none focus:border-brand-500" />
          <input type="number" step="0.01" min={0} value={price} onChange={e => setPrice(e.target.value)}
            className="rounded border border-ink-200 px-2 py-1 outline-none focus:border-brand-500" />
          <input value={currency} onChange={e => setCurrency(e.target.value.toUpperCase())} maxLength={3}
            className="rounded border border-ink-200 px-2 py-1 uppercase outline-none focus:border-brand-500" />
          <div className="flex items-center gap-1">
            <label className="inline-flex items-center gap-1 text-[10px]">
              <input type="checkbox" checked={active} onChange={e => setActive(e.target.checked)}
                className="h-3 w-3 rounded border-ink-300" />
              Active
            </label>
            <button type="button" onClick={onSave} disabled={busy}
              className="inline-flex items-center gap-1 rounded bg-brand-600 px-2 py-1 text-[10px] font-bold text-white hover:bg-brand-700 disabled:opacity-50">
              {busy ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />}
              Save
            </button>
            <button type="button" onClick={() => setEditing(false)}
              className="inline-flex items-center rounded bg-ink-100 px-2 py-1 text-[10px] font-bold text-ink-700 hover:bg-ink-200">
              Cancel
            </button>
          </div>
        </div>
      </li>
    );
  }

  return (
    <li className={`flex items-center justify-between gap-3 rounded-lg border ${extra.active ? 'border-ink-100' : 'border-amber-200 bg-amber-50/40'} bg-white px-3 py-2 text-xs`}>
      <div className="min-w-0">
        <p className="truncate font-bold text-ink-900">
          {extra.name}
          {!extra.active ? <span className="ml-2 rounded-full bg-amber-100 px-1.5 py-0.5 text-[9px] font-bold uppercase text-amber-700">Paused</span> : null}
        </p>
        {extra.description ? <p className="truncate text-[10px] text-ink-500">{extra.description}</p> : null}
      </div>
      <div className="flex items-center gap-2">
        <span className="font-mono text-xs font-bold text-ink-900">
          {extra.price.toFixed(2)} {extra.currency}
        </span>
        <button type="button" onClick={() => setEditing(true)} disabled={busy}
          className="rounded-lg bg-ink-50 px-2 py-1 text-[10px] font-bold text-ink-700 hover:bg-ink-100 disabled:opacity-50">
          Edit
        </button>
        <button type="button" onClick={onDelete} disabled={busy}
          className="rounded-lg bg-red-50 px-2 py-1 text-[10px] font-bold text-red-700 hover:bg-red-100 disabled:opacity-50">
          <Trash2 className="h-3 w-3" />
        </button>
      </div>
    </li>
  );
};

const Field: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <label className="block rounded-2xl border border-ink-200 bg-white px-4 py-3 focus-within:border-brand-500">
    <span className="text-[10px] font-bold uppercase tracking-wider text-ink-500">{label}</span>
    <div className="mt-1">{children}</div>
  </label>
);
