import { getUsers } from '@/lib/actions/auth';
import { visibleRoleLabel } from '@/lib/auth/creator';
import { requirePageRole } from '@/lib/auth/require-role';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PageHeader } from '@/components/layout/page-header';
import { EmptyState } from '@/components/ui/empty-state';

function roleVariant(role: string) {
  if (role === 'superadmin' || role === 'creator') return 'info' as const;
  if (role === 'admin') return 'info' as const;
  if (role === 'worker') return 'warning' as const;
  return 'success' as const;
}

export default async function UsersPage() {
  await requirePageRole(['superadmin', 'creator']);

  const users = await getUsers();

  return (
    <div>
      <PageHeader
        title="Foydalanuvchilar"
        description="Tizim foydalanuvchilarini boshqarish (faqat superadmin)"
      />

      <div className="mb-4 rounded-xl border border-indigo-100 bg-indigo-50 p-4">
        <p className="text-sm text-indigo-900">
          Yangi foydalanuvchi yaratish uchun Supabase Dashboard → Authentication → Users
          bo&apos;limidan foydalanuvchi qo&apos;shing. Rol avtomatik{' '}
          <code className="rounded bg-white/70 px-1">brigadier</code> bo&apos;ladi.
          Superadmin/admin qilish uchun SQL:{' '}
          <code className="rounded bg-white/70 px-1">
            UPDATE profiles SET role = &apos;superadmin&apos; WHERE id = &apos;...&apos;
          </code>
          . Metadata da faqat <code className="rounded bg-white/70 px-1">full_name</code>{' '}
          ishlatiladi. Ishchi kirishi Ishchilar sahifasidan yaratiladi; parol = kod + ism
          (bo‘sh joysiz).
        </p>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>F.I.Sh</th>
                  <th>Rol</th>
                  <th>Biriktirilgan blok</th>
                  <th>Ro&apos;yxatdan o&apos;tgan</th>
                </tr>
              </thead>
              <tbody>
                {users.length === 0 ? (
                  <tr>
                    <td colSpan={4}>
                      <EmptyState title="Foydalanuvchilar yo‘q" />
                    </td>
                  </tr>
                ) : (
                  users.map((user) => (
                    <tr key={user.id}>
                      <td className="font-medium text-slate-900">{user.full_name}</td>
                      <td>
                        <Badge variant={roleVariant(user.role)}>
                          {visibleRoleLabel(user.role)}
                        </Badge>
                      </td>
                      <td className="text-slate-600">{user.location?.name || '—'}</td>
                      <td className="text-slate-600">
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
