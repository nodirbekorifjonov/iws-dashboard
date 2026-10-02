import { getLoginModeError } from '@/lib/auth/login-errors';
import { getSupabaseEnv } from '@/lib/supabase-env';
import { LoginForm } from './login-form';

export const dynamic = 'force-dynamic';

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const env = getSupabaseEnv();
  const params = await searchParams;

  if (!env) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
        <div className="max-w-md rounded-xl border border-red-200 bg-white p-8 text-center">
          <h1 className="text-lg font-semibold text-slate-900">Supabase sozlanmagan</h1>
          <p className="mt-3 text-sm text-slate-600">
            Vercelda <code className="text-xs">NEXT_PUBLIC_SUPABASE_URL</code> va{' '}
            <code className="text-xs">NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY</code> o‘rnating,
            so‘ng qayta deploy qiling.
          </p>
        </div>
      </div>
    );
  }

  return <LoginForm initialError={getLoginModeError(params.error || '')} />;
}
