"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { useLocale } from "@/components/LocaleProvider";
import { AcademyIcon } from "@/components/AcademyIcon";
import { getSidebarGroups } from "@/lib/sidebar-navigation";
import styles from "./admin-dashboard.module.css";

export function AdminDashboardShell({ children, isAdmin, userName, isTeacher = false }: { children: ReactNode; isAdmin: boolean; userName: string; isTeacher?: boolean }) {
  const pathname = usePathname();
  const ar = useLocale() === "ar";
  const groups = getSidebarGroups(isTeacher ? "TEACHER" : isAdmin ? "ADMIN" : "ASSISTANT_ADMIN");
  const page = groups.flatMap((group) => group.items).filter((item) => item.href !== "/" && (pathname === item.href || pathname.startsWith(`${item.href}/`))).sort((a, b) => b.href.length - a.href.length)[0];
  const overview = pathname === "/dashboard";
  const workspace = isTeacher ? (ar ? "مساحة المدرب" : "Teaching workspace") : (ar ? "إدارة الأكاديمية" : "Academy administration");
  const title = overview ? (isTeacher ? (ar ? "لوحة المدرب" : "Teacher dashboard") : (ar ? "لوحة التحكم" : "Admin dashboard")) : page ? (ar ? page.ar : page.en) : workspace;
  const description = isTeacher ? (overview ? (ar ? `مرحبًا ${userName}، أدِر كورساتك وتابع طلابك من مكان واحد.` : `Welcome ${userName}. Manage your courses and follow your students in one place.`) : (ar ? "أدِر محتوى كورساتك وتابع رحلتك مع طلابك." : "Manage your course content and support your students.")) : (overview ? (ar ? `مرحبًا ${userName}، تابع الأكاديمية وأدِر أدواتك من مكان واحد.` : `Welcome ${userName}. Follow your academy and manage your tools in one place.`) : (ar ? "أدِر بيانات الأكاديمية وتابع عملك من هنا." : "Manage academy information and keep your work moving."));
  return <div className={styles.area} dir={ar ? "rtl" : "ltr"}>
    <header className={styles.header}>
      <nav aria-label={ar ? "مسار التنقل" : "Breadcrumb"}><Link href="/dashboard">{workspace}</Link><span aria-hidden="true">/</span><span aria-current="page">{overview ? (ar ? "نظرة عامة" : "Overview") : title}</span></nav>
      <div className={styles.heading}><span className={styles.headingIcon}><AcademyIcon name={overview ? "layers" : "mentor"} /></span><div><h1>{title}</h1><p>{description}</p></div>{overview && (isAdmin || isTeacher) && <Link href="/dashboard/courses/new" className={styles.button}><span aria-hidden="true">+</span>{ar ? "إنشاء كورس" : "Create course"}</Link>}</div>
    </header>
    <div className={`${styles.content} ${overview ? "" : styles.subpage}`}>{children}</div>
  </div>;
}
