import { getPayrollRepository } from '@/lib/providers';

export async function calculatePayroll(month: string) {
  return getPayrollRepository().calculate(month);
}

export async function updateAdvance(
  workerId: string,
  month: string,
  amount: number
) {
  return getPayrollRepository().updateAdvance({
    worker_id: workerId,
    month,
    amount,
  });
}
