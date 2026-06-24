'use client';

import { PartnerShell } from '../../PartnerShell';
import { RuleEditor } from '../RuleEditor';

export default function NewRulePage() {
  return (
    <PartnerShell>
      <div>
        <h1 className="text-3xl font-extrabold tracking-tighter">New price rule</h1>
        <p className="mt-1 text-sm text-ink-500">Publish prices for the polygons you cover. Customers see your offer immediately on search.</p>
        <div className="mt-6">
          <RuleEditor mode="create" />
        </div>
      </div>
    </PartnerShell>
  );
}
