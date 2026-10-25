import { getAssignmentsAsOf, getLocations } from '@/lib/actions/locations';
import { getWorkers } from '@/lib/actions/workers';
import { LocationsGrid } from '@/components/locations/locations-grid';
import { WorkerAssignments } from '@/components/locations/worker-assignments';
import { PageHeader } from '@/components/layout/page-header';
import { ADMIN_ROLES, requirePageRole } from '@/lib/auth/require-role';
import { todayInTashkent } from '@/lib/utils/payroll';

export default async function LocationsPage() {
  await requirePageRole(ADMIN_ROLES);
  const today = todayInTashkent();
  const [locations, workers, assignments] = await Promise.all([
    getLocations(),
    getWorkers(),
    getAssignmentsAsOf(today),
  ]);

  return (
    <div>
      <PageHeader
        title="Ish joylari"
        description="Zavod bloklari va ishchilarni blokka biriktirish"
      />
      <LocationsGrid initialLocations={locations} />
      <WorkerAssignments
        workers={workers}
        locations={locations}
        assignments={assignments}
        today={today}
      />
    </div>
  );
}
