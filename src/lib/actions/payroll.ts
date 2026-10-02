'use server';

import { recordAudit } from '@/lib/api/audit';
import {
  calculatePayroll as apiCalculatePayroll,
  updateAdvance as apiUpdateAdvance,
} from '@/lib/api/payroll';
import { getWorkerById } from '@/lib/api/workers';
import { ADMIN_ROLES, requireRole } from '@/lib/auth/require-role';
import { formatCurrency } from '@/lib/utils';
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
  const actor = await requireRole(ADMIN_ROLES);
  if (!Number.isFinite(amount) || amount < 0) {
    throw new Error("Avans manfiy bo'lishi mumkin emas");
  }
  const worker = await getWorkerById(workerId);
  const payroll = await apiCalculatePayroll(month);
  const oldAmount =
    payroll.rows.find((row) => row.worker.id === workerId)?.advanceAmount ?? 0;
  await apiUpdateAdvance(workerId, month, amount);
  await recordAudit({
    actor,
    action: 'payroll.advance',
    entityType: 'advance',
    entityId: workerId,
    entityName: worker?.full_name,
    summary: `${actor.full_name} ${worker?.full_name || 'ishchi'} avansini ${formatCurrency(oldAmount)} → ${formatCurrency(amount)} qildi`,
    metadata: { amount, oldAmount, month },
  });
  revalidatePath('/payroll');
}
