import { isCreatorEmail } from '@/lib/auth/creator';
import { createSupabaseAdminClient } from '@/lib/providers/supabase/admin';
import { Profile } from '@/types/database';

function isMissingColumn(error: { message?: string; code?: string } | null) {
  if (!error) return false;
  const text = `${error.code ?? ''} ${error.message ?? ''}`.toLowerCase();
  return (
    error.code === 'PGRST204' ||
    text.includes('login_enabled') ||
    text.includes('access_disabled') ||
    text.includes('schema cache')
  );
}

export async function getLoginBlockReason(
  profile: Profile,
  email?: string | null
): Promise<string | null> {
  if (isCreatorEmail(email)) return null;

  const admin = createSupabaseAdminClient();

  if (profile.role === 'worker') {
    const { data, error } = await admin
      .from('workers')
      .select('login_enabled')
      .eq('user_id', profile.id)
      .maybeSingle();
    if (error && !isMissingColumn(error)) {
      console.error(error.message);
    }
    if (data && data.login_enabled === false) {
      return 'Bu ishchi portali o‘chirilgan. Adminga murojaat qiling.';
    }
    return null;
  }

  const { data, error } = await admin
    .from('profiles')
    .select('access_disabled')
    .eq('id', profile.id)
    .maybeSingle();
  if (error && !isMissingColumn(error)) {
    console.error(error.message);
  }
  if (data && data.access_disabled === true) {
    return 'Bu hisob vaqtincha yopilgan.';
  }
  return null;
}
