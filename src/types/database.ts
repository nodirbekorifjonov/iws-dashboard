export type UserRole = 'superadmin' | 'admin' | 'brigadier';

export type AttendanceStatus =
  | 'present'
  | 'absent'
  | 'late'
  | 'holiday'
  | 'sick_leave';

export interface Profile {
  id: string;
  full_name: string;
  role: UserRole;
  assigned_location_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface WorkLocation {
  id: string;
  name: string;
  description: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Worker {
  id: string;
  full_name: string;
  position: string | null;
  phone: string | null;
  start_date: string;
  hourly_rate: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface WorkerLocationAssignment {
  id: string;
  worker_id: string;
  location_id: string;
  assignment_date: string;
  created_at: string;
  worker?: Worker;
  location?: WorkLocation;
}

export interface Attendance {
  id: string;
  worker_id: string;
  date: string;
  status: AttendanceStatus;
  hours_worked: number;
  notes: string | null;
  marked_by: string | null;
  created_at: string;
  updated_at: string;
  worker?: Worker;
}

export interface Advance {
  id: string;
  worker_id: string;
  month: string;
  amount: number;
  created_at: string;
  updated_at: string;
  worker?: Worker;
}

export interface PayrollRow {
  worker: Worker;
  totalHours: number;
  calculatedSalary: number;
  advanceAmount: number;
  remainingAmount: number;
}

export const ATTENDANCE_STATUS_LABELS: Record<AttendanceStatus, string> = {
  present: 'Keldi',
  absent: 'Kelmadi',
  late: 'Kech qoldi',
  holiday: 'Ta\'til',
  sick_leave: 'Kasallik',
};

export const ATTENDANCE_STATUS_COLORS: Record<AttendanceStatus, string> = {
  present: 'bg-green-100 text-green-800',
  absent: 'bg-red-100 text-red-800',
  late: 'bg-yellow-100 text-yellow-800',
  holiday: 'bg-blue-100 text-blue-800',
  sick_leave: 'bg-purple-100 text-purple-800',
};

export const USER_ROLE_LABELS: Record<UserRole, string> = {
  superadmin: 'Superadmin',
  admin: 'Admin',
  brigadier: 'Brigadir',
};

export const WORKER_POSITIONS = [
  'Qadoqlovchi',
  'Qandolatchi',
  'Yordamchi qandolatchi',
  'Surmachi (vafli)',
  'Pechkachi (vafli)',
  'Xamirchi (vafli)',
  'Yuk tashuvchi',
  'Kremchi',
  'Pechkachi (pechenye)',
  'Xamirchi (pechenye)',
  'Sendvich operatori',
  'Brigader',
  'Ish boshqaruvchi',
  'Oshpaz',
  'Farrosh',
] as const;

export type WorkerPosition = (typeof WORKER_POSITIONS)[number];

export const ABSENCE_REASON_LABELS: Record<string, string> = {
  absent: 'Sababsiz kelmadi',
  sick_leave: 'Kasallik',
  holiday: 'Ta\'til',
  late: 'Kech qoldi',
};
