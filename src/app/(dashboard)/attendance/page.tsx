import { getAttendanceByMonth } from '@/lib/actions/attendance';
import { AttendanceForm } from '@/components/attendance/attendance-form';

export default async function AttendancePage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>;
}) {
  const params = await searchParams;
  const now = new Date();
  const defaultMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const month = params.month || defaultMonth;
  const data = await getAttendanceByMonth(month);

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Davomat</h1>
        <p className="mt-1 text-sm text-gray-600">
          Oylik davomat jadvali — ishchilarning kunlik ish vaqti
        </p>
      </div>

      <AttendanceForm
        key={month}
        month={month}
        workers={data.workers}
        attendance={data.attendance}
      />
    </div>
  );
}
