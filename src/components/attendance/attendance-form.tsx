'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Modal } from '@/components/ui/modal';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import {
  Attendance,
  AttendanceShift,
  AttendanceStatus,
  ATTENDANCE_SHIFT_LABELS,
  Worker,
  defaultHoursForWorker,
  isFemale12hWorker,
} from '@/types/database';
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
  WorkerSearchFilter,
  useWorkerSearchFilter,
} from '@/components/workers/worker-search-filter';
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
  shift: AttendanceShift | null;
}

interface AttendanceFormProps {
  month: string;
  workers: Worker[];
  attendance: Attendance[];
}

function cellKey(workerId: string, date: string) {
  return `${workerId}:${date}`;
}

function presentCellLabel(hoursWorked: number, shift: AttendanceShift | null, showShift: boolean) {
  if (!showShift || !shift) return `${hoursWorked}s`;
  return `${hoursWorked}${shift === 'night' ? 'T' : 'K'}`;
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
  const [modalShift, setModalShift] = useState<AttendanceShift | ''>('');
  const [modalNotes, setModalNotes] = useState('Sababsiz kelmadi');

  const buildInitialCells = useCallback(() => {
    const map: Record<string, CellData> = {};
    attendance.forEach((a) => {
      map[cellKey(a.worker_id, a.date)] = {
        status: a.status,
        hoursWorked: a.hours_worked || 0,
        notes: a.notes || '',
        shift: a.shift ?? null,
      };
    });
    return map;
  }, [attendance]);

  const [cells, setCells] = useState<Record<string, CellData>>(buildInitialCells);
  const [exporting, setExporting] = useState(false);
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

  const daysInMonth = getDaysInMonth(month);
  const dates = getMonthDates(month);
  const monthLabel = formatMonthLabel(month);

  function workerById(workerId: string) {
    return workers.find((w) => w.id === workerId);
  }

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
      const worker = workerById(workerId);
      const defaultHours = worker ? defaultHoursForWorker(worker) : 8;
      setModalHours(
        existing?.hoursWorked ? String(existing.hoursWorked) : String(defaultHours)
      );
      setModalShift(
        existing?.shift === 'night' || existing?.shift === 'day' ? existing.shift : ''
      );
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

    const worker = workerById(editModal.workerId);
    const needsShift = worker ? isFemale12hWorker(worker) : false;
    if (needsShift && modalShift !== 'day' && modalShift !== 'night') {
      alert('Kunduzgi yoki kechki smenani tanlang');
      return;
    }

    const key = cellKey(editModal.workerId, editModal.date);
    setCells((prev) => ({
      ...prev,
      [key]: {
        status: 'present',
        hoursWorked: hours,
        notes: '',
        shift: needsShift && (modalShift === 'day' || modalShift === 'night')
          ? modalShift
          : null,
      },
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
        shift: null,
      },
    }));
    setEditModal(null);
  }

  async function handleSave() {
    const missingShift = Object.entries(cells).some(([key, data]) => {
      if (data.status !== 'present' && data.status !== 'late') return false;
      const workerId = key.split(':')[0];
      const worker = workerById(workerId);
      return (
        !!worker &&
        isFemale12hWorker(worker) &&
        data.shift !== 'day' &&
        data.shift !== 'night'
      );
    });
    if (missingShift) {
      alert('Kunduzgi yoki kechki smenani tanlang');
      return;
    }

    setSaving(true);
    try {
      const records = Object.entries(cells).map(([key, data]) => {
        const [workerId, date] = key.split(':');
        return {
          workerId,
          date,
          status: data.status,
          hoursWorked: data.hoursWorked,
          shift: data.shift,
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
  const selectedWorker = selectedCell
    ? workerById(selectedCell.workerId)
    : undefined;
  const editModalWorker = editModal ? workerById(editModal.workerId) : undefined;
  const editNeedsShift = editModalWorker
    ? isFemale12hWorker(editModalWorker)
    : false;

  const shiftOptions = [
    { value: '', label: 'Smenani tanlang' },
    { value: 'day', label: ATTENDANCE_SHIFT_LABELS.day },
    { value: 'night', label: ATTENDANCE_SHIFT_LABELS.night },
  ];

  return (
    <>
      {selectedCell && selectedCellData && !isEditing && (
        <div className="mb-4 rounded-xl border border-indigo-100 bg-indigo-50 p-4">
          <div className="flex items-start justify-between">
            <div>
              <p className="font-semibold text-indigo-950">
                {selectedCell.workerName} —{' '}
                {new Date(selectedCell.date + 'T00:00:00').toLocaleDateString('uz-UZ', {
                  day: 'numeric',
                  month: 'long',
                })}
              </p>
              {selectedCellData.status === 'present' ? (
                <p className="mt-1 text-sm text-indigo-800">
                  Ishlangan vaqt: <strong>{selectedCellData.hoursWorked} soat</strong>
                  {selectedWorker &&
                  isFemale12hWorker(selectedWorker) &&
                  selectedCellData.shift ? (
                    <>
                      {' · '}
                      <strong>
                        {ATTENDANCE_SHIFT_LABELS[selectedCellData.shift]} smena
                      </strong>
                    </>
                  ) : null}
                </p>
              ) : (
                <p className="mt-1 text-sm text-indigo-800">
                  Sabab:{' '}
                  <strong>
                    {getAbsenceReason(selectedCellData.status, selectedCellData.notes)}
                  </strong>
                </p>
              )}
            </div>
            <button
              onClick={() => setSelectedCell(null)}
              className="text-indigo-600 hover:text-indigo-800"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

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
                <tr className="border-b border-slate-200 bg-slate-50">
                  <th className="sticky left-0 z-10 min-w-[160px] bg-slate-50 px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
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
                        className={`px-1 py-3 text-center font-medium min-w-[44px] ${
                          future
                            ? 'text-slate-300'
                            : isToday
                              ? 'bg-indigo-50 text-indigo-600'
                              : 'text-slate-600'
                        }`}
                      >
                        {day}
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredWorkers.length === 0 ? (
                  <tr>
                    <td
                      colSpan={daysInMonth + 1}
                      className="px-6 py-12 text-center text-slate-500"
                    >
                      {workers.length === 0
                        ? 'Faol ishchilar yo\'q'
                        : 'Ishchi topilmadi'}
                    </td>
                  </tr>
                ) : (
                  filteredWorkers.map((worker) => (
                    <tr key={worker.id} className="hover:bg-slate-50">
                      <td className="sticky left-0 z-10 border-r border-slate-100 bg-white px-4 py-3 font-medium text-slate-900">
                        <div className="max-w-[160px] truncate">{worker.full_name}</div>
                        {isFemale12hWorker(worker) && (
                          <div className="text-xs text-indigo-600">12 soatlik</div>
                        )}
                        {worker.position && (
                          <div className="truncate text-xs text-slate-500">
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
                        const isNightPresent =
                          cell?.status === 'present' && cell.shift === 'night';
                        const showShiftLabel = isFemale12hWorker(worker);
                        const presentLabel =
                          cell?.status === 'present'
                            ? presentCellLabel(
                                cell.hoursWorked,
                                cell.shift,
                                showShiftLabel
                              )
                            : '';

                        return (
                          <td
                            key={dateStr}
                            className={`px-1 py-2 text-center ${
                              future ? 'bg-slate-50' : ''
                            } ${isSelected ? 'ring-2 ring-inset ring-indigo-400' : ''}`}
                          >
                            {future ? (
                              <span className="inline-block h-7 w-7 rounded text-slate-200">
                                —
                              </span>
                            ) : isEditing ? (
                              <button
                                type="button"
                                onClick={() =>
                                  handleCellClick(worker.id, dateStr, worker.full_name)
                                }
                                className={`inline-flex items-center justify-center min-w-7 h-7 px-0.5 rounded text-[10px] font-medium transition-colors ${
                                  cell?.status === 'present'
                                    ? isNightPresent
                                      ? 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200'
                                      : 'bg-green-100 text-green-700 hover:bg-green-200'
                                    : cell?.status === 'absent'
                                      ? 'bg-red-100 text-red-700 hover:bg-red-200'
                                      : 'bg-slate-100 text-slate-400 hover:bg-slate-200'
                                }`}
                              >
                                {cell?.status === 'present' ? (
                                  showShiftLabel ? (
                                    <span>{presentLabel}</span>
                                  ) : (
                                    <Check className="h-4 w-4" />
                                  )
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
                                className={`inline-flex h-7 min-w-7 items-center justify-center rounded px-0.5 text-[10px] font-medium transition-colors hover:ring-2 hover:ring-indigo-300 ${
                                  cell.status === 'present'
                                    ? isNightPresent
                                      ? 'bg-indigo-50 text-indigo-700'
                                      : 'bg-green-50 text-green-700'
                                    : 'bg-red-50 text-red-600'
                                }`}
                              >
                                {cell.status === 'present' ? (
                                  <span>{presentLabel}</span>
                                ) : (
                                  <X className="h-3.5 w-3.5" />
                                )}
                              </button>
                            ) : (
                              <span className="inline-block h-7 w-7 text-slate-300">·</span>
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

      <div className="mt-4 flex flex-wrap gap-4 text-xs text-slate-500">
        <span className="flex items-center gap-1">
          <span className="inline-flex w-5 h-5 items-center justify-center rounded bg-green-50 text-green-700">
            <Check className="h-3 w-3" />
          </span>
          Ishlagan
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-flex min-w-5 h-5 items-center justify-center rounded bg-green-50 px-0.5 text-[10px] font-medium text-green-700">
            12K
          </span>
          Kunduzgi smena
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-flex min-w-5 h-5 items-center justify-center rounded bg-indigo-50 px-0.5 text-[10px] font-medium text-indigo-700">
            12T
          </span>
          Kechki smena
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-flex w-5 h-5 items-center justify-center rounded bg-red-50 text-red-600">
            <X className="h-3 w-3" />
          </span>
          Ishlamagan
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block h-5 w-5 rounded bg-slate-50 text-center leading-5 text-slate-300">
            —
          </span>
          Hali kelmagan kun
        </span>
        {!isEditing && (
          <span className="text-slate-400">
            Katakchani bosib batafsil ma&apos;lumotni ko&apos;ring
          </span>
        )}
      </div>

      {editModal && (
        <Modal
          isOpen
          onClose={() => setEditModal(null)}
          title={
            editModal.mode === 'absent'
              ? 'Kelmaslik sababi'
              : editNeedsShift
                ? 'Ishlangan soatlar va smena'
                : 'Ishlangan soatlar'
          }
        >
          <div className="space-y-4">
            {editModal.mode === 'present' ? (
              <>
                {editNeedsShift && (
                  <Select
                    id="shift"
                    label="Smena"
                    required
                    value={modalShift}
                    onChange={(e) => {
                      const value = e.target.value;
                      setModalShift(value === 'night' || value === 'day' ? value : '');
                    }}
                    options={shiftOptions}
                  />
                )}
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
              </>
            ) : (
              <div className="space-y-1">
                <label className="block text-sm font-medium text-slate-700">
                  Kelmaslik sababi
                </label>
                <select
                  value={modalNotes}
                  onChange={(e) => setModalNotes(e.target.value)}
                  className="block w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
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
              {editModal.mode === 'present' ? (
                <>
                  <Button
                    variant="danger"
                    onClick={() =>
                      setEditModal((prev) => (prev ? { ...prev, mode: 'absent' } : null))
                    }
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
                    onClick={() =>
                      setEditModal((prev) => (prev ? { ...prev, mode: 'present' } : null))
                    }
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
      )}
    </>
  );
}
