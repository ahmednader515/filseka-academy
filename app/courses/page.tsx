import { unstable_noStore } from "next/cache";
import { getCategories, getCoursesPublished, getTeacherIdsExcludedFromPublicCourseLists, getUserById } from "@/lib/db";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { AcademyIcon } from "@/components/AcademyIcon";
import { TeacherCoursesSearch, type TeacherCourseListItem } from "./TeacherCoursesSearch";
import { getLocaleFromCookie, getServerTranslator } from "@/lib/i18n/server";
import { pickLocalizedText } from "@/lib/i18n/localized-field";

/** عدم تخزين الصفحة مؤقتاً — الكورسات الجديدة والمحذوفة تظهر فوراً */
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function generateMetadata() {
  const t = await getServerTranslator();
  return {
    title: `${t("common.courses", "Courses")} | ${t("footer.defaultTitle", "My Learning Platform")}`,
    description: t("courses.allCoursesSubtitle", "Choose the right course and start learning step by step"),
  };
}

type Props = { searchParams: Promise<{ category?: string; teacher?: string; q?: string }> };

export default async function CoursesPage({ searchParams }: Props) {
  unstable_noStore();
  const [t, locale] = await Promise.all([getServerTranslator(), getLocaleFromCookie()]);
  const { category: categorySlug, teacher: teacherId, q } = await searchParams;
  let courses: Awaited<ReturnType<typeof getCoursesPublished>> = [];
  try {
    courses = await getCoursesPublished(true);
  } catch {
    // DB not connected
  }

  const hideTeacherCreators = await getTeacherIdsExcludedFromPublicCourseLists();
  const categories = await getCategories().catch(() => []);
  const selectedCategory = categories.find((category) => category.slug === categorySlug?.trim());
  if (categorySlug?.trim() && !selectedCategory) notFound();
  const ar = locale === "ar";
  const localizedCategoryName = (category: typeof categories[number]) => pickLocalizedText(locale,
    (category as typeof category & { nameAr?: string | null }).nameAr ?? category.name_ar, category.name);

  let teacherName: string | null = null;
  const tid = teacherId?.trim();
  if (tid) {
    const u = await getUserById(tid).catch(() => null);
    if (!u || u.role !== "TEACHER") {
      redirect("/courses");
    }
    teacherName = u.name ?? null;
  }

  let filtered =
    categorySlug?.trim()
      ? courses.filter((c) => (c as { category?: { slug?: string } }).category?.slug === categorySlug.trim())
      : courses;

  if (tid) {
    filtered = filtered.filter((c) => {
      const row = c as { createdById?: string | null; created_by_id?: string | null };
      const creator = row.createdById ?? row.created_by_id ?? null;
      return creator === tid;
    });
  } else if (hideTeacherCreators.size > 0) {
    filtered = filtered.filter((c) => {
      const row = c as { createdById?: string | null; created_by_id?: string | null };
      const creator = row.createdById ?? row.created_by_id ?? null;
      return !creator || !hideTeacherCreators.has(creator);
    });
  }

  const categoryName =
    selectedCategory
      ? localizedCategoryName(selectedCategory)
      : null;

  const pageTitle = teacherName
    ? `${t("courses.teacherCoursesPrefix", "Courses by")} ${teacherName}`
    : categoryName
      ? categoryName
      : t("courses.allCoursesTitle", "All courses");

  const pageSubtitle = teacherName
    ? t("courses.teacherCoursesSubtitle", "Published courses by this teacher on the platform")
    : categoryName
      ? t("courses.categoryCoursesSubtitle", "Courses for the selected category only")
      : t("courses.allCoursesSubtitle", "Choose the right course and start learning step by step");

  return (
    <div className="academy-course-catalog" dir={ar ? "rtl" : "ltr"}>
      <nav className="academy-catalog-breadcrumb" aria-label={ar ? "مسار التنقل" : "Breadcrumb"}>
        <Link href="/">{ar ? "الرئيسية" : "Home"}</Link><span aria-hidden="true">/</span>
        {categoryName ? <><Link href="/courses">{ar ? "الكورسات" : "Courses"}</Link><span aria-hidden="true">/</span><span aria-current="page">{categoryName}</span></> : <span aria-current="page">{pageTitle}</span>}
      </nav>
      <header className="academy-catalog-hero">
        <div className="academy-catalog-icon"><AcademyIcon name="book" /></div>
        <div><span className="academy-catalog-eyebrow">{ar ? "تعلّم. أبدع. اصنع تأثيرك." : "Learn. Create. Make an impact."}</span>
          <h1>{pageTitle}</h1><p>{pageSubtitle}</p>
        </div>
        <span className="academy-catalog-count"><strong>{filtered.length}</strong>{ar ? "كورس تدريبي" : "courses"}</span>
      </header>
      <nav className="academy-catalog-filters" aria-label={ar ? "أقسام الكورسات" : "Course categories"}>
        <Link href={tid ? `/courses?teacher=${encodeURIComponent(tid)}` : "/courses"} aria-current={!selectedCategory ? "page" : undefined}>{ar ? "جميع الكورسات" : "All courses"}</Link>
        {categories.map((category) => <Link key={category.id} href={`/courses?category=${encodeURIComponent(category.slug)}${tid ? `&teacher=${encodeURIComponent(tid)}` : ""}`} aria-current={selectedCategory?.id === category.id ? "page" : undefined}>{localizedCategoryName(category)}</Link>)}
      </nav>

      {filtered.length > 0 ? (
        <TeacherCoursesSearch
          key={JSON.stringify([categorySlug, teacherId, q])}
          initialQuery={q?.trim() ?? ""}
          courses={filtered as TeacherCourseListItem[]}
          groupByCategory={!!tid}
        />
      ) : (
        <div className="rounded-[var(--radius-card)] border border-dashed border-[var(--color-border)] bg-[var(--color-surface)]/50 p-12 text-center">
          <p className="text-[var(--color-muted)]">
            {tid
              ? t("courses.noTeacherCourses", "No published courses for this teacher right now.")
              : categorySlug?.trim()
                ? t("courses.noCategoryCourses", "No courses in this category right now.")
                : t("courses.noCourses", "No published courses yet. Make sure the database is configured and seed is run.")}
          </p>
        </div>
      )}
    </div>
  );
}
