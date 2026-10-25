import { getWorkers } from '@/lib/actions/workers';
import { getPayContext } from '@/lib/api/pay-rates';
import { WorkersTable } from '@/components/workers/workers-table';
import { PageHeader } from '@/components/layout/page-header';
import { ADMIN_ROLES, requirePageRole } from '@/lib/auth/require-role';
import { todayInTashkent } from '@/lib/utils/payroll';

export default async function WorkersPage() {
  await requirePageRole(ADMIN_ROLES);
  const month = todayInTashkent().slice(0, 7);
  const [workers, payContext] = await Promise.all([getWorkers(), getPayContext(month)]);

  return (
    <div>
      <PageHeader title="Ishchilar" description="Zavod ishchilarini boshqarish" />
      <WorkersTable initialWorkers={workers} rates={payContext.rates} />
    </div>
  );
}
