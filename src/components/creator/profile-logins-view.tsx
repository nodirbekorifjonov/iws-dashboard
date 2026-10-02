'use client';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { formatDateTime, formatRelativeTime } from '@/lib/utils';
import { ProfileLogin, WorkerLoginStatus } from '@/types/database';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

interface ProfileLoginsViewProps {
  statuses: WorkerLoginStatus[];
  recent: ProfileLogin[];
  loggedInCount: number;
  workerCount: number;
}

function isRecent(date: string | null, now: number) {
  if (!date) return false;
  return now - new Date(date).getTime() < 10 * 60 * 1000;
}

function LoginTime({ date }: { date: string }) {
  const [label, setLabel] = useState<string | null>(null);

  useEffect(() => {
    setLabel(`${formatRelativeTime(date)} · ${formatDateTime(date)}`);
  }, [date]);

  return <span>{label ?? '—'}</span>;
}

export function ProfileLoginsView({
  statuses,
  recent,
  loggedInCount,
  workerCount,
}: ProfileLoginsViewProps) {
  const router = useRouter();
  const loggedIn = statuses.filter((status) => status.hasLoggedIn);
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    setNow(Date.now());
    const id = window.setInterval(() => {
      setNow(Date.now());
      router.refresh();
    }, 15000);
    return () => window.clearInterval(id);
  }, [router]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Profilga kirganlar</h1>
        <p className="mt-1 text-sm text-slate-500">
          Ishchilarning o‘z profiliga kirishlari. Ro‘yxat avtomatik yangilanadi.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-slate-500">Profiliga kirgan</p>
            <p className="mt-1 text-3xl font-semibold text-slate-900">
              {loggedInCount}
              <span className="ml-2 text-base font-medium text-slate-500">
                / {workerCount}
              </span>
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-slate-500">Oxirgi kirish</p>
            <p className="mt-1 text-lg font-semibold text-slate-900">
              {loggedIn[0]?.lastLoggedInAt ? (
                <LoginTime date={loggedIn[0].lastLoggedInAt} />
              ) : (
                'Hali yo‘q'
              )}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-3 md:hidden">
        {loggedIn.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-sm text-slate-500">
              Hali hech kim o‘z profiliga kirmagan
            </CardContent>
          </Card>
        ) : (
          loggedIn.map((status) => (
            <Card key={status.workerId}>
              <CardContent className="space-y-2 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-medium text-slate-900">{status.fullName}</p>
                    <p className="mt-1 font-mono text-sm text-slate-700">
                      {status.loginCode || 'Kod yo‘q'}
                    </p>
                  </div>
                  {now && isRecent(status.lastLoggedInAt, now) ? (
                    <Badge variant="success">Hozir</Badge>
                  ) : null}
                </div>
                <p className="text-sm text-slate-600">
                  {status.lastLoggedInAt ? (
                    <LoginTime date={status.lastLoggedInAt} />
                  ) : (
                    '—'
                  )}
                </p>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <Card className="hidden md:block">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>F.I.Sh</th>
                  <th>Kod</th>
                  <th>Oxirgi kirish</th>
                  <th>Holat</th>
                </tr>
              </thead>
              <tbody>
                {loggedIn.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center text-slate-500">
                      Hali hech kim o‘z profiliga kirmagan
                    </td>
                  </tr>
                ) : (
                  loggedIn.map((status) => (
                    <tr key={status.workerId}>
                      <td className="font-medium text-slate-900">
                        {status.fullName}
                      </td>
                      <td className="font-mono text-slate-700">
                        {status.loginCode || '—'}
                      </td>
                      <td className="text-slate-600">
                        {status.lastLoggedInAt ? (
                          <LoginTime date={status.lastLoggedInAt} />
                        ) : (
                          '—'
                        )}
                      </td>
                      <td>
                        {now && isRecent(status.lastLoggedInAt, now) ? (
                          <Badge variant="success">Hozir</Badge>
                        ) : (
                          <Badge variant="neutral">Kirgan</Badge>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {recent.length > 0 ? (
        <div>
          <h2 className="mb-3 text-lg font-semibold text-slate-900">So‘nggi kirishlar</h2>
          <Card>
            <CardContent className="p-0">
              <ul className="divide-y divide-slate-100">
                {recent.slice(0, 20).map((event) => (
                  <li
                    key={event.id}
                    className="flex flex-wrap items-center justify-between gap-2 px-6 py-3"
                  >
                    <div>
                      <p className="font-medium text-slate-900">{event.full_name}</p>
                      <p className="font-mono text-xs text-slate-500">
                        {event.login_code || 'Kod yo‘q'}
                      </p>
                    </div>
                    <p className="text-sm text-slate-600">
                      <LoginTime date={event.logged_in_at} />
                    </p>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>
      ) : null}
    </div>
  );
}
