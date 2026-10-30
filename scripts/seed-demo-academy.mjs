import "dotenv/config";
import { neon } from "@neondatabase/serverless";
import { access, mkdir, writeFile } from "node:fs/promises";

if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is not configured.");
const sql = neon(process.env.DATABASE_URL);

// Stable demo IDs: rerunning adds missing records without replacing edited content.
const categories = [
  { key: "acting", ar: "التمثيل أمام الكاميرا", en: "Acting for Camera", color: "#ff536e", icon: '<rect x="55" y="65" width="130" height="110" rx="20"/><path d="m185 100 55-30v100l-55-30M100 100l45 25-45 25z"/>', courses: [
    ["camera-confidence", "الثقة أمام الكاميرا", "Camera Confidence", "تدريبات على لغة الجسد والتواصل البصري والتعامل مع رهبة الكاميرا.", "Build confidence with body language, eye contact, and camera presence."],
    ["screen-acting", "أساسيات التمثيل التليفزيوني", "Screen Acting Foundations", "تعرّف على تحليل المشهد وبناء الشخصية والأداء المناسب للكاميرا.", "Explore scene analysis, character building, and performing for camera."],
    ["voice-acting", "الأداء الصوتي والدوبلاج", "Voice Acting and Dubbing", "طوّر تنوعك الصوتي وتدرّب على أداء الشخصيات ومزامنة الحوار.", "Practice character voices, vocal expression, and dialogue timing."],
  ] },
  { key: "podcasting", ar: "إنتاج البودكاست", en: "Podcast Production", color: "#ffad61", icon: '<rect x="115" y="35" width="70" height="130" rx="35"/><path d="M90 120v15a60 60 0 0 0 120 0v-15M150 195v40M115 235h70M120 75h30M120 100h30"/>', courses: [
    ["first-podcast", "بودكاستك الأول من الفكرة للنشر", "Launch Your First Podcast", "اختر فكرة برنامجك وحدد جمهوره وصمّم هيكل الحلقة وخطة النشر.", "Define your podcast concept, audience, episode structure, and release plan."],
    ["audio-recording", "تسجيل الصوت بجودة احترافية", "Professional Audio Recording", "اكتشف أساسيات اختيار الميكروفون وتهيئة المكان وضبط مستوى التسجيل.", "Learn microphone selection, room setup, and recording levels."],
    ["podcast-interviews", "إدارة الحوار في البودكاست", "Podcast Interview Skills", "حضّر أسئلة فعّالة وتعلّم الاستماع وإدارة إيقاع الحوار مع الضيوف.", "Prepare effective questions and guide engaging guest conversations."],
  ] },
  { key: "presenting", ar: "التقديم الإذاعي والتلفزيوني", en: "Radio and TV Presenting", color: "#b08aff", icon: '<circle cx="150" cy="110" r="18"/><path d="M115 75a50 50 0 0 0 0 70M185 75a50 50 0 0 1 0 70M85 45a90 90 0 0 0 0 130M215 45a90 90 0 0 1 0 130M150 130v100M115 230h70"/>', courses: [
    ["radio-presenting", "مهارات المذيع الإذاعي", "Radio Presenting Essentials", "تدرّب على مخارج الحروف والتنفس والإلقاء وتقديم الفقرات الإذاعية.", "Practice articulation, breathing, delivery, and radio segments."],
    ["tv-presenting", "التقديم التليفزيوني باحتراف", "TV Presenting Skills", "تعلّم افتتاح البرامج والانتقال بين الفقرات والتعامل مع الكاميرا.", "Learn program openings, segment transitions, and on-camera delivery."],
    ["news-writing", "كتابة وتقديم النشرات", "Writing and Presenting News", "صغ الخبر بوضوح وتدرّب على قراءة النشرات بأسلوب متوازن.", "Write clear news stories and practice balanced news delivery."],
  ] },
  { key: "content-editing", ar: "المونتاج وصناعة المحتوى", en: "Editing and Content Creation", color: "#54d8c5", icon: '<rect x="55" y="55" width="190" height="140" rx="15"/><path d="M55 95h190M90 55v40M130 55v40M170 55v40M210 55v40M120 120l50 25-50 25zM105 225h90M150 195v30"/>', courses: [
    ["video-editing", "المونتاج من الصفر", "Video Editing from Scratch", "نظّم اللقطات واختر القطع المناسب وأضف العناوين والصوت إلى الفيديو.", "Organize footage, make effective cuts, and add titles and audio."],
    ["short-form-content", "صناعة الريلز والفيديو القصير", "Short-Form Video Creation", "حوّل الأفكار إلى فيديوهات قصيرة عبر سيناريو واضح وإيقاع جذاب.", "Turn ideas into short videos with clear scripts and engaging pacing."],
    ["storytelling", "السرد القصصي للمحتوى الرقمي", "Digital Storytelling", "ابنِ قصة لها بداية مؤثرة وتسلسل واضح ونهاية يتذكرها الجمهور.", "Build stories with strong openings, clear structure, and memorable endings."],
  ] },
  { key: "filmmaking", ar: "الإنتاج والتصوير", en: "Production and Filming", color: "#68aaff", icon: '<rect x="55" y="75" width="190" height="130" rx="18"/><circle cx="150" cy="140" r="42"/><circle cx="150" cy="140" r="23"/><path d="m100 75 15-30h70l15 30M210 100h10"/>', courses: [
    ["camera-basics", "أساسيات التصوير بالكاميرا", "Camera Fundamentals", "افهم التعريض والعدسات وتكوين الكادر لتصوير لقطات أكثر وضوحًا.", "Understand exposure, lenses, and composition for stronger shots."],
    ["studio-lighting", "إضاءة الاستوديو للمبتدئين", "Studio Lighting for Beginners", "طبّق توزيع الإضاءة الأساسي وتعلّم التحكم في الظلال والأجواء.", "Practice basic lighting setups and control shadows and mood."],
    ["production-planning", "تخطيط وإنتاج برنامجك", "Program Production Planning", "جهّز خطة التصوير وجدول العمل واحتياجات فريق الإنتاج.", "Prepare shot plans, production schedules, and crew requirements."],
  ] },
];

