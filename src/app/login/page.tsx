'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { signIn } from '@/lib/actions/auth';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    const result = await signIn(email, password);

    if (result.error) {
      setError(result.error);
      setLoading(false);
      return;
    }

    router.push('/dashboard');
    router.refresh();
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
          <h2 className="mb-6 text-lg font-semibold text-gray-900">Tizimga kirish</h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              id="email"
              label="Email"
              type="email"
              placeholder="admin@isko.uz"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <Input
              id="password"
              label="Parol"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />

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
