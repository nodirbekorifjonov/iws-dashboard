import { getCurrentUser } from '@/lib/actions/auth';
import { homePathForRole } from '@/lib/auth/require-role';
import { redirect } from 'next/navigation';

export default async function Home() {
  const profile = await getCurrentUser();
  redirect(homePathForRole(profile?.role));
}
