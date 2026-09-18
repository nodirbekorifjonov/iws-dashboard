import { getSupabaseEnv } from '@/lib/supabase-env';
import { LoginForm } from './login-form';

export const dynamic = 'force-dynamic';

export default function LoginPage() {
  const env = getSupabaseEnv();

  if (!env) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-amber-50 px-4">
        <div className="max-w-md rounded-2xl border border-red-200 bg-white p-8 text-center shadow-lg">
          <h1 className="text-lg font-semibold text-gray-900">Supabase sozlanmagan</h1>
          <p className="mt-3 text-sm text-gray-600">
            Vercelda <code className="text-xs">NEXT_PUBLIC_SUPABASE_URL</code> va{' '}
            <code className="text-xs">NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY</code> o‘rnating,
            so‘ng qayta deploy qiling.
          </p>
        </div>
      </div>
    );
  }

  return <LoginForm supabaseUrl={env.url} supabaseKey={env.key} />;
}
