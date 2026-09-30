-- Lock down profile creation:
-- 1) New auth users always get role = brigadier (metadata cannot escalate).
-- 2) INSERT on profiles is only allowed for the auth trigger owner / service_role.

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email, 'Foydalanuvchi'),
    'brigadier'::public.user_role
  )
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

DROP POLICY IF EXISTS "Allow profile insert from auth trigger" ON public.profiles;
DROP POLICY IF EXISTS "Superadmin can insert profiles" ON public.profiles;

CREATE POLICY "Service role can insert profiles"
  ON public.profiles
  FOR INSERT
  TO service_role, supabase_auth_admin
  WITH CHECK (true);

GRANT EXECUTE ON FUNCTION public.handle_new_user() TO supabase_auth_admin;
