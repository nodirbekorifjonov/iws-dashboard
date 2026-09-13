import { Worker } from '@/types/database';
import { CreateWorkerInput, UpdateWorkerInput } from './types';

export interface WorkersRepository {
  findAll(): Promise<Worker[]>;
  create(input: CreateWorkerInput): Promise<void>;
  update(id: string, input: UpdateWorkerInput): Promise<void>;
  delete(id: string): Promise<void>;
}
