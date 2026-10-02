import { getWorkers } from '@/lib/actions/workers';
import { WorkersTable } from '@/components/workers/workers-table';
import { PageHeader } from '@/components/layout/page-header';
import { ADMIN_ROLES, requirePageRole } from '@/lib/auth/require-role';

export default async function WorkersPage() {
  await requirePageRole(ADMIN_ROLES);
  const workers = await getWorkers();

  return (
    <div>
      <PageHeader title="Ishchilar" description="Zavod ishchilarini boshqarish" />
      <WorkersTable initialWorkers={workers} />
    </div>
  );
}
