'use client';

// Reusable dashboard primitives — KPI cards, sparklines, the
// revenue chart, leaderboard rows. Used by both /admin and
// /partner dashboards. Designed to render the same numbers
// identically regardless of which scope feeds them.

import { useMemo } from 'react';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  LineChart, Line, CartesianGrid,
} from 'recharts';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { cn } from '@/lib/cn';

// ── KPI card with sparkline + delta ─────────────────────────
interface KpiProps {
  label: string;
  icon: React.ReactNode;
  value: string;             // pre-formatted
  delta: { current: number; previous: number };
  series?: number[];          // optional sparkline values
  format?: (n: number) => string;
  tone?: 'brand' | 'emerald' | 'violet' | 'amber' | 'rose';
}

const TONE_BG: Record<NonNullable<KpiProps['tone']>, string> = {
  brand:   'bg-brand-50 text-brand-700',
  emerald: 'bg-emerald-50 text-emerald-700',
  violet:  'bg-violet-50 text-violet-700',
  amber:   'bg-amber-50 text-amber-700',
  rose:    'bg-rose-50 text-rose-700',
};
const TONE_STROKE: Record<NonNullable<KpiProps['tone']>, string> = {
  brand:   '#1E5EFF',
  emerald: '#059669',
  violet:  '#7C3AED',
  amber:   '#D97706',
  rose:    '#E11D48',
};

