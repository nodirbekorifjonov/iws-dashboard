import { Attendance, Worker, Advance, PayrollRow } from '@/types/database';
import { ABSENCE_REASON_LABELS } from '@/types/database';

export function calculatePayroll(
  workers: Worker[],
  attendance: Attendance[],
  advances: Advance[],
  month: string
): PayrollRow[] {
  const monthPrefix = month.slice(0, 7);

  return workers.map((worker) => {
    const workerAttendance = attendance.filter(
      (a) => a.worker_id === worker.id && a.date.startsWith(monthPrefix)
    );

    const totalHours = workerAttendance
      .filter((a) => a.status === 'present' || a.status === 'late')
      .reduce((sum, a) => sum + (a.hours_worked || 0), 0);

    const calculatedSalary = totalHours * worker.hourly_rate;

    const advance = advances.find(
      (a) => a.worker_id === worker.id && a.month.startsWith(monthPrefix)
    );
    const advanceAmount = advance?.amount || 0;
    const remainingAmount = calculatedSalary - advanceAmount;

    return {
      worker,
      totalHours,
      calculatedSalary,
      advanceAmount,
      remainingAmount,
    };
  });
}

export function getAbsenceReason(status: string, notes: string | null): string {
  if (notes) return notes;
  return ABSENCE_REASON_LABELS[status] || 'Kelmadi';
}

export function getDaysInMonth(month: string): number {
  const [year, mon] = month.split('-').map(Number);
  return new Date(year, mon, 0).getDate();
}

export function getMonthDateRange(month: string): { startDate: string; endDate: string } {
  const prefix = month.slice(0, 7);
  const days = getDaysInMonth(prefix);
  return {
    startDate: `${prefix}-01`,
    endDate: `${prefix}-${String(days).padStart(2, '0')}`,
  };
}

export function formatMonthLabel(month: string): string {
  const [year, mon] = month.split('-').map(Number);
  const date = new Date(year, mon - 1, 1);
  return date.toLocaleDateString('uz-UZ', { year: 'numeric', month: 'long' });
}

export function isFutureDate(dateStr: string): boolean {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const date = new Date(dateStr + 'T00:00:00');
  return date > today;
}

export function getMonthDates(month: string): string[] {
  const days = getDaysInMonth(month);
  const prefix = month.slice(0, 7);
  return Array.from({ length: days }, (_, i) => {
    const day = String(i + 1).padStart(2, '0');
    return `${prefix}-${day}`;
  });
}
