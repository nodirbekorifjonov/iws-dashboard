import { getActivityPings } from '@/lib/api/activity';
import { getAuditEvents } from '@/lib/api/audit';
import { getDashboardStats } from '@/lib/api/attendance';
import { getProfileLogins } from '@/lib/api/logins';
import { calculatePayroll } from '@/lib/api/payroll';
import { isCreatorEmail, visibleRoleLabel } from '@/lib/auth/creator';
import { createSupabaseAdminClient } from '@/lib/providers/supabase/admin';
import { formatCurrency } from '@/lib/utils';
import { auditContext } from '@/lib/utils/audit-context';
import {
  AuditEvent,
  ControlAlert,
  ControlLoginRow,
  UserRole,
} from '@/types/database';

const ONLINE_MS = 10 * 60 * 1000;
const LARGE_ADVANCE = 500_000;

function isNightHour(date: string) {
  const hour = new Date(date).getHours();
  return hour >= 22 || hour < 6;
}

function daysAgo(date: string) {
  return (Date.now() - new Date(date).getTime()) / 86_400_000;
}

export interface ControlWorkerRow {
  id: string;
  fullName: string;
  loginCode: string | null;
  loginEnabled: boolean;
  hasLogin: boolean;
}

export interface ControlStaffRow {
  id: string;
  fullName: string;
  role: UserRole;
  roleLabel: string;
  accessDisabled: boolean;
  isCreator: boolean;
}

export interface ControlChartSlice {
  label: string;
  value: number;
  color: string;
}

export interface ControlChartBar {
  label: string;
  value: number;
}

export interface ControlCenterData {
  month: string;
  monthLabel: string;
  stats: {
    totalWorkers: number;
    todayPresent: number;
    todayAbsent: number;
    todayLate: number;
    totalHours: number;
    totalSalary: number;
    totalAdvance: number;
    onlineCount: number;
    alertCount: number;
  };
  charts: {
    attendance: ControlChartSlice[];
    logins: ControlChartSlice[];
    payroll: ControlChartSlice[];
    roles: ControlChartSlice[];
    topHours: ControlChartBar[];
    topSalary: ControlChartBar[];
  };
  logins: ControlLoginRow[];
  neverLoggedIn: ControlLoginRow[];
  recentLogins: ControlCenterData['logins'];
  audit: AuditEvent[];
  alerts: ControlAlert[];
  workers: ControlWorkerRow[];
  staff: ControlStaffRow[];
}

const MONTH_NAMES = [
  'Yanvar',
  'Fevral',
  'Mart',
  'Aprel',
  'May',
  'Iyun',
  'Iyul',
  'Avgust',
  'Sentabr',
  'Oktabr',
  'Noyabr',
  'Dekabr',
];

