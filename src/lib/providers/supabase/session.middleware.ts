import { updateSession } from '@/utils/supabase/middleware';
import { type NextRequest } from 'next/server';

export async function handleSupabaseSession(request: NextRequest) {
  const { user, response } = await updateSession(request);
  return { user, response };
}
