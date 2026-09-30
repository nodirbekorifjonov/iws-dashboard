import { getAttendanceHistory } from '@/lib/api/attendance';
import { getWorkerByUserId } from '@/lib/api/workers';
import { getPayrollRepository } from '@/lib/providers';
import { MyMonthResult } from '@/lib/repositories/types';
import { calculatePayroll } from '@/lib/utils/payroll';

export async function getMyMonth(userId: string, month: string): Promise<MyMonthResult | null> {
  const worker = await getWorkerByUserId(userId);
  if (!worker) return null;

  const monthPrefix = month.slice(0, 7);
  const attendance = await getAttendanceHistory(worker.id, monthPrefix);
  const advances = await getPayrollRepository().findAdvancesForWorker(
    worker.id,
    monthPrefix
  );
  const [payroll] = calculatePayroll([worker], attendance, advances, monthPrefix);

  return {
    month: monthPrefix,
    worker,
    attendance,
    payroll,
  };
}
