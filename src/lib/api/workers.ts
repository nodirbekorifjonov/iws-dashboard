import {
  getWorkersRepository,
} from '@/lib/providers';
import {
  CreateWorkerInput,
  UpdateWorkerInput,
} from '@/lib/repositories/types';

export async function getWorkers() {
  return getWorkersRepository().findAll();
}

export async function createWorker(input: CreateWorkerInput) {
  return getWorkersRepository().create(input);
}

export async function updateWorker(id: string, input: UpdateWorkerInput) {
  return getWorkersRepository().update(id, input);
}

export async function deleteWorker(id: string) {
  return getWorkersRepository().delete(id);
}
