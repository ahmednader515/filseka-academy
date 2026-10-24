import {
  HOMEPAGE_LEARNING_PROGRAMS,
  HOMEPAGE_PODCASTS,
  HOMEPAGE_PODCOURSES,
} from "@/lib/homepage-editorial-content";

export type HomepageCopyLocale = "ar" | "en";
export type HomepageCopyValue = { ar: string; en: string };
export type HomepageCopyMap = Record<string, HomepageCopyValue>;
export type ResolvedHomepageCopy = Record<string, string>;

export type HomepageCopyField = {
  key: string;
  group: string;
  labelAr: string;
  labelEn: string;
  ar: string;
  en: string;
  multiline?: boolean;
};

const baseFields: HomepageCopyField[] = [
  { key: "headerCourses", group: "Navigation", labelAr: "رابط الكورسات", labelEn: "Courses link", ar: "الكورسات", en: "Courses" },
  { key: "headerTeachers", group: "Navigation", labelAr: "رابط المعلمين", labelEn: "Teachers link", ar: "المعلمون", en: "Teachers" },
  { key: "headerStore", group: "Navigation", labelAr: "رابط المتجر", labelEn: "Store link", ar: "المتجر", en: "Store" },
  { key: "headerAbout", group: "Navigation", labelAr: "رابط عن فِلسِكة", labelEn: "About link", ar: "عن فِلسِكة", en: "About" },
  { key: "headerLogin", group: "Navigation", labelAr: "رابط تسجيل الدخول", labelEn: "Log in link", ar: "تسجيل الدخول", en: "Log in" },
  { key: "headerRegister", group: "Navigation", labelAr: "زر إنشاء الحساب", labelEn: "Create account button", ar: "إنشاء حساب", en: "Create account" },
  { key: "headerNavAria", group: "Navigation", labelAr: "وصف شريط التنقل لقارئات الشاشة", labelEn: "Navigation label for screen readers", ar: "التنقل الرئيسي", en: "Main navigation" },
  { key: "heroEyebrow", group: "Hero", labelAr: "العبارة الصغيرة في الهيرو", labelEn: "Hero eyebrow", ar: "تعلم بالطريقة التي تناسبك", en: "LEARN YOUR WAY" },
  { key: "featuredEyebrow", group: "Courses", labelAr: "عبارة قسم الكورسات المميزة", labelEn: "Featured courses eyebrow", ar: "اختياراتنا لك", en: "CURATED FOR YOU" },
  { key: "featuredViewAll", group: "Courses", labelAr: "زر عرض كل الكورسات", labelEn: "View all courses label", ar: "عرض الكل", en: "View all" },
  { key: "categoryViewAll", group: "Courses", labelAr: "رابط قسم التصنيف", labelEn: "Category courses link", ar: "الكورسات", en: "Courses" },
  { key: "courseShowcaseBadge", group: "Courses", labelAr: "شارة الدورة المميزة", labelEn: "Featured course badge", ar: "اختيار هذا الأسبوع", en: "THIS WEEK’S PICK" },
  { key: "courseShowcaseSteps", group: "Courses", labelAr: "وصف الدورة المميزة", labelEn: "Featured course descriptor", ar: "دورة عملية خطوة بخطوة", en: "A practical step-by-step course" },
  { key: "courseShowcaseCta", group: "Courses", labelAr: "زر الدورة المميزة", labelEn: "Featured course button", ar: "ابدأ الآن", en: "Start learning" },
  { key: "mobileAppEyebrow", group: "Mobile app", labelAr: "العبارة الصغيرة لقسم التطبيق", labelEn: "Mobile app eyebrow", ar: "فِلسِكة معك أينما كنت", en: "FILSEKA IN YOUR POCKET" },
  { key: "mobileAppTitle", group: "Mobile app", labelAr: "عنوان قسم التطبيق", labelEn: "Mobile app section title", ar: "تعلّم في أي وقت ومن أي مكان", en: "Learn wherever life takes you" },
  { key: "mobileAppDescription", group: "Mobile app", labelAr: "وصف قسم التطبيق", labelEn: "Mobile app section description", ar: "تابع دوراتك ومحتوى البودكاست بسهولة من هاتفك، وواصل رحلتك التعليمية أينما كنت.", en: "Access your courses and podcast content from your phone, and keep learning wherever you are.", multiline: true },
  { key: "mobileAppFeature1", group: "Mobile app", labelAr: "ميزة التطبيق الأولى", labelEn: "Mobile app feature 1", ar: "دوراتك متاحة على هاتفك", en: "Your courses, always with you" },
  { key: "mobileAppFeature2", group: "Mobile app", labelAr: "ميزة التطبيق الثانية", labelEn: "Mobile app feature 2", ar: "استمع إلى البودكاست أثناء التنقل", en: "Listen to podcasts on the go" },
  { key: "mobileAppFeature3", group: "Mobile app", labelAr: "ميزة التطبيق الثالثة", labelEn: "Mobile app feature 3", ar: "تابع تقدمك بسهولة", en: "Keep track of your progress" },
  { key: "mobileAppCta", group: "Mobile app", labelAr: "زر قسم التطبيق", labelEn: "Mobile app section button", ar: "حمّل التطبيق", en: "Download the app" },
  { key: "mobileAppUrl", group: "Mobile app", labelAr: "رابط تحميل التطبيق", labelEn: "App download URL", ar: "/courses", en: "/courses" },
  { key: "mobileAppScreenLabel", group: "Mobile app", labelAr: "شارة واجهة الهاتف", labelEn: "Phone mockup label", ar: "مسارك التعليمي", en: "YOUR LEARNING" },
  { key: "mobileAppScreenTitle", group: "Mobile app", labelAr: "عنوان الدورة في واجهة الهاتف", labelEn: "Phone mockup course title", ar: "أساسيات صناعة البودكاست", en: "Podcast creation basics" },
  { key: "mobileAppScreenMeta", group: "Mobile app", labelAr: "تفاصيل الدورة في واجهة الهاتف", labelEn: "Phone mockup course details", ar: "تابع من حيث توقفت", en: "Pick up where you left off" },
  { key: "editorialExploreMore", group: "Editorial collections", labelAr: "رابط استكشف المزيد", labelEn: "Explore more link", ar: "اكتشف المزيد", en: "Explore more" },
  { key: "editorialExploreCourses", group: "Editorial collections", labelAr: "زر بطاقة المحتوى", labelEn: "Editorial card button", ar: "استكشف الكورسات", en: "Explore courses" },
  { key: "teachersTitle", group: "Teachers", labelAr: "عنوان قسم المعلمين", labelEn: "Teachers section title", ar: "اختر المعلمين", en: "Meet our teachers" },
  { key: "teachersSubtitle", group: "Teachers", labelAr: "وصف قسم المعلمين", labelEn: "Teachers section description", ar: "تصفح خبيري المنصة وانتقل إلى كورسات كل خبير", en: "Explore our instructors and browse their courses" },
  { key: "teachersEmpty", group: "Teachers", labelAr: "رسالة عدم وجود معلمين", labelEn: "No teachers message", ar: "لا يوجد خبيرون حتى الآن. أنشئ حسابات من لوحة التحكم ← تعدد المعلمين.", en: "No teachers yet. Add teacher accounts from the dashboard." },
  { key: "teachersAllLink", group: "Teachers", labelAr: "رابط كل المعلمين", labelEn: "All teachers link", ar: "صفحة المعلمين الكاملة", en: "View all teachers" },
  { key: "subscriptionsTitle", group: "Subscriptions", labelAr: "عنوان قسم الاشتراكات", labelEn: "Subscriptions section title", ar: "الاشتراكات المتاحة", en: "Available subscriptions" },
  { key: "subscriptionsSubtitle", group: "Subscriptions", labelAr: "وصف قسم الاشتراكات", labelEn: "Subscriptions section description", ar: "اشترك لفترة محددة واستمتع بكل الكورسات المدفوعة المنشورة دون شراء كل كورس على حدة", en: "Subscribe for a set period and access all published paid courses without buying them individually.", multiline: true },
  { key: "subscriptionsEmpty", group: "Subscriptions", labelAr: "رسالة عدم وجود باقات", labelEn: "No subscriptions message", ar: "لا توجد باقات حالياً. أضف باقات من لوحة التحكم ← إنشاء اشتراكات المنصة.", en: "No plans are available yet. Add plans from the dashboard." },
  { key: "storeButton", group: "Store", labelAr: "زر دخول المتجر", labelEn: "Store button", ar: "دخول متجر المنصة", en: "Visit the platform store" },
  { key: "storeProductCount", group: "Store", labelAr: "عدد المنتجات المتاحة ({count} للعدد)", labelEn: "Product count label ({count} is replaced with the count)", ar: "عدد المنتجات المتاحة الآن: {count}", en: "Products available now: {count}" },
  { key: "reviewsEmpty", group: "Reviews", labelAr: "رسالة عدم وجود تقييمات", labelEn: "No reviews message", ar: "لا توجد تقييمات بعد.", en: "No reviews yet." },
  { key: "ctaChip1", group: "Call to action", labelAr: "ميزة قصيرة 1", labelEn: "Short benefit 1", ar: "شرح واضح وبسيط", en: "Clear, simple explanations" },
  { key: "ctaChip2", group: "Call to action", labelAr: "ميزة قصيرة 2", labelEn: "Short benefit 2", ar: "دعم مستمر", en: "Ongoing support" },
  { key: "ctaChip3", group: "Call to action", labelAr: "ميزة قصيرة 3", labelEn: "Short benefit 3", ar: "نتائج ملموسة", en: "Tangible results" },
  { key: "heroSliderEmpty", group: "Hero", labelAr: "رسالة عدم وجود صور للهيو", labelEn: "Hero slider empty message", ar: "لا توجد صور مضافة للقالب الثاني حتى الآن.", en: "No images have been added to the second hero template yet." },
  { key: "heroSliderAlt", group: "Hero", labelAr: "وصف صورة الهيرو ({index} يستبدل برقم الشريحة)", labelEn: "Hero slide image alt ({index} is replaced with the slide number)", ar: "صورة الهيرو {index}", en: "Hero slide {index}" },
  { key: "heroSliderLink", group: "Hero", labelAr: "وصف رابط شريحة الهيرو", labelEn: "Hero slide link description", ar: "الانتقال إلى صفحة الدورة المرتبطة بهذه الشريحة", en: "Open the course linked to this slide" },
  { key: "heroSliderPrevious", group: "Hero", labelAr: "زر الشريحة السابقة", labelEn: "Previous slide button", ar: "الصورة السابقة", en: "Previous slide" },
  { key: "heroSliderNext", group: "Hero", labelAr: "زر الشريحة التالية", labelEn: "Next slide button", ar: "الصورة التالية", en: "Next slide" },
  { key: "hero3Badge1", group: "Hero", labelAr: "النص البديل لشارة المتجر الأولى", labelEn: "First app-store badge fallback", ar: "Google Play", en: "Google Play" },
  { key: "hero3Badge2", group: "Hero", labelAr: "النص البديل لشارة المتجر الثانية", labelEn: "Second app-store badge fallback", ar: "App Store", en: "App Store" },
  { key: "newsPrevious", group: "News", labelAr: "تسمية زر الخبر السابق", labelEn: "Previous news button label", ar: "الخبر السابق", en: "Previous news" },
  { key: "newsNext", group: "News", labelAr: "تسمية زر الخبر التالي", labelEn: "Next news button label", ar: "الخبر التالي", en: "Next news" },
  { key: "newsDots", group: "News", labelAr: "تسمية مؤشرات الأخبار", labelEn: "News indicators label", ar: "مؤشرات الأخبار", en: "News indicators" },
];

