'use server';

import { getUsers as apiGetUsers } from '@/lib/api/users';
import {
  getCurrentUser as authGetCurrentUser,
  signIn as authSignIn,
  signOut as authSignOut,
} from '@/lib/auth/auth.service';
import { Profile } from '@/types/database';
import { ProfileWithLocation } from '@/lib/repositories/types';

export type { ProfileWithLocation };

export async function getCurrentUser(): Promise<Profile | null> {
  return authGetCurrentUser();
}

export async function getUsers(): Promise<ProfileWithLocation[]> {
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
