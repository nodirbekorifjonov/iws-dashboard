import { listAuthUsers } from '@/lib/api/auth-users';
import { invalidateCreatorEmailCache, isCreatorEmailAsync } from '@/lib/auth/creator';
import { generateTotpSecret, verifyTotp } from '@/lib/auth/totp';
import { GOVERNANCE_MIGRATION_ERROR, isMissingSchema } from '@/lib/api/schema';
import { createSupabaseAdminClient } from '@/lib/providers/supabase/admin';
import { getSupabaseEnv } from '@/lib/supabase-env';
import { PayRates, UserRole } from '@/types/database';

const RESTORE_MS = 7 * 24 * 60 * 60 * 1000;
const STAFF_ROLES: UserRole[] = ['superadmin', 'admin', 'brigadier'];

export function canRestoreWorker(deletedAt: string) {
  const time = new Date(deletedAt).getTime();
  return Number.isFinite(time) && Date.now() - time <= RESTORE_MS;
}

export async function revokeUserSessions(userId: string) {
  const env = getSupabaseEnv();
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!env || !serviceRoleKey) {
    throw new Error(
      'SUPABASE_SERVICE_ROLE_KEY sozlanmagan. Sessiyani yopib bo‘lmadi.'
    );
  }
  const response = await fetch(
    `${env.url}/auth/v1/admin/users/${userId}/logout?scope=global`,
    {
      method: 'POST',
      headers: {
        apikey: serviceRoleKey,
        Authorization: `Bearer ${serviceRoleKey}`,
      },
    }
  );
  if (!response.ok) {
    throw new Error('Foydalanuvchi sessiyasini yopib bo‘lmadi');
  }
}

function assertMonth(month: string) {
  const value = month.slice(0, 7);
  if (!/^\d{4}-\d{2}$/.test(value)) {
    throw new Error('Oy noto‘g‘ri');
  }
  return value;
}

export async function isMonthLocked(month: string) {
  const admin = createSupabaseAdminClient();
  const { data, error } = await admin
    .from('month_locks')
    .select('month')
    .eq('month', month.slice(0, 7))
    .maybeSingle();
  if (error) {
    if (isMissingSchema(error)) throw new Error(GOVERNANCE_MIGRATION_ERROR);
    throw error;
  }
  return Boolean(data);
}

export async function listMonthLocks() {
  const admin = createSupabaseAdminClient();
  const { data, error } = await admin
    .from('month_locks')
    .select('month, locked_at')
    .order('month', { ascending: false });
  if (error) {
    if (isMissingSchema(error)) throw new Error(GOVERNANCE_MIGRATION_ERROR);
    throw error;
  }
  return (data || []) as { month: string; locked_at: string }[];
}

export async function setMonthLocked(month: string, locked: boolean, userId: string) {
  const value = assertMonth(month);
  const admin = createSupabaseAdminClient();
  if (!locked) {
    const { error } = await admin.from('month_locks').delete().eq('month', value);
    if (error) {
      if (isMissingSchema(error)) throw new Error(GOVERNANCE_MIGRATION_ERROR);
      throw error;
    }
    return value;
  }
  const { error } = await admin.from('month_locks').upsert({
    month: value,
    locked_by: userId,
    locked_at: new Date().toISOString(),
  });
  if (error) {
    if (isMissingSchema(error)) throw new Error(GOVERNANCE_MIGRATION_ERROR);
    throw error;
  }
  return value;
}

export async function assertMonthEditable(month: string, role: UserRole) {
  if (role === 'creator') return;
  if (await isMonthLocked(month)) {
    throw new Error('Bu oy yopilgan. O‘zgartirish uchun Creator oyni ochishi kerak.');
  }
}

function requirePositive(value: number, label: string) {
  if (!Number.isFinite(value) || value <= 0) {
    throw new Error(`${label} musbat son bo‘lishi kerak`);
  }
}

