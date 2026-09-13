'use server';

import {
  getAttendanceByMonth as apiGetAttendanceByMonth,
  getAttendanceHistory as apiGetAttendanceHistory,
  getDashboardStats as apiGetDashboardStats,
  markAttendanceBatch as apiMarkAttendanceBatch,
} from '@/lib/api/attendance';
import { AttendanceStatus } from '@/types/database';
import { revalidatePath } from 'next/cache';

export async function getAttendanceByMonth(month: string) {
  return apiGetAttendanceByMonth(month);
}

export async function saveAttendanceBatch(
  records: {
    workerId: string;
    date: string;
    status: AttendanceStatus;
    hoursWorked?: number;
    notes?: string;
  }[]
) {
  try {
    await apiMarkAttendanceBatch(records);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    if (message.includes('hours_worked')) {
      throw new Error(
        'Baza yangilanmagan. Supabase SQL Editor\'da 004_hourly_salary_and_advances.sql migratsiyasini ishga tushiring yoki: npm run migrate'
      );
    }
    throw err;
  }
  revalidatePath('/attendance');
  revalidatePath('/dashboard');
  revalidatePath('/payroll');
}

export async function getAttendanceHistory(workerId: string, month: string) {
  return apiGetAttendanceHistory(workerId, month);
}

export async function getDashboardStats() {
  return apiGetDashboardStats();
}
