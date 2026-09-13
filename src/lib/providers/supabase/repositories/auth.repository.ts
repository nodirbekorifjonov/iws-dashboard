import { AuthRepository } from '@/lib/repositories/auth.repository';
import { AuthResult, SessionUser } from '@/lib/repositories/types';
import { Profile } from '@/types/database';
import { createSupabaseServerClient } from '../server';

export class SupabaseAuthRepository implements AuthRepository {
  async signIn(email: string, password: string): Promise<AuthResult> {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      return { success: false, error: error.message };
    }
    return { success: true };
  }

  async signOut(): Promise<void> {
    const supabase = await createSupabaseServerClient();
    await supabase.auth.signOut();
  }

  async getSessionUser(): Promise<SessionUser | null> {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return null;
    return { id: user.id, email: user.email };
  }

  async getCurrentProfile(): Promise<Profile | null> {
    const sessionUser = await this.getSessionUser();
    if (!sessionUser) return null;

    const supabase = await createSupabaseServerClient();
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', sessionUser.id)
      .single();

    return profile as Profile | null;
  }
}
