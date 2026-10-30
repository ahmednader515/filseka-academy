"use client";

import Link from "next/link";
import { useLocale } from "@/components/LocaleProvider";
import { AcademyIcon, type AcademyIconName } from "@/components/AcademyIcon";
import { getSidebarGroups } from "@/lib/sidebar-navigation";
import { HOMEWORK_UI_ENABLED } from "@/lib/ui-features";
import styles from "./admin-dashboard.module.css";
import teacherStyles from "./teacher-dashboard.module.css";

export type TeacherCourseSummary = { id: string; title: string; titleAr: string; published: boolean; lessons: number; enrollments: number };

export function TeacherDashboard({ courses }: { courses: TeacherCourseSummary[] }) {
  const ar = useLocale() === "ar";
  const text = (a: string, e: string) => ar ? a : e;
  const published = courses.filter((course) => course.published).length;
  const metrics: { label: string; value: number; icon: AcademyIconName; caption: string; href: string }[] = [
    { label: text("كورساتي", "My courses"), value: courses.length, icon: "book", caption: text("إدارة المحتوى والدروس", "Manage content and lessons"), href: "/dashboard/courses" },
    { label: text("الكورسات المنشورة", "Published courses"), value: published, icon: "broadcast", caption: text("كورسات منشورة على المنصة", "Courses published on the platform"), href: "/dashboard/courses" },
    { label: text("مسودات الكورسات", "Course drafts"), value: courses.length - published, icon: "layers", caption: text("أكمل إعداد كورساتك", "Continue preparing your courses"), href: "/dashboard/courses" },
    { label: text("التسجيلات في كورساتي", "Course enrollments"), value: courses.reduce((sum, course) => sum + course.enrollments, 0), icon: "users", caption: text("عرض إحصائيات طلابي", "View my student statistics"), href: "/dashboard/statistics" },
  ];
  const teaching = getSidebarGroups("TEACHER").filter((group) => group.id !== "teacher-account");
  return <div className={styles.overview}>
    <section className={styles.metrics} aria-label={text("إحصائيات كورساتي", "My course statistics")}>{metrics.map((metric) => <Link key={metric.label} className={styles.metric} href={metric.href}><span className={styles.metricIcon}><AcademyIcon name={metric.icon} /></span><span className={styles.metricLabel}>{metric.label}</span><strong>{metric.value}</strong><span className={styles.metricCaption}>{metric.caption}<span aria-hidden="true">{ar ? "‹" : "›"}</span></span></Link>)}</section>
    <section className={styles.panel}><div className={styles.sectionHeading}><div><span className={styles.eyebrow}>{text("محتواك التعليمي", "YOUR TEACHING CONTENT")}</span><h2>{text("تابع كورساتك", "Your courses at a glance")}</h2></div><Link href="/dashboard/courses" className={styles.textLink}>{text("عرض كل الكورسات", "View all courses")}<span aria-hidden="true">{ar ? "‹" : "›"}</span></Link></div>
      {courses.length ? <div className={teacherStyles.courses}>{courses.slice(0, 4).map((course) => <Link href={`/dashboard/courses/${encodeURIComponent(course.id)}/edit`} className={teacherStyles.course} key={course.id}><span className={teacherStyles.courseIcon}><AcademyIcon name="video" /></span><div><h3>{ar ? course.titleAr || course.title : course.title || course.titleAr}</h3><p>{course.lessons} {text("درس", "lessons")}<span aria-hidden="true"> · </span>{course.enrollments} {text("تسجيل", "enrollments")}</p></div><span className={teacherStyles.status} data-published={course.published}>{course.published ? text("منشور", "Published") : text("مسودة", "Draft")}</span><span className={teacherStyles.arrow} aria-hidden="true">{ar ? "‹" : "›"}</span></Link>)}</div> : <div className={teacherStyles.empty}><AcademyIcon name="graduate" /><h3>{text("رحلتك التعليمية تبدأ بكورس", "Your teaching journey starts with a course")}</h3><p>{text("شارك خبرتك مع طلاب الأكاديمية. أنشئ كورسك الأول وأضف دروسك ومحتواك.", "Share your expertise with academy students. Create your first course and add your lessons and content.")}</p><Link href="/dashboard/courses/new" className={styles.button}>{text("إنشاء أول كورس", "Create your first course")}</Link></div>}
    </section>
    <div className={styles.sectionHeading}><div><span className={styles.eyebrow}>{text("مساحة العمل", "YOUR WORKSPACE")}</span><h2>{text("أدواتك كمدرب", "Your teaching tools")}</h2></div><Link href="/dashboard/profile" className={styles.textLink}>{text("تعديل ملفي الشخصي", "Edit my profile")}<span aria-hidden="true">↗</span></Link></div>
    <div className={styles.tools}>{teaching.map((group) => <section className={styles.panel} key={group.id}><div className={styles.panelHeading}><span><AcademyIcon name={group.id === "teaching" ? "graduate" : "users"} /></span><div><h2>{ar ? group.ar : group.en}</h2><p>{group.id === "teaching" ? text("أنشئ المحتوى وأدِر أدوات كورساتك.", "Create content and manage your course tools.") : (HOMEWORK_UI_ENABLED ? text("تابع الواجبات والنتائج وابقَ على تواصل مع طلابك.", "Review homework and results, and stay in touch with your students.") : text("تابع نتائج طلابك وابقَ على تواصل معهم.", "Review student results and stay in touch."))}</p></div></div><div className={styles.toolLinks}>{group.items.filter((item) => item.href !== "/dashboard").map((item) => <Link href={item.href} key={item.href}><span>{ar ? item.ar : item.en}</span><span aria-hidden="true">{ar ? "‹" : "›"}</span></Link>)}</div></section>)}</div>
    <aside className={styles.help}><AcademyIcon name="mentor" /><div><h2>{text("ملفك هو أول انطباع لطلابك", "Your profile is your first introduction")}</h2><p>{text("حدّث صورتك وتخصصك وبياناتك ليتمكن الطلاب من التعرف عليك.", "Keep your photo, subject and details up to date so students can get to know you.")}</p></div><Link href="/dashboard/profile" className={styles.button}>{text("تحديث ملفي", "Update my profile")}</Link></aside>
  </div>;
}
