'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ListPlus, BookOpen, ArrowRight, Loader2, CheckCircle2, PauseCircle } from 'lucide-react';
import { partnerApi, type PartnerRule, type PartnerBookingRow } from '@/lib/partner-api';
import { PartnerShell } from './PartnerShell';

export default function PartnerDashboardPage() {
  return (
    <PartnerShell>
      <Dashboard />
    </PartnerShell>
  );
}

const Dashboard: React.FC = () => {
  const [rules, setRules] = useState<PartnerRule[] | null>(null);
  const [bookings, setBookings] = useState<PartnerBookingRow[] | null>(null);

  useEffect(() => {
    void Promise.allSettled([
      partnerApi.rules().then(r => setRules(r.rules)),
      partnerApi.bookings().then(r => setBookings(r.bookings)),
    ]);
  }, []);

  const activeRules = rules?.filter(r => r.active).length ?? null;
  const totalRules = rules?.length ?? null;
  const upcoming = bookings?.filter(b => b.status === 'confirmed' && new Date(b.pickupAt) > new Date()).length ?? null;
  const today = bookings?.filter(b => {
    const d = new Date(b.pickupAt);
    const now = new Date();
    return d.toDateString() === now.toDateString() && b.status !== 'cancelled' && b.status !== 'no_show';
  }).length ?? null;

  return (
    <div>
      <h1 className="text-3xl font-extrabold tracking-tighter">Dashboard</h1>
      <p className="mt-1 text-sm text-ink-500">Welcome back. Here's a quick view of your active supply and demand.</p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Active rules"    value={activeRules}    total={totalRules ?? undefined} />
        <Stat label="Pickups today"   value={today} />
        <Stat label="Upcoming"        value={upcoming} />
        <Stat label="All-time bookings" value={bookings?.length ?? null} />
      </div>

      <div className="mt-8 grid gap-4 lg:grid-cols-2">
        <ActionCard
          href="/partner/rules"
          icon={<ListPlus className="h-5 w-5" />}
          title="Manage price rules"
          body="Publish offers for the polygons you cover. Each rule sets per-class hourly rates + margin/min/max booking windows."
        />
        <ActionCard
          href="/partner/bookings"
          icon={<BookOpen className="h-5 w-5" />}
          title="See incoming bookings"
          body="Every booking the marketplace routes to you. Customer name, pickup, duration, price."
        />
      </div>

      {rules && rules.length > 0 ? (
        <div className="mt-8 rounded-3xl border border-ink-100 bg-white p-6 shadow-soft">
          <h2 className="text-[10px] font-bold uppercase tracking-wider text-ink-500">Your rules</h2>
          <ul className="mt-3 divide-y divide-ink-100">
            {rules.slice(0, 6).map(r => (
              <li key={r.id} className="flex items-center justify-between gap-3 py-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    {r.active ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                    ) : (
                      <PauseCircle className="h-4 w-4 text-ink-400" />
                    )}
                    <span className="font-semibold text-ink-900 truncate">{r.name || 'Untitled rule'}</span>
                  </div>
                  <div className="mt-1 text-xs text-ink-500">
                    {r.polygonPhpIds.length} polygon{r.polygonPhpIds.length === 1 ? '' : 's'} · {r.prices.length} class{r.prices.length === 1 ? '' : 'es'} · {r.marginHours}h margin
                  </div>
                </div>
                <Link href={`/partner/rules/${r.id}`} className="text-sm font-semibold text-brand-600 hover:text-brand-700">
                  Edit
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ) : rules ? (
        <div className="mt-8 rounded-3xl border border-dashed border-ink-200 bg-ink-50/40 p-8 text-center">
          <h2 className="text-lg font-bold tracking-tight">No price rules yet</h2>
          <p className="mt-1 text-sm text-ink-600">Publish a rule to start receiving bookings.</p>
          <Link href="/partner/rules/new" className="btn-primary mt-4">Create your first rule</Link>
        </div>
      ) : (
        <div className="mt-8 inline-flex items-center gap-2 text-sm text-ink-500">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading rules…
        </div>
      )}
    </div>
  );
};

const Stat: React.FC<{ label: string; value: number | null; total?: number }> = ({ label, value, total }) => (
  <div className="rounded-3xl border border-ink-100 bg-white p-5 shadow-soft">
    <div className="text-[10px] font-bold uppercase tracking-wider text-ink-500">{label}</div>
    <div className="mt-1 text-3xl font-extrabold tracking-tightest">
      {value === null ? <span className="text-ink-300">…</span> : (
        <>
          {value}
          {total !== undefined ? <span className="text-base font-bold text-ink-400"> / {total}</span> : null}
        </>
      )}
    </div>
  </div>
);

const ActionCard: React.FC<{ href: string; icon: React.ReactNode; title: string; body: string }> = ({ href, icon, title, body }) => (
  <Link href={href} className="block rounded-3xl border border-ink-100 bg-white p-5 shadow-soft transition hover:border-brand-200 hover:shadow-glow">
    <div className="grid h-10 w-10 place-items-center rounded-2xl bg-brand-50 text-brand-700">{icon}</div>
    <h3 className="mt-4 text-lg font-bold">{title}</h3>
    <p className="mt-1 text-sm leading-relaxed text-ink-600">{body}</p>
    <span className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-brand-600">
      Open <ArrowRight className="h-3.5 w-3.5" />
    </span>
  </Link>
);
