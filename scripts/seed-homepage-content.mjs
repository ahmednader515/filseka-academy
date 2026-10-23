import "dotenv/config";
import { randomBytes } from "node:crypto";
import { hash } from "bcryptjs";
import { neon } from "@neondatabase/serverless";

if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is not configured.");

const sql = neon(process.env.DATABASE_URL);
const passwordHash = await hash(randomBytes(48).toString("base64url"), 12);

const categories = [
  { id: "filseka-category-personal-growth", name: "Personal Growth", nameAr: "تطوير الذات", slug: "personal-growth", description: "Build habits and skills for a more intentional life." },
  { id: "filseka-category-entrepreneurship", name: "Entrepreneurship", nameAr: "ريادة الأعمال", slug: "entrepreneurship", description: "Build and grow a practical business." },
  { id: "filseka-category-digital-skills", name: "Digital Skills", nameAr: "المهارات الرقمية", slug: "digital-skills", description: "Develop useful digital skills for modern work." },
  { id: "filseka-category-languages", name: "Languages", nameAr: "اللغات", slug: "languages", description: "Learn to communicate with confidence." },
];

const teachers = [
  { key: "leila", id: "filseka-teacher-leila-mansour", email: "leila.mansour@teachers.filseka.invalid", name: "د. ليلى منصور", subject: "ريادة الأعمال والتخطيط للمشروعات", order: 1 },
  { key: "yassin", id: "filseka-teacher-yassin-fouad", email: "yassin.fouad@teachers.filseka.invalid", name: "م. ياسين فؤاد", subject: "التسويق الرقمي وصناعة المحتوى", order: 2 },
  { key: "sara", id: "filseka-teacher-sara-adel", email: "sara.adel@teachers.filseka.invalid", name: "أ. سارة عادل", subject: "اللغة الإنجليزية والتواصل المهني", order: 3 },
  { key: "karim", id: "filseka-teacher-karim-nabil", email: "karim.nabil@teachers.filseka.invalid", name: "د. كريم نبيل", subject: "تحليل البيانات والمهارات الرقمية", order: 4 },
];