export async function savePaySchedule(month: string, rates: PayRates) {
  const effectiveMonth = assertMonth(month);
  requirePositive(rates.maleDailyPay, 'Erkak stavkasi');
  requirePositive(rates.maleExtraWorkPay, 'Qo‘shimcha ish');
  requirePositive(rates.female8hHourly, '8 soatlik stavka');
  requirePositive(rates.female12hDayPay, 'Kunduzgi 12 soat');
  requirePositive(rates.female12hNightPay, 'Kechki 12 soat');
  if (!Number.isFinite(rates.largeAdvanceLimit) || rates.largeAdvanceLimit < 0) {
    throw new Error('Avans chegarasi manfiy bo‘la olmaydi');
  }

  const admin = createSupabaseAdminClient();
  const { error } = await admin.from('pay_rate_schedules').upsert(
    {
      effective_month: effectiveMonth,
      male_daily_pay: rates.maleDailyPay,
      male_extra_work_pay: rates.maleExtraWorkPay,
      female_8h_hourly: rates.female8hHourly,
      female_12h_day_pay: rates.female12hDayPay,
      female_12h_night_pay: rates.female12hNightPay,
      large_advance_limit: rates.largeAdvanceLimit,
    },
    { onConflict: 'effective_month' }
  );
  if (error) {
    if (isMissingSchema(error)) throw new Error(GOVERNANCE_MIGRATION_ERROR);
    throw error;
  }
  return effectiveMonth;
}

export interface AdvanceRequestRow {
  id: string;
  worker_id: string;
  month: string;
  amount: number;
  previous_amount: number;
  status: string;
  requested_by: string | null;
  requested_by_name: string;
  created_at: string;
  workerName?: string;
}

export async function listPendingAdvances(): Promise<AdvanceRequestRow[]> {
  const admin = createSupabaseAdminClient();
  const { data, error } = await admin
    .from('advance_requests')
    .select('id, worker_id, month, amount, previous_amount, status, requested_by, requested_by_name, created_at')
    .eq('status', 'pending')
    .order('created_at', { ascending: false });
  if (error) {
    if (isMissingSchema(error)) return [];
    throw error;
  }
  const rows = (data || []) as AdvanceRequestRow[];
  if (rows.length === 0) return [];
  const ids = [...new Set(rows.map((row) => row.worker_id))];
  const { data: workers } = await admin.from('workers').select('id, full_name').in('id', ids);
  const names = new Map((workers || []).map((worker) => [worker.id, worker.full_name]));
  return rows.map((row) => ({ ...row, workerName: names.get(row.worker_id) || 'Ishchi' }));
}

export async function queueAdvanceRequest(input: {
  workerId: string;
  month: string;
  amount: number;
  previousAmount: number;
  requestedBy: string;
  requestedByName: string;
}) {
  const month = assertMonth(input.month);
  const admin = createSupabaseAdminClient();
  const { data: existing, error: readError } = await admin
    .from('advance_requests')
    .select('id')
    .eq('worker_id', input.workerId)
    .eq('month', month)
    .eq('status', 'pending')
    .maybeSingle();
  if (readError) {
    if (isMissingSchema(readError)) throw new Error(GOVERNANCE_MIGRATION_ERROR);
    throw readError;
  }

  if (existing) {
    const { error } = await admin
      .from('advance_requests')
      .update({
        amount: input.amount,
        previous_amount: input.previousAmount,
        requested_by: input.requestedBy,
        requested_by_name: input.requestedByName,
      })
      .eq('id', existing.id);
    if (error) throw error;
    return;
  }

  const { error } = await admin.from('advance_requests').insert({
    worker_id: input.workerId,
    month,
    amount: input.amount,
    previous_amount: input.previousAmount,
    requested_by: input.requestedBy,
    requested_by_name: input.requestedByName,
  });
  if (error) throw error;
}

async function readPendingAdvanceRequest(requestId: string) {
  const admin = createSupabaseAdminClient();
  const { data, error } = await admin
    .from('advance_requests')
    .select('id, worker_id, month, amount, previous_amount, status, requested_by_name')
    .eq('id', requestId)
    .maybeSingle();
  if (error) throw error;
  if (!data || data.status !== 'pending') {
    throw new Error('Tasdiq so‘rovi topilmadi');
  }
  return data as AdvanceRequestRow;
}

export async function getPendingAdvanceRequest(requestId: string) {
  return readPendingAdvanceRequest(requestId);
}

