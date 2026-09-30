import { WorkersRepository } from '@/lib/repositories/workers.repository';
import { CreateWorkerInput, UpdateWorkerInput } from '@/lib/repositories/types';
import { Worker } from '@/types/database';
import { createSupabaseServerClient } from '../server';

function isMissingWorkerColumn(error: { code?: string; message?: string } | null) {
  if (!error) return false;
  const text = `${error.code ?? ''} ${error.message ?? ''}`;
  return (
    error.code === 'PGRST204' ||
    text.includes("Could not find the 'gender' column") ||
    text.includes("Could not find the 'shift_length' column")
  );
}

function withoutNewWorkerColumns<T extends CreateWorkerInput | UpdateWorkerInput>(
  input: T
) {
  const { gender: _gender, shift_length: _shiftLength, ...rest } = input;
  return rest;
}

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

  async findById(id: string): Promise<Worker | null> {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from('workers')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) throw error;
    return data;
  }

  async findByUserId(userId: string): Promise<Worker | null> {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from('workers')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) throw error;
    return data;
  }

  async create(input: CreateWorkerInput): Promise<Worker> {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from('workers')
      .insert(input)
      .select('*')
      .single();
    if (!error && data) return data;
    if (isMissingWorkerColumn(error)) {
      const retry = await supabase
        .from('workers')
        .insert(withoutNewWorkerColumns(input))
        .select('*')
        .single();
      if (retry.error || !retry.data) throw retry.error ?? new Error('Ishchi yaratilmadi');
      return retry.data;
    }
    throw error;
  }

  async update(id: string, input: UpdateWorkerInput): Promise<void> {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.from('workers').update(input).eq('id', id);
    if (!error) return;
    if (isMissingWorkerColumn(error)) {
      const retry = await supabase
        .from('workers')
        .update(withoutNewWorkerColumns(input))
        .eq('id', id);
      if (retry.error) throw retry.error;
      return;
    }
    throw error;
  }

  async delete(id: string): Promise<void> {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.from('workers').delete().eq('id', id);
    if (error) throw error;
  }
}
