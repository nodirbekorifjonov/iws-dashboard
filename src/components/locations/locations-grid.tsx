'use client';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Modal } from '@/components/ui/modal';
import { Input } from '@/components/ui/input';
import { WorkLocation } from '@/types/database';
import {
  createLocation,
  updateLocation,
  deleteLocation,
} from '@/lib/actions/locations';
import { Plus, Pencil, Trash2, MapPin } from 'lucide-react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface LocationsGridProps {
  initialLocations: WorkLocation[];
}

export function LocationsGrid({ initialLocations }: LocationsGridProps) {
  const router = useRouter();
  const [showModal, setShowModal] = useState(false);
  const [editingLocation, setEditingLocation] = useState<WorkLocation | null>(null);
  const [loading, setLoading] = useState(false);

  function openCreate() {
    setEditingLocation(null);
    setShowModal(true);
  }

  function openEdit(location: WorkLocation) {
    setEditingLocation(location);
    setShowModal(true);
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);

    try {
      if (editingLocation) {
        await updateLocation(editingLocation.id, formData);
      } else {
        await createLocation(formData);
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
    if (!confirm('Ish joyini o\'chirishni tasdiqlaysizmi?')) return;

    try {
      await deleteLocation(id);
      router.refresh();
    } catch {
      alert('O\'chirishda xatolik');
    }
  }

  return (
    <>
      <div className="mb-4 flex justify-end">
        <Button onClick={openCreate}>
          <Plus className="mr-2 h-4 w-4" />
          Yangi ish joyi
        </Button>
      </div>

      {initialLocations.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-gray-500">
            Hozircha ish joylari yo&apos;q
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {initialLocations.map((location) => (
            <Card key={location.id}>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="rounded-lg bg-amber-100 p-2">
                      <MapPin className="h-5 w-5 text-amber-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{location.name}</h3>
                      {location.description && (
                        <p className="mt-1 text-sm text-gray-500">{location.description}</p>
                      )}
                    </div>
                  </div>
                  <Badge
                    className={
                      location.is_active
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                    }
                  >
                    {location.is_active ? 'Faol' : 'Nofaol'}
                  </Badge>
                </div>
                <div className="mt-4 flex justify-end gap-2">
                  <Button variant="ghost" size="sm" onClick={() => openEdit(location)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => handleDelete(location.id)}>
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editingLocation ? 'Ish joyini tahrirlash' : 'Yangi ish joyi'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            id="name"
            name="name"
            label="Nomi"
            placeholder="Masalan: A blok"
            defaultValue={editingLocation?.name}
            required
          />
          <div className="space-y-1">
            <label htmlFor="description" className="block text-sm font-medium text-gray-700">
              Tavsif
            </label>
            <textarea
              id="description"
              name="description"
              rows={3}
              defaultValue={editingLocation?.description || ''}
              className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
              placeholder="Ish joyi haqida qisqacha ma'lumot"
            />
          </div>
          {editingLocation && (
            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700">Holat</label>
              <select
                name="is_active"
                defaultValue={editingLocation.is_active ? 'true' : 'false'}
                className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              >
                <option value="true">Faol</option>
                <option value="false">Nofaol</option>
              </select>
            </div>
          )}
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={() => setShowModal(false)}>
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
