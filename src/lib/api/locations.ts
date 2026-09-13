import { getLocationsRepository } from '@/lib/providers';
import {
  AssignWorkerLocationInput,
  CreateLocationInput,
  UpdateLocationInput,
} from '@/lib/repositories/types';

export async function getLocations() {
  return getLocationsRepository().findAll();
}

export async function createLocation(input: CreateLocationInput) {
  return getLocationsRepository().create(input);
}

export async function updateLocation(id: string, input: UpdateLocationInput) {
  return getLocationsRepository().update(id, input);
}

export async function deleteLocation(id: string) {
  return getLocationsRepository().delete(id);
}

export async function assignWorkerToLocation(input: AssignWorkerLocationInput) {
  return getLocationsRepository().assignWorker(input);
}
