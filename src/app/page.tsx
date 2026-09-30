import { getCurrentUser } from '@/lib/actions/auth';
import { redirect } from 'next/navigation';

export default async function Home() {
  const profile = await getCurrentUser();
  if (profile?.role === 'worker') {
    redirect('/my');
  }
  redirect('/dashboard');
}
