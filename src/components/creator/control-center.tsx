'use client';

import {
  setStaffAccessDisabled,
  setWorkerLoginEnabled,
} from '@/lib/actions/control';
import { ControlCenterData } from '@/lib/api/control';
import { cn, formatCurrency, formatDateTime, formatRelativeTime } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { BarListChart, ColumnChart, DonutChart } from '@/components/ui/charts';
import { PageHeader } from '@/components/layout/page-header';
import { EmptyState } from '@/components/ui/empty-state';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

type Tab = 'overview' | 'logins' | 'audit' | 'alerts' | 'manage';

const TABS: { id: Tab; label: string }[] = [
  { id: 'overview', label: 'Umumiy' },
  { id: 'logins', label: 'Kirishlar' },
  { id: 'audit', label: 'Jurnal' },
  { id: 'alerts', label: 'Ogohlantirishlar' },
  { id: 'manage', label: 'Boshqaruv' },
];

function ClientTime({ date }: { date: string | null }) {
  const [label, setLabel] = useState<string | null>(null);
  useEffect(() => {
    if (!date) return;
    setLabel(`${formatRelativeTime(date)} · ${formatDateTime(date)}`);
  }, [date]);
  if (!date) return <span>—</span>;
  return <span>{label ?? '—'}</span>;
}

