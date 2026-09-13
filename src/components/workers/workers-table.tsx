'use client';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Modal } from '@/components/ui/modal';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Worker, WORKER_POSITIONS } from '@/types/database';
import { formatCurrency, formatDate } from '@/lib/utils';
import { createWorker, updateWorker, deleteWorker } from '@/lib/actions/workers';
import { Plus, Pencil, Trash2 } from 'lucide-react';
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

  function openCreate() {
    setEditingWorker(null);
    setShowModal(true);
  }

  function openEdit(worker: Worker) {
    setEditingWorker(worker);
    setShowModal(true);
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);

    try {
      if (editingWorker) {
        await updateWorker(editingWorker.id, formData);
      } else {
        await createWorker(formData);
      }
      setShowModal(false);
      router.refresh();
    } catch {
      alert('Xatolik yuz berdi');
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

  return (
    <>
      <div className="mb-4 flex justify-end">
        <Button onClick={openCreate}>
          <Plus className="mr-2 h-4 w-4" />
          Yangi ishchi
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="px-6 py-3 text-left font-medium text-gray-600">F.I.Sh</th>
                  <th className="px-6 py-3 text-left font-medium text-gray-600">Lavozim</th>
                  <th className="px-6 py-3 text-left font-medium text-gray-600">Telefon</th>
                  <th className="px-6 py-3 text-left font-medium text-gray-600">Ish boshlagan</th>
                  <th className="px-6 py-3 text-left font-medium text-gray-600">Soatbay stavka</th>
                  <th className="px-6 py-3 text-left font-medium text-gray-600">Holat</th>
                  <th className="px-6 py-3 text-right font-medium text-gray-600">Amallar</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {initialWorkers.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                      Hozircha ishchilar yo&apos;q
                    </td>
                  </tr>
                ) : (
                  initialWorkers.map((worker) => (
                    <tr key={worker.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 font-medium text-gray-900">
                        {worker.full_name}
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
                        {formatCurrency(worker.hourly_rate)}/soat
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
          <Input
            id="hourly_rate"
            name="hourly_rate"
            label="Soatbay stavka (so'm/soat)"
            type="number"
            defaultValue={editingWorker?.hourly_rate || 0}
            min={0}
            step={1000}
          />
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
