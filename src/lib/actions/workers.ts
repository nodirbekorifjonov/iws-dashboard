'use server';

import {
  createWorker as apiCreateWorker,
  deleteWorker as apiDeleteWorker,
  getWorkers as apiGetWorkers,
  updateWorker as apiUpdateWorker,
} from '@/lib/api/workers';
import { ADMIN_ROLES, requireRole } from '@/lib/auth/require-role';
import {
  defaultHourlyRate,
  ShiftLength,
  WorkerGender,
} from '@/types/database';
import { revalidatePath } from 'next/cache';

function parseGender(value: FormDataEntryValue | null): WorkerGender | null {
  return value === 'male' || value === 'female' ? value : null;
}

function parseShiftLength(
  gender: WorkerGender | null,
  value: FormDataEntryValue | null
): ShiftLength | null {
  if (gender !== 'female') return null;
  if (value === '8') return 8;
  if (value === '12') return 12;
  return null;
}

const WORKER_MIGRATION_ERROR =
  "Baza yangilanmagan. Supabase SQL Editor'da 007_female_shift_hours.sql migratsiyasini ishga tushiring yoki: npm run migrate";

function errorText(err: unknown): string {
  if (err instanceof Error) return err.message;
  if (typeof err === 'object' && err !== null) {
    try {
      return JSON.stringify(err);
    } catch {
      return String(err);
    }
  }
  return String(err);
}

function workerActionError(err: unknown): string {
  const message = errorText(err);
  if (
    message.includes('gender') ||
    message.includes('shift_length') ||
    message.includes('PGRST204')
  ) {
    return WORKER_MIGRATION_ERROR;
  }
  return 'Xatolik yuz berdi';
}

export async function getWorkers() {
  await requireRole(ADMIN_ROLES);
  return apiGetWorkers();
}

function workerPayload(formData: FormData) {
  const gender = parseGender(formData.get('gender'));
  const shift_length = parseShiftLength(gender, formData.get('shift_length'));
  const hourly_rate =
    parseFloat(formData.get('hourly_rate') as string) ||
    (gender ? defaultHourlyRate(gender, shift_length) : 0);

  return {
    full_name: formData.get('full_name') as string,
    position: (formData.get('position') as string) || null,
    phone: (formData.get('phone') as string) || null,
    gender,
    shift_length,
    hourly_rate,
  };
}

export async function createWorker(formData: FormData): Promise<{ error?: string }> {
  await requireRole(ADMIN_ROLES);
  const gender = parseGender(formData.get('gender'));
  const shift_length = parseShiftLength(gender, formData.get('shift_length'));
  if (gender === 'female' && shift_length === null) {
    return { error: 'Ayol ishchi uchun 8 yoki 12 soatlik rejimni tanlang' };
  }
  try {
    const payload = workerPayload(formData);
    await apiCreateWorker({
      ...payload,
      start_date:
        (formData.get('start_date') as string) ||
        new Date().toISOString().split('T')[0],
    });
  } catch (err) {
    return { error: workerActionError(err) };
  }

  revalidatePath('/workers');
  revalidatePath('/dashboard');
  revalidatePath('/attendance');
  revalidatePath('/payroll');
  return {};
}

export async function updateWorker(
  id: string,
  formData: FormData
): Promise<{ error?: string }> {
  await requireRole(ADMIN_ROLES);
  const gender = parseGender(formData.get('gender'));
  const shift_length = parseShiftLength(gender, formData.get('shift_length'));
  if (gender === 'female' && shift_length === null) {
    return { error: 'Ayol ishchi uchun 8 yoki 12 soatlik rejimni tanlang' };
  }
  try {
    const payload = workerPayload(formData);
    await apiUpdateWorker(id, {
      ...payload,
      start_date: formData.get('start_date') as string,
      is_active: formData.get('is_active') === 'true',
    });
  } catch (err) {
    return { error: workerActionError(err) };
  }

  revalidatePath('/workers');
  revalidatePath('/dashboard');
  revalidatePath('/attendance');
  revalidatePath('/payroll');
  return {};
}

export async function deleteWorker(id: string) {
  await requireRole(ADMIN_ROLES);
  await apiDeleteWorker(id);
  revalidatePath('/workers');
  revalidatePath('/dashboard');
  revalidatePath('/attendance');
  revalidatePath('/payroll');
}