const courses = [
  { id: "filseka-course-launch-project", slug: "launch-your-digital-project", title: "Launch Your Digital Project from Scratch", titleAr: "ابدأ مشروعك الرقمي من الصفر", description: "A practical introduction to validating an idea, building a simple brand, and planning your first launch.", descriptionAr: "خارطة عملية لتحويل فكرتك الأولى إلى مشروع واضح وخطوة إطلاق واثقة.", short: "خارطة عملية لتحويل فكرتك الأولى إلى مشروع واضح وخطوة إطلاق واثقة.", shortEn: "A practical roadmap from first idea to a confident launch.", image: "/course-cover-growth.svg", duration: "4h 20m", level: "beginner", price: 0, category: "personal-growth", teacher: null, lessons: ["اختيار فكرة تستحق التطوير", "خطة إطلاقك الأولى"] },
  { id: "filseka-course-entrepreneurship-guide", slug: "practical-entrepreneurship-guide", title: "A Practical Guide to Entrepreneurship", titleAr: "دليلك العملي إلى ريادة الأعمال", description: "Shape your idea into a focused business plan and first launch.", descriptionAr: "حوّل فكرتك إلى مشروع بخطوات واضحة من التخطيط إلى الإطلاق.", short: "حوّل فكرتك إلى مشروع بخطوات واضحة من التخطيط إلى الإطلاق.", shortEn: "Turn your idea into a business with a clear path from plan to launch.", image: "/course-cover-business.svg", duration: "3h 45m", level: "beginner", price: 0, category: "entrepreneurship", teacher: "leila", lessons: ["من الفكرة إلى فرصة حقيقية", "خطة عمل قابلة للتنفيذ"] },
  { id: "filseka-course-digital-marketing", slug: "digital-marketing-foundations", title: "Digital Marketing from the Ground Up", titleAr: "أساسيات التسويق الرقمي من الصفر", description: "Learn to plan content, understand audiences, and measure results.", descriptionAr: "تعرّف على الجمهور وصمّم محتوى رقمياً وتابع نتائجك بذكاء.", short: "تعرّف على الجمهور وصمّم محتوى رقمياً وتابع نتائجك بذكاء.", shortEn: "Understand audiences, create digital content, and track your results.", image: "/course-cover-business.svg", duration: "5h 10m", level: "beginner", price: 250, category: "entrepreneurship", teacher: null, lessons: ["فهم الجمهور المستهدف", "إنشاء خطة محتوى", "قراءة مؤشرات الأداء"] },
  { id: "filseka-course-data-analysis", slug: "data-analysis-everyday-tools", title: "Data Analysis with Everyday Tools", titleAr: "تحليل البيانات بأدوات بسيطة", description: "Turn spreadsheets into clear answers and useful decisions.", descriptionAr: "اكتشف الأنماط في البيانات وحوّلها إلى قرارات عملية.", short: "اكتشف الأنماط في البيانات وحوّلها إلى قرارات عملية.", shortEn: "Find patterns in data and turn them into practical decisions.", image: "/course-cover-digital.svg", duration: "4h 05m", level: "intermediate", price: 320, category: "digital-skills", teacher: null, lessons: ["تنظيم البيانات وتجهيزها", "استخراج الأنماط والنتائج"] },
  { id: "filseka-course-phone-content", slug: "create-content-with-your-phone", title: "Create Content with Your Phone", titleAr: "صناعة المحتوى باستخدام هاتفك", description: "Plan, record, and edit engaging short-form video content.", descriptionAr: "خطط وصوّر واكتب محتوى قصيراً وجذاباً باستخدام هاتفك.", short: "خطط وصوّر واكتب محتوى قصيراً وجذاباً باستخدام هاتفك.", shortEn: "Plan, shoot, and edit engaging short-form content on your phone.", image: "/course-cover-digital.svg", duration: "2h 50m", level: "beginner", price: 180, category: "digital-skills", teacher: "yassin", lessons: ["كتابة فكرة الفيديو", "التصوير والمونتاج السريع"] },
  { id: "filseka-course-everyday-english", slug: "english-everyday-conversations", title: "English for Everyday Conversations", titleAr: "الإنجليزية للمحادثات اليومية", description: "Practice the phrases and listening skills used in real conversations.", descriptionAr: "تدرّب على التعبير والاستماع في مواقف الحياة والعمل اليومية.", short: "تدرّب على التعبير والاستماع في مواقف الحياة والعمل اليومية.", shortEn: "Practice speaking and listening in everyday and work situations.", image: "/course-cover-language.svg", duration: "6h 20m", level: "beginner", price: 280, category: "languages", teacher: null, lessons: ["التعارف وبداية الحوار", "التواصل في مواقف العمل"] },
  { id: "filseka-course-time-management", slug: "time-management-for-busy-days", title: "Time Management for Busy People", titleAr: "إدارة الوقت للأيام المزدحمة", description: "Build a calmer, more realistic plan for your work and life.", descriptionAr: "نظّم أولوياتك وابنِ روتيناً واقعياً يساعدك على إنجاز الأهم.", short: "نظّم أولوياتك وابنِ روتيناً واقعياً يساعدك على إنجاز الأهم.", shortEn: "Set priorities and build a realistic routine for what matters.", image: "/course-cover-growth.svg", duration: "2h 35m", level: "beginner", price: 0, category: "personal-growth", teacher: null, lessons: ["تحديد الأولويات", "روتين يومي واقعي"] },
  { id: "filseka-course-leadership-communication", slug: "leadership-clear-communication", title: "Leadership and Clear Communication", titleAr: "القيادة والتواصل بوضوح", description: "Strengthen the conversations that help teams do great work.", descriptionAr: "طوّر مهارات الحوار والتغذية الراجعة والعمل مع فريقك.", short: "طوّر مهارات الحوار والتغذية الراجعة والعمل مع فريقك.", shortEn: "Improve dialogue, feedback, and collaboration with your team.", image: "/course-cover-business.svg", duration: "3h 15m", level: "intermediate", price: 210, category: "entrepreneurship", teacher: "karim", lessons: ["الاستماع وبناء الثقة", "تغذية راجعة تقود إلى التحسن"] },
  { id: "filseka-course-learning-habits", slug: "build-better-learning-habits", title: "Build Better Learning Habits", titleAr: "ابنِ عادات تعلم أفضل", description: "Use small routines to learn consistently and remember more.", descriptionAr: "خطوات يومية صغيرة تساعدك على الاستمرار وتثبيت ما تتعلمه.", short: "خطوات يومية صغيرة تساعدك على الاستمرار وتثبيت ما تتعلمه.", shortEn: "Small daily steps to stay consistent and remember what you learn.", image: "/course-cover-growth.svg", duration: "1h 55m", level: "beginner", price: 0, category: "personal-growth", teacher: null, lessons: ["بناء روتين للتعلم", "تثبيت المعرفة بالمراجعة"] },
  { id: "filseka-course-customer-research", slug: "customer-research-for-small-business", title: "Customer Research for Small Businesses", titleAr: "فهم العملاء للمشروعات الصغيرة", description: "Use simple research methods to understand your customers and improve your offer.", descriptionAr: "استخدم طرقاً بسيطة لفهم عملائك وتطوير المنتج أو الخدمة التي تقدمها.", short: "افهم احتياجات عملائك وطوّر عرضك بخطوات واضحة.", shortEn: "Understand customer needs and improve your offer with clear steps.", image: "/course-cover-business.svg", duration: "2h 40m", level: "beginner", price: 170, category: "entrepreneurship", teacher: null, lessons: ["أسئلة تكشف احتياجات العملاء", "تحويل الملاحظات إلى تحسينات"] },
  { id: "filseka-course-spreadsheets", slug: "spreadsheets-for-everyday-work", title: "Spreadsheets for Everyday Work", titleAr: "جداول البيانات للعمل اليومي", description: "Organize information, use helpful formulas, and make clear reports.", descriptionAr: "نظّم المعلومات واستخدم المعادلات المفيدة وأنشئ تقارير واضحة.", short: "أنجز المهام اليومية بالجداول والمعادلات والتقارير.", shortEn: "Handle everyday tasks with spreadsheets, formulas, and clear reports.", image: "/course-cover-digital.svg", duration: "3h 30m", level: "beginner", price: 160, category: "digital-skills", teacher: null, lessons: ["تنسيق البيانات والجداول", "معادلات وتقارير عملية"] },
  { id: "filseka-course-workplace-english", slug: "english-for-the-workplace", title: "English for the Workplace", titleAr: "الإنجليزية لبيئة العمل", description: "Build confidence in meetings, emails, and day-to-day workplace conversations.", descriptionAr: "عزّز ثقتك في الاجتماعات والرسائل والمحادثات اليومية في العمل.", short: "تواصل بثقة في الاجتماعات والرسائل ومواقف العمل.", shortEn: "Communicate confidently in meetings, emails, and work situations.", image: "/course-cover-language.svg", duration: "4h 15m", level: "intermediate", price: 290, category: "languages", teacher: "sara", lessons: ["المشاركة في الاجتماعات", "كتابة رسائل مهنية واضحة"] },
  { id: "filseka-course-english-pronunciation", slug: "english-pronunciation-and-listening", title: "English Pronunciation and Listening", titleAr: "النطق والاستماع باللغة الإنجليزية", description: "Practice listening for meaning and speaking with greater clarity.", descriptionAr: "تدرّب على فهم المعنى عند الاستماع والتحدث بوضوح أكبر.", short: "حسّن فهمك للمحادثات وطريقة نطقك للكلمات.", shortEn: "Understand conversations and speak with clearer pronunciation.", image: "/course-cover-language.svg", duration: "3h 10m", level: "beginner", price: 220, category: "languages", teacher: null, lessons: ["أصوات شائعة في الإنجليزية", "التدرب على الاستماع المركز"] },
];

