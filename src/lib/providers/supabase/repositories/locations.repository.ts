import { LocationsRepository } from '@/lib/repositories/locations.repository';
import {
  AssignWorkerLocationInput,
  CreateLocationInput,
  UpdateLocationInput,
} from '@/lib/repositories/types';
import { WorkLocation } from '@/types/database';
import { createSupabaseServerClient } from '../server';

export class SupabaseLocationsRepository implements LocationsRepository {
  async findAll(): Promise<WorkLocation[]> {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from('work_locations')
      .select('*')
      .order('name');

    if (error) throw error;
    return data;
  }

  async create(input: CreateLocationInput): Promise<void> {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.from('work_locations').insert(input);
    if (error) throw error;
  }

  async update(id: string, input: UpdateLocationInput): Promise<void> {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase
      .from('work_locations')
      .update(input)
      .eq('id', id);
    if (error) throw error;
  }

  async delete(id: string): Promise<void> {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.from('work_locations').delete().eq('id', id);
    if (error) throw error;
  }

  async assignWorker(input: AssignWorkerLocationInput): Promise<void> {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.from('worker_location_assignments').upsert(
      input,
      { onConflict: 'worker_id,assignment_date' }
    );
    if (error) throw error;
  }
}
