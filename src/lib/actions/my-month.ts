'use server';

import { getMyMonth as apiGetMyMonth } from '@/lib/api/my-month';
import { requireRole } from '@/lib/auth/require-role';
import { MyMonthResult } from '@/lib/repositories/types';

export async function getMyMonth(month: string): Promise<MyMonthResult | null> {
  const profile = await requireRole(['worker']);
  return apiGetMyMonth(profile.id, month);
}
