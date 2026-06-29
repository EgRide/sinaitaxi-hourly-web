'use client';

import { AdminShell } from '../../AdminShell';
import { AdminRuleEditor } from '../AdminRuleEditor';

export default function NewPriceRulePage() {
  return (
    <AdminShell>
      <AdminRuleEditor mode="create" />
    </AdminShell>
  );
}