export function ControlCenter({ data }: { data: ControlCenterData }) {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>('overview');
  const [busy, setBusy] = useState<string | null>(null);

  useEffect(() => {
    const id = window.setInterval(() => router.refresh(), 20000);
    return () => window.clearInterval(id);
  }, [router]);

  async function toggleWorker(id: string, enabled: boolean) {
    setBusy(id);
    try {
      await setWorkerLoginEnabled(id, enabled);
      router.refresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Xatolik');
    } finally {
      setBusy(null);
    }
  }

  async function toggleStaff(id: string, disabled: boolean) {
    setBusy(id);
    try {
      await setStaffAccessDisabled(id, disabled);
      router.refresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Xatolik');
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Nazorat"
        description="Kirishlar, o‘zgarishlar va tizim holati. Ro‘yxat avtomatik yangilanadi."
      />

      <div className="flex flex-wrap gap-2">
        {TABS.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setTab(item.id)}
            className={cn(
              'rounded-lg px-3 py-2 text-sm font-medium transition-colors',
              tab === item.id
                ? 'bg-indigo-600 text-white'
                : 'bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50'
            )}
          >
            {item.label}
            {item.id === 'alerts' && data.stats.alertCount > 0 ? (
              <span className="ml-2 rounded-full bg-red-100 px-1.5 text-xs text-red-700">
                {data.stats.alertCount}
              </span>
            ) : null}
          </button>
        ))}
      </div>

      {tab === 'overview' ? (
        <div className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-2">
            <DonutChart
              title="Bugungi davomat"
              hint="Keldi, kech qoldi va kelmadi"
              slices={data.charts.attendance}
              centerLabel="ishchi"
            />
            <DonutChart
              title="Kirish holati"
              hint="Hozir onlayn, avval kirgan va kirmaganlar"
              slices={data.charts.logins}
              centerLabel="foydalanuvchi"
            />
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            <ColumnChart
              title={`${data.monthLabel} maosh`}
              hint="Jami hisoblangan maosh, avans va qolgan summa"
              items={data.charts.payroll}
              formatValue={formatCurrency}
            />
            <DonutChart
              title="Rollar"
              hint="Tizimdagi foydalanuvchilar taqsimoti"
              slices={data.charts.roles}
              centerLabel="jami"
            />
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            <BarListChart
              title="Eng ko‘p soat"
              hint={`${data.monthLabel} bo‘yicha top 8`}
              items={data.charts.topHours}
              color="#0ea5e9"
              formatValue={(value) => `${value} soat`}
            />
            <BarListChart
              title="Eng katta maosh"
              hint={`${data.monthLabel} hisoblangan maosh`}
              items={data.charts.topSalary}
              color="#4f46e5"
              formatValue={formatCurrency}
            />
          </div>
        </div>
      ) : null}

      {tab === 'logins' ? (
        <Card>
          <CardContent className="p-0">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Ism</th>
                  <th>Rol</th>
                  <th>Oxirgi kirish</th>
                  <th>Holat</th>
                </tr>
              </thead>
              <tbody>
                {data.logins.map((row) => (
                  <tr key={`${row.kind}-${row.id}`}>
                    <td>
                      <div className="font-medium text-slate-900">{row.fullName}</div>
                      {row.loginCode ? (
                        <div className="font-mono text-xs text-slate-500">{row.loginCode}</div>
                      ) : null}
                    </td>
                    <td className="text-slate-600">{row.role}</td>
                    <td className="text-slate-600">
                      <ClientTime date={row.lastLoggedInAt} />
                    </td>
                    <td>
                      {row.isOnline ? (
                        <Badge variant="success">Onlayn</Badge>
                      ) : row.hasLoggedIn ? (
                        <Badge variant="neutral">Kirgan</Badge>
                      ) : (
                        <Badge variant="warning">Kirmagan</Badge>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      ) : null}

      {tab === 'audit' ? (
        <Card>
          <CardContent className="p-0">
            {data.audit.length === 0 ? (
              <EmptyState
                title="Hali jurnal yozuvi yo‘q"
                description="O‘zgarishlar shu yerda paydo bo‘ladi."
              />
            ) : (
              <ul className="divide-y divide-slate-100">
                {data.audit.map((event) => (
                  <li key={event.id} className="px-6 py-3">
                    <p className="text-sm text-slate-900">{event.summary}</p>
                    <p className="mt-1 text-xs text-slate-500">
                      <ClientTime date={event.created_at} />
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      ) : null}

      {tab === 'alerts' ? (
        <div className="space-y-3">
          {data.alerts.length === 0 ? (
            <Card>
              <EmptyState title="Hozircha ogohlantirish yo‘q" />
            </Card>
          ) : (
            data.alerts.map((alert) => (
              <Card key={alert.id}>
                <CardContent className="flex items-start justify-between gap-3 p-4">
                  <div>
                    <p className="font-medium text-slate-900">{alert.title}</p>
                    <p className="mt-1 text-sm text-slate-600">{alert.detail}</p>
                    <p className="mt-1 text-xs text-slate-500">
                      <ClientTime date={alert.createdAt} />
                    </p>
                  </div>
                  <Badge variant={alert.severity === 'danger' ? 'danger' : 'warning'}>
                    {alert.severity === 'danger' ? 'Muhim' : 'Diqqat'}
                  </Badge>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      ) : null}

      {tab === 'manage' ? (
        <div className="space-y-6">
          <div>
            <h2 className="mb-3 text-lg font-semibold text-slate-900">Ishchi portali</h2>
            <Card>
              <CardContent className="p-0">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Ishchi</th>
                      <th>Kod</th>
                      <th className="text-right">Portal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.workers.map((worker) => (
                      <tr key={worker.id}>
                        <td className="font-medium text-slate-900">{worker.fullName}</td>
                        <td className="font-mono text-slate-600">
                          {worker.loginCode || '—'}
                        </td>
                        <td className="text-right">
                          <Button
                            size="sm"
                            variant={worker.loginEnabled ? 'secondary' : 'primary'}
                            disabled={busy === worker.id || !worker.hasLogin}
                            onClick={() => toggleWorker(worker.id, !worker.loginEnabled)}
                          >
                            {worker.loginEnabled ? 'O‘chirish' : 'Yoqish'}
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          </div>

          <div>
            <h2 className="mb-3 text-lg font-semibold text-slate-900">Xodim kirishi</h2>
            <Card>
              <CardContent className="p-0">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Foydalanuvchi</th>
                      <th>Rol</th>
                      <th className="text-right">Kirish</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.staff.map((user) => (
                      <tr key={user.id}>
                        <td className="font-medium text-slate-900">{user.fullName}</td>
                        <td className="text-slate-600">{user.roleLabel}</td>
                        <td className="text-right">
                          {user.isCreator ? (
                            <span className="text-xs text-slate-400">—</span>
                          ) : (
                            <Button
                              size="sm"
                              variant={user.accessDisabled ? 'primary' : 'secondary'}
                              disabled={busy === user.id}
                              onClick={() => toggleStaff(user.id, !user.accessDisabled)}
                            >
                              {user.accessDisabled ? 'Ochish' : 'Yopish'}
                            </Button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          </div>

          {data.neverLoggedIn.length > 0 ? (
            <div>
              <h2 className="mb-3 text-lg font-semibold text-slate-900">
                Hech qachon kirmaganlar
              </h2>
              <Card>
                <CardContent className="p-4">
                  <ul className="space-y-2 text-sm text-slate-700">
                    {data.neverLoggedIn.map((row) => (
                      <li key={row.id}>
                        {row.fullName}{' '}
                        <span className="font-mono text-slate-500">{row.loginCode}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
