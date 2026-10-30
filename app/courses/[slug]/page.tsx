import { notFound } from "next/navigation";
import Link from "next/link";
import { unstable_noStore } from "next/cache";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import {
  getCourseWithContent,
  getEnrollment,
  getAllowedLessonIdsForUserCourse,
  getAllowedQuizIdsForUserCourse,
  getUserById,
  getLiveStreamsByCourseId,
  hasFullCourseAccessAsStudent,
  userHasActivePlatformSubscriptionForPaidCourse,
  getLatestPlatformSubscriptionExpiry,
} from "@/lib/db";
import { EnrollButton } from "./EnrollButton";
import { CoursePageActions } from "./CoursePageActions";
import { CourseCompletion } from "@/components/CourseCompletion";
import { getLocaleFromCookie, getServerTranslator } from "@/lib/i18n/server";
import { pickLocalizedText } from "@/lib/i18n/localized-field";

type Props = { params: Promise<{ slug: string }> };

/** عدم التخزين المؤقت — دائماً التحقق من وجود الكورس (تجنب 404 للكورسات المحذوفة) */
export const dynamic = "force-dynamic";
export const revalidate = 0;

function isCourseId(segment: string): boolean {
  return /^c[a-z0-9]{24}$/i.test(segment);
}

function decodeSlug(segment: string): string {
  try {
    return decodeURIComponent(segment);
  } catch {
    return segment;
  }
}

/** توحيد الـ slug في الروابط (إزالة الشرطات الزائدة) ليتطابق مع صفحة الاختبار على Vercel */
function normalizeSlugForUrl(s: string | null | undefined): string {
  if (!s || !s.trim()) return "";
  return s.trim().replace(/-+$/, "").replace(/^-+/, "");
}

export async function generateMetadata({ params }: Props) {
  const [t, locale] = await Promise.all([getServerTranslator(), getLocaleFromCookie()]);
  const { slug: segment } = await params;
  unstable_noStore();
  const decoded = decodeSlug(segment);
  const data = await getCourseWithContent(decoded);
  const course = data?.course;
  if (!course) return { title: t("courses.notFoundCourse", "Course not found") };
  const courseTitle = pickLocalizedText(
    locale,
    (course as { titleAr?: string | null; title?: string | null }).titleAr ?? null,
    (course as { title?: string | null }).title ?? null,
  );
  const courseDescription = pickLocalizedText(
    locale,
    (course as { shortDesc?: string | null; description?: string | null }).shortDesc ??
      (course as { description?: string | null }).description ??
      null,
    (course as { shortDescEn?: string | null; short_desc_en?: string | null }).shortDescEn ??
      (course as { short_desc_en?: string | null }).short_desc_en ??
      null,
  );
  return {
    title: `${courseTitle} | ${t("footer.defaultTitle", "My Learning Platform")}`,
    description: courseDescription,
  };
}

