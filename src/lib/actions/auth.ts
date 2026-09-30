'use server';

import { getUsers as apiGetUsers } from '@/lib/api/users';
import { requireRole } from '@/lib/auth/require-role';
import {
  getCurrentUser as authGetCurrentUser,
  getSessionUser as authGetSessionUser,
  signIn as authSignIn,
  signOut as authSignOut,
} from '@/lib/auth/auth.service';
import { ProfileWithLocation, SessionUser } from '@/lib/repositories/types';
import { Profile } from '@/types/database';

export type { ProfileWithLocation };

export async function getCurrentUser(): Promise<Profile | null> {
  return authGetCurrentUser();
}

export async function getSessionUser(): Promise<SessionUser | null> {
  return authGetSessionUser();
}

export async function getUsers(): Promise<ProfileWithLocation[]> {
  await requireRole(['superadmin']);
  return apiGetUsers();
}

export async function signIn(email: string, password: string) {
  const result = await authSignIn(email, password);
  if (!result.success) {
    return { error: 'Email yoki parol noto\'g\'ri' };
  }
  return { error: null };
}

export async function signOut() {
  await authSignOut();
}
