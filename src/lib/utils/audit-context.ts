import { formatMonthLabel } from '@/lib/utils/payroll';

export function auditContext(
  action: string | null | undefined,
  metadata?: Record<string, unknown> | null,
  entityName?: string | null
): { section: string; href: string; monthLabel: string | null } {
  const month =
    (typeof metadata?.month === 'string' && metadata.month) ||
    (entityName && /^\d{4}-\d{2}$/.test(entityName) ? entityName : null);
  const monthLabel = month ? formatMonthLabel(month) : null;

  if (action?.startsWith('attendance')) {
    return {
      section: 'Davomat',
      href: month ? `/attendance?month=${month}` : '/attendance',
      monthLabel,
    };
  }
  if (action?.startsWith('payroll')) {
    return {
      section: 'Hisoblash',
      href: month ? `/payroll?month=${month}` : '/payroll',
      monthLabel,
    };
  }
  if (action?.startsWith('location')) {
    return { section: 'Ish joylari', href: '/locations', monthLabel };
  }
  if (action?.startsWith('staff')) {
    return { section: 'Nazorat', href: '/control', monthLabel };
  }
  if (action?.startsWith('worker')) {
    return { section: 'Ishchilar', href: '/workers', monthLabel };
  }
  return { section: 'Tizim', href: '/control', monthLabel };
}
