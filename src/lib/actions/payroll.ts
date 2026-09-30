'use server';

import {
  calculatePayroll as apiCalculatePayroll,
  updateAdvance as apiUpdateAdvance,
} from '@/lib/api/payroll';
import { ADMIN_ROLES, requireRole } from '@/lib/auth/require-role';
import { revalidatePath } from 'next/cache';

export async function calculatePayroll(month: string) {
  await requireRole(ADMIN_ROLES);
  return apiCalculatePayroll(month);
}

export async function updateAdvance(
  workerId: string,
  month: string,
  amount: number
) {
  await requireRole(ADMIN_ROLES);
  if (!Number.isFinite(amount) || amount < 0) {
    throw new Error("Avans manfiy bo'lishi mumkin emas");
  }
  await apiUpdateAdvance(workerId, month, amount);
  revalidatePath('/payroll');
}
