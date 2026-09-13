import { UsersRepository } from '@/lib/repositories/users.repository';
import { ProfileWithLocation } from '@/lib/repositories/types';
import { createSupabaseServerClient } from '../server';

export class SupabaseUsersRepository implements UsersRepository {
  async findAll(): Promise<ProfileWithLocation[]> {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from('profiles')
      .select('*, location:work_locations(name)')
      .order('full_name');

    if (error) throw error;
    return (data || []) as ProfileWithLocation[];
  }

  async findById(userId: string): Promise<ProfileWithLocation | null> {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from('profiles')
      .select('*, location:work_locations(name)')
      .eq('id', userId)
      .single();

    if (error) return null;
    return data as ProfileWithLocation;
  }
}
