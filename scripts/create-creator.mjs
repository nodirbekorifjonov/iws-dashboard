/**
 * Yashirin to'liq-kirish hisobini yaratish.
 *
 * Ishlatish: npm run seed:creator
 */

import { readFileSync } from 'fs';
import { resolve } from 'path';

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

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const ACCOUNT = {
  email: 'creator@isko.uz',
  password: 'Iws@2026Creator',
  full_name: 'Super Admin',
  role: 'superadmin',
};

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('\n❌ SUPABASE_SERVICE_ROLE_KEY kerak!');
  console.error('.env.local ga qo‘shing: SUPABASE_SERVICE_ROLE_KEY=your_key\n');
  process.exit(1);
}

const headers = {
  apikey: SERVICE_ROLE_KEY,
  Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
  'Content-Type': 'application/json',
};

async function findUserIdByEmail(email) {
  const res = await fetch(
    `${SUPABASE_URL}/auth/v1/admin/users?page=1&per_page=200`,
    { headers }
  );
  const data = await res.json();
  const users = data.users || data;
  if (!Array.isArray(users)) return null;
  return users.find((user) => user.email === email)?.id ?? null;
}

const res = await fetch(`${SUPABASE_URL}/auth/v1/admin/users`, {
  method: 'POST',
  headers,
  body: JSON.stringify({
    email: ACCOUNT.email,
    password: ACCOUNT.password,
    email_confirm: true,
    user_metadata: {
      full_name: ACCOUNT.full_name,
    },
  }),
});

const data = await res.json();
let userId = data.id || data.user?.id;

if (!res.ok) {
  const already =
    data.msg?.includes('already been registered') ||
    data.message?.includes('already');
  if (!already) {
    console.error('\n❌ Xatolik:', data.msg || data.message || JSON.stringify(data));
    process.exit(1);
  }
  userId = await findUserIdByEmail(ACCOUNT.email);
}

if (!userId) {
  console.error('\n❌ Foydalanuvchi topilmadi');
  process.exit(1);
}

const update = await fetch(`${SUPABASE_URL}/rest/v1/profiles?id=eq.${userId}`, {
  method: 'PATCH',
  headers: {
    ...headers,
    Prefer: 'return=representation',
  },
  body: JSON.stringify({
    role: ACCOUNT.role,
    full_name: ACCOUNT.full_name,
  }),
});

if (!update.ok) {
  console.error('\n❌ Profilni yangilashda xatolik:');
  console.error(await update.text());
  process.exit(1);
}

console.log('\n✅ Hisob tayyor!\n');
console.log('  Email:  ', ACCOUNT.email);
console.log('  Parol:  ', ACCOUNT.password);
console.log('\nXodim bo‘limidan kiring.\n');
