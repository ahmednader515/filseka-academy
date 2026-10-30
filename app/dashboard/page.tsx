import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
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
import { StudentDashboard } from "./StudentDashboard";
import { AdminDashboard } from "./AdminDashboard";
import { TeacherDashboard } from "./TeacherDashboard";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const isAdmin = session.user.role === "ADMIN";
  const isStudent = session.user.role === "STUDENT";
  const isTeacher = session.user.role === "TEACHER";

  if (isTeacher) {
    const myCourses = await getCoursesWithCountsForCreator(session.user.id).catch(() => []);
    return <TeacherDashboard courses={myCourses.map((course) => ({
      id: String(course.id),
      title: String(course.title ?? ""),
      titleAr: String(course.titleAr ?? course.title_ar ?? ""),
      published: Boolean(course.isPublished ?? course.is_published ?? false),
      lessons: Number(course.lessonsCount ?? 0),
      enrollments: Number(course.enrollmentsCount ?? 0),
    }))} />;
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
