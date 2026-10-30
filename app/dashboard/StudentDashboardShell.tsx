"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { useLocale } from "@/components/LocaleProvider";
import { AcademyIcon, type AcademyIconName } from "@/components/AcademyIcon";
import styles from "./student-dashboard.module.css";

export function StudentDashboardShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const ar = useLocale() === "ar";
  const pages: Record<string, { ar: string; en: string; descriptionAr: string; descriptionEn: string; icon: AcademyIconName }> = {
    "/dashboard/certificates": { ar: "شهاداتي", en: "My certificates", descriptionAr: "احتفظ بإنجازاتك واعرض شهادات إتمام كورساتك.", descriptionEn: "View and print your course completion certificates.", icon: "graduate" },
    "/dashboard/profile": { ar: "حسابي", en: "My profile", descriptionAr: "راجع بياناتك وحدّث حسابك من مكان واحد.", descriptionEn: "Review and update your account details in one place.", icon: "users" },
    "/dashboard/messages": { ar: "رسائلي", en: "My messages", descriptionAr: "تواصل مع فريق الأكاديمية وتابع محادثاتك.", descriptionEn: "Stay in touch with the academy and follow your conversations.", icon: "mentor" },
  };
  const page = pages[pathname];
  return <div className={styles.studentArea} dir={ar ? "rtl" : "ltr"}>
    {page && <header className={styles.subpageHeader}><nav aria-label={ar ? "مسار التنقل" : "Breadcrumb"}><Link href="/dashboard">{ar ? "لوحة تعلمي" : "My dashboard"}</Link><span aria-hidden="true">/</span><span aria-current="page">{ar ? page.ar : page.en}</span></nav><div><span className={styles.subpageIcon}><AcademyIcon name={page.icon} /></span><div><h1>{ar ? page.ar : page.en}</h1><p>{ar ? page.descriptionAr : page.descriptionEn}</p></div></div></header>}
    <div className={page ? styles.subpageContent : undefined}>{children}</div>
  </div>;
}
