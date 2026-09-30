import { getWorkers } from '@/lib/actions/workers';
import { WorkersTable } from '@/components/workers/workers-table';
import { ADMIN_ROLES, requirePageRole } from '@/lib/auth/require-role';

export default async function WorkersPage() {
  await requirePageRole(ADMIN_ROLES);
  const workers = await getWorkers();

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Ishchilar</h1>
        <p className="mt-1 text-sm text-gray-600">
          Zavod ishchilarini boshqarish
        </p>
      </div>

      <WorkersTable initialWorkers={workers} />
    </div>
  );
}