const editorialGroups = [
  { key: "podcourses", label: "Podcourses", title: "بودكورس", subtitle: "تعلم من حوارات وخبرات عملية مختارة.", cards: HOMEPAGE_PODCOURSES },
  { key: "podcasts", label: "Podcasts", title: "بودكاست", subtitle: "أفكار ملهمة للنمو في الحياة والعمل.", cards: HOMEPAGE_PODCASTS },
  { key: "learningPrograms", label: "Learning programs", title: "برامج التعلم", subtitle: "مسارات تعليمية تجمع الكورسات في رحلة واحدة واضحة.", cards: HOMEPAGE_LEARNING_PROGRAMS },
];

for (const group of editorialGroups) {
  baseFields.push(
    { key: `editorial.${group.key}.title`, group: `Editorial: ${group.label}`, labelAr: `عنوان ${group.title}`, labelEn: `${group.label} title`, ar: group.title, en: group.label },
    { key: `editorial.${group.key}.subtitle`, group: `Editorial: ${group.label}`, labelAr: `وصف ${group.title}`, labelEn: `${group.label} description`, ar: group.subtitle, en: group.key === "podcourses" ? "Learn from practical conversations and expert insights." : group.key === "podcasts" ? "Fresh perspectives on life, work, and growth." : "Focused learning paths that bring courses together.", multiline: true },
  );
  group.cards.forEach((card, index) => {
    const prefix = `editorial.${group.key}.card.${index}`;
    baseFields.push(
      { key: `${prefix}.title`, group: `Editorial: ${group.label}`, labelAr: `بطاقة ${index + 1} · العنوان`, labelEn: `Card ${index + 1} · title`, ar: card.title, en: card.titleEn },
      { key: `${prefix}.description`, group: `Editorial: ${group.label}`, labelAr: `بطاقة ${index + 1} · الوصف`, labelEn: `Card ${index + 1} · description`, ar: card.description, en: card.descriptionEn, multiline: true },
      { key: `${prefix}.meta`, group: `Editorial: ${group.label}`, labelAr: `بطاقة ${index + 1} · المدة / التفاصيل`, labelEn: `Card ${index + 1} · duration / details`, ar: card.meta, en: card.metaEn },
    );
  });
}

