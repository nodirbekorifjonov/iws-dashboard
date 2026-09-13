import { PayrollCalculationResult, UpdateAdvanceInput } from './types';

export interface PayrollRepository {
  calculate(month: string): Promise<PayrollCalculationResult>;
  updateAdvance(input: UpdateAdvanceInput): Promise<void>;
}
