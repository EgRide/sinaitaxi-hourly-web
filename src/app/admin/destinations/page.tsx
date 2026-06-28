'use client';

// Admin destination editor — index. Lists every DestinationContent
// row with status pill and a deep link to the editor at
// /admin/destinations/[id]. Header CTA goes to /new for fresh
// rows.

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Loader2, Plus, AlertCircle, MapPin, ExternalLink } from 'lucide-react';
import { adminApi, type AdminDestinationContent } from '@/lib/admin-api';
import { AdminShell } from '../AdminShell';

export default function DestinationsAdminPage() {
  return (
    <AdminShell>
      <DestinationsList />
    </AdminShell>
  );
}

const DestinationsList: React.FC = () => {
  const [rows, setRows] = useState<AdminDestinationContent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    adminApi.destinations()
      .then(r => { setRows(r.destinations); setLoading(false); })
      .catch(err => { setError((err as Error).message); setLoading(false); });
  }, []);

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tightest text-ink-900">Destinations</h1>
          <p className="mt-1 text-sm text-ink-500">
            Rich landing-page content per city. Drafts stay invisible until you publish.
          </p>
        </div>
        <Link
          href="/admin/destinations/new"
          className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-4 py-2 text-sm font-bold text-white hover:bg-brand-700">
          <Plus className="h-4 w-4" />
          New destination
        </Link>
      </header>

      {error ? (
        <div className="inline-flex w-full items-start gap-2 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <AlertCircle className="h-4 w-4 mt-0.5" />
          {error}
        </div>
      ) : null}

      {loading ? (
        <div className="rounded-2xl border border-ink-100 bg-white p-8 text-center text-sm text-ink-500">
          <Loader2 className="mx-auto h-5 w-5 animate-spin" />
          <p className="mt-3">Loading destinations…</p>
        </div>
      ) : rows.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-ink-200 bg-white p-12 text-center">
          <MapPin className="mx-auto h-8 w-8 text-ink-300" />
          <p className="mt-3 text-base font-semibold text-ink-700">No destination content yet</p>
          <p className="mt-1 text-sm text-ink-500">Use the button above to add your first city.</p>
        </div>
      ) : (
        <ul className="space-y-2">
          {rows.map(r => (
            <li key={r.id}>
              <Link
                href={`/admin/destinations/${r.id}`}
                className="flex flex-wrap items-center gap-4 rounded-2xl border border-ink-100 bg-white p-4 shadow-soft transition hover:border-brand-300 hover:shadow-glow">
                <div className="grid h-11 w-11 place-items-center rounded-xl bg-brand-50 text-brand-700">
                  <MapPin className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-baseline gap-2">
                    <h3 className="text-base font-bold text-ink-900">
                      {r.title ?? r.citySlug.replace(/-/g, ' ')}
                    </h3>
                    <span className="rounded-full bg-ink-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-ink-600">
                      {r.countryCode}
                    </span>
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                      r.status === 'published'
                        ? 'bg-emerald-50 text-emerald-700'
                        : 'bg-amber-50 text-amber-700'
                    }`}>
                      {r.status}
                    </span>
                    {r.source === 'ai_draft' ? (
                      <span className="rounded-full bg-violet-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-violet-700">
                        AI draft
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-0.5 text-xs text-ink-500">
                    /destinations/{r.countryCode.toLowerCase()}/{r.citySlug}
                    {' · '}
                    {r.attractions.length} attractions · {r.tips.length} tips · {r.faqs.length} FAQs
                  </p>
                </div>
                <a
                  href={`/destinations/${r.countryCode.toLowerCase()}/${r.citySlug}`}
                  target="_blank"
                  rel="noreferrer"
                  onClick={e => e.stopPropagation()}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-ink-500 hover:text-ink-800">
                  <ExternalLink className="h-3.5 w-3.5" />
                  View
                </a>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};
