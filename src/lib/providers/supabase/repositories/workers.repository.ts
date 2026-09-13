import { WorkersRepository } from '@/lib/repositories/workers.repository';
import { CreateWorkerInput, UpdateWorkerInput } from '@/lib/repositories/types';
import { Worker } from '@/types/database';
import { createSupabaseServerClient } from '../server';

export class SupabaseWorkersRepository implements WorkersRepository {
  async findAll(): Promise<Worker[]> {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from('workers')
      .select('*')
      .order('full_name');

    if (error) throw error;
    return data;
  }

  async create(input: CreateWorkerInput): Promise<void> {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.from('workers').insert(input);
    if (error) throw error;
  }

  async update(id: string, input: UpdateWorkerInput): Promise<void> {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.from('workers').update(input).eq('id', id);
    if (error) throw error;
  }

  async delete(id: string): Promise<void> {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.from('workers').delete().eq('id', id);
    if (error) throw error;
  }
}
