'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  DEFAULT_PAY_RATES,
  PayRates,
  PayrollRow,
  Worker,
  female12hDayHourly,
  female12hNightHourly,
  formatStavka,
  isFemale12hWorker,
  isMaleWorker,
  roundMoney,
} from '@/types/database';
import { calculatePayroll, updateAdvance } from '@/lib/actions/payroll';
import { formatCurrency } from '@/lib/utils';
import { exportPayrollToExcel } from '@/lib/utils/excel';
import { formatMonthLabel } from '@/lib/utils/payroll';
import {
  WorkerSearchFilter,
  useWorkerSearchFilter,
} from '@/components/workers/worker-search-filter';
import { Calculator, ChevronLeft, ChevronRight, Download, Save } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';

interface PayrollCalculatorProps {
  month: string;
  initialRows: PayrollRow[] | null;
  rates?: PayRates;
  advancesLocked?: boolean;
}

export function PayrollCalculator({
  month,
  initialRows,
  rates = DEFAULT_PAY_RATES,
  advancesLocked = false,
}: PayrollCalculatorProps) {
  const router = useRouter();
  const [rows, setRows] = useState<PayrollRow[] | null>(initialRows);
  const [calculating, setCalculating] = useState(false);
  const [advances, setAdvances] = useState<Record<string, string>>(() => {
    const map: Record<string, string> = {};
    initialRows?.forEach((r) => {
      map[r.worker.id] = String(r.advanceAmount);
    });
    return map;
  });
  const [savingAdvance, setSavingAdvance] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);

  const workers = useMemo(() => rows?.map((row) => row.worker) ?? [], [rows]);
  const {
    query,
    setQuery,
    gender: filterGender,
    setGender: setFilterGender,
    shiftLength: filterShiftLength,
    setShiftLength: setFilterShiftLength,
    filteredWorkers,
    hasActiveFilters,
    clearFilters,
  } = useWorkerSearchFilter(workers);

  const filteredRows = useMemo(() => {
    if (!rows) return null;
    const ids = new Set(filteredWorkers.map((worker) => worker.id));
    return rows.filter((row) => ids.has(row.worker.id));
  }, [rows, filteredWorkers]);

  const monthLabel = formatMonthLabel(month);

  function changeMonth(offset: number) {
    const [year, mon] = month.split('-').map(Number);
    const d = new Date(year, mon - 1 + offset, 1);
    const newMonth = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    router.push(`/payroll?month=${newMonth}`);
  }

  async function handleCalculate() {
    setCalculating(true);
    try {
      const result = await calculatePayroll(month);
      setRows(result.rows);
      const map: Record<string, string> = {};
      result.rows.forEach((r) => {
        map[r.worker.id] = String(r.advanceAmount);
      });
      setAdvances(map);
    } catch {
      alert('Hisoblashda xatolik');
    } finally {
      setCalculating(false);
    }
  }

  async function handleExportExcel() {
    if (!rows?.length) return;

    setExporting(true);
    try {
      await exportPayrollToExcel(rows, month, rates);
    } catch {
      alert('Excel faylni yuklab olishda xatolik');
    } finally {
      setExporting(false);
    }
  }

  async function handleSaveAdvance(workerId: string) {
    const amount = Number(advances[workerId]);
    if (!Number.isFinite(amount) || amount < 0) {
      alert("Avans manfiy bo'lishi mumkin emas");
      return;
    }
    setSavingAdvance(workerId);
    try {
      const result = await updateAdvance(workerId, month, amount);
      if (result.pending) {
        alert('Bu summa Creator tasdig‘ini kutmoqda. Avans hali o‘zgarmadi.');
        return;
      }
      if (rows) {
        setRows(
          rows.map((r) =>
            r.worker.id === workerId
              ? {
                  ...r,
                  advanceAmount: amount,
                  remainingAmount: r.calculatedSalary - amount,
                }
              : r
          )
        );
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Avans saqlashda xatolik');
    } finally {
      setSavingAdvance(null);
    }
  }

  const totals = filteredRows
    ? {
        hours: filteredRows.reduce(
          (s, r) => s + (isMaleWorker(r.worker) ? 0 : r.totalHours),
          0
        ),
        stavka: roundMoney(filteredRows.reduce((s, r) => s + r.totalStavka, 0)),
        salary: filteredRows.reduce((s, r) => s + r.calculatedSalary, 0),
        advance: filteredRows.reduce((s, r) => s + r.advanceAmount, 0),
        remaining: filteredRows.reduce((s, r) => s + r.remainingAmount, 0),
      }
    : null;

  const workedTotalLabel = totals
    ? [
        totals.hours > 0 ? `${totals.hours} soat` : '',
        totals.stavka > 0 ? `${formatStavka(totals.stavka)} stavka` : '',
      ]
        .filter(Boolean)
        .join(' · ') || '0'
    : '';

  return (
    <>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Button variant="secondary" size="sm" onClick={() => changeMonth(-1)}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="min-w-[140px] text-center text-sm font-medium text-slate-900">
            {monthLabel}
          </span>
          <Button variant="secondary" size="sm" onClick={() => changeMonth(1)}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Button onClick={handleCalculate} disabled={calculating}>
            <Calculator className="mr-2 h-4 w-4" />
            {calculating ? 'Hisoblanmoqda...' : 'Hisoblash'}
          </Button>
          {rows && rows.length > 0 && (
            <Button
              variant="secondary"
              onClick={handleExportExcel}
              disabled={exporting}
            >
              <Download className="mr-2 h-4 w-4" />
              {exporting ? 'Yuklanmoqda...' : 'Excel'}
            </Button>
          )}
        </div>
      </div>

      {rows ? (
        <>
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
            <WorkerSearchFilter
              query={query}
              onQueryChange={setQuery}
              gender={filterGender}
              onGenderChange={setFilterGender}
              shiftLength={filterShiftLength}
              onShiftLengthChange={setFilterShiftLength}
              hasActiveFilters={hasActiveFilters}
              onClearFilters={clearFilters}
            />
          </div>
          <div className="space-y-3 md:hidden">
            {filteredRows && filteredRows.length > 0 ? (
              filteredRows.map((row) => (
                <Card key={row.worker.id}>
                  <CardContent className="space-y-3 p-4">
                    <div className="min-w-0">
                      <p className="font-medium text-slate-900">{row.worker.full_name}</p>
                      {row.worker.position ? (
                        <p className="text-sm text-slate-500">{row.worker.position}</p>
                      ) : null}
                    </div>
                    <dl className="space-y-2 text-sm">
                      <div className="flex items-start justify-between gap-3">
                        <dt className="text-slate-500">Stavka</dt>
                        <dd className="min-w-0 text-right text-slate-700">
                          <WorkerRate worker={row.worker} rates={rates} />
                        </dd>
                      </div>
                      <div className="flex items-start justify-between gap-3">
                        <dt className="text-slate-500">Ishlangan</dt>
                        <dd className="text-right font-medium text-slate-900">
                          <WorkerWorked row={row} />
                        </dd>
                      </div>
                      <div className="flex items-start justify-between gap-3">
                        <dt className="text-slate-500">Hisoblangan maosh</dt>
                        <dd className="font-medium text-emerald-700">
                          {formatCurrency(row.calculatedSalary)}
                        </dd>
                      </div>
                    </dl>
                    <div>
                      <p className="mb-1.5 text-sm text-slate-500">Avans</p>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          min={0}
                          value={advances[row.worker.id] ?? '0'}
                          onChange={(e) =>
                            setAdvances((prev) => ({
                              ...prev,
                              [row.worker.id]: e.target.value,
                            }))
                          }
                          disabled={advancesLocked}
                          className="min-w-0 flex-1 rounded-lg border border-slate-200 px-3 py-2 text-right text-sm disabled:bg-slate-50"
                        />
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => handleSaveAdvance(row.worker.id)}
                          disabled={advancesLocked || savingAdvance === row.worker.id}
                        >
                          <Save className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <div className="flex items-start justify-between gap-3 text-sm">
                      <span className="text-slate-500">Qolgan summa</span>
                      <span className="font-semibold text-indigo-700">
                        {formatCurrency(row.remainingAmount)}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <Card>
                <CardContent className="py-12 text-center text-sm text-slate-500">
                  {rows.length === 0 ? "Faol ishchilar yo'q" : 'Ishchi topilmadi'}
                </CardContent>
              </Card>
            )}
            {totals && filteredRows && filteredRows.length > 0 ? (
              <Card>
                <CardContent className="space-y-2 p-4 text-sm">
                  <p className="font-semibold text-slate-900">Jami</p>
                  <div className="flex justify-between gap-3">
                    <span className="text-slate-500">Ishlangan</span>
                    <span className="text-right font-medium text-slate-900">{workedTotalLabel}</span>
                  </div>
                  <div className="flex justify-between gap-3">
                    <span className="text-slate-500">Maosh</span>
                    <span className="font-medium text-emerald-700">
                      {formatCurrency(totals.salary)}
                    </span>
                  </div>
                  <div className="flex justify-between gap-3">
                    <span className="text-slate-500">Avans</span>
                    <span className="font-medium text-slate-900">
                      {formatCurrency(totals.advance)}
                    </span>
                  </div>
                  <div className="flex justify-between gap-3">
                    <span className="text-slate-500">Qoldiq</span>
                    <span className="font-semibold text-indigo-700">
                      {formatCurrency(totals.remaining)}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ) : null}
          </div>

          <Card className="hidden md:block">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th className="w-12">№</th>
                      <th>F.I.Sh</th>
                      <th>Stavka</th>
                      <th className="text-right">Ishlangan</th>
                      <th className="text-right">Hisoblangan maosh</th>
                      <th className="text-right">Avans</th>
                      <th className="text-right">Qolgan summa</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRows && filteredRows.length > 0 ? (
                      filteredRows.map((row, index) => (
                        <tr key={row.worker.id}>
                          <td className="text-slate-500">{index + 1}</td>
                          <td>
                            <div className="font-medium text-slate-900">
                              {row.worker.full_name}
                            </div>
                            {row.worker.position && (
                              <div className="text-xs text-slate-500">
                                {row.worker.position}
                              </div>
                            )}
                          </td>
                          <td className="text-slate-600">
                            <WorkerRate worker={row.worker} rates={rates} />
                          </td>
                          <td className="text-right font-medium text-slate-900">
                            <WorkerWorked row={row} />
                          </td>
                          <td className="text-right font-medium text-emerald-700">
                            {formatCurrency(row.calculatedSalary)}
                          </td>
                          <td className="text-right">
                            <div className="flex items-center justify-end gap-2">
                              <input
                                type="number"
                                min={0}
                                value={advances[row.worker.id] ?? '0'}
                                onChange={(e) =>
                                  setAdvances((prev) => ({
                                    ...prev,
                                    [row.worker.id]: e.target.value,
                                  }))
                                }
                                disabled={advancesLocked}
                                className="w-28 rounded-lg border border-slate-200 px-2 py-1 text-right text-sm disabled:bg-slate-50"
                              />
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleSaveAdvance(row.worker.id)}
                                disabled={advancesLocked || savingAdvance === row.worker.id}
                              >
                                <Save className="h-4 w-4" />
                              </Button>
                            </div>
                          </td>
                          <td className="text-right font-semibold text-indigo-700">
                            {formatCurrency(row.remainingAmount)}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={7} className="px-6 py-12 text-center text-slate-500">
                          {rows.length === 0 ? "Faol ishchilar yo'q" : 'Ishchi topilmadi'}
                        </td>
                      </tr>
                    )}
                  </tbody>
                  {totals && filteredRows && filteredRows.length > 0 && (
                    <tfoot>
                      <tr className="border-t-2 border-slate-200 bg-slate-50 font-semibold">
                        <td className="px-6 py-4 text-slate-900" colSpan={3}>
                          Jami
                        </td>
                        <td className="px-6 py-4 text-right text-slate-900">
                          {workedTotalLabel}
                        </td>
                        <td className="px-6 py-4 text-right text-emerald-700">
                          {formatCurrency(totals.salary)}
                        </td>
                        <td className="px-6 py-4 text-right text-slate-900">
                          {formatCurrency(totals.advance)}
                        </td>
                        <td className="px-6 py-4 text-right text-indigo-700">
                          {formatCurrency(totals.remaining)}
                        </td>
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>
            </CardContent>
          </Card>
        </>
      ) : (
        <Card>
          <CardContent className="py-16 text-center">
            <Calculator className="mx-auto h-12 w-12 text-slate-300" />
            <p className="mt-4 text-slate-500">
              Oylik maoshni hisoblash uchun &quot;Hisoblash&quot; tugmasini bosing
            </p>
            <p className="mt-1 text-sm text-slate-400">
              Davomat ma&apos;lumotlari asosida har bir ishchining oylik maoshi hisoblanadi
            </p>
          </CardContent>
        </Card>
      )}
    </>
  );
}

function WorkerRate({ worker, rates }: { worker: Worker; rates: PayRates }) {
  if (isFemale12hWorker(worker)) {
    return (
      <div>
        <div>Kunduzgi: {formatCurrency(roundMoney(female12hDayHourly(rates)))}/soat</div>
        <div>Kechki: {formatCurrency(roundMoney(female12hNightHourly(rates)))}/soat</div>
      </div>
    );
  }
  if (isMaleWorker(worker)) {
    return `${formatCurrency(worker.hourly_rate)}/kun`;
  }
  return `${formatCurrency(worker.hourly_rate)}/soat`;
}

function WorkerWorked({ row }: { row: PayrollRow }) {
  if (isMaleWorker(row.worker)) {
    return (
      <div>
        <div>{formatStavka(row.totalStavka)} stavka</div>
        {row.extraWorkPay > 0 ? (
          <div className="text-xs font-normal text-slate-500">
            Qo&apos;shimcha: {formatCurrency(row.extraWorkPay)}
          </div>
        ) : null}
      </div>
    );
  }
  return `${row.totalHours} soat`;
}
