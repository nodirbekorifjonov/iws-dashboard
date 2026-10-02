import { ControlCenter } from '@/components/creator/control-center';
import { getControlCenter } from '@/lib/actions/control';
import { requirePageRole } from '@/lib/auth/require-role';

export const dynamic = 'force-dynamic';

export default async function ControlPage() {
  await requirePageRole(['creator']);
  const data = await getControlCenter();

  return <ControlCenter data={data} />;
}
