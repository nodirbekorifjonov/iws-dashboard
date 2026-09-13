import { handleSupabaseSession } from '@/lib/providers/supabase/session.middleware';
import { NextResponse, type NextRequest } from 'next/server';

function copyCookies(from: NextResponse, to: NextResponse) {
  from.cookies.getAll().forEach(({ name, value }) => {
    to.cookies.set(name, value);
  });
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
        '  BACKEND_PROVIDER=supabase',
        '',
        'Enable them for Production, Preview, and Development, then Redeploy.',
      ].join('\n'),
      { status: 503, headers: { 'Content-Type': 'text/plain; charset=utf-8' } }
    );
  }

  const isLoginPage = request.nextUrl.pathname === '/login';
  const isPublicRoute = isLoginPage;

  if (!user && !isPublicRoute) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    const redirectResponse = NextResponse.redirect(url);
    copyCookies(response, redirectResponse);
    return redirectResponse;
  }

  if (user && isLoginPage) {
    const url = request.nextUrl.clone();
    url.pathname = '/dashboard';
    const redirectResponse = NextResponse.redirect(url);
    copyCookies(response, redirectResponse);
    return redirectResponse;
  }

  return response;
}
