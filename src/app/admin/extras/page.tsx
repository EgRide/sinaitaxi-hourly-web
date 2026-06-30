'use client';

// /admin/extras — booking extras & child seats.
//
// Two layers:
//   1. Catalogue ("our data") — define extras + child seats once.
//   2. Per-provider assignment — pick a provider, tick which items
//      they offer and set that provider's price.
//
// The customer storefront only ever sees what a provider is assigned.

import { useEffect, useMemo, useState } from 'react';
import { Loader2, AlertCircle, Plus, Save, Trash2, X, Package, Baby, CheckCircle2 } from 'lucide-react';
import {
  adminApi,
  type AdminSupplier,
  type CatalogExtra,
  type SupplierCatalogRow,
} from '@/lib/admin-api';
import { AdminShell } from '../AdminShell';

type Kind = 'general' | 'child_seat';
const KIND_LABEL: Record<Kind, string> = { general: 'Add-ons', child_seat: 'Child seats' };

export default function ExtrasAdminPage() {
  return (
    <AdminShell>
      <ExtrasScreen />
    </AdminShell>
  );
}

const ExtrasScreen: React.FC = () => {
  // Bumped whenever the catalogue changes so the provider panel reloads.
  const [catalogVersion, setCatalogVersion] = useState(0);
  return (
    <div className="space-y-6">
      <header className="flex items-center gap-3">
        <span className="grid h-10 w-10 place-items-center rounded-2xl bg-brand-50 text-brand-700">
          <Package className="h-5 w-5" />
        </span>
        <div>
          <h1 className="text-lg font-bold text-ink-900">Booking extras &amp; child seats</h1>
          <p className="text-xs text-ink-500">
            Define the catalogue once, then assign items to each provider with their own price.
          </p>
        </div>
      </header>
      <CatalogPanel onChanged={() => setCatalogVersion(v => v + 1)} />
      <ProviderAssignPanel catalogVersion={catalogVersion} />
    </div>
  );
};

