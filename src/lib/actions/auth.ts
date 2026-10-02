'use server';

import { getLoginBlockReason } from '@/lib/api/access';
import { recordProfileLogin } from '@/lib/api/logins';
import { getUsers as apiGetUsers } from '@/lib/api/users';
import { getLoginErrorMessage, getLoginModeError } from '@/lib/auth/login-errors';
import { homePathForRole, requireRole } from '@/lib/auth/require-role';
import {
  getCurrentUser as authGetCurrentUser,
  getSessionUser as authGetSessionUser,
  signIn as authSignIn,
  signOut as authSignOut,
} from '@/lib/auth/auth.service';
import { ProfileWithLocation, SessionUser } from '@/lib/repositories/types';
import { Profile, UserRole } from '@/types/database';
import {
  normalizeWorkerPasswordInput,
  workerLoginCodeToEmail,
} from '@/lib/utils/worker-login';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

type LoginMode = 'staff' | 'worker';

function parseLoginMode(value: FormDataEntryValue | null): LoginMode {
  return value === 'worker' ? 'worker' : 'staff';
}

function expectedRoleForMode(mode: LoginMode): UserRole[] {
  if (mode === 'worker') return ['worker'];
  return ['superadmin', 'admin', 'brigadier', 'creator'];
}

export type { ProfileWithLocation };

export type LoginState = {
  error: string;
};

export async function getCurrentUser(): Promise<Profile | null> {
  return authGetCurrentUser();
}

export async function getSessionUser(): Promise<SessionUser | null> {
  return authGetSessionUser();
}

export async function getUsers(): Promise<ProfileWithLocation[]> {
  await requireRole(['superadmin', 'creator']);
  return apiGetUsers();
}

export async function login(
  _prevState: LoginState,
  formData: FormData
): Promise<LoginState> {
  const mode = parseLoginMode(formData.get('mode'));
  const password = normalizeWorkerPasswordInput(
    String(formData.get('password') ?? '')
  );
  const email =
    mode === 'worker'
      ? workerLoginCodeToEmail(String(formData.get('code') ?? ''))
      : String(formData.get('email') ?? '').trim();

  if (!email || !password) {
    return { error: 'Login yoki parol noto‘g‘ri.' };
  }

  const result = await authSignIn(email, password);
  if (!result.success) {
    return {
      error: getLoginErrorMessage(result.error || 'invalid login credentials'),
    };
  }

  const profile = await authGetCurrentUser();
  const session = await authGetSessionUser();
  if (!profile || !expectedRoleForMode(mode).includes(profile.role)) {
    await authSignOut();
    redirect(`/login?error=${mode}`);
  }

  const blocked = await getLoginBlockReason(profile, session?.email);
  if (blocked) {
    await authSignOut();
    return { error: blocked };
  }

  try {
    await recordProfileLogin(profile);
  } catch {
    // Kirish muvaffaqiyatli bo'lishi kerak, jurnal yozilmasa ham
  }

  revalidatePath('/', 'layout');
  redirect(homePathForRole(profile.role));
}

export async function signOut() {
  await authSignOut();
}
