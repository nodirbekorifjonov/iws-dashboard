import { getAttendanceByMonth } from '@/lib/actions/attendance';
import { AttendanceForm } from '@/components/attendance/attendance-form';
import { MonthLockBar } from '@/components/creator/month-lock-bar';
import { PageHeader } from '@/components/layout/page-header';
import { STAFF_ROLES, requirePageRole } from '@/lib/auth/require-role';
import { currentMonthInTashkent } from '@/lib/utils/payroll';

export default async function AttendancePage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>;
}) {
  const profile = await requirePageRole(STAFF_ROLES);
  const params = await searchParams;
  const defaultMonth = currentMonthInTashkent();
  const month = params.month || defaultMonth;
  const data = await getAttendanceByMonth(month);

  return (
    <div>
      <PageHeader
        title="Davomat"
        description="Oylik davomat jadvali — ishchilarning kunlik ish vaqti"
      />
      <MonthLockBar month={month} locked={data.locked} canManage={profile.role === 'creator'} />
      <AttendanceForm
        key={month}
        month={month}
        workers={data.workers}
        attendance={data.attendance}
        rates={data.rates}
        scopeNote={data.scopeNote}
        readOnly={data.locked && profile.role !== 'creator'}
        editableKeys={data.editableKeys}
      />
    </div>
  );
}
