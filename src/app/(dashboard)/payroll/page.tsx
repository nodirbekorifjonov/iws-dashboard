import { PayrollCalculator } from '@/components/payroll/payroll-calculator';

export default async function PayrollPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string; calculated?: string }>;
}) {
  const params = await searchParams;
  const now = new Date();
  const defaultMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const month = params.month || defaultMonth;

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Hisoblash</h1>
        <p className="mt-1 text-sm text-gray-600">
          Oylik maosh hisob-kitobi — davomat va avanslar asosida
        </p>
      </div>

      <PayrollCalculator key={month} month={month} initialRows={null} />
    </div>
  );
}
