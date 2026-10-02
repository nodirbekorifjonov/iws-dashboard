type LoginErrorLike = {
  message: string;
  status?: number;
};

export function getLoginErrorMessage(error: LoginErrorLike | string): string {
  const message = (typeof error === 'string' ? error : error.message).toLowerCase();
  const status = typeof error === 'string' ? undefined : error.status;

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
    return 'Login yoki parol noto‘g‘ri.';
  }

  if (message.includes('email not confirmed')) {
    return 'Email tasdiqlanmagan. Supabase Authentication → Providers → Email da tasdiqlashni o‘chiring yoki xatni tasdiqlang.';
  }

  return typeof error === 'string' ? error : error.message;
}

export function getLoginModeError(mode: string): string {
  if (mode === 'worker') {
    return 'Bu login ishchi profili emas. Ishchi kodi bilan kiring.';
  }
  if (mode === 'staff') {
    return 'Ishchi hisobi uchun Ishchi bo‘limini tanlang.';
  }
  return '';
}
