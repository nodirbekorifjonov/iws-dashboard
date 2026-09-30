import { getWorkerById, getWorkers } from '@/lib/api/workers';
import { createSupabaseAdminClient } from '@/lib/providers/supabase/admin';
import {
  MIN_WORKER_PASSWORD_LENGTH,
  workerDefaultPassword,
  workerLoginCodeToEmail,
} from '@/lib/utils/worker-login';
import { Worker } from '@/types/database';

const LOGIN_MIGRATION_ERROR =
  "Baza yangilanmagan. Supabase SQL Editor'da 008_worker_portal.sql migratsiyasini ishga tushiring yoki: npm run migrate";

function errorText(err: unknown): string {
  if (err instanceof Error) return err.message;
  return String(err);
}

function passwordForWorker(worker: Pick<Worker, 'login_code' | 'full_name'>) {
  if (!worker.login_code) {
    throw new Error(LOGIN_MIGRATION_ERROR);
  }
  const password = workerDefaultPassword(worker.login_code, worker.full_name);
  if (password.length < MIN_WORKER_PASSWORD_LENGTH) {
    throw new Error(`Parol kamida ${MIN_WORKER_PASSWORD_LENGTH} ta belgidan iborat bo‘lishi kerak`);
  }
  return password;
}

export async function createWorkerAuthLogin(workerId: string) {
  const worker = await getWorkerById(workerId);
  if (!worker) {
    throw new Error('Ishchi topilmadi');
  }
  if (!worker.login_code) {
    throw new Error(LOGIN_MIGRATION_ERROR);
  }
  if (worker.user_id) {
    throw new Error('Bu ishchi uchun kirish allaqachon yaratilgan');
  }

  const password = passwordForWorker(worker);
  const admin = createSupabaseAdminClient();
  const email = workerLoginCodeToEmail(worker.login_code);

  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: worker.full_name },
  });

  if (error || !data.user) {
    const message = error?.message || 'Kirish yaratilmadi';
    if (message.toLowerCase().includes('already')) {
      throw new Error('Bu kod uchun kirish allaqachon mavjud');
    }
    throw new Error(message);
  }

  const userId = data.user.id;

  try {
    const { error: profileError } = await admin
      .from('profiles')
      .update({ role: 'worker', full_name: worker.full_name })
      .eq('id', userId);

    if (profileError) {
      throw profileError;
    }

    const { error: workerError } = await admin
      .from('workers')
      .update({ user_id: userId })
      .eq('id', worker.id);

    if (workerError) {
      throw workerError;
    }
  } catch (err) {
    await admin.auth.admin.deleteUser(userId);
    const message = errorText(err);
    if (message.includes('worker') && message.includes('enum')) {
      throw new Error(LOGIN_MIGRATION_ERROR);
    }
    throw err;
  }

  return {
    loginCode: worker.login_code,
    password,
  };
}

export async function resetWorkerAuthPassword(workerId: string) {
  const worker = await getWorkerById(workerId);
  if (!worker) {
    throw new Error('Ishchi topilmadi');
  }
  if (!worker.user_id) {
    throw new Error('Avval kirish yarating');
  }

  const password = passwordForWorker(worker);
  const admin = createSupabaseAdminClient();
  const { error } = await admin.auth.admin.updateUserById(worker.user_id, {
    password,
  });

  if (error) {
    throw new Error(error.message);
  }

  return {
    loginCode: worker.login_code,
    password,
  };
}

export async function provisionMissingWorkerLogins() {
  const workers = await getWorkers();
  const missing = workers.filter((worker) => !worker.user_id && worker.login_code);

  let created = 0;
  const errors: string[] = [];

  for (const worker of missing) {
    try {
      await createWorkerAuthLogin(worker.id);
      created += 1;
    } catch (err) {
      errors.push(`${worker.full_name}: ${errorText(err)}`);
    }
  }

  return { created, failed: errors.length, errors };
}

export async function deleteWorkerAuthUser(userId: string) {
  const admin = createSupabaseAdminClient();
  const { error } = await admin.auth.admin.deleteUser(userId);
  if (error && !error.message.toLowerCase().includes('not found')) {
    throw new Error(error.message);
  }
}
