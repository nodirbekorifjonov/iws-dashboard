'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { PayrollRow } from '@/types/database';
import { calculatePayroll, updateAdvance } from '@/lib/actions/payroll';
import { formatCurrency } from '@/lib/utils';
import { exportPayrollToExcel } from '@/lib/utils/excel';
import { formatMonthLabel } from '@/lib/utils/payroll';
import { Calculator, ChevronLeft, ChevronRight, Download, Save } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

interface PayrollCalculatorProps {
  month: string;
  initialRows: PayrollRow[] | null;
}

export function PayrollCalculator({ month, initialRows }: PayrollCalculatorProps) {
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
      await exportPayrollToExcel(rows, month);
    } catch {
      alert('Excel faylni yuklab olishda xatolik');
    } finally {
      setExporting(false);
    }
  }

  async function handleSaveAdvance(workerId: string) {
    const amount = parseFloat(advances[workerId]) || 0;
    setSavingAdvance(workerId);
    try {
      await updateAdvance(workerId, month, amount);
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
      router.refresh();
    } catch {
      alert('Avans saqlashda xatolik');
    } finally {
      setSavingAdvance(null);
    }
  }

  const totals = rows
    ? {
        hours: rows.reduce((s, r) => s + r.totalHours, 0),
        salary: rows.reduce((s, r) => s + r.calculatedSalary, 0),
        advance: rows.reduce((s, r) => s + r.advanceAmount, 0),
        remaining: rows.reduce((s, r) => s + r.remainingAmount, 0),
      }
    : null;

  return (
    <>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Button variant="secondary" size="sm" onClick={() => changeMonth(-1)}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm font-medium text-gray-900 min-w-[140px] text-center">
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
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50">
                    <th className="px-6 py-3 text-left font-medium text-gray-600">
                      F.I.Sh
                    </th>
                    <th className="px-6 py-3 text-left font-medium text-gray-600">
                      Soatbay stavka
                    </th>
                    <th className="px-6 py-3 text-right font-medium text-gray-600">
                      Ishlangan soat
                    </th>
                    <th className="px-6 py-3 text-right font-medium text-gray-600">
                      Hisoblangan maosh
                    </th>
                    <th className="px-6 py-3 text-right font-medium text-gray-600">
                      Avans
                    </th>
                    <th className="px-6 py-3 text-right font-medium text-gray-600">
                      Qolgan summa
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {rows.map((row) => (
                    <tr key={row.worker.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="font-medium text-gray-900">
                          {row.worker.full_name}
                        </div>
                        {row.worker.position && (
                          <div className="text-xs text-gray-500">
                            {row.worker.position}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 text-gray-600">
                        {formatCurrency(row.worker.hourly_rate)}/soat
                      </td>
                      <td className="px-6 py-4 text-right font-medium text-gray-900">
                        {row.totalHours} soat
                      </td>
                      <td className="px-6 py-4 text-right font-medium text-green-700">
                        {formatCurrency(row.calculatedSalary)}
                      </td>
                      <td className="px-6 py-4 text-right">
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
                            className="w-28 rounded-lg border border-gray-300 px-2 py-1 text-sm text-right"
                          />
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleSaveAdvance(row.worker.id)}
                            disabled={savingAdvance === row.worker.id}
                          >
                            <Save className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right font-bold text-amber-700">
                        {formatCurrency(row.remainingAmount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                {totals && (
                  <tfoot>
                    <tr className="border-t-2 border-gray-300 bg-gray-50 font-semibold">
                      <td className="px-6 py-4 text-gray-900" colSpan={2}>
                        Jami
                      </td>
                      <td className="px-6 py-4 text-right text-gray-900">
                        {totals.hours} soat
                      </td>
                      <td className="px-6 py-4 text-right text-green-700">
                        {formatCurrency(totals.salary)}
                      </td>
                      <td className="px-6 py-4 text-right text-gray-900">
                        {formatCurrency(totals.advance)}
                      </td>
                      <td className="px-6 py-4 text-right text-amber-700">
                        {formatCurrency(totals.remaining)}
                      </td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="py-16 text-center">
            <Calculator className="mx-auto h-12 w-12 text-gray-300" />
            <p className="mt-4 text-gray-500">
              Oylik maoshni hisoblash uchun &quot;Hisoblash&quot; tugmasini bosing
            </p>
            <p className="mt-1 text-sm text-gray-400">
              Davomat ma&apos;lumotlari asosida har bir ishchining oylik maoshi hisoblanadi
            </p>
          </CardContent>
        </Card>
      )}
    </>
  );
}
