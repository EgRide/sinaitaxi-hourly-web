'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Loader2, AlertCircle } from 'lucide-react';
import { adminApi, type AdminDestinationContent } from '@/lib/admin-api';
import { AdminShell } from '../../AdminShell';
import { DestinationEditor } from '../DestinationEditor';

export default function EditDestinationPage() {
  return (
    <AdminShell>
      <Editor />
    </AdminShell>
  );
}

const Editor: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [row, setRow] = useState<AdminDestinationContent | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    // The list endpoint is cheap; pick the row we want client-side
    // rather than hitting a single-row endpoint we don't have yet.
    adminApi.destinations()
      .then(r => {
        const found = r.destinations.find(d => d.id === id);
        if (!found) setError('Destination not found.');
        else setRow(found);
        setLoading(false);
      })
      .catch(err => { setError((err as Error).message); setLoading(false); });
  }, [id]);

  if (loading) {
    return (
      <div className="rounded-2xl border border-ink-100 bg-white p-8 text-center text-sm text-ink-500">
        <Loader2 className="mx-auto h-5 w-5 animate-spin" />
        <p className="mt-3">Loading destination…</p>
      </div>
    );
  }
  if (error || !row) {
    return (
      <div className="inline-flex w-full items-start gap-2 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
        <AlertCircle className="h-4 w-4 mt-0.5" />
        {error ?? 'Not found.'}
      </div>
    );
  }
  return <DestinationEditor mode="edit" initial={row} />;
};
