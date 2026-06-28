'use client';

// Admin promo-code CRUD.
//
// One screen: a sticky "create" panel at the top followed by a
// table of every existing code. Edits happen in place via the
// PromoRow's expand button — we don't navigate away for a single
// field update. Toggling a code off (Deactivate) does a soft delete
// so historical bookings keep a usable foreign key.

import { useEffect, useMemo, useState } from 'react';
import { Loader2, Plus, AlertCircle, CheckCircle2, Pencil, Trash2, X, Tag } from 'lucide-react';
import { adminApi, type AdminPromoCode, type AdminPromoCodeInput } from '@/lib/admin-api';
import { AdminShell } from '../AdminShell';

export default function PromoCodesPage() {
  return (
    <AdminShell>
      <PromoCodesScreen />
    </AdminShell>
  );
}

const PromoCodesScreen: React.FC = () => {
  const [codes, setCodes] = useState<AdminPromoCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);

  const reload = async () => {
    setLoading(true);
    try {
      const r = await adminApi.promoCodes();
      setCodes(r.codes);
      setError(null);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { void reload(); }, []);

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tightest text-ink-900">Promo codes</h1>
          <p className="mt-1 text-sm text-ink-500">
            Discount codes redeemable at checkout. Percent-off or fixed-amount, optional time window and usage cap.
          </p>
        </div>
        <button
          onClick={() => setShowCreate(s => !s)}
          className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-4 py-2 text-sm font-bold text-white hover:bg-brand-700">
          {showCreate ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
          {showCreate ? 'Cancel' : 'New code'}
        </button>
      </header>

      {showCreate ? (
        <PromoForm
          mode="create"
          onCancel={() => setShowCreate(false)}
          onSaved={() => { setShowCreate(false); void reload(); }}
        />
      ) : null}

      {error ? (
        <div className="inline-flex w-full items-start gap-2 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <AlertCircle className="h-4 w-4 mt-0.5" />
          {error}
        </div>
      ) : null}

      {loading ? (
        <div className="rounded-2xl border border-ink-100 bg-white p-8 text-center text-sm text-ink-500">
          <Loader2 className="mx-auto h-5 w-5 animate-spin" />
          <p className="mt-3">Loading promo codes…</p>
        </div>
      ) : codes.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-ink-200 bg-white p-12 text-center">
          <Tag className="mx-auto h-8 w-8 text-ink-300" />
          <p className="mt-3 text-base font-semibold text-ink-700">No promo codes yet</p>
          <p className="mt-1 text-sm text-ink-500">Create your first code with the button above.</p>
        </div>
      ) : (
        <ul className="space-y-3">
          {codes.map(c => (
            <PromoRow
              key={c.id}
              code={c}
              editing={editingId === c.id}
              onStartEdit={() => setEditingId(c.id)}
              onCancelEdit={() => setEditingId(null)}
              onSaved={() => { setEditingId(null); void reload(); }}
              onDeactivated={() => void reload()}
            />
          ))}
        </ul>
      )}
    </div>
  );
};

