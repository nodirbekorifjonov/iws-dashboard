-- Fix: "Database error creating new user"
-- Sabab: handle_new_user trigger profiles jadvaliga yozolmayapti (RLS yoki enum cast)

-- 1. Trigger funksiyasini xavfsiz qayta yozish
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

-- 2. Trigger mavjud bo'lmasa yaratish
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 3. RLS: trigger va service role profil yaratishi mumkin
DROP POLICY IF EXISTS "Superadmin can insert profiles" ON public.profiles;
DROP POLICY IF EXISTS "Allow profile insert from auth trigger" ON public.profiles;

CREATE POLICY "Allow profile insert from auth trigger"
  ON public.profiles
  FOR INSERT
  TO authenticated, service_role, supabase_auth_admin
  WITH CHECK (true);

-- 4. Kerakli huquqlar
GRANT USAGE ON SCHEMA public TO supabase_auth_admin;
GRANT ALL ON public.profiles TO supabase_auth_admin;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO supabase_auth_admin;
