-- Soatbay maosh, ish soatlari va avanslar
-- Xavfsiz qayta ishga tushirish mumkin (idempotent)

-- Oylik maoshni soatbay stavkaga o'zgartirish
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'workers' AND column_name = 'monthly_salary'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'workers' AND column_name = 'hourly_rate'
  ) THEN
    ALTER TABLE workers RENAME COLUMN monthly_salary TO hourly_rate;
  END IF;
END $$;

ALTER TABLE workers ADD COLUMN IF NOT EXISTS hourly_rate NUMERIC(12, 2) DEFAULT 0;

-- Davomatga ishlangan soatlar qo'shish
ALTER TABLE attendance ADD COLUMN IF NOT EXISTS hours_worked NUMERIC(4, 2) DEFAULT 0;

-- Avanslar jadvali (har oy uchun)
CREATE TABLE IF NOT EXISTS advances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  worker_id UUID NOT NULL REFERENCES workers(id) ON DELETE CASCADE,
  month DATE NOT NULL,
  amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(worker_id, month)
);

CREATE INDEX IF NOT EXISTS idx_advances_month ON advances(month);
CREATE INDEX IF NOT EXISTS idx_advances_worker_month ON advances(worker_id, month);

DROP TRIGGER IF EXISTS advances_updated_at ON advances;
CREATE TRIGGER advances_updated_at BEFORE UPDATE ON advances
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- RLS
ALTER TABLE advances ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can view advances" ON advances;
CREATE POLICY "Authenticated users can view advances" ON advances
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Admin can manage advances" ON advances;
CREATE POLICY "Admin can manage advances" ON advances
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());
