'use client';

import { lockMonth, unlockMonth } from '@/lib/actions/governance';
import { Button } from '@/components/ui/button';
import { formatMonthLabel } from '@/lib/utils/payroll';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export function MonthLockBar({
  month,
  locked,
  canManage,
}: {
  month: string;
  locked: boolean;
  canManage: boolean;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  if (!locked && !canManage) return null;

  async function toggle() {
    setBusy(true);
    try {
      if (locked) await unlockMonth(month);
      else await lockMonth(month);
      router.refresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Xatolik');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mb-4 flex flex-col gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm text-amber-900">
        {locked
          ? `${formatMonthLabel(month)} yopilgan. Admin va brigadir bu oyni o‘zgartira olmaydi.`
          : `${formatMonthLabel(month)} ochiq. Yopsangiz, davomat va avans qotadi.`}
      </p>
      {canManage ? (
        <Button size="sm" variant={locked ? 'primary' : 'secondary'} disabled={busy} onClick={toggle}>
          {locked ? 'Oyni ochish' : 'Oyni yopish'}
        </Button>
      ) : null}
    </div>
  );
}
