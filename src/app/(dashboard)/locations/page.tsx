import { getLocations } from '@/lib/actions/locations';
import { LocationsGrid } from '@/components/locations/locations-grid';
import { PageHeader } from '@/components/layout/page-header';
import { ADMIN_ROLES, requirePageRole } from '@/lib/auth/require-role';

export default async function LocationsPage() {
  await requirePageRole(ADMIN_ROLES);
  const locations = await getLocations();

  return (
    <div>
      <PageHeader
        title="Ish joylari"
        description="Zavod bloklari va ish joylarini boshqarish"
      />
      <LocationsGrid initialLocations={locations} />
    </div>
  );
}
