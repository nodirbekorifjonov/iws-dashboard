'use client';

import { Card, CardContent } from '@/components/ui/card';
import {
  Attendance,
  ATTENDANCE_SHIFT_LABELS,
  ATTENDANCE_STATUS_LABELS,
  PayrollRow,
  Worker,
  isFemale12hWorker,
} from '@/types/database';
import { formatCurrency } from '@/lib/utils';
import {
  formatMonthLabel,
  getAbsenceReason,
  getMonthDates,
  isFutureDate,
} from '@/lib/utils/payroll';
import { CalendarDays, ChevronLeft, ChevronRight, Clock, Wallet } from 'lucide-react';
import { useRouter } from 'next/navigation';

const WEEKDAYS = ['Du', 'Se', 'Ch', 'Pa', 'Ju', 'Sh', 'Ya'];

interface MyMonthViewProps {
  month: string;
  worker: Worker;
  attendance: Attendance[];
  payroll: PayrollRow;
}

function firstWeekdayOffset(month: string): number {
  const [year, mon] = month.split('-').map(Number);
  const weekday = new Date(year, mon - 1, 1).getDay();
  return (weekday + 6) % 7;
}

export function MyMonthView({ month, worker, attendance, payroll }: MyMonthViewProps) {
  const router = useRouter();
  const dates = getMonthDates(month);
  const offset = firstWeekdayOffset(month);
  const byDate = new Map(attendance.map((row) => [row.date, row]));
  const workedDays = attendance.filter(
    (row) => row.status === 'present' || row.status === 'late'
  ).length;

  function changeMonth(step: number) {
    const [year, mon] = month.split('-').map(Number);
    const next = new Date(year, mon - 1 + step, 1);
    const nextMonth = `${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, '0')}`;
    router.push(`/my?month=${nextMonth}`);
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Mening davomatim</h1>
        <p className="mt-1 text-sm text-gray-600">
          {worker.full_name}
          {worker.login_code ? (
            <>
              {' · '}
              <span className="font-mono font-medium text-gray-800">{worker.login_code}</span>
            </>
          ) : null}
        </p>
      </div>

      <div className="mb-6 flex items-center justify-between rounded-xl border border-gray-200 bg-white px-3 py-2 shadow-sm">
        <button
          type="button"
          onClick={() => changeMonth(-1)}
          className="rounded-lg p-2 text-gray-600 hover:bg-gray-100"
          aria-label="Oldingi oy"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <p className="text-sm font-semibold capitalize text-gray-900">
          {formatMonthLabel(month)}
        </p>
        <button
          type="button"
          onClick={() => changeMonth(1)}
          className="rounded-lg p-2 text-gray-600 hover:bg-gray-100"
          aria-label="Keyingi oy"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>

      <div className="mb-6 grid gap-3 sm:grid-cols-2">
        <SummaryCard
          icon={CalendarDays}
          label="Ishlagan kunlar"
          value={String(workedDays)}
          color="text-green-700 bg-green-100"
        />
        <SummaryCard
          icon={Clock}
          label="Jami soat"
          value={String(payroll.totalHours)}
          color="text-blue-700 bg-blue-100"
        />
        <SummaryCard
          icon={Wallet}
          label="Hisoblangan maosh"
          value={formatCurrency(payroll.calculatedSalary)}
          color="text-amber-700 bg-amber-100"
        />
        <SummaryCard
          icon={Wallet}
          label="Avans / qoldiq"
          value={`${formatCurrency(payroll.advanceAmount)} / ${formatCurrency(payroll.remainingAmount)}`}
          color="text-gray-700 bg-gray-100"
        />
      </div>

      <Card>
        <CardContent className="pt-5">
          <div className="grid grid-cols-7 gap-1 text-center text-xs font-medium text-gray-500">
            {WEEKDAYS.map((day) => (
              <div key={day} className="py-1">
                {day}
              </div>
            ))}
          </div>
          <div className="mt-1 grid grid-cols-7 gap-1">
            {Array.from({ length: offset }).map((_, index) => (
              <div key={`pad-${index}`} />
            ))}
            {dates.map((date) => {
              const day = Number(date.slice(-2));
              const record = byDate.get(date);
              const future = isFutureDate(date);
              return (
                <DayCell
                  key={date}
                  day={day}
                  record={record}
                  future={future}
                  showShift={isFemale12hWorker(worker)}
                />
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function SummaryCard({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: typeof CalendarDays;
  label: string;
  value: string;
  color: string;
}) {
  return (
    <Card>
      <CardContent className="flex items-center gap-3 pt-5">
        <div className={`rounded-lg p-2.5 ${color}`}>
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <p className="text-xs text-gray-600">{label}</p>
          <p className="truncate text-lg font-bold text-gray-900">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function DayCell({
  day,
  record,
  future,
  showShift,
}: {
  day: number;
  record: Attendance | undefined;
  future: boolean;
  showShift: boolean;
}) {
  let classes = 'min-h-[4.5rem] rounded-lg border px-1 py-1.5 text-left';
  let statusLabel = '';
  let detail = '';

  if (future) {
    classes += ' border-gray-100 bg-gray-50 text-gray-300';
  } else if (!record) {
    classes += ' border-gray-200 bg-white text-gray-400';
    statusLabel = '—';
  } else if (record.status === 'present' || record.status === 'late') {
    classes +=
      record.status === 'late'
        ? ' border-yellow-200 bg-yellow-50 text-yellow-900'
        : ' border-green-200 bg-green-50 text-green-900';
    statusLabel = ATTENDANCE_STATUS_LABELS[record.status];
    detail = `${record.hours_worked} soat`;
    if (showShift && record.shift) {
      detail += ` · ${ATTENDANCE_SHIFT_LABELS[record.shift]}`;
    }
  } else {
    classes += ' border-red-200 bg-red-50 text-red-900';
    statusLabel = ATTENDANCE_STATUS_LABELS[record.status];
    detail = getAbsenceReason(record.status, record.notes);
  }

  return (
    <div className={classes}>
      <div className="text-xs font-semibold">{day}</div>
      {statusLabel ? (
        <div className="mt-0.5 text-[10px] leading-tight">{statusLabel}</div>
      ) : null}
      {detail ? (
        <div className="mt-0.5 line-clamp-2 text-[10px] leading-tight opacity-80">{detail}</div>
      ) : null}
    </div>
  );
}
