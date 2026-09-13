import { getSupabaseEnv } from '@/lib/supabase-env';

const supabaseEnv = getSupabaseEnv();

export const config = {
  backendProvider: process.env.BACKEND_PROVIDER ?? 'supabase',
  supabase: {
    url: supabaseEnv?.url ?? '',
    anonKey: supabaseEnv?.key ?? '',
  },
} as const;
