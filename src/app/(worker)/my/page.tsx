import { MyMonthView } from '@/components/worker-portal/my-month-view';
import { getMyMonth } from '@/lib/actions/my-month';
import { requirePageRole } from '@/lib/auth/require-role';

export default async function MyPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>;
}) {
  await requirePageRole(['worker']);
  const params = await searchParams;
  const now = new Date();
  const defaultMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const month = params.month || defaultMonth;
  const result = await getMyMonth(month);

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
    />
  );
}
