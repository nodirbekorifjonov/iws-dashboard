import { getSupabaseEnv } from '@/lib/supabase-env';
import { createBrowserClient } from '@supabase/ssr';

export const createClient = () => {
  const env = getSupabaseEnv();
  if (!env) {
    throw new Error(
      'Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY.'
    );
  }

  return createBrowserClient(env.url, env.key);
};
