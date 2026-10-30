"use client";

import Link from "next/link";
import { useLocale } from "@/components/LocaleProvider";
import { AcademyIcon, type AcademyIconName } from "@/components/AcademyIcon";
import { getSidebarGroups } from "@/lib/sidebar-navigation";
import styles from "./admin-dashboard.module.css";

export function AdminDashboard({ isAdmin, studentsCount, coursesCount, quizAttemptsCount, totalEarnings }: { isAdmin: boolean; studentsCount: number; coursesCount: number; quizAttemptsCount: number; totalEarnings: number }) {
  const ar = useLocale() === "ar";
  const text = (arabic: string, english: string) => ar ? arabic : english;
  const groups = getSidebarGroups(isAdmin ? "ADMIN" : "ASSISTANT_ADMIN").filter((group) => group.id !== "overview");
  const metrics: { label: string; value: string; icon: AcademyIconName; href: string; caption: string }[] = [
    { label: text("طلاب الأكاديمية", "Academy students"), value: String(studentsCount), icon: "users", href: "/dashboard/students", caption: text("إدارة الطلاب والحسابات", "Manage students and accounts") },
    { label: text("كورسات المنصة", "Platform courses"), value: String(coursesCount), icon: "book", href: isAdmin ? "/dashboard/courses" : "/dashboard/statistics", caption: text("الكورسات المسجلة بالمنصة", "Courses registered on the platform") },
    { label: text("محاولات الاختبارات", "Quiz attempts"), value: String(quizAttemptsCount), icon: "graduate", href: "/dashboard/statistics", caption: text("تابع نتائج الطلاب", "Review student results") },
    { label: text("إجمالي الأرباح", "Total earnings"), value: new Intl.NumberFormat(ar ? "ar-EG" : "en-GB", { maximumFractionDigits: 2, minimumFractionDigits: 2 }).format(totalEarnings), icon: "layers", href: "/dashboard/statistics", caption: text("جنيه مصري · عرض الإحصائيات", "EGP · View statistics") },
  ];
  const icons: Record<string, AcademyIconName> = { education: "graduate", students: "users", content: "book", settings: "layers" };
  const descriptions: Record<string, string> = {
    education: text("كل أدوات التعلم في مكان واحد.", "Your learning tools in one place."),
    students: text("تابع الطلاب وابقَ على تواصل معهم.", "Follow your students and stay in touch."),
    content: text("حدّث المحتوى الذي يراه جمهورك.", "Keep your academy’s content up to date."),
    settings: text("خصّص المنصة واضبط إعداداتها.", "Customize your platform and its settings."),
  };
  return <div className={styles.overview}>
    <section aria-label={text("إحصائيات الأكاديمية", "Academy statistics")} className={styles.metrics}>{metrics.map((metric) => <Link href={metric.href} key={metric.label} className={styles.metric}><span className={styles.metricIcon}><AcademyIcon name={metric.icon} /></span><span className={styles.metricLabel}>{metric.label}</span><strong>{metric.value}</strong><span className={styles.metricCaption}>{metric.caption}<span aria-hidden="true">{ar ? "‹" : "›"}</span></span></Link>)}</section>
    <div className={styles.sectionHeading}><div><span className={styles.eyebrow}>{text("مساحة الإدارة", "YOUR WORKSPACE")}</span><h2>{text("أدوات إدارة الأكاديمية", "Academy management tools")}</h2></div><Link href="/" className={styles.textLink}>{text("عرض الموقع", "View website")}<span aria-hidden="true">↗</span></Link></div>
    <div className={styles.tools}>{groups.map((group) => <section className={styles.panel} key={group.id}><div className={styles.panelHeading}><span><AcademyIcon name={icons[group.id]} /></span><div><h2>{ar ? group.ar : group.en}</h2><p>{descriptions[group.id]}</p></div></div><div className={styles.toolLinks}>{group.items.filter((item) => item.href !== "/").map((item) => <Link href={item.href} key={item.href}><span>{ar ? item.ar : item.en}</span><span aria-hidden="true">{ar ? "‹" : "›"}</span></Link>)}</div></section>)}</div>
    <aside className={styles.help}><AcademyIcon name="mentor" /><div><h2>{text("جاهز للخطوة القادمة؟", "Ready for the next step?")}</h2><p>{text("راجع رسائل الطلاب وطلبات تعديل الحسابات لمتابعة احتياجاتهم.", "Review student messages and account change requests to follow up on their needs.")}</p></div><Link className={styles.button} href="/dashboard/messages">{text("رسائل الطلاب", "Student messages")}</Link></aside>
  </div>;
}