export async function resolveAdvanceRequest(
  requestId: string,
  status: 'approved' | 'rejected',
  userId: string
) {
  const data = await readPendingAdvanceRequest(requestId);
  const admin = createSupabaseAdminClient();
  const { error: updateError } = await admin
    .from('advance_requests')
    .update({
      status,
      resolved_at: new Date().toISOString(),
      resolved_by: userId,
    })
    .eq('id', requestId)
    .eq('status', 'pending');
  if (updateError) throw updateError;
  return data;
}

export interface DeletedWorkerRow {
  id: string;
  fullName: string;
  deletedAt: string;
  restorable: boolean;
}

export async function listDeletedWorkers(): Promise<DeletedWorkerRow[]> {
  const admin = createSupabaseAdminClient();
  const { data, error } = await admin
    .from('workers')
    .select('id, full_name, deleted_at')
    .not('deleted_at', 'is', null)
    .order('deleted_at', { ascending: false });
  if (error) {
    if (isMissingSchema(error)) return [];
    throw error;
  }
  return (data || [])
    .filter((worker) => worker.deleted_at)
    .map((worker) => ({
      id: worker.id,
      fullName: worker.full_name,
      deletedAt: worker.deleted_at as string,
      restorable: canRestoreWorker(worker.deleted_at as string),
    }));
}

export async function restoreDeletedWorker(workerId: string) {
  const admin = createSupabaseAdminClient();
  const { data, error } = await admin
    .from('workers')
    .select('id, full_name, deleted_at, user_id')
    .eq('id', workerId)
    .maybeSingle();
  if (error) throw error;
  if (!data?.deleted_at) throw new Error('O‘chirilgan ishchi topilmadi');
  if (!canRestoreWorker(data.deleted_at)) {
    throw new Error('Tiklash muddati tugagan. 7 kundan keyin ishchini qaytarib bo‘lmaydi.');
  }
  const { error: updateError } = await admin
    .from('workers')
    .update({ deleted_at: null, is_active: true, login_enabled: true })
    .eq('id', workerId);
  if (updateError) throw updateError;
  return data as { id: string; full_name: string; user_id: string | null };
}

export async function listCreatorEmails() {
  const admin = createSupabaseAdminClient();
  const { data, error } = await admin
    .from('creator_allowlist')
    .select('email, created_at')
    .order('created_at');
  if (error) {
    if (isMissingSchema(error)) {
      return [{ email: 'creator@isko.uz', primary: true }];
    }
    throw error;
  }
  const rows = (data || []) as { email: string }[];
  const emails = new Set(rows.map((row) => row.email.trim().toLowerCase()));
  emails.add('creator@isko.uz');
  return [...emails].sort().map((email) => ({
    email,
    primary: email === 'creator@isko.uz',
  }));
}

export async function addCreatorEmail(email: string) {
  const normalized = email.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) {
    throw new Error('Email noto‘g‘ri');
  }
  const admin = createSupabaseAdminClient();
  const users = await listAuthUsers(admin);
  const found = users.some((user) => user.email?.toLowerCase() === normalized);
  if (!found) {
    throw new Error('Bu email bilan foydalanuvchi yo‘q. Avval hisob yarating.');
  }
  const { error } = await admin.from('creator_allowlist').upsert({ email: normalized });
  if (error) {
    if (isMissingSchema(error)) throw new Error(GOVERNANCE_MIGRATION_ERROR);
    throw error;
  }
  invalidateCreatorEmailCache();
  return normalized;
}

export async function removeCreatorEmail(email: string, actorEmail?: string | null) {
  const normalized = email.trim().toLowerCase();
  if (normalized === 'creator@isko.uz') {
    throw new Error('Asosiy creator hisobini olib tashlab bo‘lmaydi');
  }
  if (actorEmail && actorEmail.trim().toLowerCase() === normalized) {
    throw new Error('O‘z hisobingizni olib tashlab bo‘lmaydi');
  }
  const admin = createSupabaseAdminClient();
  const { error } = await admin.from('creator_allowlist').delete().eq('email', normalized);
  if (error) {
    if (isMissingSchema(error)) throw new Error(GOVERNANCE_MIGRATION_ERROR);
    throw error;
  }
  invalidateCreatorEmailCache();
}

export async function getMfaState(userId: string) {
  const admin = createSupabaseAdminClient();
  const { data, error } = await admin
    .from('creator_mfa')
    .select('enabled')
    .eq('user_id', userId)
    .maybeSingle();
  if (error) {
    if (isMissingSchema(error)) return { enabled: false };
    throw error;
  }
  return { enabled: data?.enabled === true };
}

