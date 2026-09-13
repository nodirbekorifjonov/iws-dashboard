'use server';

import {
  assignWorkerToLocation as apiAssignWorker,
  createLocation as apiCreateLocation,
  deleteLocation as apiDeleteLocation,
  getLocations as apiGetLocations,
  updateLocation as apiUpdateLocation,
} from '@/lib/api/locations';
import { revalidatePath } from 'next/cache';

export async function getLocations() {
  return apiGetLocations();
}

export async function createLocation(formData: FormData) {
  await apiCreateLocation({
    name: formData.get('name') as string,
    description: (formData.get('description') as string) || null,
  });

  revalidatePath('/locations');
  revalidatePath('/dashboard');
}

export async function updateLocation(id: string, formData: FormData) {
  await apiUpdateLocation(id, {
    name: formData.get('name') as string,
    description: (formData.get('description') as string) || null,
    is_active: formData.get('is_active') === 'true',
  });

  revalidatePath('/locations');
}

export async function deleteLocation(id: string) {
  await apiDeleteLocation(id);
  revalidatePath('/locations');
}

export async function assignWorkerToLocation(
  workerId: string,
  locationId: string,
  date: string
) {
  await apiAssignWorker({
    worker_id: workerId,
    location_id: locationId,
    assignment_date: date,
  });

  revalidatePath('/locations');
  revalidatePath('/attendance');
}
