/**
 * Superadmin foydalanuvchi yaratish.
 *
 * Ishlatish:
 *   1. Supabase Dashboard → Settings → API → service_role key ni nusxalang
 *   2. .env.local ga SUPABASE_SERVICE_ROLE_KEY=... qo'shing
 *   3. npm run seed:admin
 */

import { readFileSync } from 'fs';
import { resolve } from 'path';

// .env.local ni o'qish
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

const ADMIN = {
  email: 'admin@isko.uz',
  password: 'Iws@2026Admin',
  full_name: 'Super Admin',
  role: 'superadmin',
};

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('\n❌ SUPABASE_SERVICE_ROLE_KEY kerak!');
  console.error('Supabase Dashboard → Settings → API → service_role key');
  console.error('.env.local ga qo\'shing: SUPABASE_SERVICE_ROLE_KEY=your_key\n');
  process.exit(1);
}

const res = await fetch(`${SUPABASE_URL}/auth/v1/admin/users`, {
  method: 'POST',
  headers: {
    apikey: SERVICE_ROLE_KEY,
    Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    email: ADMIN.email,
    password: ADMIN.password,
    email_confirm: true,
    user_metadata: {
      full_name: ADMIN.full_name,
      role: ADMIN.role,
    },
  }),
});

const data = await res.json();

if (!res.ok) {
  if (data.msg?.includes('already been registered') || data.message?.includes('already')) {
    console.log('\n✅ Foydalanuvchi allaqachon mavjud!\n');
    console.log('  Email:  ', ADMIN.email);
    console.log('  Parol:  ', ADMIN.password);
    console.log('');
    process.exit(0);
  }
  console.error('\n❌ Xatolik:', data.msg || data.message || JSON.stringify(data));
  process.exit(1);
}

console.log('\n✅ Superadmin muvaffaqiyatli yaratildi!\n');
console.log('  Email:  ', ADMIN.email);
console.log('  Parol:  ', ADMIN.password);
console.log('\nhttp://localhost:3000/login sahifasidan kiring.\n');
