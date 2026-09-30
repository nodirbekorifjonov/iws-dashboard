'use client';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Modal } from '@/components/ui/modal';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import {
  Worker,
  WorkerGender,
  ShiftLength,
  WORKER_POSITIONS,
  WORKER_GENDER_LABELS,
  SHIFT_LENGTH_LABELS,
  FEMALE_12H_DAY_PAY,
  FEMALE_12H_NIGHT_PAY,
  FEMALE_12H_HOURS,
  defaultHourlyRate,
  female12hDayHourly,
  female12hNightHourly,
  isFemale12hWorker,
  roundMoney,
} from '@/types/database';
import { formatCurrency, formatDate } from '@/lib/utils';
import {
  createWorker,
  createWorkerLogin,
  deleteWorker,
  provisionMissingWorkerLogins,
  resetWorkerLogin,
  updateWorker,
} from '@/lib/actions/workers';
import {
  WorkerSearchFilter,
  useWorkerSearchFilter,
} from '@/components/workers/worker-search-filter';
import { workerDefaultPassword } from '@/lib/utils/worker-login';
import { KeyRound, Pencil, Plus, Trash2, UserPlus } from 'lucide-react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface WorkersTableProps {
  initialWorkers: Worker[];
}

export function WorkersTable({ initialWorkers }: WorkersTableProps) {
  const router = useRouter();
  const [showModal, setShowModal] = useState(false);
  const [editingWorker, setEditingWorker] = useState<Worker | null>(null);
  const [loading, setLoading] = useState(false);
  const [gender, setGender] = useState<WorkerGender | ''>('');
  const [shiftLength, setShiftLength] = useState<ShiftLength | ''>('');
  const [hourlyRate, setHourlyRate] = useState('');
  const [loginLoadingId, setLoginLoadingId] = useState<string | null>(null);
  const [bulkLoading, setBulkLoading] = useState(false);
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
  } = useWorkerSearchFilter(initialWorkers);

  function openCreate() {
    setEditingWorker(null);
    setGender('');
    setShiftLength('');
    setHourlyRate('');
    setShowModal(true);
  }

  function openEdit(worker: Worker) {
    setEditingWorker(worker);
    setGender(worker.gender ?? '');
    setShiftLength(worker.shift_length ?? '');
    setHourlyRate(worker.hourly_rate ? String(worker.hourly_rate) : '');
    setShowModal(true);
  }

  function applyRate(nextGender: WorkerGender | '', nextShift: ShiftLength | '') {
    if (nextGender === 'male') {
      setHourlyRate(String(defaultHourlyRate('male')));
      return;
    }
    if (nextGender === 'female' && nextShift) {
      setHourlyRate(String(defaultHourlyRate('female', nextShift)));
    }
  }

  function handleGenderChange(value: string) {
    const next = value === 'male' || value === 'female' ? value : '';
    setGender(next);
    if (next === 'male') {
      setShiftLength('');
      applyRate('male', '');
      return;
    }
    setShiftLength('');
    setHourlyRate('');
  }

  function handleShiftLengthChange(value: string) {
    const next = value === '8' || value === '12' ? (Number(value) as ShiftLength) : '';
    setShiftLength(next);
    applyRate(gender, next);
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);

    try {
      const result = editingWorker
        ? await updateWorker(editingWorker.id, formData)
        : await createWorker(formData);
      if (result?.error) {
        alert(result.error);
        return;
      }
      setShowModal(false);
      router.refresh();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Xatolik yuz berdi';
      alert(message);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Ishchini o\'chirishni tasdiqlaysizmi?')) return;

    try {
      await deleteWorker(id);
      router.refresh();
    } catch {
      alert('O\'chirishda xatolik');
    }
  }

  async function handleLogin(worker: Worker) {
    if (!worker.login_code) return;
    const actionLabel = worker.user_id ? 'Parolni formula bo‘yicha yangilash' : 'Kirish yaratish';
    if (!confirm(`${worker.full_name} uchun ${actionLabel.toLowerCase()}?`)) return;

    setLoginLoadingId(worker.id);
    try {
      const result = worker.user_id
        ? await resetWorkerLogin(worker.id)
        : await createWorkerLogin(worker.id);
      if (result.error) {
        alert(result.error);
        return;
      }
      const password =
        result.password ||
        workerDefaultPassword(worker.login_code, worker.full_name);
      alert(
        `Kod: ${result.loginCode || worker.login_code}\nParol: ${password}\n\nParol = kod + ism, bo‘sh joysiz.`
      );
      router.refresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Xatolik yuz berdi');
    } finally {
      setLoginLoadingId(null);
    }
  }

  async function handleProvisionAll() {
    const missing = initialWorkers.filter((worker) => !worker.user_id && worker.login_code);
    if (missing.length === 0) {
      alert('Kirishi yo‘q ishchi qolmadi');
      return;
    }
    if (
      !confirm(
        `${missing.length} ta ishchiga kirish yaratiladi. Parol = kod + ism, bo‘sh joysiz.`
      )
    ) {
      return;
    }

    setBulkLoading(true);
    try {
      const result = await provisionMissingWorkerLogins();
      if (result.error) {
        alert(result.error);
        return;
      }
      const failedNote =
        result.failed && result.errors?.length
          ? `\n\nXatolik (${result.failed}):\n${result.errors.slice(0, 8).join('\n')}`
          : '';
      alert(`${result.created ?? 0} ta kirish yaratildi.${failedNote}`);
      router.refresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Xatolik yuz berdi');
    } finally {
      setBulkLoading(false);
    }
  }

  const positionOptions = [
    { value: '', label: 'Lavozimni tanlang' },
    ...WORKER_POSITIONS.map((position) => ({
      value: position,
      label: position,
    })),
    ...(editingWorker?.position &&
    !(WORKER_POSITIONS as readonly string[]).includes(editingWorker.position)
      ? [{ value: editingWorker.position, label: editingWorker.position }]
      : []),
  ];

  const genderOptions = [
    { value: '', label: 'Jinsni tanlang' },
    { value: 'male', label: WORKER_GENDER_LABELS.male },
    { value: 'female', label: WORKER_GENDER_LABELS.female },
  ];

  const shiftLengthOptions = [
    { value: '', label: 'Ish vaqtini tanlang' },
    { value: '8', label: SHIFT_LENGTH_LABELS[8] },
    { value: '12', label: SHIFT_LENGTH_LABELS[12] },
  ];

  const showHourlyRateInput = gender === 'male' || (gender === 'female' && shiftLength === 8);
  const show12hRates = gender === 'female' && shiftLength === 12;
  const missingLoginCodes = initialWorkers.some((worker) => !worker.login_code);
  const missingLogins = initialWorkers.filter(
    (worker) => !worker.user_id && worker.login_code
  );

  return (
    <>
      {missingLoginCodes ? (
        <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Ishchi kodlari uchun Supabase SQL Editor’da{' '}
          <code className="rounded bg-amber-100 px-1">008_worker_portal.sql</code> ni
          ishga tushiring yoki <code className="rounded bg-amber-100 px-1">npm run migrate</code>.
          Parol = kod + ism, bo‘sh joysiz (masalan IWS-0001AkbarovaDilbar).
        </div>
      ) : null}
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
        <Button onClick={openCreate} className="shrink-0">
          <Plus className="mr-2 h-4 w-4" />
          Yangi ishchi
        </Button>
        {missingLogins.length > 0 ? (
          <Button
            type="button"
            variant="secondary"
            onClick={handleProvisionAll}
            disabled={bulkLoading}
            className="shrink-0"
          >
            <UserPlus className="mr-2 h-4 w-4" />
            {bulkLoading
              ? 'Yaratilmoqda...'
              : `Hammasiga kirish yaratish (${missingLogins.length})`}
          </Button>
        ) : null}
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="px-6 py-3 text-left font-medium text-gray-600">F.I.Sh</th>
                  <th className="px-6 py-3 text-left font-medium text-gray-600">Kod</th>
                  <th className="px-6 py-3 text-left font-medium text-gray-600">Jins</th>
                  <th className="px-6 py-3 text-left font-medium text-gray-600">Lavozim</th>
                  <th className="px-6 py-3 text-left font-medium text-gray-600">Telefon</th>
                  <th className="px-6 py-3 text-left font-medium text-gray-600">Ish boshlagan</th>
                  <th className="px-6 py-3 text-left font-medium text-gray-600">Soatbay stavka</th>
                  <th className="px-6 py-3 text-left font-medium text-gray-600">Holat</th>
                  <th className="px-6 py-3 text-right font-medium text-gray-600">Amallar</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredWorkers.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-6 py-12 text-center text-gray-500">
                      {initialWorkers.length === 0
                        ? 'Hozircha ishchilar yo\'q'
                        : 'Ishchi topilmadi'}
                    </td>
                  </tr>
                ) : (
                  filteredWorkers.map((worker) => (
                    <tr key={worker.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 font-medium text-gray-900">
                        {worker.full_name}
                      </td>
                      <td className="px-6 py-4 font-mono text-gray-700">
                        {worker.login_code || '—'}
                      </td>
                      <td className="px-6 py-4 text-gray-600">
                        <div>{worker.gender ? WORKER_GENDER_LABELS[worker.gender] : '—'}</div>
                        {worker.gender === 'female' && worker.shift_length ? (
                          <div className="text-xs text-gray-500">
                            {SHIFT_LENGTH_LABELS[worker.shift_length]}
                          </div>
                        ) : null}
                      </td>
                      <td className="px-6 py-4 text-gray-600">
                        {worker.position || '—'}
                      </td>
                      <td className="px-6 py-4 text-gray-600">
                        {worker.phone || '—'}
                      </td>
                      <td className="px-6 py-4 text-gray-600">
                        {formatDate(worker.start_date)}
                      </td>
                      <td className="px-6 py-4 text-gray-600">
                        {isFemale12hWorker(worker) ? (
                          <div>
                            <div>
                              Kunduzgi: {formatCurrency(roundMoney(female12hDayHourly()))}/soat
                            </div>
                            <div>
                              Kechki: {formatCurrency(roundMoney(female12hNightHourly()))}/soat
                            </div>
                          </div>
                        ) : (
                          `${formatCurrency(worker.hourly_rate)}/soat`
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <Badge
                          className={
                            worker.is_active
                              ? 'bg-green-100 text-green-800'
                              : 'bg-gray-100 text-gray-800'
                          }
                        >
                          {worker.is_active ? 'Faol' : 'Nofaol'}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleLogin(worker)}
                            title={
                              worker.user_id
                                ? 'Parolni formula bo‘yicha yangilash'
                                : 'Kirish yaratish'
                            }
                            disabled={!worker.login_code || loginLoadingId === worker.id}
                          >
                            <KeyRound className="h-4 w-4 text-amber-600" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEdit(worker)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(worker.id)}
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editingWorker ? 'Ishchini tahrirlash' : 'Yangi ishchi'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            id="full_name"
            name="full_name"
            label="F.I.Sh"
            defaultValue={editingWorker?.full_name}
            required
          />
          <Select
            key={editingWorker?.id ?? 'new'}
            id="position"
            name="position"
            label="Lavozim"
            required
            defaultValue={editingWorker?.position || ''}
            options={positionOptions}
          />
          <Input
            id="phone"
            name="phone"
            label="Telefon"
            defaultValue={editingWorker?.phone || ''}
          />
          <Input
            id="start_date"
            name="start_date"
            label="Ish boshlagan sana"
            type="date"
            defaultValue={editingWorker?.start_date || new Date().toISOString().split('T')[0]}
            required
          />
          <Select
            id="gender"
            name="gender"
            label="Jins"
            required
            value={gender}
            onChange={(e) => handleGenderChange(e.target.value)}
            options={genderOptions}
          />
          {gender === 'female' && (
            <Select
              id="shift_length"
              name="shift_length"
              label="Ish vaqti"
              required
              value={shiftLength === '' ? '' : String(shiftLength)}
              onChange={(e) => handleShiftLengthChange(e.target.value)}
              options={shiftLengthOptions}
            />
          )}
          {showHourlyRateInput && (
            <div>
              <Input
                id="hourly_rate"
                name="hourly_rate"
                label="Soatbay stavka (so'm/soat)"
                type="number"
                value={hourlyRate}
                onChange={(e) => setHourlyRate(e.target.value)}
                min={0}
                step={0.01}
                required
              />
              <p className="mt-1 text-xs text-gray-500">
                {gender === 'male'
                  ? 'Erkak: 140 000 so\'m / 12 soat. Qiymatni qo\'lda o\'zgartirish mumkin.'
                  : '8 soatlik: 15 000 so\'m/soat (8 soat = 120 000 so\'m). Qo\'shimcha soatlar shu stavkada.'}
              </p>
            </div>
          )}
          {show12hRates && (
            <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 text-sm text-gray-700">
              <input
                type="hidden"
                name="hourly_rate"
                value={String(defaultHourlyRate('female', 12))}
              />
              <p className="font-medium text-gray-900">12 soatlik soatbay stavkalar</p>
              <p className="mt-1">
                Kunduzgi: {formatCurrency(FEMALE_12H_DAY_PAY)} / {FEMALE_12H_HOURS} soat
                {' '}
                ({formatCurrency(roundMoney(female12hDayHourly()))}/soat)
              </p>
              <p>
                Kechki: {formatCurrency(FEMALE_12H_NIGHT_PAY)} / {FEMALE_12H_HOURS} soat
                {' '}
                ({formatCurrency(roundMoney(female12hNightHourly()))}/soat)
              </p>
              <p className="mt-1 text-xs text-gray-500">
                Stavka davomatdagi smenaga qarab avtomatik qo&apos;llaniladi.
              </p>
            </div>
          )}
          {editingWorker && (
            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700">Holat</label>
              <select
                name="is_active"
                defaultValue={editingWorker.is_active ? 'true' : 'false'}
                className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              >
                <option value="true">Faol</option>
                <option value="false">Nofaol</option>
              </select>
            </div>
          )}
          <div className="flex justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setShowModal(false)}
            >
              Bekor qilish
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Saqlanmoqda...' : 'Saqlash'}
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
}