const reviews = [
  { id: "filseka-review-mariam", text: "الدروس مرتبة وسهلة التطبيق، وبدأت أستخدم ما تعلمته في مشروعي من أول أسبوع.", textEn: "The lessons were clear and practical. I started using what I learned in my project in the first week.", name: "مريم أحمد", title: "متعلّمة في مسار ريادة الأعمال", titleEn: "Entrepreneurship learner", letter: "م" },
  { id: "filseka-review-omar", text: "المحتوى واضح، والأمثلة قريبة من واقع الشغل. التجربة خلتني أكمّل تعلمي بثقة.", textEn: "The content is clear and the examples feel relevant to real work. I feel more confident continuing to learn.", name: "عمر خالد", title: "متعلّم في مسار المهارات الرقمية", titleEn: "Digital skills learner", letter: "ع" },
  { id: "filseka-review-nour", text: "قدرت أتعلم على وقتي وأرجع للدروس وقت ما أحتاج. تجربة مرنة ومفيدة جداً.", textEn: "I could learn on my own schedule and revisit lessons when I needed them. A flexible and useful experience.", name: "نور حسن", title: "متعلّمة في مسار اللغات", titleEn: "Language learner", letter: "ن" },
];

const details = [
  { id: "platform-detail-1", title: "فصول افتراضية فورية", titleEn: "Live virtual classrooms", description: "تصميم الفصول والمعلومات خلال الفصول الافتراضية.", descriptionEn: "Join virtual classrooms and learn with clear, guided instruction.", iconType: "preset", presetIcon: "book", customIconUrl: null },
  { id: "platform-detail-2", title: "محتوى جذاب في دقائق", titleEn: "Engaging lessons in minutes", description: "تصميم وإنشاء المحتوى التعليمي بشكل سريع ومميز.", descriptionEn: "Explore focused learning content made to keep ideas clear and useful.", iconType: "preset", presetIcon: "pencil", customIconUrl: null },
  { id: "platform-detail-3", title: "أنشطة وفعاليات رائعة", titleEn: "Activities that bring learning to life", description: "تجذب الطلاب وتنشئ تفاعلهم بعد أو داخل الصف الدراسي.", descriptionEn: "Take part in activities that help you apply ideas and stay involved.", iconType: "preset", presetIcon: "bulb", customIconUrl: null },
  { id: "platform-detail-4", title: "تواصل فعال", titleEn: "Clear, effective communication", description: "أدوات للتواصل والتعاون الفعال بين كل أطراف العملية التعليمية.", descriptionEn: "Connect and collaborate with the people supporting your learning.", iconType: "preset", presetIcon: "chat", customIconUrl: null },
];

