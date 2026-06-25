'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Loader2, RefreshCcw, AlertCircle } from 'lucide-react';
import { adminApi, type AdminAuditEntry } from '@/lib/admin-api';
import { AdminShell } from '../AdminShell';

export default function AuditLogPage() {
  return (
    <AdminShell>
      <Feed />
    </AdminShell>
  );
}

const Feed: React.FC = () => {
  const [entries, setEntries] = useState<AdminAuditEntry[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    adminApi.auditLog(100)
      .then(r => setEntries(r.entries))
      .catch((e: Error) => setError(e.message));
  }, [tick]);

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tighter">Audit log</h1>
          <p className="mt-1 text-sm text-ink-500">Last 100 booking state changes across the platform.</p>
        </div>
        <button onClick={() => setTick(t => t + 1)} className="inline-flex items-center gap-1.5 rounded-2xl border border-ink-200 bg-white px-4 py-2 text-sm font-semibold text-ink-700 hover:text-ink-900">
          <RefreshCcw className="h-4 w-4" /> Refresh
        </button>
      </div>

      {error ? (
        <div className="mt-6 inline-flex items-center gap-2 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <AlertCircle className="h-4 w-4" /> {error}
        </div>
      ) : null}

      {!entries ? (
        <div className="mt-6 inline-flex items-center gap-2 text-sm text-ink-500">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading…
        </div>
      ) : entries.length === 0 ? (
        <div className="mt-6 rounded-3xl border border-dashed border-ink-200 bg-ink-50/40 p-8 text-center text-sm text-ink-600">
          No entries yet.
        </div>
      ) : (
        <ul className="mt-6 divide-y divide-ink-100 rounded-3xl border border-ink-100 bg-white shadow-soft">
          {entries.map(a => (
            <li key={a.id} className="px-5 py-4">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <div>
                  <span className="font-semibold text-ink-900">{a.action}</span>
                  {a.fromStatus && a.toStatus ? <span className="text-xs text-ink-500"> · {a.fromStatus} → {a.toStatus}</span> : null}
                </div>
                <span className="text-[10px] font-mono text-ink-500">{new Date(a.createdAt).toLocaleString()}</span>
              </div>
              <p className="mt-1 text-xs text-ink-500">
                by <span className="font-mono">{a.actor}</span> ·{' '}
                <Link href={`/admin/bookings/${a.bookingId}`} className="font-mono text-brand-600 hover:text-brand-700">{a.bookingId}</Link>
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};
