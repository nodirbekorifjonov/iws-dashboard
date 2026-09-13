import { getDashboardStats } from '@/lib/actions/attendance';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Users, CheckCircle, XCircle, Clock, Calculator } from 'lucide-react';

export default async function DashboardPage() {
  const stats = await getDashboardStats();

  const cards = [
    {
      title: 'Faol ishchilar',
      value: stats.totalWorkers,
      icon: Users,
      color: 'text-blue-600 bg-blue-100',
    },
    {
      title: 'Bugun keldi',
      value: stats.todayPresent,
      icon: CheckCircle,
      color: 'text-green-600 bg-green-100',
    },
    {
      title: 'Bugun kelmadi',
      value: stats.todayAbsent,
      icon: XCircle,
      color: 'text-red-600 bg-red-100',
    },
    {
      title: 'Kech qoldi',
      value: stats.todayLate,
      icon: Clock,
      color: 'text-yellow-600 bg-yellow-100',
    },
  ];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Bosh sahifa</h1>
        <p className="mt-1 text-sm text-gray-600">
          Bugungi holat — {new Date().toLocaleDateString('uz-UZ', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <Card key={card.title}>
              <CardContent className="flex items-center gap-4 pt-6">
                <div className={`rounded-lg p-3 ${card.color}`}>
                  <Icon className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">{card.title}</p>
                  <p className="text-2xl font-bold text-gray-900">{card.value}</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold text-gray-900">Tez havolalar</h2>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <a
                href="/attendance"
                className="flex items-center gap-3 rounded-lg border border-gray-200 p-4 hover:bg-gray-50 transition-colors"
              >
                <CheckCircle className="h-5 w-5 text-amber-600" />
                <div>
                  <p className="font-medium text-gray-900">Davomat</p>
                  <p className="text-sm text-gray-500">Oylik davomat jadvali</p>
                </div>
              </a>
              <a
                href="/workers"
                className="flex items-center gap-3 rounded-lg border border-gray-200 p-4 hover:bg-gray-50 transition-colors"
              >
                <Users className="h-5 w-5 text-amber-600" />
                <div>
                  <p className="font-medium text-gray-900">Ishchilar ro&apos;yxati</p>
                  <p className="text-sm text-gray-500">Ishchilarni boshqarish</p>
                </div>
              </a>
              <a
                href="/payroll"
                className="flex items-center gap-3 rounded-lg border border-gray-200 p-4 hover:bg-gray-50 transition-colors"
              >
                <Calculator className="h-5 w-5 text-amber-600" />
                <div>
                  <p className="font-medium text-gray-900">Hisoblash</p>
                  <p className="text-sm text-gray-500">Oylik maosh hisob-kitobi</p>
                </div>
              </a>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold text-gray-900">Tizim haqida</h2>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 leading-relaxed">
              <strong>IWS (Isko Working System)</strong> — shirinlik zavodida ishlaydigan
              ishchilarni boshqarish, kunlik davomatni kuzatish va oylik maoshni
              hisoblash uchun yaratilgan veb-tizim.
            </p>
            <div className="mt-4 rounded-lg bg-amber-50 p-4">
              <p className="text-sm font-medium text-amber-800">Imkoniyatlar</p>
              <ul className="mt-2 space-y-1 text-sm text-amber-700">
                <li>✓ Ishchilar ro&apos;yxati (soatbay stavka)</li>
                <li>✓ Oylik davomat jadvali</li>
                <li>✓ Oylik maosh hisob-kitobi</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
