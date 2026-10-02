'use server';

import {
  assignWorkerToLocation as apiAssignWorker,
  createLocation as apiCreateLocation,
  deleteLocation as apiDeleteLocation,
  getLocations as apiGetLocations,
  updateLocation as apiUpdateLocation,
} from '@/lib/api/locations';
import { recordAudit } from '@/lib/api/audit';
import { ADMIN_ROLES, requireRole } from '@/lib/auth/require-role';
import { revalidatePath } from 'next/cache';

export async function getLocations() {
  await requireRole(ADMIN_ROLES);
  return apiGetLocations();
}

export async function createLocation(formData: FormData) {
  const actor = await requireRole(ADMIN_ROLES);
  const name = formData.get('name') as string;
  await apiCreateLocation({
    name,
    description: (formData.get('description') as string) || null,
  });
  await recordAudit({
    actor,
    action: 'location.create',
    entityType: 'location',
    entityName: name,
    summary: `${actor.full_name} ${name} blokini qo‘shdi`,
  });

  revalidatePath('/locations');
  revalidatePath('/dashboard');
}

export async function updateLocation(id: string, formData: FormData) {
  const actor = await requireRole(ADMIN_ROLES);
  const name = formData.get('name') as string;
  await apiUpdateLocation(id, {
    name,
    description: (formData.get('description') as string) || null,
    is_active: formData.get('is_active') === 'true',
  });
  await recordAudit({
    actor,
    action: 'location.update',
    entityType: 'location',
    entityId: id,
    entityName: name,
    summary: `${actor.full_name} ${name} blokini tahrirladi`,
  });

  revalidatePath('/locations');
}

export async function deleteLocation(id: string) {
  const actor = await requireRole(ADMIN_ROLES);
  await apiDeleteLocation(id);
  await recordAudit({
    actor,
    action: 'location.delete',
    entityType: 'location',
    entityId: id,
    summary: `${actor.full_name} blokni o‘chirdi`,
  });
  revalidatePath('/locations');
}

export async function assignWorkerToLocation(
  workerId: string,
  locationId: string,
  date: string
) {
  const actor = await requireRole(ADMIN_ROLES);
  await apiAssignWorker({
    worker_id: workerId,
    location_id: locationId,
    assignment_date: date,
  });
  await recordAudit({
    actor,
    action: 'location.assign',
    entityType: 'assignment',
    entityId: workerId,
    summary: `${actor.full_name} ishchini blokka biriktirdi`,
    metadata: { workerId, locationId, date },
  });

  revalidatePath('/locations');
  revalidatePath('/attendance');
}
