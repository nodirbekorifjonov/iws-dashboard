import {
  Advance,
  Attendance,
  AttendanceShift,
  AttendanceStatus,
  PayrollRow,
  Profile,
  ShiftLength,
  Worker,
  WorkerGender,
} from '@/types/database';

export type ProfileWithLocation = Profile & {
  location?: { name: string } | null;
};

export interface CreateWorkerInput {
  full_name: string;
  position: string | null;
  phone: string | null;
  start_date: string;
  gender: WorkerGender | null;
  shift_length: ShiftLength | null;
  hourly_rate: number;
}

export interface UpdateWorkerInput extends CreateWorkerInput {
  is_active: boolean;
}

export interface CreateLocationInput {
  name: string;
  description: string | null;
}

export interface UpdateLocationInput extends CreateLocationInput {
  is_active: boolean;
}

export interface AssignWorkerLocationInput {
  worker_id: string;
  location_id: string;
  assignment_date: string;
}

export interface MarkAttendanceInput {
  worker_id: string;
  date: string;
  status: AttendanceStatus;
  hours_worked?: number;
  shift?: AttendanceShift | null;
  notes?: string | null;
  marked_by?: string | null;
}

export interface AttendanceByMonthResult {
  workers: Worker[];
  attendance: Attendance[];
}

export interface DashboardStats {
  totalWorkers: number;
  todayPresent: number;
  todayAbsent: number;
  todayLate: number;
}

export interface AuthResult {
  success: boolean;
  error?: string;
}

export interface SessionUser {
  id: string;
  email?: string;
}

export interface PayrollCalculationResult {
  month: string;
  rows: PayrollRow[];
}

export interface UpdateAdvanceInput {
  worker_id: string;
  month: string;
  amount: number;
}

export interface MyMonthResult {
  month: string;
  worker: Worker;
  attendance: Attendance[];
  payroll: PayrollRow;
}
