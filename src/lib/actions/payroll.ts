'use server';

import {
  calculatePayroll as apiCalculatePayroll,
  updateAdvance as apiUpdateAdvance,
} from '@/lib/api/payroll';
import { revalidatePath } from 'next/cache';

export async function calculatePayroll(month: string) {
  return apiCalculatePayroll(month);
}

export async function updateAdvance(
  workerId: string,
  month: string,
  amount: number
) {
  await apiUpdateAdvance(workerId, month, amount);
  revalidatePath('/payroll');
}
