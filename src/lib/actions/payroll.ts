'use server';

import { recordAudit } from '@/lib/api/audit';
import { assertMonthEditable, queueAdvanceRequest } from '@/lib/api/governance';
import { getPayContext } from '@/lib/api/pay-rates';
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
): Promise<{ pending: boolean }> {
  const actor = await requireRole(ADMIN_ROLES);
  if (!Number.isFinite(amount) || amount < 0) {
    throw new Error("Avans manfiy bo'lishi mumkin emas");
  }
  await assertMonthEditable(month, actor.role);
  const worker = await getWorkerById(workerId);
  const payroll = await apiCalculatePayroll(month);
  const oldAmount =
    payroll.rows.find((row) => row.worker.id === workerId)?.advanceAmount ?? 0;
  const payContext = await getPayContext(month);
  if (
    actor.role !== 'creator' &&
    amount > oldAmount &&
    amount >= payContext.rates.largeAdvanceLimit
  ) {
    await queueAdvanceRequest({
      workerId,
      month,
      amount,
      previousAmount: oldAmount,
      requestedBy: actor.id,
      requestedByName: actor.full_name,
    });
    await recordAudit({
      actor,
      action: 'payroll.advance_request',
      entityType: 'advance',
      entityId: workerId,
      entityName: worker?.full_name,
      summary: `${actor.full_name} ${worker?.full_name || 'ishchi'} uchun ${formatCurrency(amount)} avans so‘radi`,
      metadata: { amount, oldAmount, month },
    });
    revalidatePath('/payroll');
    revalidatePath('/control');
    return { pending: true };
  }
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
  return { pending: false };
}
