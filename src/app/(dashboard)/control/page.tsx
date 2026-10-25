import { ControlCenter } from '@/components/creator/control-center';
import { getControlCenter } from '@/lib/actions/control';
import { getCreatorSettings } from '@/lib/actions/governance';
import { requirePageRole } from '@/lib/auth/require-role';

export const dynamic = 'force-dynamic';

export default async function ControlPage() {
  await requirePageRole(['creator']);
  const [data, settings] = await Promise.all([getControlCenter(), getCreatorSettings()]);

  return <ControlCenter data={data} settings={settings} />;
}
