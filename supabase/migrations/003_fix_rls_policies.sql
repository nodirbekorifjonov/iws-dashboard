-- Fix: RLS "new row violates row-level security policy"
-- ✅ 001 allaqachon ishga tushirilgan bo'lsa, FAQAT shu faylni ishga tushiring.
-- 001 ni qayta ishga tushirmang — "type already exists" xatosi chiqadi.
-- get_user_role() ba'zan NULL qaytaradi — to'g'ridan-to'g'ri profiles tekshiruvi ishlatamiz

CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS public.user_role
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$;

GRANT EXECUTE ON FUNCTION public.get_user_role() TO authenticated;

-- Yordamchi: foydalanuvchi adminmi?
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
    AND role IN ('superadmin', 'admin')
  );
$$;

GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;

-- Workers RLS yangilash
DROP POLICY IF EXISTS "Admin can manage workers" ON public.workers;
CREATE POLICY "Admin can manage workers" ON public.workers
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Work locations RLS yangilash
DROP POLICY IF EXISTS "Admin can manage locations" ON public.work_locations;
CREATE POLICY "Admin can manage locations" ON public.work_locations
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Location assignments RLS yangilash
DROP POLICY IF EXISTS "Admin can manage assignments" ON public.worker_location_assignments;
CREATE POLICY "Admin can manage assignments" ON public.worker_location_assignments
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Attendance RLS yangilash
DROP POLICY IF EXISTS "Admin and brigadier can manage attendance" ON public.attendance;
CREATE POLICY "Admin and brigadier can manage attendance" ON public.attendance
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND role IN ('superadmin', 'admin', 'brigadier')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND role IN ('superadmin', 'admin', 'brigadier')
    )
  );

-- Admin profil rolini superadmin qilish (admin@isko.uz)
UPDATE public.profiles
SET role = 'superadmin'
WHERE id = (
  SELECT id FROM auth.users WHERE email = 'admin@isko.uz' LIMIT 1
);