const assets = new URL("../public/demo-courses/", import.meta.url);
await mkdir(assets, { recursive: true });
for (const category of categories) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="675" viewBox="0 0 1200 675"><defs><radialGradient id="bg"><stop stop-color="${category.color}" stop-opacity=".22"/><stop offset="1" stop-color="#0a060c"/></radialGradient><pattern id="grid" width="60" height="60" patternUnits="userSpaceOnUse"><path d="M60 0H0V60" fill="none" stroke="${category.color}" stroke-opacity=".08"/></pattern></defs><rect width="1200" height="675" fill="#100811"/><rect width="1200" height="675" fill="url(#bg)"/><rect width="1200" height="675" fill="url(#grid)"/><circle cx="600" cy="300" r="205" fill="none" stroke="${category.color}" stroke-opacity=".18"/><circle cx="600" cy="300" r="170" fill="#100912" stroke="${category.color}" stroke-opacity=".5"/><g transform="translate(450 160)" fill="none" stroke="${category.color}" stroke-width="7" stroke-linecap="round" stroke-linejoin="round">${category.icon}</g><path d="M0 590Q600 380 1200 590M0 630Q600 420 1200 630" fill="none" stroke="${category.color}" stroke-opacity=".22" stroke-width="2"/><text x="600" y="565" text-anchor="middle" font-family="Arial,sans-serif" font-size="28" letter-spacing="6" fill="#ecdfe7">FILSEKA ACADEMY</text><rect x="40" y="32" width="160" height="40" rx="20" fill="#100812" stroke="${category.color}" stroke-opacity=".5"/><text x="120" y="59" text-anchor="middle" font-family="Arial,sans-serif" font-size="17" fill="#ecdfe7">DEMO COURSE</text></svg>`;
  await writeFile(new URL(`${category.key}.svg`, assets), svg, "utf8");
}

const statements = [];
for (const [categoryIndex, category] of categories.entries()) {
  const categoryId = `demo-media-category-${category.key}`;
  const categorySlug = `demo-${category.key}`;
  const image = `/demo-courses/${category.key}.svg`;
  const generatedImage = `/category-artwork/${category.key}.webp`;
  const categoryImage = await access(new URL(`../public${generatedImage}`, import.meta.url)).then(() => generatedImage).catch(() => image);
  statements.push(sql`
    INSERT INTO "Category" (id, name, name_ar, slug, description, image_url, "order")
    VALUES (${categoryId}, ${category.en}, ${category.ar}, ${categorySlug}, ${"قسم تجريبي لاستعراض كورسات الأكاديمية — Demo category."}, ${categoryImage}, ${10 + categoryIndex})
    ON CONFLICT (id) DO NOTHING
  `);
  for (const [index, [key, ar, en, descAr, descEn]] of category.courses.entries()) {
    const courseId = `demo-media-course-${key}`;
    statements.push(sql`
      INSERT INTO "Course" (id, title, title_ar, slug, description, description_en, short_desc, short_desc_en, image_url, price, duration, level, is_published, "order", category_id)
      VALUES (${courseId}, ${en + " (Demo)"}, ${ar + " (تجريبي)"}, ${"demo-" + key}, ${"كورس تجريبي لعرض تصميم المنصة، وليست برنامجًا تدريبيًا فعليًا. " + descAr}, ${"Demo content for previewing the platform, not a real training program. " + descEn}, ${"محتوى تجريبي: " + descAr}, ${"Demo: " + descEn}, ${image}, 0, ${["2h 30m", "3h 15m", "4h"][index]}, ${index === 2 ? "intermediate" : "beginner"}, true, ${100 + categoryIndex * 3 + index}, ${categoryId})
      ON CONFLICT (id) DO NOTHING
    `);
  }
}
await sql.transaction(statements);
const [counts] = await sql`
  SELECT (SELECT COUNT(*)::int FROM "Category" WHERE id LIKE 'demo-media-category-%') AS categories,
         (SELECT COUNT(*)::int FROM "Course" WHERE id LIKE 'demo-media-course-%') AS courses
`;
console.log("Demo academy content ready:", counts);
