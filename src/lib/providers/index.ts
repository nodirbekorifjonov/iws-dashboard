import { AttendanceRepository } from '@/lib/repositories/attendance.repository';
import { AuthRepository } from '@/lib/repositories/auth.repository';
import { LocationsRepository } from '@/lib/repositories/locations.repository';
import { PayrollRepository } from '@/lib/repositories/payroll.repository';
import { UsersRepository } from '@/lib/repositories/users.repository';
import { WorkersRepository } from '@/lib/repositories/workers.repository';
import { SupabaseAttendanceRepository } from './supabase/repositories/attendance.repository';
import { SupabaseAuthRepository } from './supabase/repositories/auth.repository';
import { SupabaseLocationsRepository } from './supabase/repositories/locations.repository';
import { SupabasePayrollRepository } from './supabase/repositories/payroll.repository';
import { SupabaseUsersRepository } from './supabase/repositories/users.repository';
import { SupabaseWorkersRepository } from './supabase/repositories/workers.repository';

export function getWorkersRepository(): WorkersRepository {
  return new SupabaseWorkersRepository();
}

export function getLocationsRepository(): LocationsRepository {
  return new SupabaseLocationsRepository();
}

export function getAttendanceRepository(): AttendanceRepository {
  return new SupabaseAttendanceRepository();
}

export function getPayrollRepository(): PayrollRepository {
  return new SupabasePayrollRepository();
}

export function getUsersRepository(): UsersRepository {
  return new SupabaseUsersRepository();
}

export function getAuthRepository(): AuthRepository {
  return new SupabaseAuthRepository();
}
