import { getUsers } from '@/lib/actions/auth';
import { getStaffDirectory } from '@/lib/actions/governance';
import { getLocations } from '@/lib/actions/locations';
import { visibleRoleLabel } from '@/lib/auth/creator';
import { requirePageRole } from '@/lib/auth/require-role';
import { UsersManager } from '@/components/users/users-manager';
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
  const profile = await requirePageRole(['superadmin', 'creator']);

  if (profile.role === 'creator') {
    const [accounts, locations] = await Promise.all([getStaffDirectory(), getLocations()]);
    return (
      <div>
        <PageHeader
          title="Foydalanuvchilar"
          description="Xodim hisobini yarating, rol bering va brigadirni blokka biriktiring"
        />
        <UsersManager
          accounts={accounts}
          locations={locations
            .filter((location) => location.is_active)
            .map((location) => ({ id: location.id, name: location.name }))}
        />
      </div>
    );
  }

  const users = await getUsers();

  return (
    <div>
      <PageHeader
        title="Foydalanuvchilar"
        description="Tizim foydalanuvchilari. Hisob yaratish va rol o‘zgartirish Creator nazoratida"
      />

      <div className="space-y-3 md:hidden">
        {users.length === 0 ? (
          <Card>
            <CardContent className="py-12">
              <EmptyState title="Foydalanuvchilar yo‘q" />
            </CardContent>
          </Card>
        ) : (
          users.map((user) => (
            <Card key={user.id}>
              <CardContent className="space-y-2 p-4">
                <div className="flex items-start justify-between gap-3">
                  <p className="min-w-0 break-words font-medium text-slate-900">
                    {user.full_name}
                  </p>
                  <Badge className="shrink-0" variant={roleVariant(user.role)}>
                    {visibleRoleLabel(user.role)}
                  </Badge>
                </div>
                <p className="text-sm text-slate-600">
                  {user.location?.name || 'Blok biriktirilmagan'}
                </p>
                <p className="text-sm text-slate-500">
                  {new Date(user.created_at).toLocaleDateString('uz-UZ')}
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
