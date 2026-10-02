'use client';

import { ActivityHeartbeat } from '@/components/layout/activity-heartbeat';
import { AppHeader } from '@/components/layout/app-header';
import { Sidebar } from '@/components/layout/sidebar';
import { UserRole } from '@/types/database';
import { useState } from 'react';

interface AppShellProps {
  userRole: UserRole;
  userName: string;
  children: React.ReactNode;
}

export function AppShell({ userRole, userName, children }: AppShellProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50">
      <ActivityHeartbeat />
      <Sidebar
        userRole={userRole}
        userName={userName}
        mobileOpen={mobileOpen}
        onMobileOpenChange={setMobileOpen}
      />
      <div className="lg:pl-60">
        <AppHeader
          userName={userName}
          userRole={userRole}
          onMenuClick={() => setMobileOpen(true)}
        />
        <main className="px-4 py-6 sm:px-6 lg:px-8 lg:py-8">{children}</main>
      </div>
    </div>
  );
}
