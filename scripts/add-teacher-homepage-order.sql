-- ترتيب ظهور المدرس في قسم «اختر المعلمين» بالرئيسية (1–4)، NULL = تلقائي حسب الاسم بعد المختارين
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS teacher_homepage_order INTEGER;
