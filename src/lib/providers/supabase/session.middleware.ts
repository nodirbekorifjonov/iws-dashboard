import { updateSession } from '@/utils/supabase/middleware';
import { type NextRequest } from 'next/server';

export async function handleSupabaseSession(request: NextRequest) {
  return updateSession(request);
}
