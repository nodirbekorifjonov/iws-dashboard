import { ProfileWithLocation } from './types';

export interface UsersRepository {
  findAll(): Promise<ProfileWithLocation[]>;
  findById(userId: string): Promise<ProfileWithLocation | null>;
}
