'use server';

import {
  createWorker as apiCreateWorker,
  deleteWorker as apiDeleteWorker,
  getWorkerById as apiGetWorkerById,
  getWorkers as apiGetWorkers,
  updateWorker as apiUpdateWorker,
} from '@/lib/api/workers';
import {
  createWorkerAuthLogin,
  deleteWorkerAuthUser,
  provisionMissingWorkerLogins as apiProvisionMissingWorkerLogins,
  resetWorkerAuthPassword,
} from '@/lib/api/worker-login';
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
  "Baza yangilanmagan. Supabase SQL Editor'da 007_female_shift_hours.sql yoki 008_worker_portal.sql migratsiyasini ishga tushiring yoki: npm run migrate";

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
    message.includes('login_code') ||
    message.includes('user_id') ||
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
    const worker = await apiCreateWorker({
      ...payload,
      start_date:
        (formData.get('start_date') as string) ||
        new Date().toISOString().split('T')[0],
    });
    if (worker.login_code) {
      try {
        await createWorkerAuthLogin(worker.id);
      } catch (err) {
        revalidatePath('/workers');
        revalidatePath('/dashboard');
        revalidatePath('/attendance');
        revalidatePath('/payroll');
        return {
          error: `Ishchi saqlandi, lekin kirish yaratilmadi: ${
            err instanceof Error ? err.message : workerActionError(err)
          }`,
        };
      }
    }
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
    const existing = await apiGetWorkerById(id);
    const payload = workerPayload(formData);
    await apiUpdateWorker(id, {
      ...payload,
      start_date: formData.get('start_date') as string,
      is_active: formData.get('is_active') === 'true',
    });
    if (
      existing?.user_id &&
      existing.full_name.trim() !== payload.full_name.trim()
    ) {
      await resetWorkerAuthPassword(id);
    }
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
  const worker = await apiGetWorkerById(id);
  await apiDeleteWorker(id);
  if (worker?.user_id) {
    await deleteWorkerAuthUser(worker.user_id);
  }
  revalidatePath('/workers');
  revalidatePath('/dashboard');
  revalidatePath('/attendance');
  revalidatePath('/payroll');
  revalidatePath('/my');
}

export async function createWorkerLogin(
  workerId: string
): Promise<{ error?: string; loginCode?: string; password?: string }> {
  await requireRole(ADMIN_ROLES);
  try {
    const result = await createWorkerAuthLogin(workerId);
    revalidatePath('/workers');
    return {
      loginCode: result.loginCode ?? undefined,
      password: result.password,
    };
  } catch (err) {
    return { error: err instanceof Error ? err.message : workerActionError(err) };
  }
}

export async function resetWorkerLogin(
  workerId: string
): Promise<{ error?: string; loginCode?: string; password?: string }> {
  await requireRole(ADMIN_ROLES);
  try {
    const result = await resetWorkerAuthPassword(workerId);
    revalidatePath('/workers');
    return {
      loginCode: result.loginCode ?? undefined,
      password: result.password,
    };
  } catch (err) {
    return { error: err instanceof Error ? err.message : workerActionError(err) };
  }
}

export async function provisionMissingWorkerLogins(): Promise<{
  error?: string;
  created?: number;
  failed?: number;
  errors?: string[];
}> {
  await requireRole(ADMIN_ROLES);
  try {
    const result = await apiProvisionMissingWorkerLogins();
    revalidatePath('/workers');
    return result;
  } catch (err) {
    return { error: err instanceof Error ? err.message : workerActionError(err) };
  }
}