const ROLE_COLORS = ['#4f46e5', '#0ea5e9', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444'];

export async function getControlCenter(): Promise<ControlCenterData> {
  const now = new Date();
  const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const admin = createSupabaseAdminClient();

  const [dash, payroll, logins, audit, pings] = await Promise.all([
    getDashboardStats(),
    calculatePayroll(month),
    getProfileLogins(),
    getAuditEvents(200),
    getActivityPings(),
  ]);

  type WorkerRow = {
    id: string;
    full_name: string;
    login_code: string | null;
    user_id: string | null;
    is_active: boolean;
    login_enabled?: boolean;
    created_at?: string;
  };
  type ProfileRow = {
    id: string;
    full_name: string;
    role: UserRole;
    access_disabled?: boolean;
  };

  let workers: WorkerRow[] = [];
  {
    const withFlags = await admin
      .from('workers')
      .select('id, full_name, login_code, user_id, is_active, login_enabled, created_at')
      .order('full_name');
    if (withFlags.error) {
      const fallback = await admin
        .from('workers')
        .select('id, full_name, login_code, user_id, is_active, created_at')
        .order('full_name');
      if (fallback.error) throw fallback.error;
      workers = (fallback.data || []) as WorkerRow[];
    } else {
      workers = (withFlags.data || []) as WorkerRow[];
    }
  }

  let profiles: ProfileRow[] = [];
  {
    const withFlags = await admin
      .from('profiles')
      .select('id, full_name, role, access_disabled')
      .order('full_name');
    if (withFlags.error) {
      const fallback = await admin
        .from('profiles')
        .select('id, full_name, role')
        .order('full_name');
      if (fallback.error) throw fallback.error;
      profiles = (fallback.data || []) as ProfileRow[];
    } else {
      profiles = (withFlags.data || []) as ProfileRow[];
    }
  }

  const authEmails = new Map<string, { email?: string; last_sign_in_at?: string | null }>();
  let page = 1;
  while (page <= 10) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 200 });
    if (error) break;
    for (const user of data.users) {
      authEmails.set(user.id, {
        email: user.email,
        last_sign_in_at: user.last_sign_in_at,
      });
    }
    if (data.users.length < 200) break;
    page += 1;
  }

  const onlineIds = new Set(
    pings
      .filter((ping) => Date.now() - new Date(ping.last_seen_at).getTime() < ONLINE_MS)
      .map((ping) => ping.user_id)
  );

  const workerLogins: ControlLoginRow[] = logins.statuses.map((status) => {
    const worker = workers.find((item) => item.id === status.workerId);
    return {
      id: status.workerId,
      fullName: status.fullName,
      role: 'Ishchi',
      loginCode: status.loginCode,
      lastLoggedInAt: status.lastLoggedInAt,
      isOnline: Boolean(worker?.user_id && onlineIds.has(worker.user_id)),
      hasLoggedIn: status.hasLoggedIn,
      loginEnabled: worker?.login_enabled !== false,
      kind: 'worker',
    };
  });

  const staffLogins: ControlLoginRow[] = profiles
    .filter((profile) => profile.role !== 'worker')
    .map((profile) => {
      const auth = authEmails.get(profile.id);
      const lastFromEvents = logins.recent.find((event) => event.user_id === profile.id)
        ?.logged_in_at;
      const lastLoggedInAt = lastFromEvents || auth?.last_sign_in_at || null;
      return {
        id: profile.id,
        fullName: profile.full_name,
        role: visibleRoleLabel(
          isCreatorEmail(auth?.email) ? 'creator' : profile.role
        ),
        loginCode: null,
        lastLoggedInAt,
        isOnline: onlineIds.has(profile.id),
        hasLoggedIn: Boolean(lastLoggedInAt),
        loginEnabled: profile.access_disabled !== true,
        kind: 'staff',
      };
    });

  const allLogins = [...workerLogins, ...staffLogins].sort((a, b) => {
    if (a.isOnline !== b.isOnline) return a.isOnline ? -1 : 1;
    return (b.lastLoggedInAt || '').localeCompare(a.lastLoggedInAt || '');
  });

  const neverLoggedIn = workerLogins.filter((row) => {
    const worker = workers.find((item) => item.id === row.id);
    return Boolean(worker?.user_id) && !row.hasLoggedIn;
  });

  const alerts = buildAlerts(audit, logins.recent, neverLoggedIn, workers);

  const totalHours = payroll.rows.reduce((sum, row) => sum + row.totalHours, 0);
  const totalSalary = payroll.rows.reduce((sum, row) => sum + row.calculatedSalary, 0);
  const totalAdvance = payroll.rows.reduce((sum, row) => sum + row.advanceAmount, 0);
  const totalRemaining = payroll.rows.reduce((sum, row) => sum + row.remainingAmount, 0);

  const onlineCount = allLogins.filter((row) => row.isOnline).length;
  const loggedInCount = allLogins.filter((row) => row.hasLoggedIn && !row.isOnline).length;
  const neverCount = allLogins.filter((row) => !row.hasLoggedIn).length;

  const roleCounts = new Map<string, number>();
  for (const row of allLogins) {
    roleCounts.set(row.role, (roleCounts.get(row.role) || 0) + 1);
  }

  return {
    month,
    monthLabel: `${MONTH_NAMES[now.getMonth()]} ${now.getFullYear()}`,
    stats: {
      totalWorkers: dash.totalWorkers,
      todayPresent: dash.todayPresent,
      todayAbsent: dash.todayAbsent,
      todayLate: dash.todayLate,
      totalHours,
      totalSalary,
      totalAdvance,
      onlineCount,
      alertCount: alerts.length,
    },
    charts: {
      attendance: [
        { label: 'Keldi', value: dash.todayPresent, color: '#10b981' },
        { label: 'Kech qoldi', value: dash.todayLate, color: '#f59e0b' },
        { label: 'Kelmadi', value: dash.todayAbsent, color: '#ef4444' },
      ],
      logins: [
        { label: 'Onlayn', value: onlineCount, color: '#4f46e5' },
        { label: 'Kirgan', value: loggedInCount, color: '#0ea5e9' },
        { label: 'Kirmagan', value: neverCount, color: '#94a3b8' },
      ],
      payroll: [
        { label: 'Maosh', value: Math.round(totalSalary), color: '#4f46e5' },
        { label: 'Avans', value: Math.round(totalAdvance), color: '#f59e0b' },
        {
          label: totalRemaining >= 0 ? 'Qolgan' : 'Qarz',
          value: Math.round(Math.abs(totalRemaining)),
          color: totalRemaining >= 0 ? '#10b981' : '#ef4444',
        },
      ],
      roles: [...roleCounts.entries()].map(([label, value], index) => ({
        label,
        value,
        color: ROLE_COLORS[index % ROLE_COLORS.length],
      })),
      topHours: [...payroll.rows]
        .filter((row) => row.totalHours > 0)
        .sort((a, b) => b.totalHours - a.totalHours)
        .slice(0, 8)
        .map((row) => ({
          label: row.worker.full_name,
          value: Math.round(row.totalHours * 10) / 10,
        })),
      topSalary: [...payroll.rows]
        .filter((row) => row.calculatedSalary > 0)
        .sort((a, b) => b.calculatedSalary - a.calculatedSalary)
        .slice(0, 8)
        .map((row) => ({
          label: row.worker.full_name,
          value: Math.round(row.calculatedSalary),
        })),
    },
    logins: allLogins,
    neverLoggedIn,
    recentLogins: allLogins.filter((row) => row.hasLoggedIn).slice(0, 20),
    audit,
    alerts,
    workers: workers.map((worker) => ({
      id: worker.id,
      fullName: worker.full_name,
      loginCode: worker.login_code,
      loginEnabled: worker.login_enabled !== false,
      hasLogin: Boolean(worker.user_id),
    })),
    staff: profiles
      .filter((profile) => profile.role !== 'worker')
      .map((profile) => {
        const email = authEmails.get(profile.id)?.email;
        return {
          id: profile.id,
          fullName: profile.full_name,
          role: profile.role,
          roleLabel: visibleRoleLabel(
            isCreatorEmail(email) ? 'creator' : profile.role
          ),
          accessDisabled: profile.access_disabled === true,
          isCreator: isCreatorEmail(email),
        };
      }),
  };
}

