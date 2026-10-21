-- Erkaklar: soatbay stavkani kunlik (1 stavka) summaga,
-- davomat soatlarini stavkaga o'tkazish.
-- Qayta ishga tushirish xavfsiz: kunlik summa 70 000 dan katta,
-- stavka esa 2 dan oshmaydi.
-- Qo'shimcha ish (50 000) alohida ustun talab qilmaydi.

UPDATE workers
SET hourly_rate = ROUND(hourly_rate * 12, 0)
WHERE gender = 'male'
  AND hourly_rate > 0
  AND hourly_rate < 70000;

UPDATE attendance AS a
SET hours_worked = ROUND(a.hours_worked / 12.0, 2)
FROM workers AS w
WHERE a.worker_id = w.id
  AND w.gender = 'male'
  AND a.hours_worked > 2;
