import { PayrollCalculator } from '@/components/payroll/payroll-calculator';
import { MonthLockBar } from '@/components/creator/month-lock-bar';
import { calculatePayroll } from '@/lib/actions/payroll';
import { isMonthLocked } from '@/lib/api/governance';
import { getPayContext } from '@/lib/api/pay-rates';
import { PageHeader } from '@/components/layout/page-header';
import { ADMIN_ROLES, requirePageRole } from '@/lib/auth/require-role';
import { currentMonthInTashkent } from '@/lib/utils/payroll';

export default async function PayrollPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string; calculated?: string }>;
}) {
  const profile = await requirePageRole(ADMIN_ROLES);
  const params = await searchParams;
  const defaultMonth = currentMonthInTashkent();
  const month = params.month || defaultMonth;
  const [result, locked, payContext] = await Promise.all([
    calculatePayroll(month),
    isMonthLocked(month),
    getPayContext(month),
  ]);

  return (
    <div>
      <PageHeader
        title="Hisoblash"
        description="Oylik maosh hisob-kitobi — davomat va avanslar asosida"
      />
      <MonthLockBar month={month} locked={locked} canManage={profile.role === 'creator'} />
      <PayrollCalculator
        key={month}
        month={month}
        initialRows={result.rows}
        rates={payContext.rates}
        advancesLocked={locked && profile.role !== 'creator'}
      />
    </div>
  );
}
