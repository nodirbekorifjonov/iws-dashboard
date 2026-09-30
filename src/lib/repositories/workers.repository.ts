import { Worker } from '@/types/database';
import { CreateWorkerInput, UpdateWorkerInput } from './types';

export interface WorkersRepository {
  findAll(): Promise<Worker[]>;
  findById(id: string): Promise<Worker | null>;
  findByUserId(userId: string): Promise<Worker | null>;
  create(input: CreateWorkerInput): Promise<Worker>;
  update(id: string, input: UpdateWorkerInput): Promise<void>;
  delete(id: string): Promise<void>;
}
