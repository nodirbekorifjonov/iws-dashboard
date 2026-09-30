import { getLocations } from '@/lib/actions/locations';
import { LocationsGrid } from '@/components/locations/locations-grid';
import { ADMIN_ROLES, requirePageRole } from '@/lib/auth/require-role';

export default async function LocationsPage() {
  await requirePageRole(ADMIN_ROLES);
  const locations = await getLocations();

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Ish joylari</h1>
        <p className="mt-1 text-sm text-gray-600">
          Zavod bloklari va ish joylarini boshqarish
        </p>
      </div>

      <LocationsGrid initialLocations={locations} />
    </div>
  );
}