const news = [
  { id: "filseka-news-digital-skills", imageUrl: "/course-cover-digital.svg", description: "مسارات جديدة في المهارات الرقمية لمساعدتك على تحويل المعرفة إلى تطبيق عملي.", descriptionEn: "Explore digital skills paths designed to turn knowledge into practical action." },
  { id: "filseka-news-professional-growth", imageUrl: "/course-cover-business.svg", description: "اكتشف دورات عملية تساعدك على تطوير مشروعك ومهاراتك المهنية.", descriptionEn: "Discover practical courses to grow your project and professional skills." },
];

await sql`ALTER TABLE "User" ADD COLUMN IF NOT EXISTS teacher_subject TEXT`;
await sql`ALTER TABLE "User" ADD COLUMN IF NOT EXISTS teacher_avatar_url TEXT`;
await sql`ALTER TABLE "User" ADD COLUMN IF NOT EXISTS teacher_homepage_order INTEGER`;
await sql`ALTER TABLE "Course" ADD COLUMN IF NOT EXISTS description_en TEXT`;
await sql`ALTER TABLE "Course" ADD COLUMN IF NOT EXISTS short_desc_en VARCHAR(300)`;
await sql`ALTER TABLE "Review" ADD COLUMN IF NOT EXISTS text_en TEXT`;
await sql`ALTER TABLE "Review" ADD COLUMN IF NOT EXISTS author_title_en TEXT`;
await sql`ALTER TABLE "Review" ADD COLUMN IF NOT EXISTS image_url TEXT`;
await sql`ALTER TABLE "HomepageSetting" ADD COLUMN IF NOT EXISTS teachers_enabled BOOLEAN NOT NULL DEFAULT false`;
await sql`ALTER TABLE "HomepageSetting" ADD COLUMN IF NOT EXISTS subscriptions_enabled BOOLEAN NOT NULL DEFAULT false`;
await sql`ALTER TABLE "HomepageSetting" ADD COLUMN IF NOT EXISTS store_enabled BOOLEAN NOT NULL DEFAULT false`;
await sql`ALTER TABLE "HomepageSetting" ADD COLUMN IF NOT EXISTS featured_courses_enabled BOOLEAN NOT NULL DEFAULT true`;
await sql`ALTER TABLE "HomepageSetting" ADD COLUMN IF NOT EXISTS platform_details_enabled BOOLEAN NOT NULL DEFAULT false`;
await sql`ALTER TABLE "HomepageSetting" ADD COLUMN IF NOT EXISTS platform_details_items TEXT`;
await sql`ALTER TABLE "HomepageSetting" ADD COLUMN IF NOT EXISTS platform_details_title TEXT`;
await sql`ALTER TABLE "HomepageSetting" ADD COLUMN IF NOT EXISTS platform_details_title_en TEXT`;
await sql`ALTER TABLE "HomepageSetting" ADD COLUMN IF NOT EXISTS platform_details_subtitle TEXT`;
await sql`ALTER TABLE "HomepageSetting" ADD COLUMN IF NOT EXISTS platform_details_subtitle_en TEXT`;
await sql`ALTER TABLE "HomepageSetting" ADD COLUMN IF NOT EXISTS platform_news_enabled BOOLEAN NOT NULL DEFAULT false`;
await sql`ALTER TABLE "HomepageSetting" ADD COLUMN IF NOT EXISTS platform_news_items TEXT`;
await sql`ALTER TABLE "HomepageSetting" ADD COLUMN IF NOT EXISTS platform_news_section_title TEXT`;
await sql`ALTER TABLE "HomepageSetting" ADD COLUMN IF NOT EXISTS platform_news_section_title_en TEXT`;
await sql`CREATE TABLE IF NOT EXISTS "SubscriptionPlan" (id TEXT PRIMARY KEY, name TEXT NOT NULL, description TEXT NOT NULL DEFAULT '', image_url TEXT, duration_kind TEXT NOT NULL CHECK (duration_kind IN ('week', 'month', 'year')), price DECIMAL(10,2) NOT NULL DEFAULT 0, is_active BOOLEAN NOT NULL DEFAULT true, sort_order INT NOT NULL DEFAULT 0, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW())`;
await sql`CREATE TABLE IF NOT EXISTS "StoreProduct" (id TEXT PRIMARY KEY, title TEXT NOT NULL, description TEXT NOT NULL DEFAULT '', price DECIMAL(10,2) NOT NULL DEFAULT 0, image_url TEXT, pdf_url TEXT, is_active BOOLEAN NOT NULL DEFAULT true, sort_order INT NOT NULL DEFAULT 0, cost_price DECIMAL(10,2) NOT NULL DEFAULT 0, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW())`;
await sql`ALTER TABLE "StoreProduct" ADD COLUMN IF NOT EXISTS cost_price DECIMAL(10,2) NOT NULL DEFAULT 0`;

