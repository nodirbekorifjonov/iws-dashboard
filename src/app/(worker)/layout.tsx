import { signOut } from '@/lib/actions/auth';
import { requirePageRole } from '@/lib/auth/require-role';
import { USER_ROLE_LABELS } from '@/types/database';
import { LogOut } from 'lucide-react';
import { redirect } from 'next/navigation';

export default async function WorkerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await requirePageRole(['worker']);

  return (
    <div className="min-h-screen bg-amber-50">
      <header className="sticky top-0 z-30 border-b border-amber-800/40 bg-amber-900">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-3 px-4 py-3">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-amber-500 text-sm font-bold text-white">
              IWS
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-white">{profile.full_name}</p>
              <p className="text-xs text-amber-200">{USER_ROLE_LABELS.worker}</p>
            </div>
          </div>
          <form
            action={async () => {
              'use server';
              await signOut();
              redirect('/login');
            }}
          >
            <button
              type="submit"
              className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-amber-100 hover:bg-amber-800 hover:text-white"
            >
              <LogOut className="h-4 w-4" />
              Chiqish
            </button>
          </form>
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-4 py-6 sm:px-6">{children}</main>
    </div>
  );
}
