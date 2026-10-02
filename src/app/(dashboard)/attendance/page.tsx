import { getAttendanceByMonth } from '@/lib/actions/attendance';
import { AttendanceForm } from '@/components/attendance/attendance-form';
import { PageHeader } from '@/components/layout/page-header';
import { STAFF_ROLES, requirePageRole } from '@/lib/auth/require-role';

export default async function AttendancePage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>;
}) {
  await requirePageRole(STAFF_ROLES);
  const params = await searchParams;
  const now = new Date();
  const defaultMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const month = params.month || defaultMonth;
  const data = await getAttendanceByMonth(month);

  return (
    <div>
      <PageHeader
        title="Davomat"
        description="Oylik davomat jadvali — ishchilarning kunlik ish vaqti"
      />
      <AttendanceForm
        key={month}
        month={month}
        workers={data.workers}
        attendance={data.attendance}
      />
    </div>
  );
}