function buildAlerts(
  audit: AuditEvent[],
  recentLogins: { role: string; full_name: string; logged_in_at: string }[],
  neverLoggedIn: ControlLoginRow[],
  workers: Array<{ id: string; created_at?: string; user_id?: string | null }>
): ControlAlert[] {
  const alerts: ControlAlert[] = [];
  const dayAgo = Date.now() - 86_400_000;

  const resets = new Map<string, AuditEvent[]>();
  for (const event of audit) {
    if (event.action !== 'worker.login_reset') continue;
    if (new Date(event.created_at).getTime() < dayAgo) continue;
    const key = event.entity_id || event.entity_name || 'unknown';
    const list = resets.get(key) ?? [];
    list.push(event);
    resets.set(key, list);
  }
  for (const [key, list] of resets) {
    if (list.length < 2) continue;
    const context = auditContext(list[0].action, list[0].metadata, list[0].entity_name);
    alerts.push({
      id: `reset-${key}`,
      title: 'Parol ko‘p marta yangilandi',
      detail: `Bo‘lim: ${context.section}. ${list[0].entity_name || 'Ishchi'} uchun 24 soatda ${list.length} marta parol yangilandi.`,
      createdAt: list[0].created_at,
      severity: 'warning',
      section: context.section,
      href: context.href,
    });
  }

  for (const event of audit) {
    if (event.action === 'payroll.advance' && isNightHour(event.created_at)) {
      const amount = Number(event.metadata?.amount ?? 0);
      if (amount >= LARGE_ADVANCE) {
        const context = auditContext(event.action, event.metadata, event.entity_name);
        const oldAmount = Number(event.metadata?.oldAmount ?? 0);
        const workerName = event.entity_name || 'ishchi';
        alerts.push({
          id: `night-advance-${event.id}`,
          title: 'Kechasi katta avans',
          detail: `Bo‘lim: ${context.section}${context.monthLabel ? ` · Oy: ${context.monthLabel}` : ''}. ${event.actor_name} ${workerName} avansini ${formatCurrency(oldAmount)} → ${formatCurrency(amount)} qildi.`,
          createdAt: event.created_at,
          severity: 'danger',
          section: context.section,
          href: context.href,
        });
      }
    }
    if (event.action === 'attendance.save') {
      const count = Number(event.metadata?.count ?? 0);
      if (count >= 20) {
        const context = auditContext(event.action, event.metadata, event.entity_name);
        alerts.push({
          id: `attendance-${event.id}`,
          title: 'Katta davomat o‘zgarishi',
          detail: `Bo‘lim: ${context.section}${context.monthLabel ? ` · Oy: ${context.monthLabel}` : ''}. ${event.actor_name} ${count} qator tahrirladi.`,
          createdAt: event.created_at,
          severity: 'warning',
          section: context.section,
          href: context.href,
        });
      }
    }
    if (event.action === 'worker.delete' && daysAgo(event.created_at) < 7) {
      const context = auditContext(event.action, event.metadata, event.entity_name);
      alerts.push({
        id: `delete-${event.id}`,
        title: 'Ishchi o‘chirildi',
        detail: `Bo‘lim: ${context.section}. ${event.actor_name} ${event.entity_name || 'ishchi'} ni o‘chirdi.`,
        createdAt: event.created_at,
        severity: 'danger',
        section: context.section,
        href: context.href,
      });
    }
  }

  for (const event of recentLogins) {
    if (event.role === 'worker') continue;
    if (!isNightHour(event.logged_in_at)) continue;
    if (daysAgo(event.logged_in_at) > 2) continue;
    alerts.push({
      id: `night-login-${event.full_name}-${event.logged_in_at}`,
      title: 'Kechasi xodim kirdi',
      detail: `Bo‘lim: Kirish. ${event.full_name} kechasi tizimga kirdi.`,
      createdAt: event.logged_in_at,
      severity: 'warning',
      section: 'Kirish',
      href: '/control',
    });
  }

  for (const row of neverLoggedIn) {
    const worker = workers.find((item) => item.id === row.id);
    const created = (worker as { created_at?: string } | undefined)?.created_at;
    if (created && daysAgo(created) < 7) continue;
    alerts.push({
      id: `never-${row.id}`,
      title: 'Kirish yaratilgan, lekin kirmagan',
      detail: `Bo‘lim: Ishchilar. ${row.fullName} (${row.loginCode || 'kod yo‘q'}) hali profiliga kirmagan.`,
      createdAt: created || new Date().toISOString(),
      severity: 'warning',
      section: 'Ishchilar',
      href: '/workers',
    });
  }

  alerts.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  return alerts.slice(0, 40);
}

export async function setWorkerLoginEnabled(workerId: string, enabled: boolean) {
  const admin = createSupabaseAdminClient();
  const { error } = await admin
    .from('workers')
    .update({ login_enabled: enabled })
    .eq('id', workerId);
  if (error) {
    if (error.message.includes('login_enabled') || error.code === 'PGRST204') {
      throw new Error(
        "Baza yangilanmagan. Supabase SQL Editor’da 011_creator_control.sql ni ishga tushiring."
      );
    }
    throw error;
  }
}

export async function setStaffAccessDisabled(userId: string, disabled: boolean) {
  const admin = createSupabaseAdminClient();
  const { data: user } = await admin.auth.admin.getUserById(userId);
  if (isCreatorEmail(user.user?.email)) {
    throw new Error('Bu hisobni yopib bo‘lmaydi.');
  }
  const { error } = await admin
    .from('profiles')
    .update({ access_disabled: disabled })
    .eq('id', userId);
  if (error) {
    if (error.message.includes('access_disabled') || error.code === 'PGRST204') {
      throw new Error(
        "Baza yangilanmagan. Supabase SQL Editor’da 011_creator_control.sql ni ishga tushiring."
      );
    }
    throw error;
  }
}
