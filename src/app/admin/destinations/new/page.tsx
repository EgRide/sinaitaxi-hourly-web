'use client';

import { AdminShell } from '../../AdminShell';
import { DestinationEditor } from '../DestinationEditor';

export default function NewDestinationPage() {
  return (
    <AdminShell>
      <DestinationEditor mode="create" />
    </AdminShell>
  );
}
