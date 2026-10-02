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

const STAFF_PATH_PREFIXES = [
  '/dashboard',
  '/workers',
  '/attendance',
  '/payroll',
  '/users',
  '/locations',
];

const CREATOR_PATH_PREFIXES = ['/logins', '/control'];

function matchesPrefix(pathname: string, prefixes: string[]) {
  return prefixes.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );
}

function isStaffPath(pathname: string) {
  return matchesPrefix(pathname, STAFF_PATH_PREFIXES);
}

function isCreatorPath(pathname: string) {
  return matchesPrefix(pathname, CREATOR_PATH_PREFIXES);
}

function isWorkerPath(pathname: string) {
  return pathname === '/my' || pathname.startsWith('/my/');
}

function homePathForRole(role: string | null) {
  if (role === 'worker') return '/my';
  return '/dashboard';
}

/**
 * Sessiya middleware — provider-agnostic routing qoidalari.
 * Kelajakda auth provider o'zgarganda faqat session provider o'zgaradi.
 */
export async function handleSession(request: NextRequest) {
  const { user, role, response, configError } = await handleSupabaseSession(request);

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

  const pathname = request.nextUrl.pathname;
  const isLoginPage = pathname === '/login';
  const isPublicRoute = isLoginPage;

  if (!user && !isPublicRoute) {
    return redirectWithSession(request, response, '/login');
  }

  if (user && isLoginPage) {
    return redirectWithSession(request, response, homePathForRole(role));
  }

  if (user && role === 'worker' && (isStaffPath(pathname) || isCreatorPath(pathname))) {
    return redirectWithSession(request, response, '/my');
  }

  if (user && role && role !== 'worker' && isWorkerPath(pathname)) {
    return redirectWithSession(request, response, '/dashboard');
  }

  if (user && role && role !== 'creator' && isCreatorPath(pathname)) {
    return redirectWithSession(request, response, homePathForRole(role));
  }

  return response;
}
