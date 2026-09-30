import { getCurrentUser } from '@/lib/auth/auth.service';
import { UserRole } from '@/types/database';
import { redirect } from 'next/navigation';

export class ForbiddenError extends Error {
  constructor(message = 'Bu amal uchun ruxsat yo\'q') {
    super(message);
    this.name = 'ForbiddenError';
  }
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
    redirect('/dashboard');
  }
  return profile;
}

export const ADMIN_ROLES: UserRole[] = ['superadmin', 'admin'];
export const STAFF_ROLES: UserRole[] = ['superadmin', 'admin', 'brigadier'];
