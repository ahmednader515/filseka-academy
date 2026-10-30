import Link from "next/link";
import Image from "next/image";
import { getLocaleFromCookie, getServerTranslator } from "@/lib/i18n/server";
import type { ResolvedHomepageCopy } from "@/lib/homepage-copy";

export async function Footer({
  footerTitle,
  footerTagline,
  footerCopyright,
  copy,
}: {
  copy: ResolvedHomepageCopy;
  footerTitle?: string;
  footerTagline?: string;
  footerCopyright?: string;
}) {
  const [t, locale] = await Promise.all([getServerTranslator(), getLocaleFromCookie()]);
  const defaultTitle = t("footer.defaultTitle", "Filseka Academy");
  const defaultTagline = t("footer.defaultTagline", "تعلم بأسلوب حديث ومنهجية واضحة");
  const defaultCopyright = t("footer.defaultCopyright", "Filseka Academy. جميع الحقوق محفوظة.");
  const year = new Date().getFullYear();
  const brand = footerTitle?.trim() || defaultTitle;
  const copyrightText = footerCopyright?.trim() || defaultCopyright;

  const groups = [
    {
      title: copy.footerDiscover,
      links: [
        ["/courses", copy.footerCourses],
        ["/teachers", copy.footerTeachers],
        ["/store", copy.footerStore],
      ],
    },
    {
      title: copy.footerAccount,
      links: [
        ["/login", copy.footerLogin],
        ["/register", copy.footerRegister],
        ["/dashboard", copy.footerDashboard],
      ],
    },
  ];

  return (
    <footer className="filseka-footer mt-auto border-t border-white/10 bg-[#080808] text-white">
      <div className="mx-auto max-w-[1440px] px-5 pb-7 pt-12 sm:px-10 sm:pt-16 lg:px-16">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-[1.5fr_1fr_1fr_1.25fr] lg:gap-16">
          <div className="max-w-sm">
            <Link href="/" className="inline-flex items-center gap-3" aria-label={brand}>
              <Image src="/logo-1.png" alt={brand} width={220} height={110} sizes="220px" className="h-auto w-[220px] max-w-full object-contain" />
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
            <p className="text-sm font-bold text-white">{copy.footerCalloutTitle}</p>
            <p className="mt-3 text-sm leading-6 text-white/55">
              {copy.footerCalloutDescription}
            </p>
            <Link href="/courses" className="filseka-primary-button mt-5 inline-flex min-h-11 items-center rounded-full px-5 text-sm font-bold text-white transition hover:-translate-y-0.5">
              {copy.footerCalloutButton} <span className="ms-2" aria-hidden>↗</span>
            </Link>
          </div>
        </div>

        <div className="mt-12 flex flex-col gap-3 border-t border-white/10 pt-6 text-xs text-white/40 sm:flex-row sm:items-center sm:justify-between">
          <p>© {year} {copyrightText}</p>
          <Link href="/" className="transition hover:text-white/70">{copy.footerHome}</Link>
        </div>
      </div>
    </footer>
  );
}
