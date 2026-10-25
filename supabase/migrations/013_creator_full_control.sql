-- Creator to'liq nazorat: hisoblar, oy qulfi, stavka jadvali, avans tasdig'i, tiklash
-- Xavfsiz qayta ishga tushirish mumkin (idempotent)

ALTER TABLE public.workers
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS workers_deleted_at_idx
  ON public.workers (deleted_at);

CREATE TABLE IF NOT EXISTS public.creator_allowlist (
  email TEXT PRIMARY KEY,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO public.creator_allowlist (email)
VALUES ('creator@isko.uz')
ON CONFLICT (email) DO NOTHING;

CREATE TABLE IF NOT EXISTS public.creator_mfa (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  secret TEXT NOT NULL,
  enabled BOOLEAN NOT NULL DEFAULT false,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.month_locks (
  month TEXT PRIMARY KEY,
  locked_by UUID,
  locked_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.pay_rate_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  effective_month TEXT NOT NULL UNIQUE,
  male_daily_pay NUMERIC(12, 2) NOT NULL,
  male_extra_work_pay NUMERIC(12, 2) NOT NULL,
  female_8h_hourly NUMERIC(12, 2) NOT NULL,
  female_12h_day_pay NUMERIC(12, 2) NOT NULL,
  female_12h_night_pay NUMERIC(12, 2) NOT NULL,
  large_advance_limit NUMERIC(12, 2) NOT NULL DEFAULT 500000,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO public.pay_rate_schedules (
  effective_month,
  male_daily_pay,
  male_extra_work_pay,
  female_8h_hourly,
  female_12h_day_pay,
  female_12h_night_pay,
  large_advance_limit
) VALUES (
  '2000-01',
  140000,
  50000,
  15000,
  160000,
  180000,
  500000
)
ON CONFLICT (effective_month) DO NOTHING;

CREATE TABLE IF NOT EXISTS public.advance_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  worker_id UUID NOT NULL REFERENCES public.workers(id) ON DELETE CASCADE,
  month TEXT NOT NULL,
  amount NUMERIC(12, 2) NOT NULL,
  previous_amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending',
  requested_by UUID,
  requested_by_name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resolved_at TIMESTAMPTZ,
  resolved_by UUID,
  CONSTRAINT advance_requests_status_check
    CHECK (status IN ('pending', 'approved', 'rejected'))
);

CREATE UNIQUE INDEX IF NOT EXISTS advance_requests_pending_idx
  ON public.advance_requests (worker_id, month)
  WHERE status = 'pending';

ALTER TABLE public.creator_allowlist ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.creator_mfa ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.month_locks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pay_rate_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.advance_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service role manages creator allowlist" ON public.creator_allowlist;
CREATE POLICY "Service role manages creator allowlist" ON public.creator_allowlist
  FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Service role manages creator mfa" ON public.creator_mfa;
CREATE POLICY "Service role manages creator mfa" ON public.creator_mfa
  FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Service role manages month locks" ON public.month_locks;
CREATE POLICY "Service role manages month locks" ON public.month_locks
  FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Service role manages pay rate schedules" ON public.pay_rate_schedules;
CREATE POLICY "Service role manages pay rate schedules" ON public.pay_rate_schedules
  FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Service role manages advance requests" ON public.advance_requests;
CREATE POLICY "Service role manages advance requests" ON public.advance_requests
  FOR ALL TO service_role USING (true) WITH CHECK (true);

GRANT ALL ON public.creator_allowlist TO service_role;
GRANT ALL ON public.creator_mfa TO service_role;
GRANT ALL ON public.month_locks TO service_role;
GRANT ALL ON public.pay_rate_schedules TO service_role;
GRANT ALL ON public.advance_requests TO service_role;
