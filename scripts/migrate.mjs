/**
 * Supabase migratsiyalarini ishga tushirish.
 *
 * Ishlatish:
 *   1. Supabase Dashboard → Settings → Database → Connection string (URI)
 *   2. .env.local ga DATABASE_URL=postgresql://... qo'shing
 *   3. npm run migrate
 */

import { readFileSync, readdirSync } from 'fs';
import { resolve, join } from 'path';
import pg from 'pg';

const envPath = resolve(process.cwd(), '.env.local');
try {
  const envContent = readFileSync(envPath, 'utf8');
  for (const line of envContent.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    const val = trimmed.slice(eq + 1).trim();
    if (!process.env[key]) process.env[key] = val;
  }
} catch {
  console.error('.env.local topilmadi');
  process.exit(1);
}

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('\n❌ DATABASE_URL kerak!\n');
  console.error('Supabase Dashboard → Settings → Database → Connection string (URI)');
  console.error('.env.local ga qo\'shing:\n');
  console.error('  DATABASE_URL=postgresql://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres\n');
  console.error('Yoki SQL Editor\'da qo\'lda ishga tushiring:');
  console.error('  supabase/migrations/004_hourly_salary_and_advances.sql\n');
  process.exit(1);
}

const migrationsDir = resolve(process.cwd(), 'supabase/migrations');
const files = readdirSync(migrationsDir)
  .filter((f) => f.endsWith('.sql'))
  .sort();

const client = new pg.Client({ connectionString: DATABASE_URL, ssl: { rejectUnauthorized: false } });

try {
  await client.connect();
  console.log('\n🔄 Migratsiyalar ishga tushirilmoqda...\n');

  for (const file of files) {
    const sql = readFileSync(join(migrationsDir, file), 'utf8');
    console.log(`  → ${file}`);
    await client.query(sql);
  }

  console.log('\n✅ Barcha migratsiyalar muvaffaqiyatli bajarildi!\n');
} catch (err) {
  console.error('\n❌ Xatolik:', err.message);
  process.exit(1);
} finally {
  await client.end();
}
