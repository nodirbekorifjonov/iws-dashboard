import { getAttendanceRepository, getAuthRepository } from '@/lib/providers';
import { MarkAttendanceInput } from '@/lib/repositories/types';
import { AttendanceStatus } from '@/types/database';

export async function getAttendanceByMonth(month: string) {
  return getAttendanceRepository().findByMonth(month);
}

export async function markAttendanceBatch(
  records: {
    workerId: string;
    date: string;
    status: AttendanceStatus;
    hoursWorked?: number;
    notes?: string;
  }[]
) {
  const sessionUser = await getAuthRepository().getSessionUser();

  const inputs: MarkAttendanceInput[] = records.map((r) => ({
    worker_id: r.workerId,
    date: r.date,
    status: r.status,
    hours_worked: r.hoursWorked ?? 0,
    notes: r.notes ?? null,
    marked_by: sessionUser?.id ?? null,
  }));

  return getAttendanceRepository().markBatch(inputs);
}

export async function getAttendanceHistory(workerId: string, month: string) {
  return getAttendanceRepository().findHistory(workerId, month);
}

export async function getDashboardStats() {
  return getAttendanceRepository().getDashboardStats();
}
