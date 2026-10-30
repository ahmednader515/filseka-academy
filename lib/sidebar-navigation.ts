import type { UserRole } from "@/lib/types";

export type SidebarIcon = "chart" | "plus" | "settings" | "shield" | "home" | "users" | "play" | "broadcast" | "tasks" | "film" | "folder" | "support" | "mail" | "info" | "article" | "dashboard" | "profile" | "wallet" | "ticket" | "subscription";
export type SidebarItem = { ar: string; en: string; icon: SidebarIcon; href: string };
export type SidebarGroup = { id: string; ar?: string; en?: string; items: SidebarItem[] };

export function getSidebarGroups(role?: UserRole): SidebarGroup[] {
  if (role === "ADMIN" || role === "ASSISTANT_ADMIN") {
    const admin = role === "ADMIN";
    return [
      { id: "overview", ar: "الإدارة", en: "Administration", items: [
        { ar: "لوحة التحكم", en: "Dashboard", icon: "dashboard", href: "/dashboard" },
        { ar: "إحصائيات الطلاب", en: "Student statistics", icon: "chart", href: "/dashboard/statistics" },
      ] },
      { id: "education", ar: "إدارة التعلم", en: "Learning management", items: [
        { ar: "إدارة الأقسام", en: "Manage categories", icon: "folder", href: "/dashboard/categories" },
        ...(admin ? [
          { ar: "تصميم الشهادات", en: "Certificate designer", icon: "shield" as const, href: "/dashboard/certificates" },
          { ar: "إدارة الكورسات", en: "Manage courses", icon: "play" as const, href: "/dashboard/courses" },
          { ar: "إنشاء كورس", en: "Create course", icon: "plus" as const, href: "/dashboard/courses/new" },
          { ar: "البثوث المباشرة", en: "Live streams", icon: "broadcast" as const, href: "/dashboard/live-streams" },
          { ar: "المدربون", en: "Trainers", icon: "users" as const, href: "/dashboard/teachers" },
        ] : []),
        { ar: "واجبات الطلاب", en: "Student homework", icon: "tasks", href: "/dashboard/homework" },
        { ar: "أكواد التفعيل", en: "Activation codes", icon: "ticket", href: "/dashboard/codes" },
      ] },
      { id: "students", ar: "الطلاب والتواصل", en: "Students & communication", items: [
        { ar: admin ? "الطلاب والحسابات" : "الطلاب", en: admin ? "Students & accounts" : "Students", icon: "users", href: "/dashboard/students" },
        { ar: "رسائل الطلاب", en: "Student messages", icon: "mail", href: "/dashboard/messages" },
        { ar: "طلبات تعديل الحسابات", en: "Account change requests", icon: "profile", href: "/dashboard/password-change-requests" },
        { ar: "رسائل تواصل معنا", en: "Contact inquiries", icon: "support", href: "/dashboard/contact" },
      ] },
      { id: "content", ar: "المحتوى والمنصة", en: "Content & platform", items: [
        { ar: "إدارة معرض الأعمال", en: "Manage portfolio", icon: "film", href: "/dashboard/portfolio" },
        { ar: "إدارة المدونة", en: "Manage blog", icon: "article", href: "/dashboard/blog" },
        ...(admin ? [
          { ar: "المكتبة الإعلامية", en: "Media library", icon: "folder" as const, href: "/dashboard/store" },
          { ar: "تعليقات الطلاب", en: "Student reviews", icon: "info" as const, href: "/dashboard/reviews" },
          { ar: "خطط الاشتراك", en: "Subscription plans", icon: "subscription" as const, href: "/dashboard/subscriptions" },
          { ar: "الطلاب المشتركون", en: "Subscribed students", icon: "users" as const, href: "/dashboard/subscription-students" },
        ] : []),
      ] },
      { id: "settings", ar: "الإعدادات", en: "Settings", items: [
        { ar: "إعدادات الصفحة الرئيسية", en: "Homepage settings", icon: "settings", href: "/dashboard/settings/homepage" },
        { ar: "طرق الدفع", en: "Payment methods", icon: "wallet", href: "/dashboard/settings/add-balance" },
        ...(admin ? [{ ar: "حقوق الطبع", en: "Copyright settings", icon: "shield" as const, href: "/dashboard/settings/copyright-overlay" }] : []),
        { ar: "عرض الموقع", en: "View website", icon: "home", href: "/" },
      ] },
    ];
  }
  if (role === "STUDENT") return [
    { id: "learning", ar: "تعلمي", en: "My learning", items: [
      { ar: "لوحة تعلمي", en: "Learning dashboard", icon: "dashboard", href: "/dashboard" },
      { ar: "شحن الرصيد", en: "Add balance", icon: "wallet", href: "/dashboard/add-balance" },
      { ar: "رسائلي", en: "My messages", icon: "mail", href: "/dashboard/messages" },
      { ar: "حسابي", en: "My profile", icon: "profile", href: "/dashboard/profile" },
      { ar: "شهاداتي", en: "My certificates", icon: "shield", href: "/dashboard/certificates" },
      { ar: "المكتبة الإعلامية", en: "Media library", icon: "folder", href: "/store" },
      { ar: "المدونة", en: "Blog", icon: "article", href: "/blog" },
      { ar: "الدعم الفني", en: "Support", icon: "support", href: "/support" },
    ] },
  ];

  const staff = role === "TEACHER";
  return [{ id: "academy", items: [
    { ar: "الرئيسية", en: "Homepage", icon: "home", href: "/" },
    { ar: "المدربون", en: "Trainers", icon: "users", href: "/teachers" },
    { ar: "كورساتي", en: "My courses", icon: "play", href: staff ? "/dashboard/courses" : "/dashboard#my-courses" },
    ...(staff ? [
      { ar: "المحاضرات المباشرة", en: "Live lectures", icon: "broadcast" as const, href: "/dashboard/live-streams" },
      { ar: "المهام والتقييمات", en: "Tasks & assessments", icon: "tasks" as const, href: "/dashboard/homework" },
    ] : []),
    { ar: "معرض الأعمال", en: "Portfolio", icon: "film", href: "/portfolio" },
    { ar: "المكتبة الإعلامية", en: "Media library", icon: "folder", href: "/store" },
    { ar: "الدعم الفني", en: "Support", icon: "support", href: "/support" },
    { ar: "تواصل معنا", en: "Contact us", icon: "mail", href: "/contact" },
    { ar: "من نحن", en: "About us", icon: "info", href: "/about" },
    { ar: "المدونة", en: "Blog", icon: "article", href: "/blog" },
  ] }];
}

export function isSidebarLinkActive(href: string, pathname: string, hash: string) {
  const [target, fragment] = href.split("#");
  if (fragment) return pathname === target && hash === `#${fragment}`;
  if (target === "/dashboard") return pathname === target && !hash;
  if (target === "/dashboard/courses" && pathname === "/dashboard/courses/new") return false;
  return pathname === target || (target !== "/" && pathname.startsWith(`${target}/`));
}
