import { PayrollRepository } from '@/lib/repositories/payroll.repository';
import {
  PayrollCalculationResult,
  UpdateAdvanceInput,
} from '@/lib/repositories/types';
import { Advance } from '@/types/database';
import { calculatePayroll, getMonthDateRange, workersVisibleForMonth } from '@/lib/utils/payroll';
import { createSupabaseServerClient } from '../server';

export class SupabasePayrollRepository implements PayrollRepository {
  async calculate(month: string): Promise<PayrollCalculationResult> {
    const supabase = await createSupabaseServerClient();
    const monthPrefix = month.slice(0, 7);
    const { startDate, endDate } = getMonthDateRange(monthPrefix);
    const monthDate = startDate;

    const { data: workers, error: workersError } = await supabase
      .from('workers')
      .select('*')
      .order('full_name');

    if (workersError) throw workersError;

    const { data: attendance, error: attendanceError } = await supabase
      .from('attendance')
      .select('*')
      .gte('date', startDate)
      .lte('date', endDate);

    if (attendanceError) throw attendanceError;

    const { data: advances, error: advancesError } = await supabase
      .from('advances')
      .select('*')
      .eq('month', monthDate);

    if (advancesError) throw advancesError;

    const visibleWorkers = workersVisibleForMonth(
      workers || [],
      (attendance || []).map((row) => row.worker_id)
    );

    const rows = calculatePayroll(
      visibleWorkers,
      attendance || [],
      advances || [],
      monthPrefix
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
