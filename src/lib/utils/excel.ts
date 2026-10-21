import {
  PayrollRow,
  Worker,
  AttendanceShift,
  attendanceHasExtraWork,
  female12hDayHourly,
  female12hNightHourly,
  formatStavka,
  isFemale12hWorker,
  isMaleWorker,
  MALE_EXTRA_WORK_PAY,
  maleStavkaFromStored,
  roundMoney,
} from '@/types/database';
import { getAbsenceReason } from '@/lib/utils/payroll';

interface AttendanceCellData {
  status: string;
  hoursWorked: number;
  notes: string;
  shift?: AttendanceShift | null;
}

function cellKey(workerId: string, date: string) {
  return `${workerId}:${date}`;
}

function formatAttendanceCell(
  cell: AttendanceCellData | undefined,
  worker: Worker
): string {
  if (!cell) return '';
  if (cell.status === 'present' || cell.status === 'late') {
    if (isMaleWorker(worker)) {
      const label = formatStavka(maleStavkaFromStored(cell.hoursWorked));
      return attendanceHasExtraWork(cell.notes) ? `${label}+` : label;
    }
    if (isFemale12hWorker(worker) && cell.shift) {
      const suffix = cell.shift === 'night' ? 'T' : 'K';
      return `${cell.hoursWorked}${suffix}`;
    }
    return String(cell.hoursWorked);
  }
  return getAbsenceReason(cell.status, cell.notes || null);
}

function formatPayrollRate(row: PayrollRow): string | number {
  if (isMaleWorker(row.worker)) {
    return row.worker.hourly_rate;
  }
  if (isFemale12hWorker(row.worker)) {
    return `${roundMoney(female12hDayHourly())} / ${roundMoney(female12hNightHourly())}`;
  }
  return row.worker.hourly_rate;
}

export async function exportAttendanceToExcel(
  workers: Worker[],
  cells: Record<string, AttendanceCellData>,
  month: string,
  dates: string[]
) {
  const XLSX = await import('xlsx');

  const header = [
    'F.I.Sh',
    'Lavozim',
    ...dates.map((d) => d.slice(8)),
    'Jami soat',
    'Jami stavka',
    'Qo‘shimcha ish',
  ];
  const rows = workers.map((worker) => {
    let totalHours = 0;
    let totalStavka = 0;
    let extraPay = 0;
    const male = isMaleWorker(worker);
    const dayValues = dates.map((date) => {
      const cell = cells[cellKey(worker.id, date)];
      if (cell && (cell.status === 'present' || cell.status === 'late')) {
        if (male) {
          totalStavka += maleStavkaFromStored(cell.hoursWorked || 0);
          if (attendanceHasExtraWork(cell.notes)) extraPay += MALE_EXTRA_WORK_PAY;
        } else {
          totalHours += cell.hoursWorked || 0;
        }
      }
      return formatAttendanceCell(cell, worker);
    });

    return [
      worker.full_name,
      worker.position || '',
      ...dayValues,
      male ? '' : totalHours,
      male ? roundMoney(totalStavka) : '',
      male && extraPay > 0 ? extraPay : '',
    ];
  });

  const worksheet = XLSX.utils.aoa_to_sheet([header, ...rows]);
  worksheet['!cols'] = [
    { wch: 28 },
    { wch: 22 },
    ...dates.map(() => ({ wch: 6 })),
    { wch: 10 },
    { wch: 12 },
    { wch: 16 },
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
    'Stavka',
    'Ishlangan soat',
    'Ishlangan stavka',
    'Qo‘shimcha ish',
    'Hisoblangan maosh',
    'Avans',
    'Qolgan summa',
  ];

  const dataRows = rows.map((row) => [
    row.worker.full_name,
    row.worker.position || '',
    formatPayrollRate(row),
    isMaleWorker(row.worker) ? '' : row.totalHours,
    isMaleWorker(row.worker) ? row.totalStavka : '',
    isMaleWorker(row.worker) ? row.extraWorkPay : '',
    row.calculatedSalary,
    row.advanceAmount,
    row.remainingAmount,
  ]);

  const totals = rows.reduce(
    (acc, row) => ({
      hours: acc.hours + (isMaleWorker(row.worker) ? 0 : row.totalHours),
      stavka: acc.stavka + row.totalStavka,
      extra: acc.extra + row.extraWorkPay,
      salary: acc.salary + row.calculatedSalary,
      advance: acc.advance + row.advanceAmount,
      remaining: acc.remaining + row.remainingAmount,
    }),
    { hours: 0, stavka: 0, extra: 0, salary: 0, advance: 0, remaining: 0 }
  );

  const footer = [
    'Jami',
    '',
    '',
    totals.hours,
    roundMoney(totals.stavka),
    totals.extra,
    totals.salary,
    totals.advance,
    totals.remaining,
  ];

  const worksheet = XLSX.utils.aoa_to_sheet([header, ...dataRows, footer]);
  worksheet['!cols'] = [
    { wch: 28 },
    { wch: 22 },
    { wch: 22 },
    { wch: 14 },
    { wch: 16 },
    { wch: 16 },
    { wch: 18 },
    { wch: 14 },
    { wch: 16 },
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Hisoblash');
  XLSX.writeFile(workbook, `hisoblash-${month.slice(0, 7)}.xlsx`);
}
