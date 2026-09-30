import { AttendanceRepository } from '@/lib/repositories/attendance.repository';
import {
  AttendanceByMonthResult,
  DashboardStats,
  MarkAttendanceInput,
} from '@/lib/repositories/types';
import { Attendance } from '@/types/database';
import { getMonthDateRange, workersVisibleForMonth } from '@/lib/utils/payroll';
import { createSupabaseServerClient } from '../server';

export class SupabaseAttendanceRepository implements AttendanceRepository {
  async findByMonth(month: string): Promise<AttendanceByMonthResult> {
    const supabase = await createSupabaseServerClient();
    const { startDate, endDate } = getMonthDateRange(month);

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

    return {
      workers: workersVisibleForMonth(
        workers || [],
        (attendance || []).map((row) => row.worker_id)
      ),
      attendance: attendance || [],
    };
  }

  async markBatch(inputs: MarkAttendanceInput[]): Promise<void> {
    if (inputs.length === 0) return;

    const supabase = await createSupabaseServerClient();
    const records = inputs.map((input) => ({
      worker_id: input.worker_id,
      date: input.date,
      status: input.status,
      hours_worked: input.hours_worked ?? 0,
      shift: input.shift ?? null,
      notes: input.notes ?? null,
      marked_by: input.marked_by ?? null,
    }));

    const { error } = await supabase
      .from('attendance')
      .upsert(records, { onConflict: 'worker_id,date' });

    if (!error) return;

    const text = `${error.code ?? ''} ${error.message ?? ''}`;
    const missingShift =
      error.code === 'PGRST204' ||
      text.includes("Could not find the 'shift' column");
    if (missingShift) {
      const withoutShift = records.map(({ shift: _shift, ...rest }) => rest);
      const retry = await supabase
        .from('attendance')
        .upsert(withoutShift, { onConflict: 'worker_id,date' });
      if (retry.error) throw retry.error;
      return;
    }

    throw error;
  }

  async findHistory(workerId: string, month: string): Promise<Attendance[]> {
    const supabase = await createSupabaseServerClient();
    const { startDate, endDate } = getMonthDateRange(month);

    const { data, error } = await supabase
      .from('attendance')
      .select('*')
      .eq('worker_id', workerId)
      .gte('date', startDate)
      .lte('date', endDate)
      .order('date');

    if (error) throw error;
    return data;
  }

  async getDashboardStats(): Promise<DashboardStats> {
    const supabase = await createSupabaseServerClient();
    const today = new Date().toISOString().split('T')[0];

    const { count: totalWorkers, error: workersError } = await supabase
      .from('workers')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true);

    if (workersError) throw workersError;

    const { data: todayAttendance, error: attendanceError } = await supabase
      .from('attendance')
      .select('status')
      .eq('date', today);

    if (attendanceError) throw attendanceError;

    const present =
      todayAttendance?.filter((a) => a.status === 'present').length || 0;
    const late =
      todayAttendance?.filter((a) => a.status === 'late').length || 0;
    const explicitAbsent =
      todayAttendance?.filter((a) => a.status === 'absent').length || 0;
    const marked = todayAttendance?.length || 0;
    const unmarked = Math.max(0, (totalWorkers || 0) - marked);

    return {
      totalWorkers: totalWorkers || 0,
      todayPresent: present,
      todayAbsent: explicitAbsent + unmarked,
      todayLate: late,
    };
  }
}
