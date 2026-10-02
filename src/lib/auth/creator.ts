import { USER_ROLE_LABELS, UserRole } from '@/types/database';

export const CREATOR_EMAILS = ['creator@isko.uz'];

export function isCreatorEmail(email?: string | null) {
  return Boolean(email && CREATOR_EMAILS.includes(email.trim().toLowerCase()));
}

export function effectiveRole(
  role: string | null | undefined,
  email?: string | null
): UserRole | null {
  if (isCreatorEmail(email)) return 'creator';
  if (!role) return null;
  return role as UserRole;
}

export function visibleRoleLabel(role: UserRole): string {
  if (role === 'creator') return USER_ROLE_LABELS.superadmin;
  return USER_ROLE_LABELS[role];
}
