'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Modal } from '@/components/ui/modal';
import { Input } from '@/components/ui/input';
import { Attendance, AttendanceStatus, Worker } from '@/types/database';
import { saveAttendanceBatch } from '@/lib/actions/attendance';
import {
  getAbsenceReason,
  getDaysInMonth,
  getMonthDates,
  isFutureDate,
  formatMonthLabel,
} from '@/lib/utils/payroll';
import { exportAttendanceToExcel } from '@/lib/utils/excel';
import {
  ChevronLeft,
  ChevronRight,
  Check,
  X,
  Pencil,
  CheckCircle,
  Download,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState, useCallback } from 'react';

interface CellData {
  status: AttendanceStatus;
  hoursWorked: number;
  notes: string;
}

interface AttendanceFormProps {
  month: string;
  workers: Worker[];
  attendance: Attendance[];
}

function cellKey(workerId: string, date: string) {
  return `${workerId}:${date}`;
}

export function AttendanceForm({
  month,
  workers,
  attendance,
}: AttendanceFormProps) {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [selectedCell, setSelectedCell] = useState<{
    workerId: string;
    date: string;
    workerName: string;
  } | null>(null);

  const [editModal, setEditModal] = useState<{
    workerId: string;
    date: string;
    mode: 'present' | 'absent';
  } | null>(null);
  const [modalHours, setModalHours] = useState('8');
  const [modalNotes, setModalNotes] = useState('Sababsiz kelmadi');

  const buildInitialCells = useCallback(() => {
    const map: Record<string, CellData> = {};
    attendance.forEach((a) => {
      map[cellKey(a.worker_id, a.date)] = {
        status: a.status,
        hoursWorked: a.hours_worked || 0,
        notes: a.notes || '',
      };
    });
    return map;
  }, [attendance]);

  const [cells, setCells] = useState<Record<string, CellData>>(buildInitialCells);
  const [exporting, setExporting] = useState(false);

  const daysInMonth = getDaysInMonth(month);
  const dates = getMonthDates(month);
  const monthLabel = formatMonthLabel(month);

  function changeMonth(offset: number) {
    const [year, mon] = month.split('-').map(Number);
    const d = new Date(year, mon - 1 + offset, 1);
    const newMonth = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    router.push(`/attendance?month=${newMonth}`);
  }

  function getCell(workerId: string, date: string): CellData | undefined {
    return cells[cellKey(workerId, date)];
  }

  function handleCellClick(workerId: string, date: string, workerName: string) {
    if (isFutureDate(date)) return;

    if (isEditing) {
      const existing = getCell(workerId, date);
      setModalHours(existing?.hoursWorked ? String(existing.hoursWorked) : '8');
      setModalNotes(existing?.notes || 'Sababsiz kelmadi');
      setEditModal({
        workerId,
        date,
        mode: existing?.status === 'absent' ? 'absent' : 'present',
      });
    } else {
      const cell = getCell(workerId, date);
      if (cell) {
        setSelectedCell({ workerId, date, workerName });
      }
    }
  }

  function handleMarkPresent() {
    if (!editModal) return;
    const hours = parseFloat(modalHours) || 0;
    if (hours <= 0) return;

    const key = cellKey(editModal.workerId, editModal.date);
    setCells((prev) => ({
      ...prev,
      [key]: { status: 'present', hoursWorked: hours, notes: '' },
    }));
    setEditModal(null);
  }

  function handleMarkAbsent() {
    if (!editModal) return;

    const key = cellKey(editModal.workerId, editModal.date);
    setCells((prev) => ({
      ...prev,
      [key]: {
        status: 'absent',
        hoursWorked: 0,
        notes: modalNotes || 'Sababsiz kelmadi',
      },
    }));
    setEditModal(null);
  }

  async function handleSave() {
    setSaving(true);
    try {
      const records = Object.entries(cells).map(([key, data]) => {
        const [workerId, date] = key.split(':');
        return {
          workerId,
          date,
          status: data.status,
          hoursWorked: data.hoursWorked,
          notes: data.notes || undefined,
        };
      });
      await saveAttendanceBatch(records);
      setIsEditing(false);
      router.refresh();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Saqlashda xatolik';
      alert(message);
    } finally {
      setSaving(false);
    }
  }

  function handleStartEdit() {
    setCells(buildInitialCells());
    setIsEditing(true);
    setSelectedCell(null);
  }

  function handleCancelEdit() {
    setCells(buildInitialCells());
    setIsEditing(false);
    setSelectedCell(null);
  }

  async function handleExportExcel() {
    setExporting(true);
    try {
      await exportAttendanceToExcel(workers, cells, month, dates);
    } catch {
      alert('Excel faylni yuklab olishda xatolik');
    } finally {
      setExporting(false);
    }
  }

  const selectedCellData = selectedCell
    ? getCell(selectedCell.workerId, selectedCell.date)
    : null;

  return (
    <>
      {selectedCell && selectedCellData && !isEditing && (
        <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 p-4">
          <div className="flex items-start justify-between">
            <div>
              <p className="font-semibold text-amber-900">
                {selectedCell.workerName} —{' '}
                {new Date(selectedCell.date + 'T00:00:00').toLocaleDateString('uz-UZ', {
                  day: 'numeric',
                  month: 'long',
                })}
              </p>
              {selectedCellData.status === 'present' ? (
                <p className="mt-1 text-sm text-amber-800">
                  Ishlangan vaqt: <strong>{selectedCellData.hoursWorked} soat</strong>
                </p>
              ) : (
                <p className="mt-1 text-sm text-amber-800">
                  Sabab:{' '}
                  <strong>
                    {getAbsenceReason(selectedCellData.status, selectedCellData.notes)}
                  </strong>
                </p>
              )}
            </div>
            <button
              onClick={() => setSelectedCell(null)}
              className="text-amber-600 hover:text-amber-800"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

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
          <Button
            variant="secondary"
            onClick={handleExportExcel}
            disabled={exporting || workers.length === 0}
          >
            <Download className="mr-2 h-4 w-4" />
            {exporting ? 'Yuklanmoqda...' : 'Excel'}
          </Button>
          {isEditing ? (
            <>
              <Button variant="secondary" onClick={handleCancelEdit} disabled={saving}>
                Bekor qilish
              </Button>
              <Button onClick={handleSave} disabled={saving}>
                <CheckCircle className="mr-2 h-4 w-4" />
                {saving ? 'Saqlanmoqda...' : 'Tayyor'}
              </Button>
            </>
          ) : (
            <Button onClick={handleStartEdit}>
              <Pencil className="mr-2 h-4 w-4" />
              Tahrirlash
            </Button>
          )}
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="sticky left-0 z-10 bg-gray-50 px-4 py-3 text-left font-medium text-gray-600 min-w-[160px]">
                    F.I.Sh
                  </th>
                  {Array.from({ length: daysInMonth }, (_, i) => {
                    const day = i + 1;
                    const dateStr = dates[i];
                    const future = isFutureDate(dateStr);
                    const isToday =
                      dateStr === new Date().toISOString().split('T')[0];
                    return (
                      <th
                        key={day}
                        className={`px-1 py-3 text-center font-medium min-w-[36px] ${
                          future
                            ? 'text-gray-300'
                            : isToday
                              ? 'text-amber-600 bg-amber-50'
                              : 'text-gray-600'
                        }`}
                      >
                        {day}
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {workers.length === 0 ? (
                  <tr>
                    <td
                      colSpan={daysInMonth + 1}
                      className="px-6 py-12 text-center text-gray-500"
                    >
                      Faol ishchilar yo&apos;q
                    </td>
                  </tr>
                ) : (
                  workers.map((worker) => (
                    <tr key={worker.id} className="hover:bg-gray-50">
                      <td className="sticky left-0 z-10 bg-white px-4 py-3 font-medium text-gray-900 border-r border-gray-100">
                        <div className="truncate max-w-[160px]">{worker.full_name}</div>
                        {worker.position && (
                          <div className="text-xs text-gray-500 truncate">
                            {worker.position}
                          </div>
                        )}
                      </td>
                      {dates.map((dateStr) => {
                        const cell = getCell(worker.id, dateStr);
                        const future = isFutureDate(dateStr);
                        const isSelected =
                          selectedCell?.workerId === worker.id &&
                          selectedCell?.date === dateStr;

                        return (
                          <td
                            key={dateStr}
                            className={`px-1 py-2 text-center ${
                              future ? 'bg-gray-50' : ''
                            } ${isSelected ? 'ring-2 ring-inset ring-amber-400' : ''}`}
                          >
                            {future ? (
                              <span className="inline-block w-7 h-7 rounded text-gray-200">
                                —
                              </span>
                            ) : isEditing ? (
                              <button
                                type="button"
                                onClick={() =>
                                  handleCellClick(worker.id, dateStr, worker.full_name)
                                }
                                className={`inline-flex items-center justify-center w-7 h-7 rounded transition-colors ${
                                  cell?.status === 'present'
                                    ? 'bg-green-100 text-green-700 hover:bg-green-200'
                                    : cell?.status === 'absent'
                                      ? 'bg-red-100 text-red-700 hover:bg-red-200'
                                      : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                                }`}
                              >
                                {cell?.status === 'present' ? (
                                  <Check className="h-4 w-4" />
                                ) : cell?.status === 'absent' ? (
                                  <X className="h-4 w-4" />
                                ) : (
                                  <span className="text-xs">+</span>
                                )}
                              </button>
                            ) : cell ? (
                              <button
                                type="button"
                                onClick={() =>
                                  handleCellClick(worker.id, dateStr, worker.full_name)
                                }
                                className={`inline-flex items-center justify-center w-7 h-7 rounded text-xs font-medium transition-colors hover:ring-2 hover:ring-amber-300 ${
                                  cell.status === 'present'
                                    ? 'bg-green-50 text-green-700'
                                    : 'bg-red-50 text-red-600'
                                }`}
                              >
                                {cell.status === 'present' ? (
                                  <span>{cell.hoursWorked}s</span>
                                ) : (
                                  <X className="h-3.5 w-3.5" />
                                )}
                              </button>
                            ) : (
                              <span className="inline-block w-7 h-7 text-gray-300">·</span>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <div className="mt-4 flex flex-wrap gap-4 text-xs text-gray-500">
        <span className="flex items-center gap-1">
          <span className="inline-flex w-5 h-5 items-center justify-center rounded bg-green-50 text-green-700">
            <Check className="h-3 w-3" />
          </span>
          Ishlagan
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-flex w-5 h-5 items-center justify-center rounded bg-red-50 text-red-600">
            <X className="h-3 w-3" />
          </span>
          Ishlamagan
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block w-5 h-5 rounded bg-gray-50 text-gray-300 text-center leading-5">
            —
          </span>
          Hali kelmagan kun
        </span>
        {!isEditing && (
          <span className="text-gray-400">
            Katakchani bosib batafsil ma&apos;lumotni ko&apos;ring
          </span>
        )}
      </div>

      <Modal
        isOpen={!!editModal}
        onClose={() => setEditModal(null)}
        title={editModal?.mode === 'absent' ? 'Kelmaslik sababi' : 'Ishlangan soatlar'}
      >
        <div className="space-y-4">
          {editModal?.mode === 'present' ? (
            <Input
              id="hours"
              label="Ishlangan soatlar"
              type="number"
              min={0.5}
              max={24}
              step={0.5}
              value={modalHours}
              onChange={(e) => setModalHours(e.target.value)}
            />
          ) : (
            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700">
                Kelmaslik sababi
              </label>
              <select
                value={modalNotes}
                onChange={(e) => setModalNotes(e.target.value)}
                className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              >
                <option value="Sababsiz kelmadi">Sababsiz kelmadi</option>
                <option value="Kasallik">Kasallik</option>
                <option value="Ta&apos;til">Ta&apos;til</option>
                <option value="Shaxsiy sabab">Shaxsiy sabab</option>
                <option value="Ruxsat bilan">Ruxsat bilan</option>
              </select>
            </div>
          )}
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setEditModal(null)}>
              Bekor qilish
            </Button>
            {editModal?.mode === 'present' ? (
              <>
                <Button
                  variant="danger"
                  onClick={() => setEditModal({ ...editModal, mode: 'absent' })}
                >
                  <X className="mr-2 h-4 w-4" />
                  Ishlamadi
                </Button>
                <Button onClick={handleMarkPresent}>
                  <Check className="mr-2 h-4 w-4" />
                  Saqlash
                </Button>
              </>
            ) : (
              <>
                <Button
                  variant="secondary"
                  onClick={() => setEditModal({ ...editModal, mode: 'present' })}
                >
                  Orqaga
                </Button>
                <Button onClick={handleMarkAbsent} variant="danger">
                  <X className="mr-2 h-4 w-4" />
                  Saqlash
                </Button>
              </>
            )}
          </div>
        </div>
      </Modal>
    </>
  );
}
