export function isMissingSchema(error: { message?: string; code?: string } | null) {
  if (!error) return false;
  const text = `${error.code ?? ''} ${error.message ?? ''}`.toLowerCase();
  return (
    error.code === 'PGRST204' ||
    error.code === 'PGRST205' ||
    error.code === '42P01' ||
    text.includes('does not exist') ||
    text.includes('schema cache') ||
    text.includes('could not find the')
  );
}

export const GOVERNANCE_MIGRATION_ERROR =
  "Baza yangilanmagan. Supabase SQL Editor'da 013_creator_full_control.sql ni ishga tushiring yoki: npm run migrate";
