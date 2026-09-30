import { getUsers } from '@/lib/actions/auth';
import { requirePageRole } from '@/lib/auth/require-role';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { USER_ROLE_LABELS } from '@/types/database';

export default async function UsersPage() {
  await requirePageRole(['superadmin']);

  const users = await getUsers();

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Foydalanuvchilar</h1>
        <p className="mt-1 text-sm text-gray-600">
          Tizim foydalanuvchilarini boshqarish (faqat superadmin)
        </p>
      </div>

      <div className="mb-4 rounded-lg bg-amber-50 border border-amber-200 p-4">
        <p className="text-sm text-amber-800">
          Yangi foydalanuvchi yaratish uchun Supabase Dashboard → Authentication → Users
          bo&apos;limidan foydalanuvchi qo&apos;shing. Rol avtomatik{' '}
          <code className="rounded bg-amber-100 px-1">brigadier</code> bo&apos;ladi.
          Superadmin/admin qilish uchun SQL:{' '}
          <code className="rounded bg-amber-100 px-1">
            UPDATE profiles SET role = &apos;superadmin&apos; WHERE id = &apos;...&apos;
          </code>
          . Metadata da faqat <code className="rounded bg-amber-100 px-1">full_name</code>{' '}
          ishlatiladi. Ishchi kirishi Ishchilar sahifasidan yaratiladi; parol = kod + ism
          (bo‘sh joysiz).
        </p>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="px-6 py-3 text-left font-medium text-gray-600">F.I.Sh</th>
                  <th className="px-6 py-3 text-left font-medium text-gray-600">Rol</th>
                  <th className="px-6 py-3 text-left font-medium text-gray-600">Biriktirilgan blok</th>
                  <th className="px-6 py-3 text-left font-medium text-gray-600">Ro&apos;yxatdan o&apos;tgan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {users.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center text-gray-500">
                      Foydalanuvchilar yo&apos;q
                    </td>
                  </tr>
                ) : (
                  users.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 font-medium text-gray-900">
                        {user.full_name}
                      </td>
                      <td className="px-6 py-4">
                        <Badge
                          className={
                            user.role === 'superadmin'
                              ? 'bg-purple-100 text-purple-800'
                              : user.role === 'admin'
                                ? 'bg-blue-100 text-blue-800'
                                : user.role === 'worker'
                                  ? 'bg-amber-100 text-amber-800'
                                  : 'bg-green-100 text-green-800'
                          }
                        >
                          {USER_ROLE_LABELS[user.role]}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-gray-600">
                        {user.location?.name || '—'}
                      </td>
                      <td className="px-6 py-4 text-gray-600">
                        {new Date(user.created_at).toLocaleDateString('uz-UZ')}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
