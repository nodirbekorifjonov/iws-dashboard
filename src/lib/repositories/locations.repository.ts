import { WorkLocation } from '@/types/database';
import {
  AssignWorkerLocationInput,
  CreateLocationInput,
  UpdateLocationInput,
} from './types';

export interface LocationsRepository {
  findAll(): Promise<WorkLocation[]>;
  create(input: CreateLocationInput): Promise<void>;
  update(id: string, input: UpdateLocationInput): Promise<void>;
  delete(id: string): Promise<void>;
  assignWorker(input: AssignWorkerLocationInput): Promise<void>;
}
