import { handleSupabaseSession } from '@/lib/providers/supabase/session.middleware';
import { NextResponse, type NextRequest } from 'next/server';

function redirectWithSession(
  request: NextRequest,
  sessionResponse: NextResponse,
  pathname: string
) {
  const url = request.nextUrl.clone();
  url.pathname = pathname;
  const redirectResponse = NextResponse.redirect(url);
  sessionResponse.cookies.getAll().forEach((cookie) => {
    redirectResponse.cookies.set(cookie);
  });
  return redirectResponse;
}

/**
 * Sessiya middleware — provider-agnostic routing qoidalari.
 * Kelajakda auth provider o'zgarganda faqat session provider o'zgaradi.
 */
export async function handleSession(request: NextRequest) {
  const { user, response, configError } = await handleSupabaseSession(request);

  if (configError) {
    if (request.nextUrl.pathname === '/login') {
      return response;
    }

    return new NextResponse(
      [
        'Supabase is not configured on Vercel.',
        '',
        'Add these Environment Variables (Settings → Environment Variables):',
        '  NEXT_PUBLIC_SUPABASE_URL',
        '  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY',
        '',
        'Enable them for Production, Preview, and Development, then Redeploy.',
      ].join('\n'),
      { status: 503, headers: { 'Content-Type': 'text/plain; charset=utf-8' } }
    );
  }

  const isLoginPage = request.nextUrl.pathname === '/login';
  const isPublicRoute = isLoginPage;

  if (!user && !isPublicRoute) {
    return redirectWithSession(request, response, '/login');
  }

  if (user && isLoginPage) {
    return redirectWithSession(request, response, '/dashboard');
  }

  return response;
}
