'use server';

import { pingActivity as apiPingActivity } from '@/lib/api/activity';
import { getCurrentUser } from '@/lib/auth/auth.service';

export async function pingActivity() {
  const profile = await getCurrentUser();
  if (!profile) return;
  await apiPingActivity(profile);
}
