import { resolveEffectiveRole } from '@/lib/auth/creator';
import { getSupabaseEnv } from '@/lib/supabase-env';
import { createServerClient } from '@supabase/ssr';
import { type NextRequest, NextResponse } from 'next/server';

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const env = getSupabaseEnv();
  if (!env) {
    return {
      user: null,
      role: null,
      response: supabaseResponse,
      configError: true as const,
      blocked: false as const,
    };
  }

  const supabase = createServerClient(env.url, env.key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet, headers) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value)
        );
        supabaseResponse = NextResponse.next({
          request,
        });
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options)
        );
        Object.entries(headers).forEach(([key, value]) =>
          supabaseResponse.headers.set(key, value)
        );
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  let role: string | null = null;
  let blocked = false;
  if (user) {
    let profile: { role?: string | null; access_disabled?: boolean | null } | null = null;
    const withAccess = await supabase
      .from('profiles')
      .select('role, access_disabled')
      .eq('id', user.id)
      .maybeSingle();
    if (withAccess.error) {
      const roleOnly = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .maybeSingle();
      profile = roleOnly.data;
    } else {
      profile = withAccess.data;
    }
    let accessUnknown = Boolean(withAccess.error);
    role = await resolveEffectiveRole(profile?.role ?? null, user.email);
    if (role !== 'creator' && (accessUnknown || profile?.access_disabled === true)) {
      blocked = true;
    }
    if (role === 'worker') {
      const worker = await supabase
        .from('workers')
        .select('login_enabled')
        .eq('user_id', user.id)
        .maybeSingle();
      if (worker.error || worker.data?.login_enabled === false) {
        blocked = true;
      }
    }
  }

  if (blocked) {
    await supabase.auth.signOut();
    return {
      user: null,
      role: null,
      response: supabaseResponse,
      configError: false as const,
      blocked: true as const,
    };
  }

  return {
    user,
    role,
    response: supabaseResponse,
    configError: false as const,
    blocked: false as const,
  };
}
