import { PayrollRepository } from '@/lib/repositories/payroll.repository';
import {
  PayrollCalculationResult,
  UpdateAdvanceInput,
} from '@/lib/repositories/types';
import { Advance, Attendance } from '@/types/database';
import { getPayContext } from '@/lib/api/pay-rates';
import { calculatePayroll, getMonthDateRange, workersVisibleForMonth } from '@/lib/utils/payroll';
import { fetchAllPages } from '../fetch-all';
import { createSupabaseServerClient } from '../server';

export class SupabasePayrollRepository implements PayrollRepository {
  async calculate(month: string): Promise<PayrollCalculationResult> {
    const supabase = await createSupabaseServerClient();
    const monthPrefix = month.slice(0, 7);
    const { startDate, endDate } = getMonthDateRange(monthPrefix);
    const monthDate = startDate;

    const workers = await fetchAllPages<PayrollCalculationResult['rows'][number]['worker']>(
      (from, to) =>
        supabase
          .from('workers')
          .select('*')
          .order('id', { ascending: true })
          .range(from, to)
    );

    const attendance = await fetchAllPages<Attendance>((from, to) =>
      supabase
        .from('attendance')
        .select('*')
        .gte('date', startDate)
        .lte('date', endDate)
        .order('worker_id', { ascending: true })
        .order('date', { ascending: true })
        .range(from, to)
    );

    const advances = await fetchAllPages<Advance>((from, to) =>
      supabase
        .from('advances')
        .select('*')
        .eq('month', monthDate)
        .order('id', { ascending: true })
        .range(from, to)
    );

    const attendanceIds = new Set(attendance.map((row) => row.worker_id));
    const visibleWorkers = workersVisibleForMonth(
      workers.filter((worker) => !worker.deleted_at || attendanceIds.has(worker.id)),
      attendanceIds
    ).sort((a, b) => a.full_name.localeCompare(b.full_name, 'uz'));
    const payContext = await getPayContext(monthPrefix);

    const rows = calculatePayroll(
      visibleWorkers,
      attendance,
      advances,
      monthPrefix,
      payContext
    );

    return { month: monthPrefix, rows };
  }

  async findAdvancesForWorker(workerId: string, month: string): Promise<Advance[]> {
    const supabase = await createSupabaseServerClient();
    const monthDate = `${month.slice(0, 7)}-01`;

    const { data, error } = await supabase
      .from('advances')
      .select('*')
      .eq('worker_id', workerId)
      .eq('month', monthDate);

    if (error) throw error;
    return data || [];
  }

  async updateAdvance(input: UpdateAdvanceInput): Promise<void> {
    const supabase = await createSupabaseServerClient();
    const monthDate = `${input.month.slice(0, 7)}-01`;

    if (!Number.isFinite(input.amount) || input.amount < 0) {
      throw new Error("Avans manfiy bo'lishi mumkin emas");
    }

    const { error } = await supabase.from('advances').upsert(
      {
        worker_id: input.worker_id,
        month: monthDate,
        amount: input.amount,
      },
      { onConflict: 'worker_id,month' }
    );

    if (error) throw error;
  }
}
