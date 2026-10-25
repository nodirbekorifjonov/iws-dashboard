import { getSupabaseEnv } from '@/lib/supabase-env';
import { USER_ROLE_LABELS, UserRole } from '@/types/database';

export const CREATOR_EMAILS = ['creator@isko.uz'];

const CACHE_MS = 30_000;

let emailCache: { at: number; emails: Set<string> } | null = null;

export function isCreatorEmail(email?: string | null) {
  return Boolean(email && CREATOR_EMAILS.includes(email.trim().toLowerCase()));
}

export function invalidateCreatorEmailCache() {
  emailCache = null;
}

export async function creatorEmailSet(): Promise<Set<string>> {
  const now = Date.now();
  if (emailCache && now - emailCache.at < CACHE_MS) {
    return emailCache.emails;
  }

  const emails = new Set(CREATOR_EMAILS.map((email) => email.trim().toLowerCase()));
  const env = getSupabaseEnv();
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (env && serviceRoleKey) {
    try {
      const response = await fetch(
        `${env.url}/rest/v1/creator_allowlist?select=email`,
        {
          headers: {
            apikey: serviceRoleKey,
            Authorization: `Bearer ${serviceRoleKey}`,
          },
          cache: 'no-store',
        }
      );
      if (response.ok) {
        const rows = (await response.json()) as { email?: string }[];
        for (const row of rows) {
          if (row.email) emails.add(row.email.trim().toLowerCase());
        }
      }
    } catch {
      // Asosiy creator emaili doim ishlaydi
    }
  }

  emailCache = { at: now, emails };
  return emails;
}

export async function isCreatorEmailAsync(email?: string | null) {
  if (!email) return false;
  const emails = await creatorEmailSet();
  return emails.has(email.trim().toLowerCase());
}

export function effectiveRole(
  role: string | null | undefined,
  email?: string | null
): UserRole | null {
  if (isCreatorEmail(email)) return 'creator';
  if (!role) return null;
  return role as UserRole;
}

export async function resolveEffectiveRole(
  role: string | null | undefined,
  email?: string | null
): Promise<UserRole | null> {
  if (await isCreatorEmailAsync(email)) return 'creator';
  if (!role) return null;
  return role as UserRole;
}

export function visibleRoleLabel(role: UserRole): string {
  if (role === 'creator') return USER_ROLE_LABELS.superadmin;
  return USER_ROLE_LABELS[role];
}
