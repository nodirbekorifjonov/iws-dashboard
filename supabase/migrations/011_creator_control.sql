-- Creator nazorat markazi: jurnal, onlayn holat, kirishni yopish
-- Xavfsiz qayta ishga tushirish mumkin (idempotent)

CREATE TABLE IF NOT EXISTS public.audit_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  actor_name TEXT NOT NULL,
  actor_role TEXT,
  action TEXT NOT NULL,
  entity_type TEXT,
  entity_id TEXT,
  entity_name TEXT,
  summary TEXT NOT NULL,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS audit_events_created_at_idx
  ON public.audit_events (created_at DESC);
CREATE INDEX IF NOT EXISTS audit_events_action_idx
  ON public.audit_events (action);

CREATE TABLE IF NOT EXISTS public.activity_pings (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  role TEXT,
  last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS activity_pings_last_seen_idx
  ON public.activity_pings (last_seen_at DESC);

ALTER TABLE public.workers
  ADD COLUMN IF NOT EXISTS login_enabled BOOLEAN NOT NULL DEFAULT true;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS access_disabled BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE public.audit_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_pings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service role manages audit events" ON public.audit_events;
CREATE POLICY "Service role manages audit events" ON public.audit_events
  FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Service role manages activity pings" ON public.activity_pings;
CREATE POLICY "Service role manages activity pings" ON public.activity_pings
  FOR ALL TO service_role USING (true) WITH CHECK (true);

GRANT ALL ON public.audit_events TO service_role;
GRANT ALL ON public.activity_pings TO service_role;
