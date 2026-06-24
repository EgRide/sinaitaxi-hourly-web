'use client';

import { use, useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { partnerApi, type PartnerRule } from '@/lib/partner-api';
import { PartnerShell } from '../../PartnerShell';
import { RuleEditor } from '../RuleEditor';

interface Props {
  params: Promise<{ id: string }>;
}

export default function EditRulePage({ params }: Props) {
  const { id } = use(params);
  const [rule, setRule] = useState<PartnerRule | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    partnerApi.rule(id)
      .then(r => setRule(r.rule))
      .catch((e: Error) => setError(e.message));
  }, [id]);

  return (
    <PartnerShell>
      <div>
        <h1 className="text-3xl font-extrabold tracking-tighter">Edit price rule</h1>
        <p className="mt-1 text-sm text-ink-500">Changes go live immediately for new customer searches.</p>
        <div className="mt-6">
          {error ? (
            <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
          ) : rule ? (
            <RuleEditor mode="edit" initial={rule} />
          ) : (
            <div className="inline-flex items-center gap-2 text-sm text-ink-500">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading rule…
            </div>
          )}
        </div>
      </div>
    </PartnerShell>
  );
}
