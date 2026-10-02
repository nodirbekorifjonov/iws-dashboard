import { PayrollCalculator } from '@/components/payroll/payroll-calculator';
import { calculatePayroll } from '@/lib/actions/payroll';
import { PageHeader } from '@/components/layout/page-header';
import { ADMIN_ROLES, requirePageRole } from '@/lib/auth/require-role';

export default async function PayrollPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string; calculated?: string }>;
}) {
  await requirePageRole(ADMIN_ROLES);
  const params = await searchParams;
  const now = new Date();
  const defaultMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const month = params.month || defaultMonth;
  const result = await calculatePayroll(month);

  return (
    <div>
      <PageHeader
        title="Hisoblash"
        description="Oylik maosh hisob-kitobi — davomat va avanslar asosida"
      />
      <PayrollCalculator key={month} month={month} initialRows={result.rows} />
    </div>
  );
}
