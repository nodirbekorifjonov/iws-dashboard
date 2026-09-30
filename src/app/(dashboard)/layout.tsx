import { Sidebar } from '@/components/layout/sidebar';
import { getCurrentUser, getSessionUser, signOut } from '@/lib/actions/auth';
import { redirect } from 'next/navigation';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  let profile = null;
  try {
    profile = await getCurrentUser();
  } catch {
    profile = null;
  }

  if (!profile) {
    const session = await getSessionUser();
    if (!session) {
      redirect('/login');
    }

    return (
      <div className="flex min-h-screen items-center justify-center bg-amber-50 px-4">
        <div className="max-w-md rounded-2xl border border-amber-200 bg-white p-8 text-center shadow-lg">
          <h1 className="text-lg font-semibold text-gray-900">Profil topilmadi</h1>
          <p className="mt-3 text-sm text-gray-600">
            Hisobingiz autentifikatsiyadan o‘tgan, lekin <code>profiles</code> jadvalida
            yozuv yo‘q. Superadmin migratsiyalarni tekshirsin yoki foydalanuvchini qayta
            yaratsin.
          </p>
          <form
            className="mt-6"
            action={async () => {
              'use server';
              await signOut();
              redirect('/login');
            }}
          >
            <button
              type="submit"
              className="rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-700"
            >
              Chiqish
            </button>
          </form>
        </div>
      </div>
    );
  }

  if (profile.role === 'worker') {
    redirect('/my');
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar userRole={profile.role} userName={profile.full_name} />
      <main className="pt-14 lg:pt-0 lg:pl-72">
        <div className="px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          {children}
        </div>
      </main>
    </div>
  );
}
