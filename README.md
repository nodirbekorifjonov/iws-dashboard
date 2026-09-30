# IWS — Isko Working System

Shirinlik zavodi uchun ishchi boshqaruv veb-dasturi.

## Texnologiyalar

- **Frontend:** Next.js 16, React 19, TypeScript, Tailwind CSS
- **Backend:** Supabase (PostgreSQL, Auth, RLS)
- **UI:** Lucide icons, responsive dizayn

## Foydalanuvchi rollari

| Rol | Vakolatlar |
|---|---|
| Superadmin | Admin va brigadir hisoblarini yaratadi, tizimni to'liq boshqaradi |
| Admin | Ish joylari, ishchilar, davomat, maosh boshqaruvi; ishchi kirishini yaratadi |
| Brigadir | O'z blokidagi ishchilarning kunlik davomatini belgilaydi |
| Ishchi | Faqat o'z davomati, soatlari va taxminiy maoshini ko'radi |

## O'rnatish

### 1. Dependencies

```bash
npm install
```

### 2. Supabase sozlash

1. [supabase.com](https://supabase.com) da yangi loyiha yarating
2. SQL Editor da migratsiyalarni ketma-ket ishga tushiring:
   - **Yangi loyiha:** `001_initial_schema.sql` (faqat bir marta)
   - **User yaratish xatosi:** `002_fix_profile_trigger.sql`
   - **Ishchi qo'shish RLS xatosi:** `003_fix_rls_policies.sql`
   - **Soatbay maosh va avans:** `004_hourly_salary_and_advances.sql`
   - **Profil roli himoyasi:** `005_lock_profile_roles.sql`
   - **Ishchi jinsi (soatbay default):** `006_worker_gender.sql`
   - **Ayol 8/12 soat va davomat smenasi:** `007_female_shift_hours.sql`
   - **Ishchi portali (kod + RLS):** `008_worker_portal.sql`
   
   > ⚠️ `001` allaqachon ishga tushgan bo'lsa, qayta ishga tushirmang. Faqat kerakli tuzatish faylini ishga tushiring.
3. `.env.local` faylini yarating:

```env
NEXT_PUBLIC_SUPABASE_URL=your_project_url
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your_publishable_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

`SUPABASE_SERVICE_ROLE_KEY` ishchi loginini yaratish va parolni yangilash uchun kerak (Supabase Dashboard → Settings → API). Brauzerga chiqmasin.

Authentication → Providers → Email da public signup yoqilmasin. Ishchi hisoblari faqat admin orqali yaratiladi.

### 3. Birinchi superadmin yaratish

Supabase Dashboard → Authentication → Users → Add user:

- Email va parol kiriting
- User Metadata (ixtiyoriy):
  ```json
  {
    "full_name": "Super Admin"
  }
  ```

Yangi foydalanuvchi avtomatik `brigadier` rolida yaratiladi. Superadmin qilish uchun SQL Editor:

```sql
UPDATE public.profiles
SET role = 'superadmin'
WHERE id = (SELECT id FROM auth.users WHERE email = 'admin@isko.uz' LIMIT 1);
```

Keyin `005_lock_profile_roles.sql` migratsiyasini ishga tushiring.

### 4. Ishga tushirish

```bash
npm run dev
```

Brauzerda [http://localhost:3000](http://localhost:3000) oching.

### 5. Ishchi portali

1. `008_worker_portal.sql` migratsiyasini ishga tushiring.
2. `.env.local` ga `SUPABASE_SERVICE_ROLE_KEY` qo‘shing.
3. Admin → Ishchilar: **Hammasiga kirish yaratish**. Har bir ishchiga `IWS-0001` kodi beriladi.
4. Parol avtomatik: **kod + ism, bo‘sh joysiz**. Masalan `IWS-0001AkbarovaDilbar`.
5. Ishchi `/login` da **Ishchi** tabida kod + shu parol bilan kiradi.

## MVP funksiyalar

- [x] Ishchilar ro'yxati (CRUD)
- [x] Ish joylari boshqaruvi (bloklar)
- [x] Kunlik davomat belgilash
- [x] Role-based autentifikatsiya
- [x] Ishchi portali (kod + o'z davomati/maoshi)
- [x] Responsive dizayn

## Keyingi bosqichlar

- [ ] Avtomatik oylik/avans hisob-kitobi
- [ ] Admin tuzatish imkoniyati
- [ ] Hisobotlar va statistika
- [ ] Ish joyiga kunlik biriktirish UI

## Arxitektura (backend-agnostic)

Backend almashtirish imkoniyati uchun loyiha qatlamlarga ajratilgan:

```
Komponentlar / Sahifalar
        ↓
  lib/actions/          ← Server actions (FormData, revalidate)
        ↓
  lib/api/              ← Markaziy data layer (getWorkers, markAttendance...)
  lib/auth/             ← Autentifikatsiya qatlami (signIn, getCurrentUser...)
        ↓
  lib/repositories/     ← Interfeyslar (kontraktlar)
        ↓
  lib/providers/        ← Provider factory (BACKEND_PROVIDER)
        ↓
  lib/providers/supabase/  ← Hozirgi Supabase implementatsiyasi
```

**Backend almashtirishda:**
- Komponentlar va sahifalar o'zgarmaydi
- Faqat `lib/providers/` ichidagi implementatsiya qayta yoziladi
- PostgreSQL schema `supabase/migrations/` da saqlanadi (ko'chirish oson)

## Loyiha strukturasi

```
src/
├── app/                  # Next.js sahifalar
├── components/           # UI komponentlar
├── lib/
│   ├── actions/          # Server actions (yupqa qatlam)
│   ├── api/              # Data layer — barcha CRUD shu yerda
│   ├── auth/             # Auth moduli
│   ├── providers/        # Backend provider factory
│   │   └── supabase/     # Supabase implementatsiyasi
│   └── repositories/     # Repository interfeyslari
└── types/                # TypeScript turlari
```
# iws-dashboard
