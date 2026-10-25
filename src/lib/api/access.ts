import { isCreatorEmailAsync } from '@/lib/auth/creator';
import { createSupabaseAdminClient } from '@/lib/providers/supabase/admin';
import { Profile } from '@/types/database';

const CHECK_FAILED = 'Hisob holatini tekshirib bo‘lmadi. Qayta urinib ko‘ring.';

export async function getLoginBlockReason(
  profile: Profile,
  email?: string | null
): Promise<string | null> {
  if (await isCreatorEmailAsync(email)) return null;

  const admin = createSupabaseAdminClient();

  if (profile.role === 'worker') {
    const { data, error } = await admin
      .from('workers')
      .select('login_enabled')
      .eq('user_id', profile.id)
      .maybeSingle();
    if (error) {
      console.error(error.message);
      return CHECK_FAILED;
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
  if (error) {
    console.error(error.message);
    return CHECK_FAILED;
  }
  if (data && data.access_disabled === true) {
    return 'Bu hisob vaqtincha yopilgan.';
  }
  return null;
}
