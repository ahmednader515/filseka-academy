import Image from "next/image";
import Link from "next/link";
import { AcademyIcon } from "@/components/AcademyIcon";
import { getLocaleFromCookie } from "@/lib/i18n/server";
import { pickLocalizedText } from "@/lib/i18n/localized-field";
import { getLessonsByCourseId, getLiveStreamsByCourseId, getAllowedLessonIdsForUserCourse, hasFullCourseAccessAsStudent, type listStudentStorePurchases, type listActiveSubscriptionPlansPublic, type getAccessibleCoursesForUser } from "@/lib/db";
import { MyCoursesSection } from "./MyCoursesSection";
import { ActivateCodeSection } from "./ActivateCodeSection";
import { StudentSubscriptionsPanel } from "./StudentSubscriptionsPanel";
import styles from "./student-dashboard.module.css";

type Props = {
  userId: string; userName: string; balance: number;
  courses: Awaited<ReturnType<typeof getAccessibleCoursesForUser>>;
  purchases: Awaited<ReturnType<typeof listStudentStorePurchases>>;
  subscriptionsEnabled: boolean; plans: Awaited<ReturnType<typeof listActiveSubscriptionPlansPublic>>;
  hasActiveSubscription: boolean; subscriptionExpiry: string | null;
};
function upcomingSessions(streams: Awaited<ReturnType<typeof getLiveStreamsByCourseId>>, locale: "ar" | "en") {
  const now = Date.now();
  return streams.map((stream) => {
    const row = stream as typeof stream & { scheduledAt?: Date | string; titleAr?: string };
    const date = new Date(row.scheduledAt || stream.scheduled_at);
    return { id: stream.id, title: pickLocalizedText(locale, row.titleAr || stream.title_ar, stream.title), date };
  }).filter((stream) => Number.isFinite(stream.date.getTime()) && stream.date.getTime() > now).sort((a, b) => a.date.getTime() - b.date.getTime()).slice(0, 3);
}
export async function StudentDashboard({ userId, userName, balance, courses, purchases, subscriptionsEnabled, plans, hasActiveSubscription, subscriptionExpiry }: Props) {
  const locale = await getLocaleFromCookie();
  const ar = locale === "ar";
  const text = (arabic: string, english: string) => ar ? arabic : english;
  const course = courses[0];
  const courseData = course ? await Promise.all([getLessonsByCourseId(course.id).catch(() => []), getLiveStreamsByCourseId(course.id).catch(() => []), hasFullCourseAccessAsStudent(userId, course.id).catch(() => false), getAllowedLessonIdsForUserCourse(userId, course.id).catch(() => [])]) : null;
  const lessons = courseData?.[0] || [];
  const fullAccess = courseData?.[2] || false;
  const allowedIds = new Set<string>(courseData?.[3] || []);
  const availableLessons = lessons.filter((lesson) => fullAccess || allowedIds.has(lesson.id));
  const courseRow = course as (typeof course & { titleAr?: string; imageUrl?: string; shortDesc?: string }) | undefined;
  const title = course ? pickLocalizedText(locale, courseRow?.titleAr || course.title_ar, course.title) : text("رحلتك تبدأ بخطوة", "Your journey starts with one step");
  const courseHref = course ? `/courses/${encodeURIComponent(course.slug || course.id)}` : "/courses";
  const lessonHref = (lesson: { slug: string; id: string }) => `${courseHref}/lessons/${encodeURIComponent(lesson.slug || lesson.id)}`;
  const firstLesson = availableLessons[0];
  const upcoming = upcomingSessions(courseData?.[1] || [], locale);

  return <div className={styles.dashboard}>
    <header className={styles.welcome}><Image src="/background.png" alt="" fill priority sizes="100vw" /><div><span className={styles.eyebrow}>{text("لوحة تعلمي", "My learning dashboard")}</span><h1>{text("مرحبًا بك", "Welcome")}{userName ? `، ${userName}` : ""} <span aria-hidden="true">👋</span></h1><p>{text("كل ما تحتاجه لخطوتك القادمة في عالم الإعلام، في مكان واحد.", "Everything you need for your next step in media, in one place.")}</p></div></header>

    <div className={styles.overviewGrid}>
      <section className={styles.courseHero} aria-labelledby="student-course-title"><div className={styles.courseCopy}><span className={styles.courseBadge}><AcademyIcon name="graduate" />{course ? text("من كورساتك المتاحة", "From your available courses") : text("ابدأ التعلّم", "Start learning")}</span><h2 id="student-course-title">{title}</h2><p>{courseRow?.shortDesc || course?.short_desc || text("اختر مجالك أو فعّل كودك لتبدأ رحلتك مع الأكاديمية.", "Choose your field or activate your code to begin with the academy.")}</p>{course && <div className={styles.courseAccess}><span>{text("دروس متاحة في هذا الكورس", "Available lessons in this course")}</span><strong>{availableLessons.length}</strong></div>}<Link href={firstLesson ? lessonHref(firstLesson) : courseHref} className={styles.button}><AcademyIcon name="video" />{firstLesson ? text("افتح الدرس", "Open lesson") : course ? text("افتح الكورس", "Open course") : text("اكتشف الكورسات", "Explore courses")}</Link></div><div className={styles.courseArt}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={courseRow?.imageUrl || course?.image_url || "/category-artwork/presenting.webp"} alt="" />
      </div></section>
      <div className={styles.summary}><div className={styles.stats}>{[{ value: courses.length, label: text("كورس متاح", "available courses"), icon: "video" as const }, { value: availableLessons.length, label: text("درس في الكورس", "course lessons"), icon: "book" as const }, { value: purchases.length, label: text("مشتريات المكتبة", "library purchases"), icon: "layers" as const }].map((stat) => <div key={stat.icon}><AcademyIcon name={stat.icon} /><strong>{stat.value}</strong><span>{stat.label}</span></div>)}</div><section className={styles.balanceCard}><div><AcademyIcon name="layers" /><h2>{text("رصيد حسابك", "Your balance")}</h2></div><strong><bdi>{new Intl.NumberFormat(ar ? "ar-EG" : "en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(balance)}</bdi> <small>{text("ج.م", "EGP")}</small></strong><Link href="/dashboard/add-balance" className={styles.button}>{text("شحن الرصيد", "Add balance")}<span aria-hidden="true">{ar ? "‹" : "›"}</span></Link></section></div>
    </div>

    <div className={styles.learningGrid}>
      <section className={styles.panel}><div className={styles.panelHeading}><h2><AcademyIcon name="layers" />{text("محتوى الكورس", "Course content")}</h2>{course && <Link href={courseHref} className={styles.smallLink}>{text("عرض الكل", "View all")}</Link>}</div>{availableLessons.length ? <ul className={styles.lessonList}>{availableLessons.slice(0, 5).map((lesson, index) => <li key={lesson.id}><Link href={lessonHref(lesson)}><span className={styles.lessonNumber}>{String(index + 1).padStart(2, "0")}</span><strong>{pickLocalizedText(locale, lesson.title_ar, lesson.title)}</strong>{lesson.duration && lesson.duration > 0 ? <small>{lesson.duration} {text("دقيقة", "min")}</small> : null}<AcademyIcon name="video" /></Link></li>)}</ul> : <div className={styles.empty}><AcademyIcon name="book" /><p>{text("تظهر هنا الدروس المتاحة لك بعد التسجيل أو تفعيل الكود.", "Your available lessons appear here after enrollment or code activation.")}</p><Link href="#activate-code" className={styles.smallLink}>{text("تفعيل كود", "Activate a code")}</Link></div>}</section>
      <section className={styles.panel}><div className={styles.panelHeading}><h2><AcademyIcon name="clock" />{text("خطوتك القادمة", "Your next step")}</h2></div><div className={styles.quickActions}><Link href="#activate-code"><AcademyIcon name="book" /><span>{text("فعّل كودك وافتح محتوى جديدًا", "Activate your code to access new content")}</span><span aria-hidden="true">{ar ? "‹" : "›"}</span></Link><Link href="/dashboard/profile"><AcademyIcon name="users" /><span>{text("راجع بيانات حسابك", "Review your profile")}</span><span aria-hidden="true">{ar ? "‹" : "›"}</span></Link><Link href="/dashboard/messages"><AcademyIcon name="mentor" /><span>{text("تواصل مع فريق الأكاديمية", "Message the academy team")}</span><span aria-hidden="true">{ar ? "‹" : "›"}</span></Link></div></section>
      <section className={styles.panel}><div className={styles.panelHeading}><h2><AcademyIcon name="broadcast" />{text("المواعيد القادمة", "Upcoming sessions")}</h2></div><p className={styles.panelHint}>{course ? text("المحاضرات المجدولة لهذا الكورس", "Scheduled sessions for this course") : text("مواعيد محاضرات الكورس تظهر هنا", "Course sessions will appear here")}</p>{upcoming.length ? <ul className={styles.sessions}>{upcoming.map((stream) => <li key={stream.id}><span><strong>{new Intl.DateTimeFormat(ar ? "ar-EG" : "en-GB", { day: "numeric", timeZone: "Africa/Cairo" }).format(stream.date)}</strong><small>{new Intl.DateTimeFormat(ar ? "ar-EG" : "en-GB", { month: "short", timeZone: "Africa/Cairo" }).format(stream.date)}</small></span><div><h3>{stream.title}</h3><time dateTime={stream.date.toISOString()}>{new Intl.DateTimeFormat(ar ? "ar-EG" : "en-GB", { hour: "2-digit", minute: "2-digit", timeZone: "Africa/Cairo" }).format(stream.date)}</time></div><Link href={courseHref} className={styles.smallLink}>{text("التفاصيل", "Details")}</Link></li>)}</ul> : <div className={styles.empty}><AcademyIcon name="clock" /><p>{text("لا توجد محاضرات قادمة مجدولة لهذا الكورس حاليًا.", "There are no upcoming sessions scheduled for this course yet.")}</p></div>}</section>
    </div>

    <div className={styles.accountGrid}><ActivateCodeSection /><section className={styles.panel}><div className={styles.panelHeading}><h2><AcademyIcon name="graduate" />{subscriptionsEnabled ? text("اشتراكك في المنصة", "Your platform subscription") : text("مسارك في الأكاديمية", "Your academy journey")}</h2></div><p className={styles.subscriptionStatus}>{subscriptionsEnabled ? (hasActiveSubscription ? text("اشتراك نشط", "Active subscription") : text("لا يوجد اشتراك منصة نشط", "No active platform subscription")) : text(`${courses.length} كورس متاح لحسابك`, `${courses.length} courses available to your account`)}</p>{hasActiveSubscription && subscriptionExpiry && <p className={styles.panelHint}>{text("ينتهي في", "Expires")} <time dateTime={subscriptionExpiry}>{new Intl.DateTimeFormat(ar ? "ar-EG" : "en-GB", { dateStyle: "long", timeZone: "Africa/Cairo" }).format(new Date(subscriptionExpiry))}</time></p>}<p className={styles.panelHint}>{text("تجد كورساتك المسجّل بها والمحتوى المتاح عبر الأكواد في قسم كورساتي.", "Find enrolled courses and code-unlocked content in My courses.")}</p><Link href={subscriptionsEnabled ? "#my-subscriptions" : "#my-courses"} className={styles.button}>{subscriptionsEnabled ? text("عرض الاشتراكات", "View subscriptions") : text("اذهب لكورساتي", "Go to my courses")}</Link></section></div>
    {subscriptionsEnabled && <StudentSubscriptionsPanel plans={plans} hasActivePlatformSubscription={hasActiveSubscription} activePlatformSubscriptionExpiresAtIso={subscriptionExpiry} />}
    <div id="my-courses" className={styles.anchor}><MyCoursesSection courses={courses} /></div>
    <section className={styles.panel}><div className={styles.panelHeading}><h2><AcademyIcon name="book" />{text("مكتبتي", "My library")}</h2><Link href="/store" className={styles.smallLink}>{text("تصفح المكتبة", "Browse library")}</Link></div>{purchases.length ? <div className={styles.purchaseGrid}>{purchases.map((purchase) => <article key={purchase.purchaseId}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={purchase.imageUrl || "/category-artwork/general.webp"} alt="" loading="lazy" /><div><h3>{purchase.title}</h3><p>{purchase.description}</p>{purchase.pdfUrl ? <a href={purchase.pdfUrl} target="_blank" rel="noopener noreferrer" className={styles.button}>{text("تحميل الملف", "Download file")}<span aria-hidden="true">↓</span></a> : <span className={styles.panelHint}>{text("الملف غير متاح حاليًا", "File currently unavailable")}</span>}</div>
    </article>)}</div> : <div className={styles.empty}><AcademyIcon name="book" /><p>{text("تظهر المواد التي اشتريتها من المكتبة هنا.", "Materials purchased from the library will appear here.")}</p></div>}</section>
  </div>;
}
