'use client';

import { Card, CardContent } from '@/components/ui/card';
import {
  Attendance,
  ATTENDANCE_SHIFT_LABELS,
  ATTENDANCE_STATUS_LABELS,
  PayrollRow,
  Worker,
  attendanceHasExtraWork,
  formatStavka,
  isFemale12hWorker,
  isMaleWorker,
  DEFAULT_PAY_RATES,
  PayRates,
  maleStavkaFromStored,
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
import type { ReactNode } from 'react';

const WEEKDAYS = ['Du', 'Se', 'Ch', 'Pa', 'Ju', 'Sh', 'Ya'];

interface MyMonthViewProps {
  month: string;
  worker: Worker;
  attendance: Attendance[];
  payroll: PayrollRow;
  rates?: PayRates;
}

function firstWeekdayOffset(month: string): number {
  const [year, mon] = month.split('-').map(Number);
  const weekday = new Date(year, mon - 1, 1).getDay();
  return (weekday + 6) % 7;
}

export function MyMonthView({
  month,
  worker,
  attendance,
  payroll,
  rates = DEFAULT_PAY_RATES,
}: MyMonthViewProps) {
  const router = useRouter();
  const dates = getMonthDates(month);
  const offset = firstWeekdayOffset(month);
  const byDate = new Map(attendance.map((row) => [row.date, row]));
  const workedDays = attendance.filter(
    (row) => row.status === 'present' || row.status === 'late'
  ).length;
  const male = isMaleWorker(worker);

  function changeMonth(step: number) {
    const [year, mon] = month.split('-').map(Number);
    const next = new Date(year, mon - 1 + step, 1);
    const nextMonth = `${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, '0')}`;
    router.push(`/my?month=${nextMonth}`);
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Mening davomatim</h1>
        <p className="mt-1 text-sm text-slate-500">
          {worker.full_name}
          {worker.login_code ? (
            <>
              {' · '}
              <span className="font-mono font-medium text-slate-800">{worker.login_code}</span>
            </>
          ) : null}
        </p>
      </div>

      <div className="mb-6 flex items-center justify-between rounded-xl border border-slate-200 bg-white px-3 py-2">
        <button
          type="button"
          onClick={() => changeMonth(-1)}
          className="rounded-lg p-2 text-slate-600 hover:bg-slate-100"
          aria-label="Oldingi oy"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <p className="text-sm font-semibold capitalize text-slate-900">
          {formatMonthLabel(month)}
        </p>
        <button
          type="button"
          onClick={() => changeMonth(1)}
          className="rounded-lg p-2 text-slate-600 hover:bg-slate-100"
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
          color="text-emerald-600 bg-emerald-50"
        />
        <SummaryCard
          icon={Clock}
          label={male ? 'Jami stavka' : 'Jami soat'}
          value={male ? formatStavka(payroll.totalStavka) : String(payroll.totalHours)}
          color="text-sky-600 bg-sky-50"
        />
        <SummaryCard
          icon={Wallet}
          label="Hisoblangan maosh"
          value={formatCurrency(payroll.calculatedSalary)}
          color="text-indigo-600 bg-indigo-50"
        />
        <SummaryCard
          icon={Wallet}
          label="Avans / qoldiq"
          value={
            <>
              <span className="block">{formatCurrency(payroll.advanceAmount)}</span>
              <span className="block text-base font-medium text-slate-700">
                {formatCurrency(payroll.remainingAmount)}
              </span>
            </>
          }
          color="text-slate-600 bg-slate-100"
        />
      </div>

      <Card>
        <CardContent className="pt-5">
          <div className="grid grid-cols-7 gap-1 text-center text-xs font-medium text-slate-500">
            {WEEKDAYS.map((day) => (
              <div key={day} className="min-w-0 py-1">
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
                  male={male}
                  extraPay={rates.maleExtraWorkPay}
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
  value: ReactNode;
  color: string;
}) {
  return (
    <Card>
      <CardContent className="flex items-center gap-3 pt-5">
        <div className={`rounded-lg p-2.5 ${color}`}>
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <p className="text-xs text-slate-500">{label}</p>
          <p className="break-words text-lg font-semibold text-slate-900">{value}</p>
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
  male,
  extraPay,
}: {
  day: number;
  record: Attendance | undefined;
  future: boolean;
  showShift: boolean;
  male: boolean;
  extraPay: number;
}) {
  let classes =
    'min-h-16 min-w-0 overflow-hidden break-words rounded-lg border px-0.5 py-1.5 text-left sm:min-h-[4.5rem] sm:px-1';
  let statusLabel = '';
  let shortLabel = '';
  let detail = '';

  if (future) {
    classes += ' border-slate-100 bg-slate-50 text-slate-300';
  } else if (!record) {
    classes += ' border-slate-200 bg-white text-slate-400';
    statusLabel = '—';
    shortLabel = '—';
  } else if (record.status === 'present' || record.status === 'late') {
    classes +=
      record.status === 'late'
        ? ' border-yellow-200 bg-yellow-50 text-yellow-900'
        : ' border-green-200 bg-green-50 text-green-900';
    statusLabel = ATTENDANCE_STATUS_LABELS[record.status];
    shortLabel = record.status === 'late' ? 'Kech' : 'Keldi';
    detail = male
      ? `${formatStavka(maleStavkaFromStored(record.hours_worked))} stavka`
      : `${record.hours_worked} soat`;
    if (male && attendanceHasExtraWork(record.notes)) {
      detail += ` · +${formatCurrency(extraPay)}`;
    }
    if (showShift && record.shift) {
      detail += ` · ${ATTENDANCE_SHIFT_LABELS[record.shift]}`;
    }
  } else {
    classes += ' border-red-200 bg-red-50 text-red-900';
    statusLabel = ATTENDANCE_STATUS_LABELS[record.status];
    shortLabel =
      record.status === 'absent'
        ? 'Yo‘q'
        : record.status === 'holiday'
          ? 'Ta’til'
          : 'Kas.';
    detail = getAbsenceReason(record.status, record.notes);
  }

  return (
    <div className={classes}>
      <div className="text-xs font-semibold">{day}</div>
      {shortLabel ? (
        <div className="mt-0.5 text-[10px] leading-tight sm:hidden">{shortLabel}</div>
      ) : null}
      {statusLabel ? (
        <div className="mt-0.5 hidden text-[10px] leading-tight sm:block">{statusLabel}</div>
      ) : null}
      {detail ? (
        <div className="mt-0.5 hidden break-words text-[10px] leading-tight opacity-80 sm:line-clamp-2">
          {detail}
        </div>
      ) : null}
    </div>
  );
}
