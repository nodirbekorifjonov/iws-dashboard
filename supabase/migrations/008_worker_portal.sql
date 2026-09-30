-- Ishchi portali: login kodi, auth bog'lanishi va RLS izolyatsiyasi
-- Xavfsiz qayta ishga tushirish mumkin (idempotent)
-- 'worker' enum qiymati shu faylda ishlatilmaydi (PG: yangi enum qiymat commit qilinmaguncha ishlatib bo'lmaydi)

ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'worker';

CREATE SEQUENCE IF NOT EXISTS public.worker_login_code_seq START 1;

CREATE OR REPLACE FUNCTION public.next_worker_login_code()
RETURNS TEXT
LANGUAGE sql
AS $$
  SELECT 'IWS-' || LPAD(nextval('public.worker_login_code_seq')::TEXT, 4, '0');
$$;

ALTER TABLE workers ADD COLUMN IF NOT EXISTS login_code TEXT;
ALTER TABLE workers ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

UPDATE workers
SET login_code = public.next_worker_login_code()
WHERE login_code IS NULL OR btrim(login_code) = '';

ALTER TABLE workers ALTER COLUMN login_code SET DEFAULT public.next_worker_login_code();
ALTER TABLE workers ALTER COLUMN login_code SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS workers_login_code_key ON workers(login_code);
CREATE UNIQUE INDEX IF NOT EXISTS workers_user_id_key ON workers(user_id) WHERE user_id IS NOT NULL;

CREATE OR REPLACE FUNCTION public.set_worker_login_code()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.login_code IS NULL OR btrim(NEW.login_code) = '' THEN
    NEW.login_code := public.next_worker_login_code();
  ELSE
    NEW.login_code := upper(btrim(NEW.login_code));
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS workers_login_code_before_insert ON workers;
CREATE TRIGGER workers_login_code_before_insert
  BEFORE INSERT ON workers
  FOR EACH ROW EXECUTE FUNCTION public.set_worker_login_code();

CREATE OR REPLACE FUNCTION public.is_staff()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
    AND role IN ('superadmin', 'admin', 'brigadier')
  );
$$;

GRANT EXECUTE ON FUNCTION public.is_staff() TO authenticated;

CREATE OR REPLACE FUNCTION public.my_worker_id()
RETURNS UUID
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT id FROM public.workers WHERE user_id = auth.uid() LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION public.my_worker_id() TO authenticated;

DROP POLICY IF EXISTS "Authenticated users can view workers" ON public.workers;
DROP POLICY IF EXISTS "Staff and own worker can view workers" ON public.workers;
CREATE POLICY "Staff and own worker can view workers" ON public.workers
  FOR SELECT TO authenticated
  USING (public.is_staff() OR user_id = auth.uid());

DROP POLICY IF EXISTS "Authenticated users can view attendance" ON public.attendance;
DROP POLICY IF EXISTS "Workers can view own attendance" ON public.attendance;
CREATE POLICY "Workers can view own attendance" ON public.attendance
  FOR SELECT TO authenticated
  USING (worker_id = public.my_worker_id());

DROP POLICY IF EXISTS "Authenticated users can view advances" ON public.advances;
DROP POLICY IF EXISTS "Workers can view own advances" ON public.advances;
CREATE POLICY "Workers can view own advances" ON public.advances
  FOR SELECT TO authenticated
  USING (worker_id = public.my_worker_id());

DROP POLICY IF EXISTS "Authenticated users can view locations" ON public.work_locations;
DROP POLICY IF EXISTS "Staff can view locations" ON public.work_locations;
CREATE POLICY "Staff can view locations" ON public.work_locations
  FOR SELECT TO authenticated
  USING (public.is_staff());

DROP POLICY IF EXISTS "Authenticated users can view assignments" ON public.worker_location_assignments;
DROP POLICY IF EXISTS "Staff can view assignments" ON public.worker_location_assignments;
CREATE POLICY "Staff can view assignments" ON public.worker_location_assignments
  FOR SELECT TO authenticated
  USING (public.is_staff());
