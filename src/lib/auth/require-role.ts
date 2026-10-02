import { getCurrentUser } from '@/lib/auth/auth.service';
import { UserRole } from '@/types/database';
import { redirect } from 'next/navigation';

export class ForbiddenError extends Error {
  constructor(message = 'Bu amal uchun ruxsat yo\'q') {
    super(message);
    this.name = 'ForbiddenError';
  }
}

export const ADMIN_ROLES: UserRole[] = ['superadmin', 'admin', 'creator'];
export const STAFF_ROLES: UserRole[] = ['superadmin', 'admin', 'brigadier', 'creator'];

export function homePathForRole(role: UserRole | null | undefined): string {
  if (role === 'worker') return '/my';
  return '/dashboard';
}

export async function requireRole(allowed: UserRole[]) {
  const profile = await getCurrentUser();
  if (!profile || !allowed.includes(profile.role)) {
    throw new ForbiddenError();
  }
  return profile;
}

export async function requirePageRole(allowed: UserRole[]) {
  const profile = await getCurrentUser();
  if (!profile || !allowed.includes(profile.role)) {
    redirect(homePathForRole(profile?.role));
  }
  return profile;
}
