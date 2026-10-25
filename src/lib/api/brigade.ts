import { fetchAllPages } from '@/lib/providers/supabase/fetch-all';
import { createSupabaseServerClient } from '@/lib/providers/supabase/server';
import { getMonthDateRange, getMonthDates, todayInTashkent } from '@/lib/utils/payroll';
import { DashboardStats } from '@/lib/repositories/types';

type AssignmentRow = {
  id: string;
  worker_id: string;
  location_id: string;
  assignment_date: string;
};

type AssignmentIndex = Map<string, { location_id: string; assignment_date: string }[]>;

async function loadAssignmentsUntil(endDate: string) {
  const supabase = await createSupabaseServerClient();
  return fetchAllPages<AssignmentRow>((from, to) =>
    supabase
      .from('worker_location_assignments')
      .select('id, worker_id, location_id, assignment_date')
      .lte('assignment_date', endDate)
      .order('id', { ascending: true })
      .range(from, to)
  );
}

function indexAssignments(rows: AssignmentRow[]): AssignmentIndex {
  const byWorker: AssignmentIndex = new Map();
  for (const row of rows) {
    const list = byWorker.get(row.worker_id) ?? [];
    list.push({ location_id: row.location_id, assignment_date: row.assignment_date });
    byWorker.set(row.worker_id, list);
  }
  for (const list of byWorker.values()) {
    list.sort((a, b) => a.assignment_date.localeCompare(b.assignment_date));
  }
  return byWorker;
}

export function locationOnDate(
  index: AssignmentIndex,
  workerId: string,
  date: string
): string | null {
  const list = index.get(workerId);
  if (!list?.length) return null;
  let found: string | null = null;
  for (const row of list) {
    if (row.assignment_date > date) break;
    found = row.location_id;
  }
  return found;
}

export async function currentAssignments(date: string) {
  const index = indexAssignments(await loadAssignmentsUntil(date));
  const rows: { workerId: string; locationId: string; assignmentDate: string }[] = [];
  for (const [workerId, list] of index) {
    const locationId = locationOnDate(index, workerId, date);
    const latest = [...list].reverse().find((row) => row.assignment_date <= date);
    if (!locationId || !latest) continue;
    rows.push({
      workerId,
      locationId,
      assignmentDate: latest.assignment_date,
    });
  }
  return rows;
}

export async function brigadeMonthScope(locationId: string, month: string) {
  const dates = getMonthDates(month);
  const endDate = dates[dates.length - 1] ?? getMonthDateRange(month).endDate;
  const index = indexAssignments(await loadAssignmentsUntil(endDate));
  const workerIds = new Set<string>();
  const editableKeys = new Set<string>();
  for (const workerId of index.keys()) {
    for (const date of dates) {
      if (locationOnDate(index, workerId, date) !== locationId) continue;
      workerIds.add(workerId);
      editableKeys.add(`${workerId}:${date}`);
    }
  }
  return { workerIds, editableKeys };
}

export async function workerIdsOnDate(locationId: string, date: string) {
  const index = indexAssignments(await loadAssignmentsUntil(date));
  const ids = new Set<string>();
  for (const workerId of index.keys()) {
    if (locationOnDate(index, workerId, date) === locationId) ids.add(workerId);
  }
  return ids;
}

export async function dashboardStatsForLocation(
  locationId: string
): Promise<DashboardStats> {
  const supabase = await createSupabaseServerClient();
  const today = todayInTashkent();
  const ids = await workerIdsOnDate(locationId, today);
  if (ids.size === 0) {
    return { totalWorkers: 0, todayPresent: 0, todayAbsent: 0, todayLate: 0 };
  }

  const workerIds = [...ids];
  const withDeleted = await supabase
    .from('workers')
    .select('id, is_active, deleted_at')
    .in('id', workerIds);
  const workersResult = withDeleted.error
    ? await supabase.from('workers').select('id, is_active').in('id', workerIds)
    : withDeleted;
  if (workersResult.error) throw workersResult.error;

  const activeIds = new Set(
    (workersResult.data || [])
      .filter((worker) => worker.is_active && !('deleted_at' in worker && worker.deleted_at))
      .map((worker) => worker.id)
  );

  const { data: attendance, error: attendanceError } = await supabase
    .from('attendance')
    .select('worker_id, status')
    .eq('date', today)
    .in('worker_id', workerIds);
  if (attendanceError) throw attendanceError;

  const rows = (attendance || []).filter((row) => activeIds.has(row.worker_id));
  return {
    totalWorkers: activeIds.size,
    todayPresent: rows.filter((row) => row.status === 'present').length,
    todayLate: rows.filter((row) => row.status === 'late').length,
    todayAbsent: rows.filter((row) => row.status === 'absent').length,
  };
}
