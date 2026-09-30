-- Ishchi jinsi (soatbay stavka defaultlari uchun)
-- Xavfsiz qayta ishga tushirish mumkin (idempotent)

DO $$ BEGIN
  CREATE TYPE worker_gender AS ENUM ('male', 'female');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE workers ADD COLUMN IF NOT EXISTS gender worker_gender;
