'use server';

import {
  getAttendanceByMonth as apiGetAttendanceByMonth,
  getAttendanceHistory as apiGetAttendanceHistory,
  getDashboardStats as apiGetDashboardStats,
  markAttendanceBatch as apiMarkAttendanceBatch,
} from '@/lib/api/attendance';
import { STAFF_ROLES, requireRole } from '@/lib/auth/require-role';
import { AttendanceShift, AttendanceStatus } from '@/types/database';
import { revalidatePath } from 'next/cache';

export async function getAttendanceByMonth(month: string) {
  await requireRole(STAFF_ROLES);
  return apiGetAttendanceByMonth(month);
}

export async function saveAttendanceBatch(
  records: {
    workerId: string;
    date: string;
    status: AttendanceStatus;
    hoursWorked?: number;
    shift?: AttendanceShift | null;
    notes?: string;
  }[]
) {
  await requireRole(STAFF_ROLES);
  try {
    await apiMarkAttendanceBatch(records);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    if (message.includes('hours_worked')) {
      throw new Error(
        "Baza yangilanmagan. Supabase SQL Editor'da 004_hourly_salary_and_advances.sql migratsiyasini ishga tushiring yoki: npm run migrate"
      );
    }
    if (
      message.includes('shift') ||
      message.includes('attendance_shift') ||
      message.includes('PGRST204')
    ) {
      throw new Error(
        "Baza yangilanmagan. Supabase SQL Editor'da 007_female_shift_hours.sql migratsiyasini ishga tushiring yoki: npm run migrate"
      );
    }
    throw err;
  }
  revalidatePath('/attendance');
  revalidatePath('/dashboard');
  revalidatePath('/payroll');
}

export async function getAttendanceHistory(workerId: string, month: string) {
  await requireRole(STAFF_ROLES);
  return apiGetAttendanceHistory(workerId, month);
}

export async function getDashboardStats() {
  await requireRole(STAFF_ROLES);
  return apiGetDashboardStats();
}
