import { WorkersRepository } from '@/lib/repositories/workers.repository';
import { CreateWorkerInput, UpdateWorkerInput } from '@/lib/repositories/types';
import { Worker } from '@/types/database';
import { fetchAllPages } from '../fetch-all';
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
  private async fetchWorkers(): Promise<Worker[]> {
    const supabase = await createSupabaseServerClient();
    const rows = await fetchAllPages<Worker>((from, to) =>
      supabase
        .from('workers')
        .select('*')
        .order('id', { ascending: true })
        .range(from, to)
    );
    return rows.sort((a, b) => a.full_name.localeCompare(b.full_name, 'uz'));
  }

  async findAll(): Promise<Worker[]> {
    const rows = await this.fetchWorkers();
    return rows.filter((worker) => !worker.deleted_at);
  }

  async findAllIncludingDeleted(): Promise<Worker[]> {
    return this.fetchWorkers();
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

  async delete(id: string): Promise<boolean> {
    const supabase = await createSupabaseServerClient();
    const stamp = new Date().toISOString();
    const full = await supabase
      .from('workers')
      .update({ deleted_at: stamp, is_active: false, login_enabled: false })
      .eq('id', id);
    if (!full.error) return true;

    const text = `${full.error.code ?? ''} ${full.error.message ?? ''}`;
    if (text.includes('login_enabled') && !text.includes('deleted_at')) {
      const retry = await supabase
        .from('workers')
        .update({ deleted_at: stamp, is_active: false })
        .eq('id', id);
      if (!retry.error) return true;
      if (!`${retry.error.message ?? ''}`.includes('deleted_at')) throw retry.error;
    }

    if (text.includes('deleted_at') || full.error.code === 'PGRST204') {
      const removed = await supabase.from('workers').delete().eq('id', id);
      if (removed.error) throw removed.error;
      return false;
    }
    throw full.error;
  }
}
