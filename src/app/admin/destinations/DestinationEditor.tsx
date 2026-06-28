'use client';

// Shared editor for /admin/destinations/new and /admin/destinations/[id].
// Repeatable form for attractions / tips / FAQs — drag-to-reorder is
// deliberately out of scope (the array order is the render order).

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft, Save, Loader2, Plus, X, AlertCircle, CheckCircle2,
  Trash2, Eye, EyeOff,
} from 'lucide-react';
import {
  adminApi,
  type AdminDestinationContent,
  type AdminDestinationContentInput,
  type AdminAttraction,
  type AdminTip,
  type AdminFaq,
} from '@/lib/admin-api';

interface Props {
  mode: 'create' | 'edit';
  initial?: AdminDestinationContent;
}

export const DestinationEditor: React.FC<Props> = ({ mode, initial }) => {
  const router = useRouter();
  const [polygonPhpId, setPolygonPhpId] = useState(initial?.polygonPhpId ?? '');
  const [countryCode, setCountryCode] = useState(initial?.countryCode ?? '');
  const [citySlug, setCitySlug] = useState(initial?.citySlug ?? '');
  const [title, setTitle] = useState(initial?.title ?? '');
  const [metaDescription, setMetaDescription] = useState(initial?.metaDescription ?? '');
  const [heroPhotoUrl, setHeroPhotoUrl] = useState(initial?.heroPhotoUrl ?? '');
  const [intro, setIntro] = useState(initial?.intro ?? '');
  const [attractions, setAttractions] = useState<AdminAttraction[]>(initial?.attractions ?? []);
  const [tips, setTips] = useState<AdminTip[]>(initial?.tips ?? []);
  const [faqs, setFaqs] = useState<AdminFaq[]>(initial?.faqs ?? []);
  const [status, setStatus] = useState<'draft' | 'published'>(initial?.status ?? 'draft');

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const onSave = async (publish?: boolean) => {
    setBusy(true);
    setError(null);
    setSuccess(false);
    const nextStatus = publish === undefined ? status : publish ? 'published' : 'draft';
    const payload: AdminDestinationContentInput = {
      polygonPhpId: polygonPhpId.trim(),
      countryCode: countryCode.trim().toUpperCase(),
      citySlug: citySlug.trim().toLowerCase(),
      title: title.trim() || null,
      metaDescription: metaDescription.trim() || null,
      heroPhotoUrl: heroPhotoUrl.trim() || null,
      intro: intro.trim() || null,
      attractions,
      tips,
      faqs,
      status: nextStatus,
    };
    try {
      if (mode === 'create') {
        const r = await adminApi.createDestination(payload);
        router.push(`/admin/destinations/${r.id}`);
      } else if (initial) {
        await adminApi.updateDestination(initial.id, payload);
        setStatus(nextStatus);
        setSuccess(true);
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const onDelete = async () => {
    if (!initial) return;
    if (!confirm(`Delete content for ${initial.citySlug}? This can't be undone.`)) return;
    setBusy(true);
    try {
      await adminApi.deleteDestination(initial.id);
      router.push('/admin/destinations');
    } catch (err) {
      setError((err as Error).message);
      setBusy(false);
    }
  };

  return (
    <div className="space-y-6">
      <header className="space-y-3">
        <Link href="/admin/destinations" className="inline-flex items-center gap-1.5 text-xs font-semibold text-ink-500 hover:text-ink-800">
          <ArrowLeft className="h-3.5 w-3.5" />
          All destinations
        </Link>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tightest text-ink-900">
              {mode === 'create' ? 'New destination' : title || citySlug.replace(/-/g, ' ')}
            </h1>
            <p className="mt-1 text-sm text-ink-500">
              {mode === 'create'
                ? 'Add the rich content for a city. Defaults to draft — won’t show on the storefront until published.'
                : `Edit the content shown at /destinations/${countryCode.toLowerCase()}/${citySlug}.`}
            </p>
          </div>
          {initial ? (
            <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-wider ${
              status === 'published' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
            }`}>
              {status === 'published' ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
              {status}
            </span>
          ) : null}
        </div>
      </header>

      {/* ── Identity ──────────────────────────────────────── */}
      <Card title="1. Identity" subtitle="The polygon this content is for. Keep slug + ISO code aligned with the PHP polygon.">
        <div className="grid gap-3 sm:grid-cols-3">
          <Field label="PHP polygon ID">
            <input
              value={polygonPhpId}
              onChange={e => setPolygonPhpId(e.target.value)}
              required
              disabled={mode === 'edit'}
              placeholder="23"
              className="w-full bg-transparent text-base outline-none"
            />
          </Field>
          <Field label="Country (ISO-2)">
            <input
              value={countryCode}
              onChange={e => setCountryCode(e.target.value.toUpperCase())}
              required
              maxLength={2}
              placeholder="EG"
              className="w-full bg-transparent text-base outline-none uppercase"
            />
          </Field>
          <Field label="City slug (matches PHP)">
            <input
              value={citySlug}
              onChange={e => setCitySlug(e.target.value.toLowerCase())}
              required
              placeholder="sharm-el-sheikh"
              className="w-full bg-transparent text-base outline-none lowercase"
            />
          </Field>
        </div>
      </Card>

      {/* ── Page meta ─────────────────────────────────────── */}
      <Card title="2. Hero + meta" subtitle="Optional. When empty the page falls back to the auto-template.">
        <div className="space-y-3">
          <Field label="Title (overrides default h1)">
            <input
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="Hourly chauffeur in Sharm El Sheikh"
              className="w-full bg-transparent text-base outline-none"
            />
          </Field>
          <Field label="Meta description">
            <textarea
              value={metaDescription}
              onChange={e => setMetaDescription(e.target.value)}
              rows={2}
              maxLength={320}
              placeholder="Shown in Google SERP. 1-2 sentences, includes the destination name."
              className="w-full resize-none bg-transparent text-base outline-none"
            />
          </Field>
          <Field label="Hero photo URL">
            <input
              type="url"
              value={heroPhotoUrl}
              onChange={e => setHeroPhotoUrl(e.target.value)}
              placeholder="https://images.unsplash.com/photo-XXXX?w=2400"
              className="w-full bg-transparent text-base outline-none"
            />
          </Field>
        </div>
      </Card>

      {/* ── Intro ─────────────────────────────────────────── */}
      <Card title="3. Intro" subtitle="2-3 paragraphs. Separate paragraphs with a blank line.">
        <Field label="Intro body (plain text + blank lines)">
          <textarea
            value={intro}
            onChange={e => setIntro(e.target.value)}
            rows={8}
            placeholder="Why hourly works well in this city…"
            className="w-full resize-none bg-transparent text-base outline-none"
          />
        </Field>
      </Card>

      {/* ── Attractions ───────────────────────────────────── */}
      <Card title="4. Attractions" subtitle="Things to do that pair well with an hourly rental.">
        <RepeatableList
          items={attractions}
          onChange={setAttractions}
          empty={{ name: '', blurb: '', durationMin: null, photoUrl: null }}
          renderItem={(a, set) => (
            <>
              <Field label="Name"><input value={a.name} onChange={e => set({ ...a, name: e.target.value })} className="w-full bg-transparent outline-none" /></Field>
              <Field label="Blurb"><textarea value={a.blurb} onChange={e => set({ ...a, blurb: e.target.value })} rows={3} className="w-full resize-none bg-transparent outline-none" /></Field>
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Duration (minutes, optional)">
                  <input
                    type="number" min={0} step={30}
                    value={a.durationMin ?? ''}
                    onChange={e => set({ ...a, durationMin: e.target.value ? Number(e.target.value) : null })}
                    className="w-full bg-transparent outline-none" />
                </Field>
                <Field label="Photo URL (optional)">
                  <input
                    type="url"
                    value={a.photoUrl ?? ''}
                    onChange={e => set({ ...a, photoUrl: e.target.value || null })}
                    className="w-full bg-transparent outline-none" />
                </Field>
              </div>
            </>
          )}
        />
      </Card>

      {/* ── Tips ──────────────────────────────────────────── */}
      <Card title="5. Local tips" subtitle="Practical advice for renting an hourly chauffeur in this city.">
        <RepeatableList
          items={tips}
          onChange={setTips}
          empty={{ title: '', body: '' }}
          renderItem={(t, set) => (
            <>
              <Field label="Title"><input value={t.title} onChange={e => set({ ...t, title: e.target.value })} className="w-full bg-transparent outline-none" /></Field>
              <Field label="Body"><textarea value={t.body} onChange={e => set({ ...t, body: e.target.value })} rows={3} className="w-full resize-none bg-transparent outline-none" /></Field>
            </>
          )}
        />
      </Card>

      {/* ── FAQs ──────────────────────────────────────────── */}
      <Card title="6. Local FAQ" subtitle="Questions specific to this destination.">
        <RepeatableList
          items={faqs}
          onChange={setFaqs}
          empty={{ question: '', answer: '' }}
          renderItem={(q, set) => (
            <>
              <Field label="Question"><input value={q.question} onChange={e => set({ ...q, question: e.target.value })} className="w-full bg-transparent outline-none" /></Field>
              <Field label="Answer"><textarea value={q.answer} onChange={e => set({ ...q, answer: e.target.value })} rows={3} className="w-full resize-none bg-transparent outline-none" /></Field>
            </>
          )}
        />
      </Card>

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

      {/* ── Actions ───────────────────────────────────────── */}
      <div className="sticky bottom-4 z-10 flex flex-wrap items-center justify-end gap-2 rounded-2xl border border-ink-100 bg-white p-3 shadow-soft">
        {mode === 'edit' ? (
          <button
            type="button"
            onClick={onDelete}
            disabled={busy}
            className="mr-auto inline-flex items-center gap-1.5 rounded-xl bg-red-50 px-3 py-2 text-xs font-bold text-red-700 hover:bg-red-100 disabled:opacity-50">
            <Trash2 className="h-3.5 w-3.5" />
            Delete
          </button>
        ) : null}
        <button
          type="button"
          onClick={() => onSave(false)}
          disabled={busy}
          className="inline-flex items-center gap-1.5 rounded-xl bg-ink-100 px-4 py-2 text-sm font-bold text-ink-800 hover:bg-ink-200 disabled:opacity-50">
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Save as draft
        </button>
        <button
          type="button"
          onClick={() => onSave(true)}
          disabled={busy}
          className="inline-flex items-center gap-1.5 rounded-xl bg-brand-600 px-4 py-2 text-sm font-bold text-white hover:bg-brand-700 disabled:opacity-50">
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Eye className="h-4 w-4" />}
          {status === 'published' ? 'Save & keep published' : 'Save & publish'}
        </button>
      </div>
    </div>
  );
};

interface RepeatableProps<T> {
  items: T[];
  onChange: (next: T[]) => void;
  empty: T;
  renderItem: (item: T, set: (next: T) => void) => React.ReactNode;
}

function RepeatableList<T>({ items, onChange, empty, renderItem }: RepeatableProps<T>) {
  const update = (idx: number, next: T) => {
    const copy = [...items];
    copy[idx] = next;
    onChange(copy);
  };
  const remove = (idx: number) => onChange(items.filter((_, i) => i !== idx));
  const add = () => onChange([...items, { ...empty }]);

  return (
    <div className="space-y-3">
      {items.map((it, idx) => (
        <div key={idx} className="relative space-y-3 rounded-2xl border border-ink-100 bg-ink-50/40 p-4">
          <button
            type="button"
            onClick={() => remove(idx)}
            className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full bg-white px-2 py-1 text-[10px] font-bold text-ink-500 hover:bg-red-50 hover:text-red-700">
            <X className="h-3 w-3" />
            Remove
          </button>
          {renderItem(it, next => update(idx, next))}
        </div>
      ))}
      <button
        type="button"
        onClick={add}
        className="inline-flex items-center gap-1.5 rounded-xl bg-ink-100 px-3 py-2 text-xs font-bold text-ink-700 hover:bg-ink-200">
        <Plus className="h-3.5 w-3.5" />
        Add row
      </button>
    </div>
  );
}

const Card: React.FC<{ title: string; subtitle?: string; children: React.ReactNode }> = ({ title, subtitle, children }) => (
  <section className="space-y-4 rounded-3xl border border-ink-100 bg-white p-6 shadow-soft">
    <div>
      <h2 className="text-lg font-bold text-ink-900">{title}</h2>
      {subtitle ? <p className="mt-0.5 text-xs text-ink-500">{subtitle}</p> : null}
    </div>
    {children}
  </section>
);

const Field: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <label className="block rounded-2xl border border-ink-200 bg-white px-4 py-3 focus-within:border-brand-500">
    <span className="text-[10px] font-bold uppercase tracking-wider text-ink-500">{label}</span>
    <div className="mt-1">{children}</div>
  </label>
);
