import { Sidebar } from '@/components/layout/sidebar';
import { getCurrentUser } from '@/lib/actions/auth';
import { redirect } from 'next/navigation';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await getCurrentUser();

  if (!profile) {
    redirect('/login');
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
