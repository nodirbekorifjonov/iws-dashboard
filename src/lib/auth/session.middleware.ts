import { handleSupabaseSession } from '@/lib/providers/supabase/session.middleware';
import { NextResponse, type NextRequest } from 'next/server';

/**
 * Sessiya middleware — provider-agnostic routing qoidalari.
 * Kelajakda auth provider o'zgarganda faqat session provider o'zgaradi.
 */
export async function handleSession(request: NextRequest) {
  const { user, response } = await handleSupabaseSession(request);

  const isLoginPage = request.nextUrl.pathname === '/login';
  const isPublicRoute = isLoginPage;

  if (!user && !isPublicRoute) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }

  if (user && isLoginPage) {
    const url = request.nextUrl.clone();
    url.pathname = '/dashboard';
    return NextResponse.redirect(url);
  }

  return response;
}
