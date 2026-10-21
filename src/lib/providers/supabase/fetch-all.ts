const PAGE_SIZE = 1000;

type PageResult<T> = {
  data: T[] | null;
  error: { message?: string } | null;
};

/** Supabase bir so'rovda 1000 qator qaytaradi. Qolganini tartibli sahifalab olamiz. */
export async function fetchAllPages<T>(
  loadPage: (from: number, to: number) => PromiseLike<PageResult<T>>
): Promise<T[]> {
  const rows: T[] = [];

  for (let from = 0; ; from += PAGE_SIZE) {
    const { data, error } = await loadPage(from, from + PAGE_SIZE - 1);
    if (error) throw error;
    const page = data ?? [];
    rows.push(...page);
    if (page.length < PAGE_SIZE) return rows;
  }
}
