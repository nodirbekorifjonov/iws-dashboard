import { MyMonthView } from '@/components/worker-portal/my-month-view';
import { getMyMonth } from '@/lib/actions/my-month';
import { getPayContext } from '@/lib/api/pay-rates';
import { requirePageRole } from '@/lib/auth/require-role';
import { currentMonthInTashkent } from '@/lib/utils/payroll';

export default async function MyPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>;
}) {
  await requirePageRole(['worker']);
  const params = await searchParams;
  const defaultMonth = currentMonthInTashkent();
  const month = params.month || defaultMonth;
  const [result, payContext] = await Promise.all([getMyMonth(month), getPayContext(month)]);

  if (!result) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-8 text-center">
        <h1 className="text-lg font-semibold text-slate-900">Ishchi yozuvi topilmadi</h1>
        <p className="mt-3 text-sm text-slate-600">
          Hisobingiz tizimga kirgan, lekin ishchi kartasiga ulanmagan. Adminga murojaat qiling.
        </p>
      </div>
    );
  }

  return (
    <MyMonthView
      month={result.month}
      worker={result.worker}
      attendance={result.attendance}
      payroll={result.payroll}
      rates={payContext.rates}
    />
  );
}
