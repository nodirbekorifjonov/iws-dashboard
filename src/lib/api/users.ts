import { getUsersRepository } from '@/lib/providers';

export async function getUsers() {
  return getUsersRepository().findAll();
}
