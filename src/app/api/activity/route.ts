import { pingActivity } from '@/lib/api/activity';
import { getCurrentUser } from '@/lib/auth/auth.service';

export async function POST() {
  const profile = await getCurrentUser();
  if (profile) {
    await pingActivity(profile);
  }
  return new Response(null, { status: 204 });
}
