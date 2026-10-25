'use client';

import { assignWorkerToLocation } from '@/lib/actions/locations';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Select } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Worker, WorkLocation } from '@/types/database';
import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';

export function WorkerAssignments({
  workers,
  locations,
  assignments,
  today,
}: {
  workers: Worker[];
  locations: WorkLocation[];
  assignments: { workerId: string; locationId: string; assignmentDate: string }[];
  today: string;
}) {
  const router = useRouter();
  const [workerId, setWorkerId] = useState(workers[0]?.id ?? '');
  const [locationId, setLocationId] = useState(locations[0]?.id ?? '');
  const [date, setDate] = useState(today);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const locationName = useMemo(() => {
    const names = new Map(locations.map((location) => [location.id, location.name]));
    return (id: string) => names.get(id) || 'Noma’lum blok';
  }, [locations]);

  const assignmentByWorker = useMemo(() => {
    const map = new Map<string, { locationId: string; assignmentDate: string }>();
    for (const row of assignments) {
      map.set(row.workerId, {
        locationId: row.locationId,
        assignmentDate: row.assignmentDate,
      });
    }
    return map;
  }, [assignments]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!workerId || !locationId || !date) return;
    setLoading(true);
    setError(null);
    try {
      await assignWorkerToLocation(workerId, locationId, date);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Biriktirishda xatolik');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="mt-6">
      <CardContent className="space-y-4 p-4 sm:p-6">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Ishchini blokka biriktirish</h2>
          <p className="mt-1 text-sm text-slate-500">
            Biriktirish tanlangan kundan boshlab amal qiladi. Undan oldingi kunlar eski blokda qoladi.
          </p>
        </div>
        <form className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4" onSubmit={handleSubmit}>
          <Select
            label="Ishchi"
            value={workerId}
            onChange={(event) => setWorkerId(event.target.value)}
            options={workers.map((worker) => ({ value: worker.id, label: worker.full_name }))}
          />
          <Select
            label="Blok"
            value={locationId}
            onChange={(event) => setLocationId(event.target.value)}
            options={locations.map((location) => ({ value: location.id, label: location.name }))}
          />
          <Input label="Sana" type="date" value={date} onChange={(event) => setDate(event.target.value)} required />
          <div className="flex items-end">
            <Button type="submit" disabled={loading || !workerId || !locationId}>
              {loading ? 'Saqlanmoqda...' : 'Biriktirish'}
            </Button>
          </div>
        </form>
        {error ? <p className="text-sm text-red-600">{error}</p> : null}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left text-slate-500">
                <th className="py-2 pr-3 font-medium">Ishchi</th>
                <th className="py-2 pr-3 font-medium">Joriy blok</th>
                <th className="py-2 font-medium">Shu kundan</th>
              </tr>
            </thead>
            <tbody>
              {workers.map((worker) => {
                const current = assignmentByWorker.get(worker.id);
                return (
                  <tr key={worker.id} className="border-b border-slate-100">
                    <td className="py-2 pr-3 text-slate-900">{worker.full_name}</td>
                    <td className="py-2 pr-3 text-slate-700">
                      {current ? locationName(current.locationId) : 'Biriktirilmagan'}
                    </td>
                    <td className="py-2 text-slate-500">{current?.assignmentDate || '—'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