const categoryIds = new Map();
for (const category of categories) {
  const rows = await sql`
    INSERT INTO "Category" (id, name, name_ar, slug, description, "order")
    VALUES (${category.id}, ${category.name}, ${category.nameAr}, ${category.slug}, ${category.description}, ${categories.indexOf(category)})
    ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, name_ar = EXCLUDED.name_ar, description = EXCLUDED.description, "order" = EXCLUDED."order", updated_at = NOW()
    RETURNING id
  `;
  categoryIds.set(category.slug, rows[0].id);
}

const teacherIds = new Map();
for (const teacher of teachers) {
  const rows = await sql`
    INSERT INTO "User" (id, email, password_hash, name, role, teacher_subject, teacher_avatar_url, teacher_homepage_order)
    VALUES (${teacher.id}, ${teacher.email}, ${passwordHash}, ${teacher.name}, 'TEACHER', ${teacher.subject}, '/teacher-avatar.svg', ${teacher.order})
    ON CONFLICT (email) DO UPDATE SET name = EXCLUDED.name, role = 'TEACHER', teacher_subject = EXCLUDED.teacher_subject, teacher_avatar_url = EXCLUDED.teacher_avatar_url, teacher_homepage_order = EXCLUDED.teacher_homepage_order, updated_at = NOW()
    RETURNING id
  `;
  teacherIds.set(teacher.key, rows[0].id);
}