export async function getEnabledMfaSecret(userId: string) {
  const admin = createSupabaseAdminClient();
  const { data, error } = await admin
    .from('creator_mfa')
    .select('secret, enabled')
    .eq('user_id', userId)
    .maybeSingle();
  if (error) {
    if (isMissingSchema(error)) throw new Error(GOVERNANCE_MIGRATION_ERROR);
    throw error;
  }
  if (!data?.enabled || !data.secret) return null;
  return data.secret as string;
}

export async function beginMfaEnrollment(userId: string, currentCode?: string) {
  const secret = generateTotpSecret();
  const admin = createSupabaseAdminClient();
  const existing = await admin
    .from('creator_mfa')
    .select('secret, enabled')
    .eq('user_id', userId)
    .maybeSingle();
  if (existing.error) {
    if (isMissingSchema(existing.error)) throw new Error(GOVERNANCE_MIGRATION_ERROR);
    throw existing.error;
  }

  const now = new Date().toISOString();
  if (existing.data?.enabled) {
    if (!currentCode || !verifyTotp(existing.data.secret, currentCode)) {
      throw new Error('Joriy tasdiqlash kodini kiriting');
    }
    const { error } = await admin
      .from('creator_mfa')
      .update({ pending_secret: secret, updated_at: now })
      .eq('user_id', userId)
      .eq('enabled', true);
    if (error) {
      if (isMissingSchema(error)) throw new Error(GOVERNANCE_MIGRATION_ERROR);
      throw error;
    }
    return secret;
  }

  const row = {
    user_id: userId,
    secret,
    enabled: false,
    pending_secret: null as string | null,
    updated_at: now,
  };
  const write = existing.data
    ? await admin.from('creator_mfa').update(row).eq('user_id', userId).eq('enabled', false)
    : await admin.from('creator_mfa').insert(row);
  if (write.error && isMissingSchema(write.error)) {
    const { pending_secret: _pending, ...withoutPending } = row;
    const retry = existing.data
      ? await admin
          .from('creator_mfa')
          .update(withoutPending)
          .eq('user_id', userId)
          .eq('enabled', false)
      : await admin.from('creator_mfa').insert(withoutPending);
    if (retry.error) throw retry.error;
    return secret;
  }
  if (write.error) throw write.error;
  return secret;
}

export async function confirmMfaEnrollment(userId: string, code: string) {
  const admin = createSupabaseAdminClient();
  const withPending = await admin
    .from('creator_mfa')
    .select('secret, pending_secret')
    .eq('user_id', userId)
    .maybeSingle();
  let secret = withPending.data?.secret as string | undefined;
  let pending = (withPending.data?.pending_secret as string | null) || null;
  if (withPending.error) {
    const fallback = await admin
      .from('creator_mfa')
      .select('secret')
      .eq('user_id', userId)
      .maybeSingle();
    if (fallback.error) throw fallback.error;
    secret = fallback.data?.secret as string | undefined;
    pending = null;
  }
  const activeSecret = pending || secret;
  if (!activeSecret || !verifyTotp(activeSecret, code)) {
    throw new Error('Tasdiqlash kodi noto‘g‘ri');
  }
  const patch = {
    secret: activeSecret,
    pending_secret: null as string | null,
    enabled: true,
    updated_at: new Date().toISOString(),
  };
  const updated = await admin.from('creator_mfa').update(patch).eq('user_id', userId);
  if (updated.error && isMissingSchema(updated.error)) {
    const { pending_secret: _pending, ...withoutPending } = patch;
    const retry = await admin.from('creator_mfa').update(withoutPending).eq('user_id', userId);
    if (retry.error) throw retry.error;
    return;
  }
  if (updated.error) throw updated.error;
}

export interface StaffAccount {
  id: string;
  fullName: string;
  email: string | null;
  role: UserRole;
  locationId: string | null;
  locationName: string | null;
  accessDisabled: boolean;
  isCreator: boolean;
  createdAt: string;
}

