import { requirePageRole } from '@/lib/auth/require-role';
import { redirect } from 'next/navigation';

export default async function LoginsPage() {
  await requirePageRole(['creator']);
  redirect('/control');
}
