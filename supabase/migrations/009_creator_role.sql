-- Creator roli: faqat profilga kirishlar sahifasini ko'radi
-- Xavfsiz qayta ishga tushirish mumkin (idempotent)
-- 'creator' qiymati shu faylda ishlatilmaydi (PG: yangi enum qiymat commit qilinmaguncha ishlatib bo'lmaydi)

ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'creator';
