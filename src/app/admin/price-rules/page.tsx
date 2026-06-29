'use client';

// Admin price-rules cross-supplier list.
// Paginated, searchable, with CSV import / export + sample download.

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import {
  Loader2, AlertCircle, Plus, Search, ListTree, Upload, Download,
  FileText, CheckCircle2, PauseCircle, Pencil,
} from 'lucide-react';
import { adminApi, adminSession, type AdminPriceRule } from '@/lib/admin-api';
import { Pagination } from '@/components/Pagination';
import { AdminShell } from '../AdminShell';

const PAGE_SIZE = 25;

export default function PriceRulesAdminPage() {
  return (
    <AdminShell>
      <RulesScreen />
    </AdminShell>
  );
}

const RulesScreen: React.FC = () => {
  const [rules, setRules] = useState<AdminPriceRule[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [scope, setScope] = useState<'all' | 'active' | 'paused'>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement | null>(null);
  const [uploading, setUploading] = useState(false);
  const [importResult, setImportResult] = useState<{ created: number; updated: number; errors: number } | null>(null);

  // Debounce search.
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => { setPage(1); }, [debouncedSearch, scope]);

  const reload = () => {
    setLoading(true);
    return adminApi.priceRules({
      search: debouncedSearch || undefined,
      active: scope === 'all' ? undefined : (scope === 'active' ? 'true' : 'false'),
      page,
      pageSize: PAGE_SIZE,
    })
      .then(r => { setRules(r.rules); setTotal(r.total); setError(null); })
      .catch(err => setError((err as Error).message))
      .finally(() => setLoading(false));
  };
  useEffect(() => { void reload(); }, [debouncedSearch, scope, page]);

  const onUpload = async (file: File) => {
    setUploading(true);
    setError(null);
    setImportResult(null);
    try {
      const r = await adminApi.importPriceRules(file);
      setImportResult({ created: r.created, updated: r.updated, errors: r.errors.length });
      await reload();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  // Inject the admin Bearer into the export URL so the browser
  // download tab can hit the auth-gated endpoint.
  const exportHref = useMemo(() => {
    const token = adminSession.token;
    return token
      ? `${adminApi.priceRulesExportUrl()}?_t=${token}`        // placeholder, see onExport
      : adminApi.priceRulesExportUrl();
  }, []);

  // CSV downloads need the Bearer header, which a plain <a download>
  // can't set. Fetch the file ourselves and trigger a blob save.
  const triggerDownload = async (url: string, filename: string) => {
    const token = adminSession.token;
    try {
      const res = await fetch(url, { headers: token ? { Authorization: `Bearer ${token}` } : undefined });
      if (!res.ok) throw new Error(`Download failed (${res.status})`);
      const blob = await res.blob();
      const link = document.createElement('a');
      const objUrl = URL.createObjectURL(blob);
      link.href = objUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(objUrl);
    } catch (err) {
      setError((err as Error).message);
    }
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tightest text-ink-900">Price rules</h1>
          <p className="mt-1 text-sm text-ink-500">
            Every supplier's hourly price rules in one place. Create rules on behalf of a supplier,
            or bulk-edit via CSV.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => triggerDownload(adminApi.priceRulesSampleUrl(), 'price-rules-sample.csv')}
            className="inline-flex items-center gap-1.5 rounded-xl bg-ink-50 px-3 py-2 text-xs font-bold text-ink-700 hover:bg-ink-100">
            <FileText className="h-3.5 w-3.5" />
            Sample CSV
          </button>
          <button
            type="button"
            onClick={() => triggerDownload(adminApi.priceRulesExportUrl(), `price-rules-${new Date().toISOString().slice(0, 10)}.csv`)}
            className="inline-flex items-center gap-1.5 rounded-xl bg-ink-100 px-3 py-2 text-xs font-bold text-ink-800 hover:bg-ink-200">
            <Download className="h-3.5 w-3.5" />
            Export CSV
          </button>
          <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl bg-violet-600 px-3 py-2 text-xs font-bold text-white hover:bg-violet-700 disabled:opacity-50">
            {uploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
            Import CSV
            <input
              ref={fileRef}
              type="file"
              accept=".csv,text/csv"
              className="hidden"
              disabled={uploading}
              onChange={e => {
                const f = e.target.files?.[0];
                if (f) void onUpload(f);
              }}
            />
          </label>
          <Link
            href="/admin/price-rules/new"
            className="inline-flex items-center gap-1.5 rounded-xl bg-brand-600 px-3 py-2 text-xs font-bold text-white hover:bg-brand-700">
            <Plus className="h-3.5 w-3.5" />
            New rule
          </Link>
        </div>
      </header>

      <div className="flex flex-wrap items-center gap-3">
        <label className="flex flex-1 items-center gap-2 rounded-2xl border border-ink-200 bg-white px-4 py-2.5 focus-within:border-brand-500">
          <Search className="h-4 w-4 text-ink-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by rule name or supplier PHP id"
            className="w-full bg-transparent text-sm outline-none"
          />
        </label>
        <div className="flex gap-1 rounded-full bg-ink-100 p-1">
          {(['all', 'active', 'paused'] as const).map(s => (
            <button
              key={s}
              onClick={() => setScope(s)}
              className={`whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-semibold capitalize ${scope === s ? 'bg-white text-ink-900 shadow-sm' : 'text-ink-600 hover:text-ink-900'}`}>
              {s}
            </button>
          ))}
        </div>
      </div>

      {importResult ? (
        <div className="inline-flex w-full items-start gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          <CheckCircle2 className="h-4 w-4 mt-0.5" />
          Imported · created {importResult.created} · updated {importResult.updated}
          {importResult.errors > 0 ? <> · {importResult.errors} errors (see network response)</> : null}
        </div>
      ) : null}

      {error ? (
        <div className="inline-flex w-full items-start gap-2 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <AlertCircle className="h-4 w-4 mt-0.5" />
          {error}
        </div>
      ) : null}

      {loading && rules.length === 0 ? (
        <div className="rounded-2xl border border-ink-100 bg-white p-12 text-center text-sm text-ink-500">
          <Loader2 className="mx-auto h-6 w-6 animate-spin" />
          <p className="mt-3">Loading rules…</p>
        </div>
      ) : rules.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-ink-200 bg-white p-12 text-center">
          <ListTree className="mx-auto h-8 w-8 text-ink-300" />
          <p className="mt-3 text-base font-semibold text-ink-700">No price rules match this filter.</p>
        </div>
      ) : (
        <>
          <p className="text-xs text-ink-500">
            Showing {rules.length} of {total} rules.
          </p>
          <ul className="divide-y divide-ink-100 rounded-2xl border border-ink-100 bg-white shadow-soft">
            {rules.map(r => <RuleRow key={r.id} rule={r} />)}
          </ul>
          <Pagination
            page={page}
            pageSize={PAGE_SIZE}
            total={total}
            onChange={setPage}
          />
        </>
      )}

      {/* Inline help: how the CSV format works. */}
      <details className="rounded-2xl border border-ink-100 bg-white p-5 shadow-soft">
        <summary className="cursor-pointer text-sm font-bold text-ink-900">CSV format reference</summary>
        <div className="mt-3 space-y-3 text-xs text-ink-700">
          <p>
            One row per <strong>(rule × vehicle class)</strong>. Multiple rows with the same
            <code className="mx-1 rounded bg-ink-50 px-1 font-mono">rule_id</code> (or matching
            <code className="mx-1 rounded bg-ink-50 px-1 font-mono">partner_php_id + rule_name</code>) collapse into one rule
            with multiple class prices.
          </p>
          <ul className="list-disc space-y-1 pl-5">
            <li><strong>rule_id</strong> — empty to create new; existing UUID to update in place.</li>
            <li><strong>partner_php_id</strong> — required. The PHP polygon-provider id this rule belongs to.</li>
            <li><strong>polygons_pipe</strong> — pipe-separated polygon IDs (e.g. <code className="font-mono">2681|3786|3783</code>).</li>
            <li><strong>vehicle_class</strong> — slug from the live catalog (<code className="font-mono">economy-sedan</code>, etc.).</li>
            <li><strong>active</strong> — <code className="font-mono">true</code> or <code className="font-mono">false</code>.</li>
            <li><strong>valid_from / valid_to</strong> — ISO timestamps, optional.</li>
          </ul>
          <p>
            Click <strong>Sample CSV</strong> above for a ready-to-edit template.
          </p>
        </div>
      </details>
    </div>
  );
};

const RuleRow: React.FC<{ rule: AdminPriceRule }> = ({ rule }) => {
  const cheapest = rule.prices.length ? Math.min(...rule.prices.map(p => p.hourlyRate)) : 0;
  return (
    <li>
      <Link
        href={`/admin/price-rules/${rule.id}`}
        className="grid grid-cols-1 items-center gap-2 px-4 py-3 transition hover:bg-ink-50/60 lg:grid-cols-[1fr_auto_auto_auto_auto_24px] lg:gap-4">
        <div className="min-w-0">
          <p className="flex items-center gap-2 text-sm font-bold text-ink-900">
            <span className="truncate">{rule.name ?? `Rule ${rule.id.slice(0, 8)}`}</span>
            {rule.active ? null : (
              <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-700">
                Paused
              </span>
            )}
          </p>
          <p className="mt-0.5 truncate text-[11px] text-ink-500">
            <span className="font-mono">supplier #{rule.partnerPhpId}</span>
            {' · '}
            <span className="font-mono uppercase">{rule.currency}</span>
            {' · '}
            {rule.polygonPhpIds.length} polygons
            {' · '}
            {rule.prices.length} classes
          </p>
        </div>
        <span className="w-28 text-right text-xs text-ink-600">
          margin <strong>{rule.marginHours}h</strong>
        </span>
        <span className="w-28 text-right text-xs text-ink-600">
          {rule.minHours}–{rule.maxHours} h
        </span>
        <span className="w-28 text-right text-xs text-ink-600">
          from <strong className="text-ink-900">{cheapest.toFixed(2)} {rule.currency}</strong> /h
        </span>
        <span className="inline-flex w-20 items-center justify-end gap-1 text-xs font-semibold">
          {rule.active ? (
            <>
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
              <span className="text-emerald-700">Active</span>
            </>
          ) : (
            <>
              <PauseCircle className="h-3.5 w-3.5 text-amber-600" />
              <span className="text-amber-700">Paused</span>
            </>
          )}
        </span>
        <Pencil className="hidden h-4 w-4 text-ink-400 lg:block" />
      </Link>
    </li>
  );
};
