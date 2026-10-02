'use server';

import { getProfileLogins as apiGetProfileLogins } from '@/lib/api/logins';
import { requireRole } from '@/lib/auth/require-role';
import { ProfileLoginsResult } from '@/lib/api/logins';

export async function getProfileLogins(): Promise<ProfileLoginsResult> {
  await requireRole(['creator']);
  return apiGetProfileLogins();
}
