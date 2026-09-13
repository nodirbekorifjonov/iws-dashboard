-- IWS (Isko Working System) - Initial Database Schema
-- ⚠️ FAQAT BIR MARTA ishga tushiring (yangi loyiha uchun).
-- Agar "type already exists" xatosi chiqsa — bu faylni QAYTA ishga tushirmang!
-- Keyingi tuzatishlar uchun: 002, 003 migratsiyalarini ishlating.

-- Enums
DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('superadmin', 'admin', 'brigadier');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE attendance_status AS ENUM ('present', 'absent', 'late', 'holiday', 'sick_leave');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Work locations (bloklar)
CREATE TABLE work_locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- User profiles (extends auth.users)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  role user_role NOT NULL DEFAULT 'brigadier',
  assigned_location_id UUID REFERENCES work_locations(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Workers (ishchilar)
CREATE TABLE workers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name TEXT NOT NULL,
  position TEXT,
  phone TEXT,
  start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  monthly_salary NUMERIC(12, 2) DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Daily work location assignments (tarix sifatida saqlanadi)
CREATE TABLE worker_location_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  worker_id UUID NOT NULL REFERENCES workers(id) ON DELETE CASCADE,
  location_id UUID NOT NULL REFERENCES work_locations(id) ON DELETE CASCADE,
  assignment_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(worker_id, assignment_date)
);

-- Daily attendance
CREATE TABLE attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  worker_id UUID NOT NULL REFERENCES workers(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  status attendance_status NOT NULL DEFAULT 'absent',
  notes TEXT,
  marked_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(worker_id, date)
);

-- Indexes
CREATE INDEX idx_workers_active ON workers(is_active);
CREATE INDEX idx_attendance_date ON attendance(date);
CREATE INDEX idx_attendance_worker_date ON attendance(worker_id, date);
CREATE INDEX idx_worker_location_assignments_date ON worker_location_assignments(assignment_date);
CREATE INDEX idx_profiles_role ON profiles(role);

-- Updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER workers_updated_at BEFORE UPDATE ON workers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER work_locations_updated_at BEFORE UPDATE ON work_locations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER attendance_updated_at BEFORE UPDATE ON attendance
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Auto-create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_role_value public.user_role;
BEGIN
  BEGIN
    user_role_value := COALESCE(
      NULLIF(NEW.raw_user_meta_data->>'role', ''),
      'brigadier'
    )::public.user_role;
  EXCEPTION WHEN OTHERS THEN
    user_role_value := 'brigadier';
  END;

  INSERT INTO public.profiles (id, full_name, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email, 'Foydalanuvchi'),
    user_role_value
  )
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE work_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE workers ENABLE ROW LEVEL SECURITY;
ALTER TABLE worker_location_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;

-- Helper: get current user role
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

-- Profiles policies
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Superadmin can view all profiles" ON profiles
  FOR SELECT USING (get_user_role() = 'superadmin');
CREATE POLICY "Superadmin can update profiles" ON profiles
  FOR UPDATE USING (get_user_role() = 'superadmin');
CREATE POLICY "Allow profile insert from auth trigger" ON profiles
  FOR INSERT
  TO authenticated, service_role, supabase_auth_admin
  WITH CHECK (true);

GRANT USAGE ON SCHEMA public TO supabase_auth_admin;
GRANT ALL ON public.profiles TO supabase_auth_admin;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO supabase_auth_admin;

-- Work locations: all authenticated users can read
CREATE POLICY "Authenticated users can view locations" ON work_locations
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admin can manage locations" ON work_locations
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Workers: all authenticated can read
CREATE POLICY "Authenticated users can view workers" ON workers
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admin can manage workers" ON workers
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Location assignments
CREATE POLICY "Authenticated users can view assignments" ON worker_location_assignments
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admin can manage assignments" ON worker_location_assignments
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Attendance
CREATE POLICY "Authenticated users can view attendance" ON attendance
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admin and brigadier can manage attendance" ON attendance
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
