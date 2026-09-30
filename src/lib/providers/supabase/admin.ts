import { createClient } from '@supabase/supabase-js';
import { getSupabaseEnv } from '@/lib/supabase-env';

export function createSupabaseAdminClient() {
  const env = getSupabaseEnv();
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

  if (!env || !serviceRoleKey) {
    throw new Error(
      'SUPABASE_SERVICE_ROLE_KEY sozlanmagan. .env.local ga qo‘shing (Supabase Dashboard → Settings → API).'
    );
  }

  return createClient(env.url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
