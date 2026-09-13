import { PayrollRow, Worker } from '@/types/database';
import { getAbsenceReason } from '@/lib/utils/payroll';

interface AttendanceCellData {
  status: string;
  hoursWorked: number;
  notes: string;
}

function cellKey(workerId: string, date: string) {
  return `${workerId}:${date}`;
}

function formatAttendanceCell(cell: AttendanceCellData | undefined): string {
  if (!cell) return '';
  if (cell.status === 'present' || cell.status === 'late') {
    return String(cell.hoursWorked);
  }
  return getAbsenceReason(cell.status, cell.notes || null);
}

export async function exportAttendanceToExcel(
  workers: Worker[],
  cells: Record<string, AttendanceCellData>,
  month: string,
  dates: string[]
) {
  const XLSX = await import('xlsx');

  const header = ['F.I.Sh', 'Lavozim', ...dates.map((d) => d.slice(8)), 'Jami soat'];
  const rows = workers.map((worker) => {
    let totalHours = 0;
    const dayValues = dates.map((date) => {
      const cell = cells[cellKey(worker.id, date)];
      if (cell && (cell.status === 'present' || cell.status === 'late')) {
        totalHours += cell.hoursWorked || 0;
      }
      return formatAttendanceCell(cell);
    });

    return [worker.full_name, worker.position || '', ...dayValues, totalHours];
  });

  const worksheet = XLSX.utils.aoa_to_sheet([header, ...rows]);
  worksheet['!cols'] = [
    { wch: 28 },
    { wch: 22 },
    ...dates.map(() => ({ wch: 6 })),
    { wch: 10 },
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Davomat');
  XLSX.writeFile(workbook, `davomat-${month.slice(0, 7)}.xlsx`);
}

export async function exportPayrollToExcel(rows: PayrollRow[], month: string) {
  const XLSX = await import('xlsx');

  const header = [
    'F.I.Sh',
    'Lavozim',
    'Soatbay stavka',
    'Ishlangan soat',
    'Hisoblangan maosh',
    'Avans',
    'Qolgan summa',
  ];

  const dataRows = rows.map((row) => [
    row.worker.full_name,
    row.worker.position || '',
    row.worker.hourly_rate,
    row.totalHours,
    row.calculatedSalary,
    row.advanceAmount,
    row.remainingAmount,
  ]);

  const totals = rows.reduce(
    (acc, row) => ({
      hours: acc.hours + row.totalHours,
      salary: acc.salary + row.calculatedSalary,
      advance: acc.advance + row.advanceAmount,
      remaining: acc.remaining + row.remainingAmount,
    }),
    { hours: 0, salary: 0, advance: 0, remaining: 0 }
  );

  const footer = [
    'Jami',
    '',
    '',
    totals.hours,
    totals.salary,
    totals.advance,
    totals.remaining,
  ];

  const worksheet = XLSX.utils.aoa_to_sheet([header, ...dataRows, footer]);
  worksheet['!cols'] = [
    { wch: 28 },
    { wch: 22 },
    { wch: 14 },
    { wch: 14 },
    { wch: 18 },
    { wch: 14 },
    { wch: 16 },
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Hisoblash');
  XLSX.writeFile(workbook, `hisoblash-${month.slice(0, 7)}.xlsx`);
}
