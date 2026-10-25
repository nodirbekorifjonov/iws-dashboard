-- Oy qulfi va brigadir blokini RLS da majburlash.
-- Xavfsiz qayta ishga tushirish mumkin (idempotent).

ALTER TABLE public.creator_mfa
  ADD COLUMN IF NOT EXISTS pending_secret TEXT;

CREATE OR REPLACE FUNCTION public.is_creator()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = auth.uid()
      AND role::text = 'creator'
  )
  OR EXISTS (
    SELECT 1
    FROM auth.users AS account
    WHERE account.id = auth.uid()
      AND lower(account.email) IN (
        SELECT lower(email) FROM public.creator_allowlist
      )
  );
$$;

CREATE OR REPLACE FUNCTION public.month_is_editable(target date)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT public.is_creator()
    OR NOT EXISTS (
      SELECT 1
      FROM public.month_locks
      WHERE month = to_char(target, 'YYYY-MM')
    );
$$;

CREATE OR REPLACE FUNCTION public.worker_location_on(worker uuid, target date)
RETURNS uuid
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT location_id
  FROM public.worker_location_assignments
  WHERE worker_id = worker
    AND assignment_date <= target
  ORDER BY assignment_date DESC
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.can_manage_attendance_row(worker uuid, target date)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT public.month_is_editable(target)
    AND (
      public.is_creator()
      OR EXISTS (
        SELECT 1
        FROM public.profiles
        WHERE id = auth.uid()
          AND role IN ('superadmin', 'admin')
      )
      OR EXISTS (
        SELECT 1
        FROM public.profiles
        WHERE id = auth.uid()
          AND role = 'brigadier'
          AND assigned_location_id IS NOT NULL
          AND assigned_location_id = public.worker_location_on(worker, target)
      )
    );
$$;

CREATE OR REPLACE FUNCTION public.can_manage_advance(target date)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT public.month_is_editable(target)
    AND (
      public.is_creator()
      OR public.is_admin()
    );
$$;

CREATE OR REPLACE FUNCTION public.is_staff()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT public.is_creator()
    OR EXISTS (
      SELECT 1
      FROM public.profiles
      WHERE id = auth.uid()
        AND role IN ('superadmin', 'admin', 'brigadier')
    );
$$;

GRANT EXECUTE ON FUNCTION public.is_staff() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_creator() TO authenticated;
GRANT EXECUTE ON FUNCTION public.month_is_editable(date) TO authenticated;
GRANT EXECUTE ON FUNCTION public.worker_location_on(uuid, date) TO authenticated;
GRANT EXECUTE ON FUNCTION public.can_manage_attendance_row(uuid, date) TO authenticated;
GRANT EXECUTE ON FUNCTION public.can_manage_advance(date) TO authenticated;

DROP POLICY IF EXISTS "Admin and brigadier can manage attendance" ON public.attendance;
DROP POLICY IF EXISTS "Scoped attendance insert" ON public.attendance;
DROP POLICY IF EXISTS "Scoped attendance update" ON public.attendance;
DROP POLICY IF EXISTS "Scoped attendance delete" ON public.attendance;
DROP POLICY IF EXISTS "Staff can read attendance in scope" ON public.attendance;

CREATE POLICY "Staff can read attendance in scope" ON public.attendance
  FOR SELECT TO authenticated
  USING (
    public.is_creator()
    OR EXISTS (
      SELECT 1
      FROM public.profiles
      WHERE id = auth.uid()
        AND role IN ('superadmin', 'admin')
    )
    OR EXISTS (
      SELECT 1
      FROM public.profiles
      WHERE id = auth.uid()
        AND role = 'brigadier'
        AND assigned_location_id IS NOT NULL
        AND assigned_location_id = public.worker_location_on(attendance.worker_id, attendance.date)
    )
  );

CREATE POLICY "Scoped attendance insert" ON public.attendance
  FOR INSERT TO authenticated
  WITH CHECK (public.can_manage_attendance_row(worker_id, date));

CREATE POLICY "Scoped attendance update" ON public.attendance
  FOR UPDATE TO authenticated
  USING (public.can_manage_attendance_row(worker_id, date))
  WITH CHECK (public.can_manage_attendance_row(worker_id, date));

CREATE POLICY "Scoped attendance delete" ON public.attendance
  FOR DELETE TO authenticated
  USING (public.can_manage_attendance_row(worker_id, date));

DROP POLICY IF EXISTS "Admin can manage advances" ON public.advances;
DROP POLICY IF EXISTS "Admin can view advances" ON public.advances;
DROP POLICY IF EXISTS "Scoped advance insert" ON public.advances;
DROP POLICY IF EXISTS "Scoped advance update" ON public.advances;
DROP POLICY IF EXISTS "Scoped advance delete" ON public.advances;

CREATE POLICY "Admin can view advances" ON public.advances
  FOR SELECT TO authenticated
  USING (public.is_admin() OR public.is_creator());

CREATE POLICY "Scoped advance insert" ON public.advances
  FOR INSERT TO authenticated
  WITH CHECK (public.can_manage_advance(month));

CREATE POLICY "Scoped advance update" ON public.advances
  FOR UPDATE TO authenticated
  USING (public.can_manage_advance(month))
  WITH CHECK (public.can_manage_advance(month));

CREATE POLICY "Scoped advance delete" ON public.advances
  FOR DELETE TO authenticated
  USING (public.can_manage_advance(month));