export default async function CoursePage({ params }: Props) {
  unstable_noStore();
  const t = await getServerTranslator();
  const locale = await getLocaleFromCookie();
  const { slug: segment } = await params;
  const decoded = decodeSlug(segment);
  const session = await getServerSession(authOptions);
  let data: Awaited<ReturnType<typeof getCourseWithContent>> = null;
  let isEnrolled = false;
  let allowedLessonIds: string[] = [];
  let allowedQuizIds: string[] = [];
  let userBalance = 0;
  let hasFullStudentAccess = false;
  let paidCourseCoveredBySubscription = false;
  let subscriptionExpiresAt: Date | null = null;
  try {
    data = await getCourseWithContent(decoded);
    if (data?.course && session?.user?.id && session.user.role === "STUDENT") {
      const [en, user, lessons, quizzes, fullAccess, subPaid] = await Promise.all([
        getEnrollment(session.user.id, data.course.id),
        getUserById(session.user.id),
        getAllowedLessonIdsForUserCourse(session.user.id, data.course.id),
        getAllowedQuizIdsForUserCourse(session.user.id, data.course.id),
        hasFullCourseAccessAsStudent(session.user.id, data.course.id),
        userHasActivePlatformSubscriptionForPaidCourse(session.user.id, data.course.id),
      ]);
      isEnrolled = !!en;
      if (!isEnrolled) {
        allowedLessonIds = lessons;
        allowedQuizIds = quizzes;
      }
      userBalance = Number(user?.balance) || 0;
      hasFullStudentAccess = fullAccess;
      paidCourseCoveredBySubscription = subPaid && !isEnrolled;
      if (paidCourseCoveredBySubscription) {
        subscriptionExpiresAt = await getLatestPlatformSubscriptionExpiry(session.user.id);
      }
    }
  } catch {
    notFound();
  }
  if (!data?.course) notFound();

  const course = {
    ...data.course,
    lessons: data.lessons,
    quizzes: data.quizzes,
  };
  const title = pickLocalizedText(
    locale,
    (course as { titleAr?: string | null; title?: string | null }).titleAr ?? null,
    (course as { title?: string | null }).title ?? null,
  );
  const categoryName = pickLocalizedText(
    locale,
    (course.category as { nameAr?: string | null; name?: string | null })?.nameAr ?? null,
    (course.category as { name?: string | null })?.name ?? null,
  );
  const courseDescription = pickLocalizedText(
    locale,
    (course as { description?: string | null }).description ?? null,
    (course as { descriptionEn?: string | null; description_en?: string | null }).descriptionEn ??
      (course as { description_en?: string | null }).description_en ??
      null,
  );
  const canEnroll =
    session?.user?.role === "STUDENT" && !isEnrolled && !paidCourseCoveredBySubscription;
  const hasPartialAccess = allowedLessonIds.length > 0 || allowedQuizIds.length > 0;
  const isStaff = session?.user?.role === "ADMIN" || session?.user?.role === "ASSISTANT_ADMIN";
  const canAccessContent =
    isStaff || hasPartialAccess || (session?.user?.role === "STUDENT" && hasFullStudentAccess);
  const canAccessQuizzes = isStaff || (session?.user?.role === "STUDENT" && hasFullStudentAccess);
  const coursePrice = Number((course as Record<string, unknown>).price) || 0;
  const courseRecord = course as Record<string, unknown>;
  const imageValue = courseRecord.imageUrl ?? courseRecord.image_url;
  const courseImageUrl = typeof imageValue === "string" && imageValue.trim() ? imageValue.trim() : null;
  const courseDuration = typeof courseRecord.duration === "string" ? courseRecord.duration : null;
  const courseLevel = String(courseRecord.level ?? "").toLowerCase();
  const courseLevelLabel = courseLevel === "beginner"
    ? t("common.beginner", "Beginner")
    : courseLevel === "intermediate"
      ? t("common.intermediate", "Intermediate")
      : courseLevel === "advanced"
        ? t("common.advanced", "Advanced")
        : null;
  const categorySlug = String((course.category as Record<string, unknown> | null)?.slug ?? "").trim();

  const liveStreams = canAccessContent ? await getLiveStreamsByCourseId(course.id) : [];
  const instructor = course.created_by_id ? await getUserById(course.created_by_id).catch(() => null) : null;
  const instructorName = instructor?.role === "TEACHER" ? instructor.name : "Filseka Academy";
  const formatStreamDate = (d: Date | string) => {
    const date = typeof d === "string" ? new Date(d) : d;
    return new Intl.DateTimeFormat(locale === "ar" ? "ar-EG" : "en-US", { dateStyle: "medium", timeStyle: "short" }).format(date);
  };

  const isGuest = !session;

  return (
    <div className="course-detail-page relative isolate min-h-screen overflow-hidden bg-black text-white">
      {courseImageUrl ? (
        <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[760px] overflow-hidden" aria-hidden="true">
          <img src={courseImageUrl} alt="" className="h-full w-full scale-110 object-cover opacity-40 blur-3xl" />
          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(12,8,9,0.32)_0%,rgba(5,5,5,0.84)_68%,#050505_100%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_70%_10%,rgba(225,29,46,0.2),transparent_48%)]" />
        </div>
      ) : null}

      <div className="mx-auto w-full max-w-[1200px] px-4 pb-16 pt-8 sm:px-6 sm:pt-12" style={{ maxWidth: "1200px" }}>
      <Link href="/courses" className="inline-flex items-center gap-2 text-sm font-medium text-white/70 transition hover:text-white">
        <span aria-hidden="true">{locale === "ar" ? "→" : "←"}</span>{t("common.backToCourses", "Back to courses")}
      </Link>

      <div className="mt-5 grid gap-6 lg:grid-cols-[340px_minmax(0,1fr)] lg:gap-7" dir="ltr">
        <aside className="order-2 self-start rounded-xl border border-white/10 bg-[#0b0b0b]/95 p-5 shadow-2xl backdrop-blur sm:p-6 lg:order-1 lg:sticky lg:top-24" dir={locale === "ar" ? "rtl" : "ltr"}>
          {categoryName ? (
            <div className="mb-3">
              {categorySlug ? (
                <Link href={`/courses?category=${encodeURIComponent(categorySlug)}`} className="text-sm font-semibold text-sky-300 hover:text-sky-200 hover:underline">{categoryName}</Link>
              ) : <span className="text-sm font-semibold text-sky-300">{categoryName}</span>}
            </div>
          ) : null}
          <h1 className="text-2xl font-bold leading-snug text-white sm:text-[27px]">{title}</h1>
          {session?.user.role === "STUDENT" && (isEnrolled || hasFullStudentAccess || allowedLessonIds.length > 0) && <CourseCompletion courseId={course.id} />}
          <p className="mt-3 text-sm text-white/65">{locale === "ar" ? "بواسطة " : "By "}<span className="font-semibold text-sky-300">{instructorName}</span></p>
          {categoryName ? (
            <div className="mt-1 text-sm">
              {categorySlug ? <Link href={`/courses?category=${encodeURIComponent(categorySlug)}`} className="text-red-300 underline decoration-red-300/70 underline-offset-4">{locale === "ar" ? "الكورسات التدريبية" : "Courses"}</Link> : <span className="text-red-300 underline underline-offset-4">{categoryName}</span>}
            </div>
          ) : null}

          <ul className="mt-5 space-y-2.5 border-t border-white/10 pt-4 text-sm text-white/75">
            {courseDuration ? <li className="flex items-center justify-between gap-3"><span>{locale === "ar" ? "مدة الكورس" : "Course duration"}</span><span>{courseDuration}</span></li> : null}
            <li className="flex items-center justify-between gap-3"><span>{locale === "ar" ? "عدد الدروس" : "Lessons"}</span><span>{course.lessons.length}</span></li>
            {courseLevelLabel ? <li className="flex items-center justify-between gap-3"><span>{locale === "ar" ? "المستوى" : "Level"}</span><span>{courseLevelLabel}</span></li> : null}
          </ul>

          <div className="mt-5 border-t border-white/10 pt-4">
            {coursePrice > 0 ? (
              <p className="mb-3 text-center text-sm text-white/70">
                {locale === "ar" ? "اشترِ الكورس لمرة واحدة مقابل" : "Get lifetime access for"} <strong className="text-lg text-white">{coursePrice.toFixed(2)} {locale === "ar" ? t("common.egpShortAr", "ج.م") : t("common.egyptianPoundShort", "EGP")}</strong>
              </p>
            ) : <p className="mb-3 text-center text-sm font-semibold text-emerald-300">{locale === "ar" ? "كورس مجاني" : "Free course"}</p>}
            {canEnroll ? <EnrollButton courseId={course.id} coursePrice={coursePrice} userBalance={userBalance} /> : null}
            {isGuest ? (
              <div className="grid gap-2">
                <Link href={`/login?callbackUrl=${encodeURIComponent(`/courses/${decodeURIComponent(segment)}`)}`} className="inline-flex min-h-11 items-center justify-center rounded-md bg-[var(--color-primary)] px-4 text-sm font-bold text-white transition hover:bg-[var(--color-primary-hover)]">{locale === "ar" ? "اشترك الآن" : "Enroll now"}</Link>
                <p className="text-center text-xs leading-5 text-white/55">{t("courses.enrollLoginPrompt", "Log in or create an account to view this course content and enroll.")}</p>
                <Link href={`/register?callbackUrl=${encodeURIComponent(`/courses/${decodeURIComponent(segment)}`)}`} className="text-center text-xs font-semibold text-white/75 underline underline-offset-4 hover:text-white">{t("header.register", "Create account")}</Link>
              </div>
            ) : null}
            {isEnrolled ? <p className="rounded-md bg-emerald-500/10 px-3 py-2 text-center text-sm text-emerald-300">✓ {t("courses.youAreEnrolled", "You are enrolled in this course.")} <Link href="/dashboard" className="underline">{t("dashboard.title", "Dashboard")}</Link></p> : null}
            {paidCourseCoveredBySubscription && subscriptionExpiresAt ? (
              <p className="mt-3 rounded-md border border-teal-500/40 bg-teal-500/10 px-3 py-2 text-xs leading-5 text-teal-100">{t("courses.viaPlatformSubscription", "You are viewing this course through platform subscription until")} {new Intl.DateTimeFormat(locale === "ar" ? "ar-EG" : "en-US", { dateStyle: "medium", timeStyle: "short" }).format(subscriptionExpiresAt)}.</p>
            ) : null}
            {hasPartialAccess && !isEnrolled && !hasFullStudentAccess ? <p className="mt-3 rounded-md border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-xs leading-5 text-amber-100">{t("courses.partialAccessInfo", "This course is available to you through a code that unlocks specific lessons/quizzes.")}</p> : null}
          </div>
          <CoursePageActions courseId={course.id} />
        </aside>

        <article className="order-1 min-w-0 lg:order-2" dir={locale === "ar" ? "rtl" : "ltr"}>
          <div className="course-detail-cover relative aspect-video w-full overflow-hidden rounded-xl bg-[#111] shadow-2xl">
            {courseImageUrl ? (
              <img src={courseImageUrl} alt={title} className="h-full w-full object-cover" fetchPriority="high" />
            ) : (
              <div className="grid h-full w-full place-items-center bg-[radial-gradient(ellipse_at_70%_15%,#51131b_0%,#171010_48%,#0a0a0a_100%)] text-6xl opacity-70" aria-hidden="true">📚</div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-black/10" aria-hidden="true" />
          </div>

          <div className="mt-5 rounded-xl border border-white/10 bg-[#0b0b0b]/90 p-5 sm:p-7">
            <div className="flex flex-wrap items-center gap-2">
              {categoryName ? <span className="rounded-full border border-sky-400/60 px-3 py-1 text-xs text-sky-300">{categoryName}</span> : null}
              {courseLevelLabel ? <span className="rounded-full border border-sky-400/60 px-3 py-1 text-xs text-sky-300">{courseLevelLabel}</span> : null}
              {courseDuration ? <span className="rounded-full border border-sky-400/60 px-3 py-1 text-xs text-sky-300">{courseDuration}</span> : null}
            </div>

            <h2 className="mt-7 text-2xl font-bold text-white">{locale === "ar" ? "ماذا ستتعلم" : "What you’ll learn"}</h2>
            {course.lessons.length > 0 ? (
              <ul className="mt-5 grid gap-x-8 gap-y-3 sm:grid-cols-2">
                {course.lessons.slice(0, 6).map((lesson) => {
                  const lessonRecord = lesson as Record<string, unknown>;
                  const lessonTitle = pickLocalizedText(locale, String(lessonRecord.titleAr ?? lessonRecord.title_ar ?? ""), String(lessonRecord.title ?? ""));
                  return <li key={String(lessonRecord.id)} className="flex items-start gap-3 text-sm leading-7 text-white/70"><span className="mt-1 text-lg leading-6 text-white/60" aria-hidden="true">✓</span><span>{lessonTitle}</span></li>;
                })}
              </ul>
            ) : null}

            <div className="mt-7 border-t border-white/10 pt-6">
              <h2 className="text-xl font-bold text-white">{locale === "ar" ? "عن الكورس" : "About this course"}</h2>
              <div className="prose-custom mt-3 text-sm leading-7 text-white/70"><p>{courseDescription}</p></div>
            </div>

            {liveStreams.length > 0 && (
              <div className="mt-8">
                <h2 className="text-xl font-semibold text-[var(--color-foreground)]">
                  {t("courses.liveStreams", "Live streams")}
                </h2>
                <ul className="mt-4 space-y-3">
                  {(liveStreams as unknown as Record<string, unknown>[]).map((ls) => (
                    <li
                      key={String(ls.id)}
                      className="flex flex-wrap items-center justify-between gap-2 rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-background)] p-4"
                    >
                      <div>
                        <span className="font-medium text-[var(--color-foreground)]">
                          {String(ls.title_ar ?? ls.titleAr ?? ls.title ?? "")}
                        </span>
                        <span className="mr-2 text-sm text-[var(--color-muted)]">
                          {ls.provider === "google_meet" ? "Google Meet" : "Zoom"} — {formatStreamDate((ls.scheduled_at ?? ls.scheduledAt) as string | Date || new Date())}
                        </span>
                      </div>
                      <a
                        href={String(ls.meeting_url ?? ls.meetingUrl ?? "#")}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="rounded-[var(--radius-btn)] bg-[var(--color-primary)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--color-primary-hover)]"
                      >
                        {t("courses.joinStream", "Join stream")}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {course.lessons.length > 0 && (
              <div className="mt-10">
                <h2 className="text-xl font-semibold text-[var(--color-foreground)]">
                  {t("courses.courseContent", "Course content")} ({course.lessons.length} {t("courses.lessonsCount", "lessons")})
                </h2>
                <ul className="mt-4 space-y-2">
                  {(hasPartialAccess && !isEnrolled && !isStaff
                    ? course.lessons.filter((l) => allowedLessonIds.includes(String((l as Record<string, unknown>).id ?? l.id)))
                    : course.lessons
                  ).map((lesson, i) => {
                    const lessonClassName = `flex items-center gap-3 rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-background)] p-3 ${canAccessContent ? "transition hover:border-[var(--color-primary)]/30" : ""}`;
                    const content = (
                      <>
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--color-primary)]/20 text-sm font-medium text-[var(--color-primary)]">
                          {i + 1}
                        </span>
                        <div className="min-w-0 flex-1">
                          <span className="font-medium text-[var(--color-foreground)]">
                            {String((lesson as Record<string, unknown>).titleAr ?? (lesson as Record<string, unknown>).title ?? "")}
                          </span>
                          {(lesson as Record<string, unknown>).duration ? (
                            <span className="mr-2 text-sm text-[var(--color-muted)]">
                              • {String((lesson as Record<string, unknown>).duration)} {t("courses.minutes", "minutes")}
                            </span>
                          ) : null}
                          {(lesson as Record<string, unknown>).videoUrl && canAccessContent ? (
                            <span className="mr-2 text-xs text-[var(--color-primary)]">▶ {t("courses.videoTag", "Video")}</span>
                          ) : null}
                        </div>
                      </>
                    );
                    const courseSlugOrId = String((course as Record<string, unknown>).slug ?? "").trim() || String((course as Record<string, unknown>).id ?? course.id);
                    const lessonSlugOrId = (lesson as Record<string, unknown>).slug && String((lesson as Record<string, unknown>).slug).trim()
                      ? encodeURIComponent(String((lesson as Record<string, unknown>).slug).trim())
                      : String((lesson as Record<string, unknown>).id ?? lesson.id);
                    return (
                      <li key={String(lesson.id)}>
                        {canAccessContent ? (
                          <Link
                            href={`/courses/${courseSlugOrId}/lessons/${lessonSlugOrId}`}
                            className={lessonClassName}
                          >
                            {content}
                          </Link>
                        ) : (
                          <div className={lessonClassName}>
                            {content}
                          </div>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}

            {course.quizzes && course.quizzes.length > 0 && (
              <div className="mt-10">
                <h2 className="text-xl font-semibold text-[var(--color-foreground)]">
                  {t("courses.quizzes", "Quizzes")} ({course.quizzes.length})
                </h2>
                <ul className="mt-4 space-y-2">
                  {course.quizzes.map((quiz, i) => {
                    const q = quiz as Record<string, unknown> & { _count?: { questions?: number } };
                    const questionsCount = q._count?.questions ?? 0;
                    return (
                    <li key={String(q.id)}>
                      {canAccessQuizzes ? (
                        <Link
                          href={`/courses/${encodeURIComponent(normalizeSlugForUrl(String((course as Record<string, unknown>).slug ?? "")) || String((course as Record<string, unknown>).id ?? course.id))}/quizzes/${String(q.id)}`}
                          className="flex items-center justify-between rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-background)] p-4 transition hover:border-[var(--color-primary)]/30"
                        >
                          <span className="font-medium text-[var(--color-foreground)]">{String(q.title ?? "")}</span>
                          <span className="text-sm text-[var(--color-muted)]">{questionsCount} {t("courses.questions", "questions")}</span>
                        </Link>
                      ) : (
                        <div className="flex items-center justify-between rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-background)] p-4 opacity-75">
                          <span className="font-medium text-[var(--color-foreground)]">{String(q.title ?? "")}</span>
                          <span className="text-sm text-[var(--color-muted)]">{questionsCount} {t("courses.questions", "questions")}</span>
                        </div>
                      )}
                    </li>
                  );})}
                </ul>
              </div>
            )}
          </div>
        </article>
      </div>
    </div>
    </div>
  );
}