for (let index = 0; index < courses.length; index++) {
  const course = courses[index];
  const teacherId = course.teacher ? teacherIds.get(course.teacher) : null;
  const result = await sql`
    INSERT INTO "Course" (id, title, title_ar, slug, description, description_en, short_desc, short_desc_en, image_url, price, duration, level, is_published, "order", category_id, created_by_id)
    VALUES (${course.id}, ${course.title}, ${course.titleAr}, ${course.slug}, ${course.descriptionAr}, ${course.description}, ${course.short}, ${course.shortEn}, ${course.image}, ${course.price}, ${course.duration}, ${course.level}, true, ${index}, ${categoryIds.get(course.category)}, ${teacherId})
    ON CONFLICT (slug) DO UPDATE SET title = EXCLUDED.title, title_ar = EXCLUDED.title_ar, description = EXCLUDED.description, description_en = EXCLUDED.description_en, short_desc = EXCLUDED.short_desc, short_desc_en = EXCLUDED.short_desc_en, image_url = EXCLUDED.image_url, price = EXCLUDED.price, duration = EXCLUDED.duration, level = EXCLUDED.level, is_published = true, "order" = EXCLUDED."order", category_id = EXCLUDED.category_id, created_by_id = EXCLUDED.created_by_id, updated_at = NOW()
    RETURNING id
  `;
  const courseId = result[0].id;
  for (let lessonIndex = 0; lessonIndex < course.lessons.length; lessonIndex++) {
    const title = course.lessons[lessonIndex];
    const slug = `lesson-${lessonIndex + 1}`;
    await sql`
      INSERT INTO "Lesson" (id, course_id, title, title_ar, slug, content, "order")
      VALUES (${`${courseId}-${slug}`}, ${courseId}, ${title}, ${title}, ${slug}, ${`يتناول هذا الدرس ${title} بخطوات عملية وأمثلة تساعدك على تطبيق ما تعلمته.`}, ${lessonIndex})
      ON CONFLICT (course_id, slug) DO UPDATE SET title = EXCLUDED.title, title_ar = EXCLUDED.title_ar, content = EXCLUDED.content, "order" = EXCLUDED."order", updated_at = NOW()
    `;
  }
}

for (let index = 0; index < reviews.length; index++) {
  const review = reviews[index];
  await sql`
    INSERT INTO "Review" (id, text, text_en, author_name, author_title, author_title_en, avatar_letter, "order")
    VALUES (${review.id}, ${review.text}, ${review.textEn}, ${review.name}, ${review.title}, ${review.titleEn}, ${review.letter}, ${index})
    ON CONFLICT (id) DO UPDATE SET text = EXCLUDED.text, text_en = EXCLUDED.text_en, author_name = EXCLUDED.author_name, author_title = EXCLUDED.author_title, author_title_en = EXCLUDED.author_title_en, avatar_letter = EXCLUDED.avatar_letter, "order" = EXCLUDED."order", updated_at = NOW()
  `;
}

const plans = [
  { id: "filseka-plan-monthly", name: "اشتراك شهر واحد", description: "وصول كامل إلى مكتبة الدورات طوال الشهر.", image: "/course-cover-digital.svg", duration: "month", price: 399 },
  { id: "filseka-plan-yearly", name: "اشتراك سنوي", description: "تعلّم على مدار العام مع وصول غير محدود إلى جميع الدورات.", image: "/course-cover-business.svg", duration: "year", price: 2999 },
];
for (let index = 0; index < plans.length; index++) {
  const plan = plans[index];
  await sql`
    INSERT INTO "SubscriptionPlan" (id, name, description, image_url, duration_kind, price, is_active, sort_order)
    VALUES (${plan.id}, ${plan.name}, ${plan.description}, ${plan.image}, ${plan.duration}, ${plan.price}, true, ${index})
    ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description, image_url = EXCLUDED.image_url, duration_kind = EXCLUDED.duration_kind, price = EXCLUDED.price, is_active = true, sort_order = EXCLUDED.sort_order, updated_at = NOW()
  `;
}

