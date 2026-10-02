'use client';

import { visibleRoleLabel } from '@/lib/auth/creator';
import { signOut } from '@/lib/actions/auth';
import { UserRole } from '@/types/database';
import { LogOut, Menu } from 'lucide-react';
import { usePathname } from 'next/navigation';

const PAGE_TITLES: Record<string, string> = {
  '/dashboard': 'Bosh sahifa',
  '/workers': 'Ishchilar',
  '/attendance': 'Davomat',
  '/payroll': 'Hisoblash',
  '/locations': 'Ish joylari',
  '/users': 'Foydalanuvchilar',
  '/control': 'Nazorat',
  '/logins': 'Kirishlar',
};

interface AppHeaderProps {
  userName: string;
  userRole: UserRole;
  onMenuClick: () => void;
}

export function AppHeader({ userName, userRole, onMenuClick }: AppHeaderProps) {
  const pathname = usePathname();
  const title = PAGE_TITLES[pathname] || 'IWS';

  async function handleLogout() {
    try {
      await signOut();
    } finally {
      window.location.assign('/login');
    }
  }

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center justify-between gap-3 border-b border-slate-200 bg-white/90 px-4 backdrop-blur sm:px-6">
      <div className="flex min-w-0 items-center gap-3">
        <button
          type="button"
          onClick={onMenuClick}
          className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 lg:hidden"
          aria-label="Menyuni ochish"
        >
          <Menu className="h-5 w-5" />
        </button>
        <p className="truncate text-sm font-semibold text-slate-900">{title}</p>
      </div>

      <div className="flex items-center gap-3">
        <div className="hidden text-right sm:block">
          <p className="truncate text-sm font-medium text-slate-900">{userName}</p>
          <p className="text-xs text-slate-500">{visibleRoleLabel(userRole)}</p>
        </div>
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-50 text-xs font-semibold text-indigo-700">
          {userName.trim().charAt(0).toUpperCase() || 'U'}
        </div>
        <button
          type="button"
          onClick={handleLogout}
          className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900"
        >
          <LogOut className="h-4 w-4" />
          <span className="hidden sm:inline">Chiqish</span>
        </button>
      </div>
    </header>
  );
}
