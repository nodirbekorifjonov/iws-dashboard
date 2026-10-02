'use client';

import { cn } from '@/lib/utils';
import { visibleRoleLabel } from '@/lib/auth/creator';
import { UserRole } from '@/types/database';
import { signOut } from '@/lib/actions/auth';
import {
  LayoutDashboard,
  Users,
  ClipboardCheck,
  Calculator,
  UserCog,
  LogOut,
  X,
  Shield,
  MapPin,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface SidebarProps {
  userRole: UserRole;
  userName: string;
  mobileOpen: boolean;
  onMobileOpenChange: (open: boolean) => void;
}

const navItems = [
  { href: '/dashboard', label: 'Bosh sahifa', icon: LayoutDashboard, roles: ['superadmin', 'admin', 'brigadier', 'creator'] },
  { href: '/workers', label: 'Ishchilar', icon: Users, roles: ['superadmin', 'admin', 'creator'] },
  { href: '/attendance', label: 'Davomat', icon: ClipboardCheck, roles: ['superadmin', 'admin', 'brigadier', 'creator'] },
  { href: '/payroll', label: 'Hisoblash', icon: Calculator, roles: ['superadmin', 'admin', 'creator'] },
  { href: '/locations', label: 'Ish joylari', icon: MapPin, roles: ['superadmin', 'admin', 'creator'] },
  { href: '/users', label: 'Foydalanuvchilar', icon: UserCog, roles: ['superadmin', 'creator'] },
  { href: '/control', label: 'Nazorat', icon: Shield, roles: ['creator'] },
];

export function Sidebar({
  userRole,
  userName,
  mobileOpen,
  onMobileOpenChange,
}: SidebarProps) {
  const pathname = usePathname();
  const filteredNav = navItems.filter((item) => item.roles.includes(userRole));

  async function handleLogout() {
    try {
      await signOut();
    } finally {
      window.location.assign('/login');
    }
  }

  const navContent = (
    <>
      <div className="flex items-center gap-3 px-5 py-5">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-600 text-xs font-bold text-white">
          IWS
        </div>
        <div>
          <h1 className="text-sm font-semibold text-slate-900">IWS</h1>
          <p className="text-xs text-slate-500">Isko Working System</p>
        </div>
      </div>

      <nav className="flex-1 space-y-0.5 px-3 py-2">
        {filteredNav.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => onMobileOpenChange(false)}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-indigo-50 text-indigo-700'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              )}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-slate-200 p-3">
        <div className="mb-2 px-2">
          <p className="truncate text-sm font-medium text-slate-900">{userName}</p>
          <p className="text-xs text-slate-500">{visibleRoleLabel(userRole)}</p>
        </div>
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-900"
        >
          <LogOut className="h-4 w-4" />
          Chiqish
        </button>
      </div>
    </>
  );

  return (
    <>
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="animate-fade-in absolute inset-0 bg-slate-900/40"
            onClick={() => onMobileOpenChange(false)}
          />
          <aside className="relative flex h-full w-60 flex-col border-r border-slate-200 bg-white">
            <button
              type="button"
              onClick={() => onMobileOpenChange(false)}
              className="absolute top-4 right-3 rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              aria-label="Menyuni yopish"
            >
              <X className="h-5 w-5" />
            </button>
            {navContent}
          </aside>
        </div>
      )}

      <aside className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-60 lg:flex-col lg:border-r lg:border-slate-200 lg:bg-white">
        {navContent}
      </aside>
    </>
  );
}
