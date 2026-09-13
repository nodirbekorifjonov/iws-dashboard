import { PayrollRepository } from '@/lib/repositories/payroll.repository';
import {
  PayrollCalculationResult,
  UpdateAdvanceInput,
} from '@/lib/repositories/types';
import { calculatePayroll, getMonthDateRange } from '@/lib/utils/payroll';
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
      .eq('is_active', true)
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

    const rows = calculatePayroll(
      workers || [],
      attendance || [],
      advances || [],
      monthPrefix
    );

    return { month: monthPrefix, rows };
  }

  async updateAdvance(input: UpdateAdvanceInput): Promise<void> {
    const supabase = await createSupabaseServerClient();
    const monthDate = `${input.month.slice(0, 7)}-01`;

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