export const HOMEPAGE_COPY_FIELDS = baseFields;

export function parseHomepageCopy(value: string | null | undefined): HomepageCopyMap {
  if (!value) return {};
  try {
    const parsed: unknown = JSON.parse(value);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return {};
    const result: HomepageCopyMap = {};
    for (const field of HOMEPAGE_COPY_FIELDS) {
      const raw = (parsed as Record<string, unknown>)[field.key];
      if (!raw || typeof raw !== "object" || Array.isArray(raw)) continue;
      const row = raw as Record<string, unknown>;
      result[field.key] = {
        ar: typeof row.ar === "string" ? row.ar.slice(0, 2000) : field.ar,
        en: typeof row.en === "string" ? row.en.slice(0, 2000) : field.en,
      };
    }
    return result;
  } catch {
    return {};
  }
}

export function getHomepageCopyEditorValues(value: string | null | undefined): HomepageCopyMap {
  const saved = parseHomepageCopy(value);
  return Object.fromEntries(
    HOMEPAGE_COPY_FIELDS.map((field) => [field.key, saved[field.key] ?? { ar: field.ar, en: field.en }]),
  );
}

export function resolveHomepageCopy(
  value: string | null | undefined,
  locale: HomepageCopyLocale,
): ResolvedHomepageCopy {
  const saved = parseHomepageCopy(value);
  return Object.fromEntries(
    HOMEPAGE_COPY_FIELDS.map((field) => [
      field.key,
      saved[field.key]?.[locale]?.trim() || field[locale],
    ]),
  );
}
