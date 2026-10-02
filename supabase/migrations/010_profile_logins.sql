-- Ishchilarning o'z profiliga kirishlari
-- Avval 009_creator_role.sql ni ishga tushiring
-- Xavfsiz qayta ishga tushirish mumkin (idempotent)

CREATE TABLE IF NOT EXISTS public.profile_logins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  worker_id UUID REFERENCES public.workers(id) ON DELETE SET NULL,
  full_name TEXT NOT NULL,
  login_code TEXT,
  role TEXT NOT NULL DEFAULT 'worker',
  logged_in_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS profile_logins_logged_in_at_idx
  ON public.profile_logins (logged_in_at DESC);
CREATE INDEX IF NOT EXISTS profile_logins_worker_id_idx
  ON public.profile_logins (worker_id);

ALTER TABLE public.profile_logins ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Creator can view profile logins" ON public.profile_logins;
CREATE POLICY "Creator can view profile logins" ON public.profile_logins
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
        AND role::text = 'creator'
    )
  );

GRANT SELECT ON public.profile_logins TO authenticated;
GRANT ALL ON public.profile_logins TO service_role;
