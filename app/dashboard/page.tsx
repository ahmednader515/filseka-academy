import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { authOptions } from "@/lib/auth";
import {
  getUserById,
  getAccessibleCoursesForUser,
  countUsersByRole,
  countCourses,
  getAllQuizAttemptsForAdmin,
  getTotalPlatformEarnings,
  getCoursesWithCountsForCreator,
  getSubscriptionsFeatureEnabled,
  listActiveSubscriptionPlansPublic,
  listStudentStorePurchases,
  userHasActivePlatformSubscription,
  getLatestPlatformSubscriptionExpiry,
} from "@/lib/db";
import { getServerTranslator } from "@/lib/i18n/server";
import { StudentDashboard } from "./StudentDashboard";
import { AdminDashboard } from "./AdminDashboard";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
  const t = await getServerTranslator();

  const isAdmin = session.user.role === "ADMIN";
  const isStudent = session.user.role === "STUDENT";
  const isTeacher = session.user.role === "TEACHER";

  if (isTeacher) {
    const myCourses = await getCoursesWithCountsForCreator(session.user.id).catch(() => []);
    const publishedCount = myCourses.filter((c) => {
      const row = c as Record<string, unknown>;
      return Boolean(row.isPublished ?? row.is_published ?? false);
    }).length;

    return (
      <div className="space-y-8">
        <div className="rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-[var(--shadow-card)]">
          <h2 className="text-lg font-semibold text-[var(--color-foreground)]">
            {t("dashboard.page.greetingComma", "Welcome,")} {session.user.name}
          </h2>
          <p className="mt-2 text-sm text-[var(--color-muted)]">
            {t(
              "dashboard.page.teacherIntro",
              "Teacher dashboard: manage your courses, enrolled students, homework, live streams, and activation codes from the menu above.",
            )}
          </p>
        </div>
        <div>
          <h2 className="mb-4 text-lg font-semibold text-[var(--color-foreground)]">
            {t("dashboard.page.shortcutsTitle", "Shortcuts")}
          </h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <Link
              href="/dashboard/courses"
              className="flex min-h-[160px] flex-col justify-center rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 text-center transition hover:border-[var(--color-primary)]/30"
            >
              <h3 className="font-semibold text-[var(--color-foreground)]">
                {t("dashboard.page.myCoursesTitle", "My courses")}
              </h3>
              <p className="mt-1 text-2xl font-bold text-[var(--color-primary)]">{myCourses.length}</p>
              <p className="mt-1 text-sm text-[var(--color-muted)]">
                {t("dashboard.page.publishedLabel", "Published:")} {publishedCount}
              </p>
            </Link>
            <Link
              href="/dashboard/profile"
              className="flex min-h-[160px] flex-col justify-center rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 text-center transition hover:border-[var(--color-primary)]/30"
            >
              <h3 className="font-semibold text-[var(--color-foreground)]">
                {t("dashboard.page.editProfileTitle", "Edit profile")}
              </h3>
              <p className="mt-1 text-sm text-[var(--color-muted)]">
                {t(
                  "dashboard.page.editProfileDesc",
                  "Name, password, photo, and subject shown to students",
                )}
              </p>
            </Link>
            <Link
              href="/dashboard/statistics"
              className="flex min-h-[160px] flex-col justify-center rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 text-center transition hover:border-[var(--color-primary)]/30"
            >
              <h3 className="font-semibold text-[var(--color-foreground)]">
                {t("dashboard.page.studentStatisticsTitle", "Student statistics")}
              </h3>
              <p className="mt-1 text-sm text-[var(--color-muted)]">
                {t(
                  "dashboard.page.studentStatisticsDesc",
                  "Quiz scores and enrollments in your courses",
                )}
              </p>
            </Link>
            <Link
              href="/dashboard/messages"
              className="flex min-h-[160px] flex-col justify-center rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 text-center transition hover:border-[var(--color-primary)]/30"
            >
              <h3 className="font-semibold text-[var(--color-foreground)]">
                {t("dashboard.page.contactStudentsTitle", "Contact students")}
              </h3>
              <p className="mt-1 text-sm text-[var(--color-muted)]">
                {t("dashboard.page.contactStudentsDesc", "Students enrolled in your courses")}
              </p>
            </Link>
            <Link
              href="/dashboard/homework"
              className="flex min-h-[160px] flex-col justify-center rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 text-center transition hover:border-[var(--color-primary)]/30"
            >
              <h3 className="font-semibold text-[var(--color-foreground)]">
                {t("dashboard.page.receiveHomeworkTitle", "Collect homework")}
              </h3>
              <p className="mt-1 text-sm text-[var(--color-muted)]">
                {t("dashboard.page.receiveHomeworkDesc", "Submissions for your courses")}
              </p>
            </Link>
            <Link
              href="/dashboard/live-streams"
              className="flex min-h-[160px] flex-col justify-center rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 text-center transition hover:border-[var(--color-primary)]/30"
            >
              <h3 className="font-semibold text-[var(--color-foreground)]">
                {t("dashboard.page.liveStreamsCardTitle", "Live streams")}
              </h3>
              <p className="mt-1 text-sm text-[var(--color-muted)]">
                {t("dashboard.page.liveStreamsCardDesc", "Link Zoom or Meet to your courses")}
              </p>
            </Link>
            <Link
              href="/dashboard/codes"
              className="flex min-h-[160px] flex-col justify-center rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 text-center transition hover:border-[var(--color-primary)]/30"
            >
              <h3 className="font-semibold text-[var(--color-foreground)]">
                {t("dashboard.page.activationCodesTitle", "Activation codes")}
              </h3>
              <p className="mt-1 text-sm text-[var(--color-muted)]">
                {t("dashboard.page.activationCodesSubtitle", "For your courses only")}
              </p>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (isStudent) {
    const user = await getUserById(session.user.id);
    const enrolledCourses = user ? await getAccessibleCoursesForUser(session.user.id) : [];
    const balance = user ? Number(user.balance) : 0;

    let subscriptionsFeature = false;
    let subscriptionPlansForStudent: Awaited<ReturnType<typeof listActiveSubscriptionPlansPublic>> = [];
    let studentHasActiveSub = false;
    let studentSubExpiresIso: string | null = null;
    let storePurchases: Awaited<ReturnType<typeof listStudentStorePurchases>> = [];
    try {
      subscriptionsFeature = await getSubscriptionsFeatureEnabled();
      if (subscriptionsFeature) {
        subscriptionPlansForStudent = await listActiveSubscriptionPlansPublic();
        studentHasActiveSub = await userHasActivePlatformSubscription(session.user.id);
        const exp = studentHasActiveSub ? await getLatestPlatformSubscriptionExpiry(session.user.id) : null;
        studentSubExpiresIso = exp ? exp.toISOString() : null;
      }
      storePurchases = await listStudentStorePurchases(session.user.id).catch(() => []);
    } catch {
      subscriptionsFeature = false;
    }

    return <StudentDashboard
      userId={session.user.id}
      userName={session.user.name || ""}
      balance={balance}
      courses={enrolledCourses}
      purchases={storePurchases}
      subscriptionsEnabled={subscriptionsFeature}
      plans={subscriptionPlansForStudent}
      hasActiveSubscription={studentHasActiveSub}
      subscriptionExpiry={studentSubExpiresIso}
    />;
  }
  const [studentsCount, coursesCount, quizAttempts, totalEarnings] = await Promise.all([
    countUsersByRole("STUDENT"),
    countCourses(),
    getAllQuizAttemptsForAdmin().catch(() => []),
    getTotalPlatformEarnings(),
  ]);

  return <AdminDashboard
    isAdmin={isAdmin}
    studentsCount={studentsCount}
    coursesCount={coursesCount}
    quizAttemptsCount={quizAttempts.length}
    totalEarnings={totalEarnings}
  />;
}
