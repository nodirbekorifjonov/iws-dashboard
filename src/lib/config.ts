export const config = {
  backendProvider: process.env.BACKEND_PROVIDER ?? 'supabase',
  supabase: {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL ?? '',
    anonKey:
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
      '',
  },
} as const;
