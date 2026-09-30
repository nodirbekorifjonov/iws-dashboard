import { Advance } from '@/types/database';
import { PayrollCalculationResult, UpdateAdvanceInput } from './types';

export interface PayrollRepository {
  calculate(month: string): Promise<PayrollCalculationResult>;
  findAdvancesForWorker(workerId: string, month: string): Promise<Advance[]>;
  updateAdvance(input: UpdateAdvanceInput): Promise<void>;
}
