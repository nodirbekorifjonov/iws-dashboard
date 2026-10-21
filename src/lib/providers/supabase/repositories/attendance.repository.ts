import { AttendanceRepository } from '@/lib/repositories/attendance.repository';
import {
  AttendanceByMonthResult,
  DashboardStats,
  MarkAttendanceInput,
} from '@/lib/repositories/types';
import { Attendance } from '@/types/database';
import { getMonthDateRange, todayInTashkent, workersVisibleForMonth } from '@/lib/utils/payroll';
import { fetchAllPages } from '../fetch-all';
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

    return {
      workers: workersVisibleForMonth(
        workers || [],
        attendance.map((row) => row.worker_id)
      ),
      attendance,
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

    const chunkSize = 400;
    for (let index = 0; index < records.length; index += chunkSize) {
      const chunk = records.slice(index, index + chunkSize);
      const { error } = await supabase
        .from('attendance')
        .upsert(chunk, { onConflict: 'worker_id,date' });

      if (!error) continue;

      const text = `${error.code ?? ''} ${error.message ?? ''}`;
      const missingShift =
        error.code === 'PGRST204' ||
        text.includes("Could not find the 'shift' column");
      if (!missingShift) throw error;

      const withoutShift = chunk.map(({ shift: _shift, ...rest }) => rest);
      const retry = await supabase
        .from('attendance')
        .upsert(withoutShift, { onConflict: 'worker_id,date' });
      if (retry.error) throw retry.error;
    }
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
    const today = todayInTashkent();

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

    return {
      totalWorkers: totalWorkers || 0,
      todayPresent: present,
      todayAbsent: explicitAbsent,
      todayLate: late,
    };
  }
}
