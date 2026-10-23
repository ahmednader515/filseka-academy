import Link from "next/link";
import { getLocaleFromCookie, getServerTranslator } from "@/lib/i18n/server";

export async function Footer({
  footerTitle,
  footerTagline,
  footerCopyright,
  logoUrl,
}: {
  footerTitle?: string;
  footerTagline?: string;
  footerCopyright?: string;
  logoUrl?: string | null;
}) {
  const [t, locale] = await Promise.all([getServerTranslator(), getLocaleFromCookie()]);
  const ar = locale === "ar";
  const defaultTitle = t("footer.defaultTitle", "Filseka Academy");
  const defaultTagline = t("footer.defaultTagline", "تعلم بأسلوب حديث ومنهجية واضحة");
  const defaultCopyright = t("footer.defaultCopyright", "Filseka Academy. جميع الحقوق محفوظة.");
  const year = new Date().getFullYear();
  const brand = footerTitle?.trim() || defaultTitle;
  const copyrightText = footerCopyright?.trim() || defaultCopyright;

  const groups = [
    {
      title: ar ? "اكتشف المزيد" : "Discover",
      links: [
        ["/courses", t("common.courses", ar ? "الكورسات" : "Courses")],
        ["/teachers", ar ? "الخبراء والمعلمون" : "Experts"],
        ["/store", ar ? "المتجر التعليمي" : "Learning store"],
      ],
    },
    {
      title: ar ? "حسابك" : "Your account",
      links: [
        ["/login", t("header.login", ar ? "تسجيل الدخول" : "Log in")],
        ["/register", t("header.register", ar ? "إنشاء حساب" : "Create an account")],
        ["/dashboard", ar ? "تعلمي" : "My learning"],
      ],
    },
  ];

  return (
    <footer className="filseka-footer mt-auto border-t border-white/10 bg-[#080808] text-white">
      <div className="mx-auto max-w-[1440px] px-5 pb-7 pt-12 sm:px-10 sm:pt-16 lg:px-16">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-[1.5fr_1fr_1fr_1.25fr] lg:gap-16">
          <div className="max-w-sm">
            <Link href="/" className="inline-flex items-center gap-3" aria-label={brand}>
              <img src={logoUrl?.trim() || "/logo.png"} alt="" className="h-12 w-12 rounded-xl object-contain" />
              <span className="text-lg font-bold tracking-tight">{brand}</span>
            </Link>
            <p className="mt-4 max-w-xs text-sm leading-7 text-white/55">
              {footerTagline?.trim() || defaultTagline}
            </p>
          </div>

          {groups.map((group) => (
            <nav key={group.title} aria-label={group.title}>
              <h2 className="text-sm font-bold text-white">{group.title}</h2>
              <ul className="mt-4 space-y-3">
                {group.links.map(([href, label]) => (
                  <li key={href}>
                    <Link href={href} className="text-sm text-white/55 transition hover:text-white">
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}

          <div>
            <p className="text-sm font-bold text-white">{ar ? "ابدأ رحلتك التعليمية" : "Start learning today"}</p>
            <p className="mt-3 text-sm leading-6 text-white/55">
              {ar ? "اكتشف كورسات عملية وابنِ المهارات التي تحتاجها لخطوتك القادمة." : "Explore practical courses and build skills for your next step."}
            </p>
            <Link href="/courses" className="filseka-primary-button mt-5 inline-flex min-h-11 items-center rounded-full px-5 text-sm font-bold text-white transition hover:-translate-y-0.5">
              {ar ? "تصفح الكورسات" : "Browse courses"} <span className="ms-2" aria-hidden>↗</span>
            </Link>
          </div>
        </div>

        <div className="mt-12 flex flex-col gap-3 border-t border-white/10 pt-6 text-xs text-white/40 sm:flex-row sm:items-center sm:justify-between">
          <p>© {year} {copyrightText}</p>
          <Link href="/" className="transition hover:text-white/70">{t("common.home", ar ? "الرئيسية" : "Home")}</Link>
        </div>
      </div>
    </footer>
  );
}
