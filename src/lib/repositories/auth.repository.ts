import { Profile } from '@/types/database';
import { AuthResult, SessionUser } from './types';

export interface AuthRepository {
  signIn(email: string, password: string): Promise<AuthResult>;
  signOut(): Promise<void>;
  getSessionUser(): Promise<SessionUser | null>;
  getCurrentProfile(): Promise<Profile | null>;
}