const products = [
  { id: "filseka-store-learning-planner", title: "دليل تخطيط مسارك التعليمي", description: "دفتر عمل رقمي لترتيب أهدافك وخطواتك التعليمية.", price: 95, image: "/course-cover-growth.svg" },
  { id: "filseka-store-marketing-templates", title: "قوالب المحتوى والتسويق", description: "مجموعة قوالب تساعدك على تنظيم أفكار المحتوى والحملات.", price: 140, image: "/course-cover-business.svg" },
  { id: "filseka-store-study-kit", title: "حزمة أدوات الدراسة المركزة", description: "صفحات عمل رقمية لدعم التركيز والمتابعة والاستذكار.", price: 75, image: "/course-cover-digital.svg" },
];
for (let index = 0; index < products.length; index++) {
  const product = products[index];
  await sql`
    INSERT INTO "StoreProduct" (id, title, description, price, image_url, is_active, sort_order)
    VALUES (${product.id}, ${product.title}, ${product.description}, ${product.price}, ${product.image}, true, ${index})
    ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, description = EXCLUDED.description, price = EXCLUDED.price, image_url = EXCLUDED.image_url, is_active = true, sort_order = EXCLUDED.sort_order, updated_at = NOW()
  `;
}

await sql`
  INSERT INTO "HomepageSetting" (id, teachers_enabled, subscriptions_enabled, store_enabled, featured_courses_enabled, platform_details_enabled, platform_details_items, platform_news_enabled, platform_news_items, updated_at)
  VALUES ('default', true, true, true, true, true, ${JSON.stringify(details)}, true, ${JSON.stringify(news)}, NOW())
  ON CONFLICT (id) DO UPDATE SET teachers_enabled = true, subscriptions_enabled = true, store_enabled = true, featured_courses_enabled = true, platform_details_enabled = true, platform_details_items = CASE WHEN "HomepageSetting".platform_details_items IS NULL OR BTRIM("HomepageSetting".platform_details_items) = '' OR "HomepageSetting".platform_details_items = '[]' THEN EXCLUDED.platform_details_items ELSE "HomepageSetting".platform_details_items END, platform_news_enabled = true, platform_news_items = CASE WHEN "HomepageSetting".platform_news_items IS NULL OR BTRIM("HomepageSetting".platform_news_items) = '' OR "HomepageSetting".platform_news_items = '[]' THEN EXCLUDED.platform_news_items ELSE "HomepageSetting".platform_news_items END, updated_at = NOW()
`;

await sql`UPDATE "HomepageSetting" SET platform_details_title = COALESCE(NULLIF(platform_details_title, ''), 'ماذا يميز فِلسِكة أكاديمي؟'), platform_details_title_en = COALESCE(NULLIF(platform_details_title_en, ''), 'What makes Filseka Academy different?'), platform_details_subtitle = COALESCE(NULLIF(platform_details_subtitle, ''), 'اكتشف ما يجعل رحلتك التعليمية أكثر وضوحاً وفاعلية'), platform_details_subtitle_en = COALESCE(NULLIF(platform_details_subtitle_en, ''), 'Discover what makes your learning journey clearer and more effective.'), platform_news_section_title = COALESCE(NULLIF(platform_news_section_title, ''), 'أخبار المنصة'), platform_news_section_title_en = COALESCE(NULLIF(platform_news_section_title_en, ''), 'Platform news'), updated_at = NOW() WHERE id = 'default'`;

const counts = await sql`
  SELECT
    (SELECT COUNT(*)::int FROM "Course" WHERE id LIKE 'filseka-course-%') AS courses,
    (SELECT COUNT(*)::int FROM "Category" WHERE slug IN ('personal-growth', 'entrepreneurship', 'digital-skills', 'languages')) AS categories,
    (SELECT COUNT(*)::int FROM "Review" WHERE id LIKE 'filseka-review-%') AS reviews,
    (SELECT COUNT(*)::int FROM "SubscriptionPlan" WHERE id LIKE 'filseka-plan-%') AS plans,
    (SELECT COUNT(*)::int FROM "StoreProduct" WHERE id LIKE 'filseka-store-%') AS products,
    (SELECT COUNT(*)::int FROM "User" WHERE email LIKE '%@teachers.filseka.invalid') AS teachers
`;
console.log("Homepage content saved.", counts[0]);