export const KpiCard: React.FC<KpiProps> = ({ label, icon, value, delta, series, tone = 'brand' }) => {
  const deltaPct = useMemo(() => {
    if (delta.previous === 0) {
      return delta.current === 0 ? 0 : Infinity;
    }
    return ((delta.current - delta.previous) / Math.abs(delta.previous)) * 100;
  }, [delta]);
  const sparkData = useMemo(
    () => series?.map((v, i) => ({ i, v })) ?? [],
    [series],
  );
  const trend: 'up' | 'down' | 'flat' = deltaPct > 0.5 ? 'up' : deltaPct < -0.5 ? 'down' : 'flat';

  return (
    <div className="relative overflow-hidden rounded-2xl border border-ink-100 bg-white p-5 shadow-soft">
      <div className="flex items-center justify-between">
        <div className={cn('grid h-9 w-9 place-items-center rounded-xl', TONE_BG[tone])}>
          {icon}
        </div>
        <DeltaPill trend={trend} pct={deltaPct} />
      </div>
      <p className="mt-3 text-[10px] font-bold uppercase tracking-wider text-ink-500">{label}</p>
      <p className="mt-0.5 truncate text-2xl font-extrabold tracking-tight text-ink-900">{value}</p>
      {sparkData.length > 1 ? (
        <div className="mt-3 h-10">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={sparkData} margin={{ top: 2, right: 2, bottom: 2, left: 2 }}>
              <defs>
                <linearGradient id={`spark-${tone}-${label}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={TONE_STROKE[tone]} stopOpacity={0.3} />
                  <stop offset="100%" stopColor={TONE_STROKE[tone]} stopOpacity={0} />
                </linearGradient>
              </defs>
              <Area
                type="monotone"
                dataKey="v"
                stroke={TONE_STROKE[tone]}
                strokeWidth={1.5}
                fill={`url(#spark-${tone}-${label})`}
                isAnimationActive={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      ) : null}
    </div>
  );
};

const DeltaPill: React.FC<{ trend: 'up' | 'down' | 'flat'; pct: number }> = ({ trend, pct }) => {
  const Icon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus;
  const cls = trend === 'up'
    ? 'bg-emerald-50 text-emerald-700'
    : trend === 'down'
    ? 'bg-rose-50 text-rose-700'
    : 'bg-ink-100 text-ink-600';
  const label = !Number.isFinite(pct)
    ? '— %'
    : pct === 0
    ? '0%'
    : `${pct > 0 ? '+' : ''}${pct.toFixed(0)}%`;
  return (
    <span className={cn('inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold', cls)}>
      <Icon className="h-3 w-3" />
      {label}
    </span>
  );
};

// ── Period selector chip ────────────────────────────────────
export const PeriodChips: React.FC<{
  options: { id: string; label: string; days: number }[];
  value: number;
  onChange: (days: number) => void;
}> = ({ options, value, onChange }) => (
  <div className="inline-flex gap-1 rounded-full bg-ink-100 p-1">
    {options.map(o => (
      <button
        key={o.id}
        onClick={() => onChange(o.days)}
        className={cn(
          'whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-semibold',
          value === o.days ? 'bg-white text-ink-900 shadow-sm' : 'text-ink-600 hover:text-ink-900',
        )}>
        {o.label}
      </button>
    ))}
  </div>
);

// ── Revenue + bookings dual-axis chart ──────────────────────
export const RevenueChart: React.FC<{
  data: { date: string; revenue: number; bookings: number }[];
  height?: number;
  currency?: string;
}> = ({ data, height = 280, currency = '' }) => {
  const formatted = useMemo(
    () =>
      data.map(d => ({
        date: d.date,
        label: new Date(d.date).toLocaleDateString('en', { month: 'short', day: 'numeric' }),
        revenue: d.revenue,
        bookings: d.bookings,
      })),
    [data],
  );
  return (
    <div className="rounded-3xl border border-ink-100 bg-white p-6 shadow-soft">
      <div className="mb-4 flex items-baseline justify-between gap-2">
        <h3 className="text-base font-bold text-ink-900">Revenue &amp; bookings</h3>
        <p className="text-xs text-ink-500">Daily totals across the selected window</p>
      </div>
      <div style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={formatted} margin={{ top: 10, right: 20, bottom: 0, left: -10 }}>
            <CartesianGrid stroke="#F1F5F9" vertical={false} />
            <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
            <YAxis yAxisId="rev" tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false}
                   tickFormatter={(n: number) => n >= 1000 ? `${(n / 1000).toFixed(1)}k` : n.toString()} />
            <YAxis yAxisId="bkg" orientation="right" tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
            <Tooltip
              formatter={(value, name) => {
                const n = Number(value) || 0;
                if (name === 'revenue') return [`${currency ? currency + ' ' : ''}${n.toFixed(2)}`, 'Revenue'];
                return [n, 'Bookings'];
              }}
              labelStyle={{ fontSize: 12, fontWeight: 700 }}
              contentStyle={{ borderRadius: 12, border: '1px solid #E2E8F0', fontSize: 12 }}
            />
            <Line yAxisId="rev" type="monotone" dataKey="revenue"
                  stroke="#1E5EFF" strokeWidth={2.5} dot={false} isAnimationActive={false} />
            <Line yAxisId="bkg" type="monotone" dataKey="bookings"
                  stroke="#7C3AED" strokeWidth={2} strokeDasharray="4 3" dot={false} isAnimationActive={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

// ── Leaderboard ─────────────────────────────────────────────
interface LeaderRow {
  key: string;
  label: string;
  sub?: string;
  bookings: number;
  revenue: number;
}
export const Leaderboard: React.FC<{
  title: string;
  rows: LeaderRow[];
  icon: React.ReactNode;
  currency?: string;
  emptyHint?: string;
}> = ({ title, rows, icon, currency = '', emptyHint = 'Nothing yet.' }) => {
  const maxRevenue = Math.max(1, ...rows.map(r => r.revenue));
  return (
    <div className="rounded-3xl border border-ink-100 bg-white p-6 shadow-soft">
      <div className="mb-4 flex items-center gap-2">
        <span className="grid h-7 w-7 place-items-center rounded-lg bg-brand-50 text-brand-700">{icon}</span>
        <h3 className="text-base font-bold text-ink-900">{title}</h3>
      </div>
      {rows.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-ink-200 px-4 py-6 text-center text-xs text-ink-500">
          {emptyHint}
        </p>
      ) : (
        <ul className="space-y-2">
          {rows.map((r, i) => (
            <li key={r.key} className="relative overflow-hidden rounded-2xl bg-ink-50/40 px-3 py-2.5">
              <div
                aria-hidden
                className="absolute inset-y-0 left-0 bg-brand-100/40"
                style={{ width: `${(r.revenue / maxRevenue) * 100}%` }}
              />
              <div className="relative flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-ink-900">
                    <span className="mr-1.5 text-ink-400">{i + 1}.</span>
                    {r.label}
                  </p>
                  {r.sub ? <p className="truncate text-[10px] text-ink-500">{r.sub}</p> : null}
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-ink-900">
                    {currency ? `${currency} ` : ''}{r.revenue.toLocaleString('en', { maximumFractionDigits: 0 })}
                  </p>
                  <p className="text-[10px] text-ink-500">{r.bookings} bookings</p>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

// ── Funnel ──────────────────────────────────────────────────
export const Funnel: React.FC<{
  funnel: Record<string, number>;
  stages?: { key: string; label: string; tone?: 'brand' | 'emerald' | 'violet' | 'amber' | 'rose' }[];
}> = ({ funnel, stages }) => {
  const s = stages ?? [
    { key: 'pending',   label: 'Pending',    tone: 'amber' as const },
    { key: 'confirmed', label: 'Confirmed',  tone: 'brand' as const },
    { key: 'started',   label: 'Started',    tone: 'violet' as const },
    { key: 'completed', label: 'Completed',  tone: 'emerald' as const },
    { key: 'settled',   label: 'Settled',    tone: 'emerald' as const },
    { key: 'cancelled', label: 'Cancelled',  tone: 'rose' as const },
  ];
  const max = Math.max(1, ...s.map(st => funnel[st.key] ?? 0));
  return (
    <div className="rounded-3xl border border-ink-100 bg-white p-6 shadow-soft">
      <h3 className="text-base font-bold text-ink-900">Booking funnel</h3>
      <p className="mt-0.5 text-xs text-ink-500">Counts per status within the selected window.</p>
      <ul className="mt-4 space-y-2">
        {s.map(st => {
          const n = funnel[st.key] ?? 0;
          const pct = (n / max) * 100;
          return (
            <li key={st.key} className="text-xs">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-ink-700">{st.label}</span>
                <span className="font-bold text-ink-900">{n}</span>
              </div>
              <div className="mt-1 h-2 overflow-hidden rounded-full bg-ink-100">
                <div className={cn('h-full transition-all', `bg-${st.tone ?? 'brand'}-500`)} style={{ width: `${pct}%` }} />
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
};

// ── Activity feed ───────────────────────────────────────────
export interface ActivityItem {
  id: string;
  bookingId: string;
  actor: string;
  action: string;
  fromStatus: string | null;
  toStatus: string | null;
  at: string;
}
export const ActivityFeed: React.FC<{ items: ActivityItem[]; emptyHint?: string }> = ({ items, emptyHint = 'No recent activity.' }) => (
  <div className="rounded-3xl border border-ink-100 bg-white p-6 shadow-soft">
    <h3 className="text-base font-bold text-ink-900">Recent activity</h3>
    {items.length === 0 ? (
      <p className="mt-4 rounded-2xl border border-dashed border-ink-200 px-4 py-6 text-center text-xs text-ink-500">
        {emptyHint}
      </p>
    ) : (
      <ul className="mt-4 max-h-96 space-y-2 overflow-auto pr-1">
        {items.map(it => (
          <li key={it.id} className="rounded-xl border border-ink-100 bg-white px-3 py-2 text-xs">
            <div className="flex items-baseline justify-between gap-2">
              <span className="font-bold text-ink-800">{it.action.replace(/_/g, ' ')}</span>
              <span className="text-[10px] text-ink-500">{new Date(it.at).toLocaleString()}</span>
            </div>
            <p className="mt-0.5 truncate text-ink-600">
              <span className="font-mono text-[10px] text-ink-400">#{it.bookingId.slice(0, 8)}</span>
              {it.fromStatus && it.toStatus ? <> · {it.fromStatus} → <span className="font-semibold">{it.toStatus}</span></> : null}
              <span className="ml-1 text-ink-400">· {it.actor}</span>
            </p>
          </li>
        ))}
      </ul>
    )}
  </div>
);
