'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Loader2, AlertCircle } from 'lucide-react';
import { adminApi, type AdminPriceRule } from '@/lib/admin-api';
import { AdminShell } from '../../AdminShell';
import { AdminRuleEditor } from '../AdminRuleEditor';

export default function EditPriceRulePage() {
  return (
    <AdminShell>
      <Loader />
    </AdminShell>
  );
}

const Loader: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [rule, setRule] = useState<AdminPriceRule | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    adminApi.priceRule(id)
      .then(r => { setRule(r.rule); setLoading(false); })
      .catch(err => { setError((err as Error).message); setLoading(false); });
  }, [id]);

  if (loading) {
    return (
      <div className="rounded-2xl border border-ink-100 bg-white p-12 text-center text-sm text-ink-500">
        <Loader2 className="mx-auto h-6 w-6 animate-spin" />
        <p className="mt-3">Loading rule…</p>
      </div>
    );
  }
  if (error || !rule) {
    return (
      <div className="inline-flex w-full items-start gap-2 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
        <AlertCircle className="h-4 w-4 mt-0.5" /> {error ?? 'Not found.'}
      </div>
    );
  }
  return <AdminRuleEditor mode="edit" initial={rule} />;
};
