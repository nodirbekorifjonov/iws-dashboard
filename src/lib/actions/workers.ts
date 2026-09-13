'use server';

import {
  createWorker as apiCreateWorker,
  deleteWorker as apiDeleteWorker,
  getWorkers as apiGetWorkers,
  updateWorker as apiUpdateWorker,
} from '@/lib/api/workers';
import { revalidatePath } from 'next/cache';

export async function getWorkers() {
  return apiGetWorkers();
}

export async function createWorker(formData: FormData) {
  await apiCreateWorker({
    full_name: formData.get('full_name') as string,
    position: (formData.get('position') as string) || null,
    phone: (formData.get('phone') as string) || null,
    start_date:
      (formData.get('start_date') as string) ||
      new Date().toISOString().split('T')[0],
    hourly_rate: parseFloat(formData.get('hourly_rate') as string) || 0,
  });

  revalidatePath('/workers');
  revalidatePath('/dashboard');
}

export async function updateWorker(id: string, formData: FormData) {
  await apiUpdateWorker(id, {
    full_name: formData.get('full_name') as string,
    position: (formData.get('position') as string) || null,
    phone: (formData.get('phone') as string) || null,
    start_date: formData.get('start_date') as string,
    hourly_rate: parseFloat(formData.get('hourly_rate') as string) || 0,
    is_active: formData.get('is_active') === 'true',
  });

  revalidatePath('/workers');
  revalidatePath('/dashboard');
}

export async function deleteWorker(id: string) {
  await apiDeleteWorker(id);
  revalidatePath('/workers');
  revalidatePath('/dashboard');
}
