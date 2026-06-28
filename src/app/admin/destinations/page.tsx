'use client';

// Admin destination editor — index. Lists every DestinationContent
// row with status pill and a deep link to the editor at
// /admin/destinations/[id]. Header CTA goes to /new for fresh
// rows.

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Loader2, Plus, AlertCircle, MapPin, ExternalLink, Sparkles, Wand2 } from 'lucide-react';
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
  const [seeding, setSeeding] = useState(false);
  const [seedMsg, setSeedMsg] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [genMsg, setGenMsg] = useState<string | null>(null);
  const [coverage, setCoverage] = useState<{ polygons: number; withContent: number; gap: number } | null>(null);

  const reload = () => {
    setLoading(true);
    return Promise.all([
      adminApi.destinations().then(r => setRows(r.destinations)),
      adminApi.destinationsCoverage().then(setCoverage).catch(() => setCoverage(null)),
    ])
      .then(() => setLoading(false))
      .catch(err => { setError((err as Error).message); setLoading(false); });
  };

  useEffect(() => { void reload(); }, []);

  const onGenerate = async () => {
    if (!confirm('Generate AI content for up to the next batch of polygons that don’t have content yet? Output is published immediately.')) return;
    setGenerating(true);
    setError(null);
    setGenMsg(null);
    try {
      const r = await adminApi.generateDestinations();
      setGenMsg(`Generated ${r.generated} · failed ${r.failed} · skipped ${r.skipped} · ${(r.durationMs / 1000).toFixed(0)}s`);
      await reload();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setGenerating(false);
    }
  };

  const onSeed = async () => {
    if (!confirm('Apply the bundled launch seed? This upserts every entry in src/destinationData.ts (currently Sharm el-Sheikh) as a published row.')) return;
    setSeeding(true);
    setError(null);
    setSeedMsg(null);
    try {
      const r = await adminApi.seedDestinations();
      setSeedMsg(`Seeded ${r.upserted} destination${r.upserted === 1 ? '' : 's'}: ${r.slugs.join(', ')}`);
      await reload();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSeeding(false);
    }
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tightest text-ink-900">Destinations</h1>
          <p className="mt-1 text-sm text-ink-500">
            Rich landing-page content per city. Drafts stay invisible until you publish.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onGenerate}
            disabled={generating}
            className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2 text-sm font-bold text-white hover:bg-violet-700 disabled:opacity-50">
            {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />}
            Generate AI batch
          </button>
          <button
            type="button"
            onClick={onSeed}
            disabled={seeding}
            className="inline-flex items-center gap-2 rounded-xl bg-ink-100 px-4 py-2 text-sm font-bold text-ink-800 hover:bg-ink-200 disabled:opacity-50">
            {seeding ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            Apply launch seed
          </button>
          <Link
            href="/admin/destinations/new"
            className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-4 py-2 text-sm font-bold text-white hover:bg-brand-700">
            <Plus className="h-4 w-4" />
            New destination
          </Link>
        </div>
      </header>

      {error ? (
        <div className="inline-flex w-full items-start gap-2 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <AlertCircle className="h-4 w-4 mt-0.5" />
          {error}
        </div>
      ) : null}
      {seedMsg ? (
        <div className="inline-flex w-full items-start gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          <Sparkles className="h-4 w-4 mt-0.5" />
          {seedMsg}
        </div>
      ) : null}
      {genMsg ? (
        <div className="inline-flex w-full items-start gap-2 rounded-2xl border border-violet-200 bg-violet-50 px-4 py-3 text-sm text-violet-700">
          <Wand2 className="h-4 w-4 mt-0.5" />
          {genMsg}
        </div>
      ) : null}

      {coverage ? (
        <div className="rounded-2xl border border-ink-100 bg-white p-5 shadow-soft">
          <div className="flex items-baseline justify-between gap-3">
            <h2 className="text-sm font-bold uppercase tracking-wider text-ink-700">Coverage</h2>
            <span className="font-mono text-sm text-ink-500">
              {coverage.withContent} / {coverage.polygons}
            </span>
          </div>
          <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-ink-100">
            <div
              className="h-full bg-gradient-to-r from-brand-500 to-violet-500 transition-all"
              style={{ width: `${coverage.polygons === 0 ? 0 : Math.min(100, (coverage.withContent / coverage.polygons) * 100)}%` }}
            />
          </div>
          <p className="mt-2 text-xs text-ink-500">
            {coverage.gap === 0
              ? 'Every active polygon has destination content.'
              : `${coverage.gap} polygon${coverage.gap === 1 ? '' : 's'} still on the template fallback. Hit "Generate AI batch" to fill some.`}
          </p>
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