// ── Catalogue management ──────────────────────────────────────
const CatalogPanel: React.FC<{ onChanged: () => void }> = ({ onChanged }) => {
  const [items, setItems] = useState<CatalogExtra[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [creating, setCreating] = useState(false);

  const [newKind, setNewKind] = useState<Kind>('general');
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newPrice, setNewPrice] = useState('5.00');
  const [newCurrency, setNewCurrency] = useState('EUR');

  const reload = () =>
    adminApi.catalogExtras()
      .then(r => { setItems(r.items); setError(null); })
      .catch(e => setError((e as Error).message));
  useEffect(() => { void reload(); }, []);

  const onCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    setCreating(true);
    setError(null);
    try {
      await adminApi.createCatalogExtra({
        name: newName.trim(),
        description: newDesc.trim() || null,
        kind: newKind,
        defaultPrice: Number(newPrice) || 0,
        currency: newCurrency.toUpperCase(),
      });
      setNewName(''); setNewDesc(''); setNewPrice('5.00'); setNewKind('general');
      setAdding(false);
      await reload();
      onChanged();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setCreating(false);
    }
  };

  const groups: Kind[] = ['general', 'child_seat'];

  return (
    <section className="rounded-2xl border border-ink-100 bg-white p-4 shadow-soft">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <div>
          <h2 className="text-sm font-bold text-ink-900">Catalogue</h2>
          <p className="text-[11px] text-ink-500">Our standard extras &amp; child seats, shared across all providers.</p>
        </div>
        <button
          type="button"
          onClick={() => setAdding(a => !a)}
          className="inline-flex items-center gap-1 rounded-full bg-brand-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-brand-700">
          {adding ? <X className="h-3 w-3" /> : <Plus className="h-3 w-3" />}
          {adding ? 'Cancel' : 'Add item'}
        </button>
      </div>

      {error ? (
        <div className="mt-3 inline-flex w-full items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
          <AlertCircle className="h-3.5 w-3.5 mt-0.5" /> {error}
        </div>
      ) : null}

      {adding ? (
        <form onSubmit={onCreate} className="mt-3 flex flex-col gap-2 rounded-xl border border-ink-200 bg-ink-50/40 p-3">
          <div className="flex gap-1.5">
            {(['general', 'child_seat'] as Kind[]).map(k => (
              <button
                key={k}
                type="button"
                onClick={() => setNewKind(k)}
                className={`rounded-lg px-3 py-1 text-xs font-bold ${newKind === k ? 'bg-brand-600 text-white' : 'bg-ink-100 text-ink-700 hover:bg-ink-200'}`}>
                {k === 'child_seat' ? 'Child seat' : 'Add-on'}
              </button>
            ))}
          </div>
          <div className="grid gap-2 sm:grid-cols-[2fr_2fr_80px_auto]">
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
              title="Default price"
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
          <p className="text-[10px] text-ink-500">
            Default price is the starting suggestion when you assign this item to a provider — each provider can override it.
          </p>
        </form>
      ) : null}

      <div className="mt-3 space-y-4">
        {items === null ? (
          <p className="inline-flex items-center gap-2 text-xs text-ink-500"><Loader2 className="h-3 w-3 animate-spin" /> Loading…</p>
        ) : groups.map(kind => {
          const list = items.filter(i => i.kind === kind);
          return (
            <div key={kind}>
              <h3 className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-ink-500">
                {kind === 'child_seat' ? <Baby className="h-3 w-3" /> : <Package className="h-3 w-3" />}
                {KIND_LABEL[kind]}
              </h3>
              {list.length === 0 ? (
                <p className="mt-1 rounded-lg border border-dashed border-ink-200 px-3 py-2 text-xs text-ink-500">
                  None yet. Use “Add item” → {kind === 'child_seat' ? 'Child seat' : 'Add-on'}.
                </p>
              ) : (
                <ul className="mt-1 space-y-1.5">
                  {list.map(it => (
                    <CatalogItemRow key={it.id} item={it} onChanged={() => { void reload(); onChanged(); }} onError={setError} />
                  ))}
                </ul>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
};

const CatalogItemRow: React.FC<{
  item: CatalogExtra;
  onChanged: () => void;
  onError: (m: string) => void;
}> = ({ item, onChanged, onError }) => {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(item.name);
  const [desc, setDesc] = useState(item.description ?? '');
  const [price, setPrice] = useState(item.defaultPrice.toFixed(2));
  const [currency, setCurrency] = useState(item.currency);
  const [active, setActive] = useState(item.active);
  const [busy, setBusy] = useState(false);

  const onSave = async () => {
    setBusy(true);
    try {
      await adminApi.updateCatalogExtra(item.id, {
        name: name.trim(),
        description: desc.trim() || null,
        kind: item.kind,
        defaultPrice: Number(price) || 0,
        currency: currency.toUpperCase(),
        active,
      });
      setEditing(false);
      onChanged();
    } catch (err) { onError((err as Error).message); }
    finally { setBusy(false); }
  };

  const onDelete = async () => {
    if (!confirm(`Delete "${item.name}"? It will be removed from every provider that offers it.`)) return;
    setBusy(true);
    try {
      await adminApi.deleteCatalogExtra(item.id);
      onChanged();
    } catch (err) { onError((err as Error).message); }
    finally { setBusy(false); }
  };

  if (editing) {
    return (
      <li className="rounded-lg border border-brand-200 bg-white p-2 text-xs">
        <div className="grid gap-1.5 sm:grid-cols-[2fr_2fr_70px_60px_auto]">
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
              <input type="checkbox" checked={active} onChange={e => setActive(e.target.checked)} className="h-3 w-3 rounded border-ink-300" />
              Active
            </label>
            <button type="button" onClick={onSave} disabled={busy}
              className="inline-flex items-center gap-1 rounded bg-brand-600 px-2 py-1 text-[10px] font-bold text-white hover:bg-brand-700 disabled:opacity-50">
              {busy ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />} Save
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
    <li className={`flex items-center justify-between gap-3 rounded-lg border ${item.active ? 'border-ink-100' : 'border-amber-200 bg-amber-50/40'} bg-white px-3 py-2 text-xs`}>
      <div className="min-w-0">
        <p className="truncate font-bold text-ink-900">
          {item.name}
          {!item.active ? <span className="ml-2 rounded-full bg-amber-100 px-1.5 py-0.5 text-[9px] font-bold uppercase text-amber-700">Hidden</span> : null}
        </p>
        {item.description ? <p className="truncate text-[10px] text-ink-500">{item.description}</p> : null}
      </div>
      <div className="flex items-center gap-2">
        <span className="font-mono text-xs font-bold text-ink-900">{item.defaultPrice.toFixed(2)} {item.currency}</span>
        <button type="button" onClick={() => setEditing(true)} disabled={busy}
          className="rounded-lg bg-ink-50 px-2 py-1 text-[10px] font-bold text-ink-700 hover:bg-ink-100 disabled:opacity-50">Edit</button>
        <button type="button" onClick={onDelete} disabled={busy}
          className="rounded-lg bg-red-50 px-2 py-1 text-[10px] font-bold text-red-700 hover:bg-red-100 disabled:opacity-50">
          <Trash2 className="h-3 w-3" />
        </button>
      </div>
    </li>
  );
};

// ── Per-provider assignment ───────────────────────────────────
const supplierLabel = (s: AdminSupplier): string =>
  s.companyName?.trim()
  || [s.firstName, s.lastName].filter(Boolean).join(' ').trim()
  || `Provider ${s.partnerPhpId}`;

const ProviderAssignPanel: React.FC<{ catalogVersion: number }> = ({ catalogVersion }) => {
  const [suppliers, setSuppliers] = useState<AdminSupplier[] | null>(null);
  const [phpId, setPhpId] = useState('');
  const [rows, setRows] = useState<SupplierCatalogRow[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    adminApi.suppliers()
      .then(r => setSuppliers([...r.suppliers].sort((a, b) => supplierLabel(a).localeCompare(supplierLabel(b)))))
      .catch(e => setError((e as Error).message));
  }, []);

  const loadCatalog = (id: string) => {
    if (!id) { setRows(null); return; }
    setLoading(true);
    setSaved(false);
    adminApi.supplierCatalog(id)
      .then(r => { setRows(r.items); setError(null); })
      .catch(e => setError((e as Error).message))
      .finally(() => setLoading(false));
  };

  // Reload when the provider changes or the catalogue was edited.
  useEffect(() => { loadCatalog(phpId); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [phpId, catalogVersion]);

  const setRow = (catalogExtraId: string, patch: Partial<SupplierCatalogRow>) =>
    setRows(rs => rs ? rs.map(r => r.catalogExtraId === catalogExtraId ? { ...r, ...patch } : r) : rs);

  const onSave = async () => {
    if (!rows) return;
    setSaving(true);
    setError(null);
    try {
      await adminApi.saveSupplierCatalog(phpId, rows.map(r => ({
        catalogExtraId: r.catalogExtraId,
        assigned: r.assigned,
        price: Number(r.price) || 0,
      })));
      setSaved(true);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const groups: Kind[] = ['general', 'child_seat'];

  return (
    <section className="rounded-2xl border border-ink-100 bg-white p-4 shadow-soft">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-sm font-bold text-ink-900">Assign to a provider</h2>
          <p className="text-[11px] text-ink-500">Tick what this provider offers and set their price. Customers only see ticked items.</p>
        </div>
        <select
          value={phpId}
          onChange={e => setPhpId(e.target.value)}
          className="rounded-xl border border-ink-200 bg-white px-3 py-2 text-sm font-medium text-ink-900 outline-none focus:border-brand-500">
          <option value="">{suppliers === null ? 'Loading providers…' : 'Select a provider…'}</option>
          {(suppliers ?? []).map(s => (
            <option key={s.partnerPhpId} value={s.partnerPhpId}>{supplierLabel(s)}</option>
          ))}
        </select>
      </div>

      {error ? (
        <div className="mt-3 inline-flex w-full items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
          <AlertCircle className="h-3.5 w-3.5 mt-0.5" /> {error}
        </div>
      ) : null}

      {!phpId ? (
        <p className="mt-4 rounded-xl border border-dashed border-ink-200 px-3 py-6 text-center text-xs text-ink-500">
          Pick a provider above to manage their extras &amp; child seats.
        </p>
      ) : loading ? (
        <p className="mt-4 inline-flex items-center gap-2 text-xs text-ink-500"><Loader2 className="h-3 w-3 animate-spin" /> Loading…</p>
      ) : rows && rows.length === 0 ? (
        <p className="mt-4 rounded-xl border border-dashed border-ink-200 px-3 py-6 text-center text-xs text-ink-500">
          The catalogue is empty. Add items above first.
        </p>
      ) : rows ? (
        <div className="mt-4 space-y-4">
          {groups.map(kind => {
            const list = rows.filter(r => r.kind === kind);
            if (list.length === 0) return null;
            return (
              <div key={kind}>
                <h3 className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-ink-500">
                  {kind === 'child_seat' ? <Baby className="h-3 w-3" /> : <Package className="h-3 w-3" />}
                  {KIND_LABEL[kind]}
                </h3>
                <ul className="mt-1 space-y-1.5">
                  {list.map(r => (
                    <li key={r.catalogExtraId}
                      className={`flex items-center justify-between gap-3 rounded-lg border px-3 py-2 text-xs ${r.assigned ? 'border-brand-200 bg-brand-50/30' : 'border-ink-100 bg-white'}`}>
                      <label className="flex min-w-0 flex-1 items-center gap-2">
                        <input
                          type="checkbox"
                          checked={r.assigned}
                          onChange={e => { setRow(r.catalogExtraId, { assigned: e.target.checked }); setSaved(false); }}
                          className="h-4 w-4 rounded border-ink-300" />
                        <span className="min-w-0">
                          <span className="truncate font-bold text-ink-900">{r.name}</span>
                          {r.description ? <span className="block truncate text-[10px] text-ink-500">{r.description}</span> : null}
                        </span>
                      </label>
                      <div className="flex items-center gap-1.5">
                        <input
                          type="number" step="0.01" min={0}
                          value={r.price}
                          disabled={!r.assigned}
                          onChange={e => { setRow(r.catalogExtraId, { price: Number(e.target.value) }); setSaved(false); }}
                          className="w-20 rounded border border-ink-200 px-2 py-1 text-right text-xs outline-none focus:border-brand-500 disabled:bg-ink-50 disabled:text-ink-400" />
                        <span className="w-9 text-[10px] font-bold text-ink-500">{r.currency}</span>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}

          <div className="flex items-center gap-3 pt-1">
            <button
              type="button"
              onClick={onSave}
              disabled={saving}
              className="inline-flex items-center gap-1.5 rounded-xl bg-brand-600 px-4 py-2 text-xs font-bold text-white hover:bg-brand-700 disabled:opacity-50">
              {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
              Save changes
            </button>
            {saved ? (
              <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600">
                <CheckCircle2 className="h-4 w-4" /> Saved
              </span>
            ) : null}
          </div>
        </div>
      ) : null}
    </section>
  );
};
