import { getDashboardStats } from '@/lib/actions/attendance';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { PageHeader } from '@/components/layout/page-header';
import { StatCard } from '@/components/ui/stat-card';
import { ADMIN_ROLES, STAFF_ROLES, requirePageRole } from '@/lib/auth/require-role';
import { UserRole } from '@/types/database';
import { Users, CheckCircle, XCircle, Clock, Calculator, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default async function DashboardPage() {
  const profile = await requirePageRole(STAFF_ROLES);
  const stats = await getDashboardStats();

  const cards = [
    {
      title: 'Faol ishchilar',
      value: stats.totalWorkers,
      icon: Users,
      tone: 'blue' as const,
    },
    {
      title: 'Bugun keldi',
      value: stats.todayPresent,
      icon: CheckCircle,
      tone: 'green' as const,
    },
    {
      title: 'Bugun kelmadi',
      value: stats.todayAbsent,
      icon: XCircle,
      tone: 'red' as const,
    },
    {
      title: 'Kech qoldi',
      value: stats.todayLate,
      icon: Clock,
      tone: 'amber' as const,
    },
  ];

  const links = [
    {
      href: '/attendance',
      title: 'Davomat',
      description: 'Oylik davomat jadvali',
      icon: CheckCircle,
      roles: STAFF_ROLES as UserRole[],
    },
    {
      href: '/workers',
      title: 'Ishchilar ro‘yxati',
      description: 'Ishchilarni boshqarish',
      icon: Users,
      roles: ADMIN_ROLES as UserRole[],
    },
    {
      href: '/payroll',
      title: 'Hisoblash',
      description: 'Oylik maosh hisob-kitobi',
      icon: Calculator,
      roles: ADMIN_ROLES as UserRole[],
    },
  ].filter((link) => link.roles.includes(profile.role));

  return (
    <div>
      <PageHeader
        title="Bosh sahifa"
        description={`Bugungi holat — ${new Date().toLocaleDateString('uz-UZ', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        })}`}
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => (
          <StatCard
            key={card.title}
            title={card.title}
            value={card.value}
            icon={card.icon}
            tone={card.tone}
          />
        ))}
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <h2 className="text-base font-semibold text-slate-900">Tez havolalar</h2>
          </CardHeader>
          <CardContent className="space-y-2">
            {links.map((link) => {
              const Icon = link.icon;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className="flex items-center gap-3 rounded-lg px-3 py-3 transition-colors hover:bg-slate-50"
                >
                  <div className="rounded-lg bg-indigo-50 p-2 text-indigo-600">
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-slate-900">{link.title}</p>
                    <p className="text-sm text-slate-500">{link.description}</p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-slate-300" />
                </Link>
              );
            })}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <h2 className="text-base font-semibold text-slate-900">Tizim haqida</h2>
          </CardHeader>
          <CardContent>
            <p className="text-sm leading-relaxed text-slate-600">
              <strong className="font-semibold text-slate-900">IWS (Isko Working System)</strong> —
              shirinlik zavodida ishlaydigan ishchilarni boshqarish, kunlik davomatni kuzatish
              va oylik maoshni hisoblash uchun yaratilgan veb-tizim.
            </p>
            <ul className="mt-5 space-y-2 text-sm text-slate-600">
              {[
                'Ishchilar ro‘yxati (soatbay stavka)',
                'Oylik davomat jadvali',
                'Oylik maosh hisob-kitobi',
              ].map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-indigo-500" />
                  {item}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
