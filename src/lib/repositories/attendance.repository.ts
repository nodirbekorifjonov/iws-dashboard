import { Attendance } from '@/types/database';
import {
  AttendanceByMonthResult,
  DashboardStats,
  MarkAttendanceInput,
} from './types';

export interface AttendanceRepository {
  findByMonth(month: string): Promise<AttendanceByMonthResult>;
  markBatch(inputs: MarkAttendanceInput[]): Promise<void>;
  findHistory(workerId: string, month: string): Promise<Attendance[]>;
  getDashboardStats(): Promise<DashboardStats>;
}
