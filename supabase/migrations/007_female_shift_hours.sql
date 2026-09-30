-- Ayol ishchilar: 8/12 soat rejimi va davomat smenasi (kunduzgi/kechki)
-- Xavfsiz qayta ishga tushirish mumkin (idempotent)

ALTER TABLE workers ADD COLUMN IF NOT EXISTS shift_length SMALLINT;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'workers_shift_length_check'
  ) THEN
    ALTER TABLE workers ADD CONSTRAINT workers_shift_length_check
      CHECK (shift_length IS NULL OR shift_length IN (8, 12));
  END IF;
END $$;

UPDATE workers
SET shift_length = 8
WHERE gender = 'female' AND shift_length IS NULL;

DO $$ BEGIN
  CREATE TYPE attendance_shift AS ENUM ('day', 'night');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE attendance ADD COLUMN IF NOT EXISTS shift attendance_shift;
