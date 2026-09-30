'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { getLoginErrorMessage } from '@/lib/auth/login-errors';
import { cn } from '@/lib/utils';
import { workerLoginCodeToEmail } from '@/lib/utils/worker-login';
import { createBrowserClient } from '@supabase/ssr';
import { useMemo, useState } from 'react';

type LoginFormProps = {
  supabaseUrl: string;
  supabaseKey: string;
};

type LoginMode = 'staff' | 'worker';

export function LoginForm({ supabaseUrl, supabaseKey }: LoginFormProps) {
  const supabase = useMemo(
    () => createBrowserClient(supabaseUrl, supabaseKey),
    [supabaseUrl, supabaseKey]
  );

  const [mode, setMode] = useState<LoginMode>('staff');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    const loginEmail =
      mode === 'worker' ? workerLoginCodeToEmail(code) : email;

    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: loginEmail,
        password,
      });

      if (signInError) {
        setError(getLoginErrorMessage(signInError));
        setLoading(false);
        return;
      }

      window.location.assign(mode === 'worker' ? '/my' : '/dashboard');
    } catch {
      setError('Kirish vaqtida xatolik yuz berdi. Qayta urinib ko\'ring.');
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-amber-50 to-amber-100 px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-600 text-2xl font-bold text-white shadow-lg">
            IWS
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Isko Working System</h1>
          <p className="mt-1 text-sm text-gray-600">Shirinlik zavodi boshqaruv tizimi</p>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-lg">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">Tizimga kirish</h2>

          <div className="mb-6 grid grid-cols-2 rounded-lg bg-gray-100 p-1">
            <button
              type="button"
              onClick={() => {
                setMode('staff');
                setError('');
              }}
              className={cn(
                'rounded-md px-3 py-2 text-sm font-medium transition-colors',
                mode === 'staff'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              )}
            >
              Xodim
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('worker');
                setError('');
              }}
              className={cn(
                'rounded-md px-3 py-2 text-sm font-medium transition-colors',
                mode === 'worker'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              )}
            >
              Ishchi
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'staff' ? (
              <Input
                id="email"
                label="Email"
                type="email"
                placeholder="admin@isko.uz"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            ) : (
              <Input
                id="login_code"
                label="Kod"
                type="text"
                placeholder="IWS-0001"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                required
                autoComplete="username"
                autoCapitalize="characters"
              />
            )}
            <Input
              id="password"
              label="Parol"
              type="password"
              placeholder={
                mode === 'worker' ? 'IWS-0001AkbarovaDilbar' : '••••••••'
              }
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />
            {mode === 'worker' ? (
              <p className="text-xs text-gray-500">
                Parol = kod + ism, bo‘sh joysiz. Masalan:{' '}
                <span className="font-mono">IWS-0001AkbarovaDilbar</span>
              </p>
            ) : null}

            {error && (
              <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            <Button type="submit" className="w-full" size="lg" disabled={loading}>
              {loading ? 'Kirish...' : 'Kirish'}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
