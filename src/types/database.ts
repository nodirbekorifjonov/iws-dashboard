export type UserRole = 'superadmin' | 'admin' | 'brigadier';

export type AttendanceStatus =
  | 'present'
  | 'absent'
  | 'late'
  | 'holiday'
  | 'sick_leave';

export type WorkerGender = 'male' | 'female';
export type ShiftLength = 8 | 12;
export type AttendanceShift = 'day' | 'night';

export const MALE_SHIFT_PAY = 140_000;
export const MALE_SHIFT_HOURS = 12;
export const FEMALE_8H_HOURLY_RATE = 15_000;
export const FEMALE_HOURLY_RATE = FEMALE_8H_HOURLY_RATE;
export const FEMALE_12H_HOURS = 12;
export const FEMALE_12H_DAY_PAY = 160_000;
export const FEMALE_12H_NIGHT_PAY = 180_000;

export function roundMoney(amount: number): number {
  return Math.round(amount * 100) / 100;
}

export function female12hDayHourly(): number {
  return FEMALE_12H_DAY_PAY / FEMALE_12H_HOURS;
}

export function female12hNightHourly(): number {
  return FEMALE_12H_NIGHT_PAY / FEMALE_12H_HOURS;
}

export function defaultHourlyRate(
  gender: WorkerGender,
  shiftLength?: ShiftLength | null
): number {
  if (gender === 'male') {
    return roundMoney(MALE_SHIFT_PAY / MALE_SHIFT_HOURS);
  }
  if (shiftLength === 12) {
    return roundMoney(female12hDayHourly());
  }
  return FEMALE_8H_HOURLY_RATE;
}

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
  gender: WorkerGender | null;
  shift_length: ShiftLength | null;
  hourly_rate: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export function isFemale12hWorker(
  worker: Pick<Worker, 'gender' | 'shift_length'>
): boolean {
  return worker.gender === 'female' && Number(worker.shift_length) === 12;
}

export function defaultHoursForWorker(
  worker: Pick<Worker, 'shift_length'>
): number {
  if (Number(worker.shift_length) === 8) return 8;
  return 12;
}

export function hourlyRateForAttendance(
  worker: Pick<Worker, 'gender' | 'shift_length' | 'hourly_rate'>,
  shift: AttendanceShift | null | undefined
): number {
  if (isFemale12hWorker(worker)) {
    return shift === 'night' ? female12hNightHourly() : female12hDayHourly();
  }
  return Number(worker.hourly_rate) || 0;
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
  shift: AttendanceShift | null;
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

export const WORKER_GENDER_LABELS: Record<WorkerGender, string> = {
  male: 'Erkak',
  female: 'Ayol',
};

export const SHIFT_LENGTH_LABELS: Record<ShiftLength, string> = {
  8: '8 soatlik',
  12: '12 soatlik',
};

export const ATTENDANCE_SHIFT_LABELS: Record<AttendanceShift, string> = {
  day: 'Kunduzgi',
  night: 'Kechki',
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
