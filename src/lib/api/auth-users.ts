import type { SupabaseClient, User } from '@supabase/supabase-js';

const PAGE_SIZE = 200;
const MAX_PAGES = 50;

export async function listAuthUsers(admin: SupabaseClient): Promise<User[]> {
  const users: User[] = [];
  for (let page = 1; page <= MAX_PAGES; page += 1) {
    const { data, error } = await admin.auth.admin.listUsers({
      page,
      perPage: PAGE_SIZE,
    });
    if (error) throw error;
    users.push(...data.users);
    if (data.users.length < PAGE_SIZE) return users;
  }
  throw new Error('Foydalanuvchilar ro‘yxati to‘liq yuklanmadi');
}
