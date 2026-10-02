import { createSupabaseAdminClient } from '@/lib/providers/supabase/admin';
import { Profile, ProfileLogin, WorkerLoginStatus } from '@/types/database';

export interface ProfileLoginsResult {
  statuses: WorkerLoginStatus[];
  recent: ProfileLogin[];
  loggedInCount: number;
  workerCount: number;
}

function isMissingLoginsTable(error: { message?: string; code?: string } | null) {
  if (!error) return false;
  const text = `${error.code ?? ''} ${error.message ?? ''}`.toLowerCase();
  return (
    text.includes('profile_logins') ||
    text.includes('does not exist') ||
    text.includes('schema cache')
  );
}

function latestIso(...values: Array<string | null | undefined>) {
  const times = values
    .filter((value): value is string => Boolean(value))
    .map((value) => new Date(value).getTime())
    .filter((value) => Number.isFinite(value));
  if (times.length === 0) return null;
  return new Date(Math.max(...times)).toISOString();
}

export async function recordProfileLogin(profile: Profile) {
  const admin = createSupabaseAdminClient();
  let worker: { id: string; full_name: string; login_code: string | null } | null =
    null;

  if (profile.role === 'worker') {
    const { data } = await admin
      .from('workers')
      .select('id, full_name, login_code')
      .eq('user_id', profile.id)
      .maybeSingle();
    worker = data;
  }

  const { error } = await admin.from('profile_logins').insert({
    user_id: profile.id,
    worker_id: worker?.id ?? null,
    full_name: worker?.full_name ?? profile.full_name,
    login_code: worker?.login_code ?? null,
    role: profile.role,
  });

  if (error && !isMissingLoginsTable(error)) {
    throw error;
  }
}

export async function recordWorkerProfileLogin(profile: Profile) {
  return recordProfileLogin(profile);
}

export async function getProfileLogins(): Promise<ProfileLoginsResult> {
  const admin = createSupabaseAdminClient();

  const { data: workers, error: workersError } = await admin
    .from('workers')
    .select('id, full_name, login_code, user_id, is_active')
    .eq('is_active', true)
    .order('full_name');

  if (workersError) throw workersError;

  const { data: events, error: eventsError } = await admin
    .from('profile_logins')
    .select('*')
    .order('logged_in_at', { ascending: false })
    .limit(200);

  const recent = eventsError && isMissingLoginsTable(eventsError)
    ? []
    : ((events || []) as ProfileLogin[]);
  if (eventsError && !isMissingLoginsTable(eventsError)) {
    throw eventsError;
  }

  const authUsers = new Map<
    string,
    { last_sign_in_at?: string | null }
  >();
  let page = 1;
  while (page <= 10) {
    const { data, error } = await admin.auth.admin.listUsers({
      page,
      perPage: 200,
    });
    if (error) throw error;
    for (const user of data.users) {
      authUsers.set(user.id, { last_sign_in_at: user.last_sign_in_at });
    }
    if (data.users.length < 200) break;
    page += 1;
  }

  const eventsByWorker = new Map<string, ProfileLogin[]>();
  for (const event of recent) {
    if (!event.worker_id) continue;
    const list = eventsByWorker.get(event.worker_id) ?? [];
    list.push(event);
    eventsByWorker.set(event.worker_id, list);
  }

  const statuses = (workers || []).map((worker) => {
    const workerEvents = eventsByWorker.get(worker.id) ?? [];
    const lastEventAt = workerEvents[0]?.logged_in_at ?? null;
    const lastAuthAt = worker.user_id
      ? authUsers.get(worker.user_id)?.last_sign_in_at ?? null
      : null;
    const lastLoggedInAt = latestIso(lastEventAt, lastAuthAt);
    const loginCount =
      workerEvents.length || (lastLoggedInAt ? 1 : 0);

    return {
      workerId: worker.id,
      fullName: worker.full_name,
      loginCode: worker.login_code,
      lastLoggedInAt,
      loginCount,
      hasLoggedIn: lastLoggedInAt !== null,
    } satisfies WorkerLoginStatus;
  });

  statuses.sort((a, b) => {
    if (a.hasLoggedIn !== b.hasLoggedIn) return a.hasLoggedIn ? -1 : 1;
    return (b.lastLoggedInAt || '').localeCompare(a.lastLoggedInAt || '');
  });

  return {
    statuses,
    recent,
    loggedInCount: statuses.filter((status) => status.hasLoggedIn).length,
    workerCount: statuses.length,
  };
}
