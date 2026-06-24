'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Plus, CheckCircle2, PauseCircle, Loader2, ArrowRight } from 'lucide-react';
import { partnerApi, type PartnerRule } from '@/lib/partner-api';
import { PartnerShell } from '../PartnerShell';
import { cn } from '@/lib/cn';

export default function RulesListPage() {
  return (
    <PartnerShell>
      <RulesList />
    </PartnerShell>
  );
}

const RulesList: React.FC = () => {
  const [rules, setRules] = useState<PartnerRule[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    partnerApi.rules()
      .then(r => setRules(r.rules))
      .catch((e: Error) => setError(e.message));
  }, []);

  return (
    <div>
      <div className="flex items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tighter">Price rules</h1>
          <p className="mt-1 text-sm text-ink-500">Publish offers to the marketplace. Each rule covers one or more polygons + your rates per vehicle class.</p>
        </div>
        <Link href="/partner/rules/new" className="btn-primary !py-2.5 !px-4 !text-sm">
          <Plus className="h-4 w-4" /> New rule
        </Link>
      </div>

      {error ? (
        <p className="mt-6 inline-flex items-center gap-2 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      ) : null}

      {!rules ? (
        <div className="mt-6 inline-flex items-center gap-2 text-sm text-ink-500">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading rules…
        </div>
      ) : rules.length === 0 ? (
        <div className="mt-6 rounded-3xl border border-dashed border-ink-200 bg-ink-50/40 p-8 text-center">
          <h2 className="text-lg font-bold tracking-tight">No rules yet</h2>
          <p className="mt-1 text-sm text-ink-600">Publish your first rule to start receiving bookings.</p>
          <Link href="/partner/rules/new" className="btn-primary mt-4">Create rule</Link>
        </div>
      ) : (
        <ul className="mt-6 space-y-3">
          {rules.map(r => <RuleRow key={r.id} rule={r} />)}
        </ul>
      )}
    </div>
  );
};

const RuleRow: React.FC<{ rule: PartnerRule }> = ({ rule }) => {
  return (
    <li className="rounded-3xl border border-ink-100 bg-white p-5 shadow-soft">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            {rule.active ? (
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
            ) : (
              <PauseCircle className="h-4 w-4 text-ink-400" />
            )}
            <h2 className="text-lg font-bold tracking-tight">{rule.name || 'Untitled rule'}</h2>
            <span className={cn(
              'rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider',
              rule.active ? 'bg-emerald-100 text-emerald-700' : 'bg-ink-100 text-ink-600',
            )}>{rule.active ? 'Active' : 'Paused'}</span>
          </div>
          <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-ink-600">
            <li>{rule.polygonPhpIds.length} polygon{rule.polygonPhpIds.length === 1 ? '' : 's'}</li>
            <li>{rule.prices.length} class{rule.prices.length === 1 ? '' : 'es'} published</li>
            <li>{rule.marginHours}h notice required</li>
            <li>{rule.minHours}h – {rule.maxHours}h booking window</li>
            <li>Currency {rule.currency}</li>
          </ul>
          <ul className="mt-3 flex flex-wrap gap-2 text-xs">
            {rule.prices.map(p => (
              <li key={p.vehicleClass} className="rounded-full bg-brand-50 px-3 py-1 font-medium text-brand-700">
                {p.vehicleClass}: {rule.currency} {p.hourlyRate.toFixed(2)}/h
              </li>
            ))}
          </ul>
        </div>
        <Link href={`/partner/rules/${rule.id}`} className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-600 hover:text-brand-700">
          Edit <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </li>
  );
};
