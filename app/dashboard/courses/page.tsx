import { getServerSession } from "next-auth";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { authOptions } from "@/lib/auth";
import { getCoursesWithCounts, getCoursesWithCountsForCreator, getUsersByRole } from "@/lib/db";
import { getServerTranslator } from "@/lib/i18n/server";
import { CoursesManageList } from "./CoursesManageList";

export default async function DashboardCoursesPage({ searchParams }: { searchParams: Promise<{ teacherId?: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
  const role = session.user.role;
  if (role !== "ADMIN" && role !== "ASSISTANT_ADMIN" && role !== "TEACHER") {
    redirect("/dashboard");
  }
  const t = await getServerTranslator();
  const teachers = role === "ADMIN" ? await getUsersByRole("TEACHER") : [];
  const { teacherId: requestedTeacherId } = await searchParams;
  const teacherId = role === "ADMIN" ? requestedTeacherId : undefined;
  const teacher = teachers.find((teacher) => teacher.id === teacherId);
  if (teacherId && !teacher) notFound();
  const createHref = teacherId ? `/dashboard/courses/new?teacherId=${encodeURIComponent(teacherId)}` : "/dashboard/courses/new";

  const courses =
    role === "TEACHER"
      ? await getCoursesWithCountsForCreator(session.user.id)
      : teacherId ? await getCoursesWithCountsForCreator(teacherId) : await getCoursesWithCounts();

  const coursesPlain = courses.map((c) => {
    const row = c as Record<string, unknown>;
    const cat = row.category as { id: string; name: string; nameAr?: string | null; slug: string } | null | undefined;
    const rawImg = row.imageUrl ?? row.image_url;
    const imageUrl: string | null = rawImg !== null && rawImg !== undefined && typeof rawImg === "string" ? rawImg : null;
    return {
      id: String(row.id ?? ""),
      title: String(row.title ?? ""),
      titleAr: String(row.titleAr ?? row.title_ar ?? ""),
      slug: String(row.slug ?? ""),
      isPublished: Boolean(row.isPublished ?? row.is_published ?? false),
      price: Number(row.price ?? 0),
      imageUrl,
      lessonsCount: Number(row.lessonsCount ?? 0),
      enrollmentsCount: Number(row.enrollmentsCount ?? 0),
      category: cat
        ? { id: cat.id, name: cat.name, nameAr: cat.nameAr ?? null }
        : null,
    };
  });

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <h2 className="text-xl font-bold text-[var(--color-foreground)]">
          {teacher ? `${t("dashboard.teachersAdmin.manageContent")}: ${teacher.name}` : role === "TEACHER" ? t("dashboard.coursesRoutePage.titleTeacher") : t("dashboard.coursesRoutePage.titleStaff")}
        </h2>
        <Link
          href={createHref}
          className="rounded-[var(--radius-btn)] bg-[var(--color-primary)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--color-primary-hover)]"
        >
          {t("dashboard.coursesRoutePage.createCourse")}
        </Link>
      </div>
      {role === "ADMIN" && (
        <form className="mb-6 flex flex-wrap items-end gap-3" action="/dashboard/courses">
          <label className="text-sm font-medium">
            {t("dashboard.coursesRoutePage.teacherFilter")}
            <select name="teacherId" defaultValue={teacherId ?? ""} className="mt-1 block rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2">
              <option value="">{t("dashboard.coursesRoutePage.allTeachers")}</option>
              {teachers.map((teacher) => <option key={teacher.id} value={teacher.id}>{teacher.name} ({teacher.email})</option>)}
            </select>
          </label>
          <button type="submit" className="rounded-[var(--radius-btn)] border border-[var(--color-border)] px-4 py-2 text-sm">{t("dashboard.coursesRoutePage.showContent")}</button>
        </form>
      )}
      {teacher && <p className="mb-4 text-sm text-[var(--color-muted)]">{t("dashboard.coursesRoutePage.teacherContentHelp")}</p>}
      <CoursesManageList courses={coursesPlain} createHref={createHref} />
    </div>
  );
}