export async function listStaffAccounts(): Promise<StaffAccount[]> {
  const admin = createSupabaseAdminClient();
  const { data, error } = await admin
    .from('profiles')
    .select('id, full_name, role, assigned_location_id, access_disabled, created_at, location:work_locations(name)')
    .order('full_name');
  if (error) throw error;

  const emails = new Map<string, string>();
  for (const user of await listAuthUsers(admin)) {
    if (user.email) emails.set(user.id, user.email);
  }

  const accounts = await Promise.all(
    (data || [])
      .filter((profile) => profile.role !== 'worker')
      .map(async (profile) => {
        const email = emails.get(profile.id) || null;
        const location = profile.location as { name?: string } | { name?: string }[] | null;
        const locationName = Array.isArray(location) ? location[0]?.name : location?.name;
        return {
          id: profile.id,
          fullName: profile.full_name,
          email,
          role: profile.role as UserRole,
          locationId: profile.assigned_location_id,
          locationName: locationName || null,
          accessDisabled: profile.access_disabled === true,
          isCreator: await isCreatorEmailAsync(email),
          createdAt: profile.created_at,
        };
      })
  );
  return accounts;
}

function assertStaffRole(role: string): UserRole {
  if (!STAFF_ROLES.includes(role as UserRole)) {
    throw new Error('Rol noto‘g‘ri');
  }
  return role as UserRole;
}

export async function createStaffAccount(input: {
  fullName: string;
  email: string;
  password: string;
  role: string;
  locationId: string | null;
}) {
  const fullName = input.fullName.trim();
  const email = input.email.trim().toLowerCase();
  const role = assertStaffRole(input.role);
  if (fullName.length < 2) throw new Error('Ism kiriting');
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error('Email noto‘g‘ri');
  if (input.password.length < 6) throw new Error('Parol kamida 6 ta belgidan iborat bo‘lsin');
  if (role === 'brigadier' && !input.locationId) {
    throw new Error('Brigadir uchun blok tanlang');
  }

  const admin = createSupabaseAdminClient();
  const created = await admin.auth.admin.createUser({
    email,
    password: input.password,
    email_confirm: true,
    user_metadata: { full_name: fullName },
  });
  if (created.error || !created.data.user) {
    const message = created.error?.message || 'Hisob yaratilmadi';
    if (message.toLowerCase().includes('already')) {
      throw new Error('Bu email allaqachon ro‘yxatdan o‘tgan');
    }
    throw new Error(message);
  }

  const userId = created.data.user.id;
  const locationId = role === 'brigadier' ? input.locationId : null;
  const patch = {
    full_name: fullName,
    role,
    assigned_location_id: locationId,
  };
  let updated = await admin.from('profiles').update(patch).eq('id', userId).select('id');
  if (!updated.error && (updated.data || []).length === 0) {
    await new Promise((resolve) => setTimeout(resolve, 400));
    updated = await admin.from('profiles').update(patch).eq('id', userId).select('id');
  }
  if (updated.error) throw updated.error;
  if ((updated.data || []).length === 0) {
    throw new Error('Profil yaratilmadi. Qayta urinib ko‘ring.');
  }
  return { id: userId, fullName, email, role };
}

export async function updateStaffAccount(input: {
  userId: string;
  role: string;
  locationId: string | null;
}) {
  const role = assertStaffRole(input.role);
  const admin = createSupabaseAdminClient();
  const user = await admin.auth.admin.getUserById(input.userId);
  if (await isCreatorEmailAsync(user.data.user?.email)) {
    throw new Error('Creator hisobining roli o‘zgartirilmaydi');
  }
  if (role === 'brigadier' && !input.locationId) {
    throw new Error('Brigadir uchun blok tanlang');
  }
  const { error } = await admin
    .from('profiles')
    .update({
      role,
      assigned_location_id: role === 'brigadier' ? input.locationId : null,
    })
    .eq('id', input.userId);
  if (error) throw error;
}

export async function resetStaffPassword(userId: string, password: string) {
  if (password.length < 6) throw new Error('Parol kamida 6 ta belgidan iborat bo‘lsin');
  const admin = createSupabaseAdminClient();
  const user = await admin.auth.admin.getUserById(userId);
  if (await isCreatorEmailAsync(user.data.user?.email)) {
    throw new Error('Creator parolini shu yerdan yangilab bo‘lmaydi');
  }
  const { error } = await admin.auth.admin.updateUserById(userId, { password });
  if (error) throw error;
  await revokeUserSessions(userId);
}
