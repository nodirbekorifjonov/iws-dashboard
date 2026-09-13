'use client';

import { cn } from '@/lib/utils';
import { UserRole, USER_ROLE_LABELS } from '@/types/database';
import { signOut } from '@/lib/actions/auth';
import {
  LayoutDashboard,
  Users,
  ClipboardCheck,
  Calculator,
  UserCog,
  LogOut,
  Menu,
  X,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';

interface SidebarProps {
  userRole: UserRole;
  userName: string;
}

const navItems = [
  { href: '/dashboard', label: 'Bosh sahifa', icon: LayoutDashboard, roles: ['superadmin', 'admin', 'brigadier'] },
  { href: '/workers', label: 'Ishchilar', icon: Users, roles: ['superadmin', 'admin'] },
  { href: '/attendance', label: 'Davomat', icon: ClipboardCheck, roles: ['superadmin', 'admin', 'brigadier'] },
  { href: '/payroll', label: 'Hisoblash', icon: Calculator, roles: ['superadmin', 'admin'] },
  { href: '/users', label: 'Foydalanuvchilar', icon: UserCog, roles: ['superadmin'] },
];

export function Sidebar({ userRole, userName }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);

  const filteredNav = navItems.filter((item) => item.roles.includes(userRole));

  async function handleLogout() {
    await signOut();
    router.push('/login');
    router.refresh();
  }

  const navContent = (
    <>
      <div className="flex items-center gap-3 px-6 py-5 border-b border-amber-700/30">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500 font-bold text-white">
          IWS
        </div>
        <div>
          <h1 className="text-lg font-bold text-white">IWS</h1>
          <p className="text-xs text-amber-200">Isko Working System</p>
        </div>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-4">
        {filteredNav.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-amber-600 text-white'
                  : 'text-amber-100 hover:bg-amber-800 hover:text-white'
              )}
            >
              <Icon className="h-5 w-5" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-amber-700/30 p-4">
        <div className="mb-3 px-2">
          <p className="text-sm font-medium text-white truncate">{userName}</p>
          <p className="text-xs text-amber-200">{USER_ROLE_LABELS[userRole]}</p>
        </div>
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-amber-100 hover:bg-amber-800 hover:text-white transition-colors"
        >
          <LogOut className="h-5 w-5" />
          Chiqish
        </button>
      </div>
    </>
  );

  return (
    <>
      <header className="fixed inset-x-0 top-0 z-40 flex h-14 items-center gap-3 bg-amber-900 px-3 lg:hidden">
        <button
          type="button"
          onClick={() => setMobileOpen(true)}
          className="rounded-lg p-2 text-white hover:bg-amber-800"
          aria-label="Menyuni ochish"
        >
          <Menu className="h-5 w-5" />
        </button>
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-amber-500 text-xs font-bold text-white">
            IWS
          </div>
          <span className="text-sm font-semibold text-white">IWS</span>
        </div>
      </header>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="relative flex h-full w-72 flex-col bg-amber-900">
            <button
              type="button"
              onClick={() => setMobileOpen(false)}
              className="absolute top-4 right-4 rounded-lg p-1 text-amber-200 hover:text-white"
              aria-label="Menyuni yopish"
            >
              <X className="h-5 w-5" />
            </button>
            {navContent}
          </aside>
        </div>
      )}

      <aside className="hidden lg:flex lg:w-72 lg:flex-col lg:fixed lg:inset-y-0 bg-amber-900">
        {navContent}
      </aside>
    </>
  );
}
