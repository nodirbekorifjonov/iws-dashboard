import type { AuthError } from '@supabase/supabase-js';

export function getLoginErrorMessage(error: AuthError): string {
  const message = error.message.toLowerCase();
  const status = error.status;

  if (status === 401 || message.includes('invalid api key')) {
    return [
      'Supabase API kaliti noto‘g‘ri (401).',
      'Vercel → Environment Variables da NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ni',
      'Supabase Dashboard → Settings → API dagi Publishable key bilan aynan moslang.',
      'Qo‘shtirnoq, bo‘sh joy yoki qisqartirilgan kalit bo‘lmasin.',
    ].join(' ');
  }

  if (
    message.includes('invalid login credentials') ||
    message.includes('invalid_credentials')
  ) {
    return 'Email yoki parol noto‘g‘ri. Supabase Authentication → Users da foydalanuvchi yaratilganini tekshiring.';
  }

  if (message.includes('email not confirmed')) {
    return 'Email tasdiqlanmagan. Supabase Authentication → Providers → Email da tasdiqlashni o‘chiring yoki xatni tasdiqlang.';
  }

  return error.message;
}