const PromoRow: React.FC<{
  code: AdminPromoCode;
  editing: boolean;
  onStartEdit: () => void;
  onCancelEdit: () => void;
  onSaved: () => void;
  onDeactivated: () => void;
}> = ({ code, editing, onStartEdit, onCancelEdit, onSaved, onDeactivated }) => {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onDeactivate = async () => {
    if (!confirm(`Deactivate ${code.code}? Customers will no longer be able to redeem it.`)) return;
    setBusy(true);
    try {
      await adminApi.deactivatePromoCode(code.id);
      onDeactivated();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <li className={`rounded-2xl border bg-white shadow-soft transition ${code.active ? 'border-ink-100' : 'border-ink-100 opacity-60'}`}>
      <div className="flex flex-wrap items-center gap-4 p-5">
        <div className="grid h-11 w-11 place-items-center rounded-xl bg-brand-50 text-brand-700">
          <Tag className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-baseline gap-2">
            <code className="font-mono text-lg font-extrabold text-ink-900">{code.code}</code>
            {!code.active ? (
              <span className="rounded-full bg-ink-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-ink-600">Inactive</span>
            ) : null}
            {code.percentOff ? (
              <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-700">
                {Math.round(code.percentOff * 100)}% off
              </span>
            ) : null}
            {code.amountOff ? (
              <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-700">
                {code.amountOff.toFixed(2)} {code.currency} off
              </span>
            ) : null}
          </div>
          {code.description ? (
            <p className="mt-1 text-xs text-ink-500">{code.description}</p>
          ) : null}
          <p className="mt-1 text-xs text-ink-500">
            Used {code.usedCount}{code.maxUses ? ` / ${code.maxUses}` : ''}
            {code.validFrom ? ` · from ${new Date(code.validFrom).toLocaleDateString()}` : ''}
            {code.validUntil ? ` · until ${new Date(code.validUntil).toLocaleDateString()}` : ''}
            {code.minAmount ? ` · min ${code.minAmount.toFixed(2)} ${code.currency ?? ''}` : ''}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={editing ? onCancelEdit : onStartEdit}
            className="inline-flex items-center gap-1.5 rounded-xl bg-ink-50 px-3 py-1.5 text-xs font-bold text-ink-700 hover:bg-ink-100">
            {editing ? <X className="h-3.5 w-3.5" /> : <Pencil className="h-3.5 w-3.5" />}
            {editing ? 'Close' : 'Edit'}
          </button>
          {code.active ? (
            <button
              onClick={onDeactivate}
              disabled={busy}
              className="inline-flex items-center gap-1.5 rounded-xl bg-red-50 px-3 py-1.5 text-xs font-bold text-red-700 hover:bg-red-100 disabled:opacity-50">
              <Trash2 className="h-3.5 w-3.5" />
              Deactivate
            </button>
          ) : null}
        </div>
      </div>
      {error ? (
        <p className="border-t border-ink-100 px-5 py-2 text-xs text-red-700">{error}</p>
      ) : null}
      {editing ? (
        <div className="border-t border-ink-100 px-5 py-5">
          <PromoForm
            mode="edit"
            initial={code}
            onCancel={onCancelEdit}
            onSaved={onSaved}
          />
        </div>
      ) : null}
    </li>
  );
};

interface PromoFormProps {
  mode: 'create' | 'edit';
  initial?: AdminPromoCode;
  onCancel: () => void;
  onSaved: () => void;
}

const PromoForm: React.FC<PromoFormProps> = ({ mode, initial, onCancel, onSaved }) => {
  const [code, setCode] = useState(initial?.code ?? '');
  const [description, setDescription] = useState(initial?.description ?? '');
  const [discountType, setDiscountType] = useState<'percent' | 'amount'>(
    initial?.amountOff ? 'amount' : 'percent',
  );
  const [percentInput, setPercentInput] = useState(
    initial?.percentOff != null ? String(Math.round(initial.percentOff * 100)) : '10',
  );
  const [amountInput, setAmountInput] = useState(
    initial?.amountOff != null ? initial.amountOff.toFixed(2) : '5.00',
  );
  const [currency, setCurrency] = useState(initial?.currency ?? 'EUR');
  const [minAmount, setMinAmount] = useState(
    initial?.minAmount != null ? initial.minAmount.toFixed(2) : '',
  );
  const [maxUses, setMaxUses] = useState(initial?.maxUses != null ? String(initial.maxUses) : '');
  const [validFrom, setValidFrom] = useState(initial?.validFrom ? initial.validFrom.slice(0, 10) : '');
  const [validUntil, setValidUntil] = useState(initial?.validUntil ? initial.validUntil.slice(0, 10) : '');
  const [active, setActive] = useState(initial?.active ?? true);

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const payload = useMemo<AdminPromoCodeInput>(() => ({
    code: code.toUpperCase().trim(),
    description: description.trim() || null,
    percentOff: discountType === 'percent' ? Number(percentInput) / 100 : null,
    amountOff: discountType === 'amount' ? Number(amountInput) : null,
    currency: discountType === 'amount' ? currency.toUpperCase() : null,
    minAmount: minAmount.trim() ? Number(minAmount) : null,
    maxUses: maxUses.trim() ? Number(maxUses) : null,
    validFrom: validFrom ? new Date(`${validFrom}T00:00:00Z`).toISOString() : null,
    validUntil: validUntil ? new Date(`${validUntil}T23:59:59Z`).toISOString() : null,
    active,
  }), [code, description, discountType, percentInput, amountInput, currency, minAmount, maxUses, validFrom, validUntil, active]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setSuccess(false);
    try {
      if (mode === 'create') {
        await adminApi.createPromoCode(payload);
      } else if (initial) {
        await adminApi.updatePromoCode(initial.id, payload);
      }
      setSuccess(true);
      onSaved();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Code">
          <input
            value={code}
            onChange={e => setCode(e.target.value.toUpperCase())}
            required
            disabled={mode === 'edit'}
            placeholder="WELCOME10"
            className="w-full bg-transparent font-mono text-base outline-none uppercase"
          />
        </Field>
        <Field label="Description (internal)">
          <input
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="Launch promo · summer 2026"
            className="w-full bg-transparent text-base outline-none"
          />
        </Field>
      </div>

      <div className="rounded-2xl border border-ink-200 bg-white p-4">
        <div className="flex items-center gap-3">
          <label className="inline-flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="discount-type"
              checked={discountType === 'percent'}
              onChange={() => setDiscountType('percent')}
            />
            <span className="text-sm font-semibold">Percent off</span>
          </label>
          <label className="inline-flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="discount-type"
              checked={discountType === 'amount'}
              onChange={() => setDiscountType('amount')}
            />
            <span className="text-sm font-semibold">Fixed amount</span>
          </label>
        </div>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          {discountType === 'percent' ? (
            <Field label="% off (1-100)">
              <input
                type="number" step="1" min={1} max={100}
                value={percentInput}
                onChange={e => setPercentInput(e.target.value)}
                required
                className="w-full bg-transparent text-base outline-none"
              />
            </Field>
          ) : (
            <>
              <Field label="Amount off">
                <input
                  type="number" step="0.01" min={0.01}
                  value={amountInput}
                  onChange={e => setAmountInput(e.target.value)}
                  required
                  className="w-full bg-transparent text-base outline-none"
                />
              </Field>
              <Field label="Currency">
                <input
                  value={currency}
                  onChange={e => setCurrency(e.target.value.toUpperCase())}
                  required
                  maxLength={3}
                  placeholder="EUR"
                  className="w-full bg-transparent text-base outline-none uppercase"
                />
              </Field>
            </>
          )}
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Min subtotal (optional)">
          <input
            type="number" step="0.01" min={0}
            value={minAmount}
            onChange={e => setMinAmount(e.target.value)}
            placeholder="20.00"
            className="w-full bg-transparent text-base outline-none"
          />
        </Field>
        <Field label="Max total uses (optional)">
          <input
            type="number" step="1" min={1}
            value={maxUses}
            onChange={e => setMaxUses(e.target.value)}
            placeholder="100"
            className="w-full bg-transparent text-base outline-none"
          />
        </Field>
        <Field label="Valid from (optional)">
          <input
            type="date"
            value={validFrom}
            onChange={e => setValidFrom(e.target.value)}
            className="w-full bg-transparent text-base outline-none"
          />
        </Field>
        <Field label="Valid until (optional)">
          <input
            type="date"
            value={validUntil}
            onChange={e => setValidUntil(e.target.value)}
            className="w-full bg-transparent text-base outline-none"
          />
        </Field>
      </div>

      <label className="flex items-center gap-2 text-sm text-ink-700">
        <input
          type="checkbox"
          checked={active}
          onChange={e => setActive(e.target.checked)}
        />
        Active
      </label>

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

      <div className="flex items-center gap-2">
        <button
          type="submit"
          disabled={busy}
          className="inline-flex items-center gap-1.5 rounded-xl bg-brand-600 px-4 py-2 text-sm font-bold text-white hover:bg-brand-700 disabled:opacity-50">
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
          {mode === 'create' ? 'Create promo code' : 'Save changes'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-xl bg-ink-50 px-4 py-2 text-sm font-bold text-ink-700 hover:bg-ink-100">
          Cancel
        </button>
      </div>
    </form>
  );
};

const Field: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <label className="block rounded-2xl border border-ink-200 bg-white px-4 py-3 focus-within:border-brand-500">
    <span className="text-[10px] font-bold uppercase tracking-wider text-ink-500">{label}</span>
    <div className="mt-1">{children}</div>
  </label>
);
