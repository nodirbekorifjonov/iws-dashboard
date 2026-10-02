'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { login } from '@/lib/actions/auth';
import { cn } from '@/lib/utils';
import { Eye, EyeOff } from 'lucide-react';
import { useActionState, useState } from 'react';

type LoginMode = 'staff' | 'worker';

export function LoginForm({ initialError = '' }: { initialError?: string }) {
  const [mode, setMode] = useState<LoginMode>('staff');
  const [showPassword, setShowPassword] = useState(false);
  const [state, formAction, pending] = useActionState(login, {
    error: initialError,
  });
  const error = state.error || initialError;

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="relative hidden overflow-hidden bg-indigo-600 px-12 py-16 text-white lg:flex lg:flex-col lg:justify-between">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.16),transparent_55%)]" />
        <div className="relative">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/15 text-sm font-bold">
            IWS
          </div>
          <p className="mt-8 text-sm font-medium text-indigo-100">Isko Working System</p>
          <h1 className="mt-3 max-w-sm text-4xl font-semibold tracking-tight">
            Zavod ishini bir joyda boshqaring
          </h1>
          <p className="mt-4 max-w-sm text-sm leading-6 text-indigo-100">
            Davomat, ishchilar va oylik hisob-kitob — toza, tez va tushunarli interfeysda.
          </p>
        </div>
        <p className="relative text-sm text-indigo-200">Shirinlik zavodi boshqaruv tizimi</p>
      </div>

      <div className="flex items-center justify-center bg-slate-50 px-4 py-12">
        <div className="w-full max-w-md">
          <div className="mb-8 lg:hidden">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-600 text-sm font-bold text-white">
              IWS
            </div>
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
              Isko Working System
            </h1>
            <p className="mt-1 text-sm text-slate-500">Shirinlik zavodi boshqaruv tizimi</p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-8">
            <h2 className="text-lg font-semibold text-slate-900">Tizimga kirish</h2>
            <p className="mt-1 mb-6 text-sm text-slate-500">
              Xodim yoki ishchi sifatida davom eting
            </p>

            <div className="mb-6 grid grid-cols-2 rounded-lg bg-slate-100 p-1">
              <button
                type="button"
                onClick={() => setMode('staff')}
                className={cn(
                  'rounded-md px-3 py-2 text-sm font-medium transition-colors',
                  mode === 'staff'
                    ? 'bg-white text-indigo-700 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                )}
              >
                Xodim
              </button>
              <button
                type="button"
                onClick={() => setMode('worker')}
                className={cn(
                  'rounded-md px-3 py-2 text-sm font-medium transition-colors',
                  mode === 'worker'
                    ? 'bg-white text-indigo-700 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                )}
              >
                Ishchi
              </button>
            </div>

            <form action={formAction} className="space-y-4">
              <input type="hidden" name="mode" value={mode} />
              {mode === 'staff' ? (
                <Input
                  id="email"
                  name="email"
                  label="Email"
                  type="email"
                  placeholder="admin@isko.uz"
                  required
                  autoComplete="email"
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck={false}
                />
              ) : (
                <Input
                  id="login_code"
                  name="code"
                  label="Kod"
                  type="text"
                  placeholder="IWS-0001"
                  required
                  autoComplete="username"
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck={false}
                />
              )}
              <Input
                id="password"
                name="password"
                label="Parol"
                type={showPassword ? 'text' : 'password'}
                placeholder={
                  mode === 'worker' ? 'IWS-0001AkbarovaDilbar' : '••••••••'
                }
                required
                autoComplete="current-password"
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                trailing={
                  <button
                    type="button"
                    onClick={() => setShowPassword((visible) => !visible)}
                    className="rounded-md p-1 text-slate-400 hover:text-slate-700"
                    aria-label={showPassword ? 'Parolni yashirish' : 'Parolni ko‘rsatish'}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                }
              />
              {mode === 'worker' ? (
                <p className="text-xs text-slate-500">
                  Parol = kod + ism, bo‘sh joysiz. Masalan:{' '}
                  <span className="font-mono">IWS-0001AkbarovaDilbar</span>
                </p>
              ) : null}

              {error ? (
                <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
                  {error}
                </div>
              ) : null}

              <Button type="submit" className="w-full" size="lg" disabled={pending}>
                {pending ? 'Kirish...' : 'Kirish'}
              </Button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
