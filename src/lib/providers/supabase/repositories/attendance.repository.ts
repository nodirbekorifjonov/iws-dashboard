import { AttendanceRepository } from '@/lib/repositories/attendance.repository';
import {
  AttendanceByMonthResult,
  DashboardStats,
  MarkAttendanceInput,
} from '@/lib/repositories/types';
import { Attendance } from '@/types/database';
import { getMonthDateRange } from '@/lib/utils/payroll';
import { createSupabaseServerClient } from '../server';

export class SupabaseAttendanceRepository implements AttendanceRepository {
  async findByMonth(month: string): Promise<AttendanceByMonthResult> {
    const supabase = await createSupabaseServerClient();
    const { startDate, endDate } = getMonthDateRange(month);

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

    return {
      workers: workers || [],
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
      notes: input.notes ?? null,
      marked_by: input.marked_by ?? null,
    }));

    const { error } = await supabase
      .from('attendance')
      .upsert(records, { onConflict: 'worker_id,date' });

    if (error) throw error;
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

    const { count: totalWorkers } = await supabase
      .from('workers')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true);

    const { data: todayAttendance } = await supabase
      .from('attendance')
      .select('status')
      .eq('date', today);

    const present =
      todayAttendance?.filter((a) => a.status === 'present').length || 0;
    const absent =
      todayAttendance?.filter((a) => a.status === 'absent').length || 0;
    const late =
      todayAttendance?.filter((a) => a.status === 'late').length || 0;

    return {
      totalWorkers: totalWorkers || 0,
      todayPresent: present,
      todayAbsent: absent,
      todayLate: late,
    };
  }
}
