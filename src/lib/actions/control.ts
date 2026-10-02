'use server';

import { recordAudit } from '@/lib/api/audit';
import {
  getControlCenter as apiGetControlCenter,
  setStaffAccessDisabled as apiSetStaffAccessDisabled,
  setWorkerLoginEnabled as apiSetWorkerLoginEnabled,
} from '@/lib/api/control';
import { requireRole } from '@/lib/auth/require-role';
import { revalidatePath } from 'next/cache';

export async function getControlCenter() {
  await requireRole(['creator']);
  return apiGetControlCenter();
}

export async function setWorkerLoginEnabled(workerId: string, enabled: boolean) {
  const actor = await requireRole(['creator']);
  await apiSetWorkerLoginEnabled(workerId, enabled);
  await recordAudit({
    actor,
    action: enabled ? 'worker.login_enable' : 'worker.login_disable',
    entityType: 'worker',
    entityId: workerId,
    summary: `${actor.full_name} ishchi portalini ${enabled ? 'yoqdi' : 'o‘chirdi'}`,
  });
  revalidatePath('/control');
}

export async function setStaffAccessDisabled(userId: string, disabled: boolean) {
  const actor = await requireRole(['creator']);
  await apiSetStaffAccessDisabled(userId, disabled);
  await recordAudit({
    actor,
    action: disabled ? 'staff.disable' : 'staff.enable',
    entityType: 'profile',
    entityId: userId,
    summary: `${actor.full_name} xodim kirishini ${disabled ? 'yopdi' : 'ochdi'}`,
  });
  revalidatePath('/control');
}
