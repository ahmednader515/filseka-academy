import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import NextTopLoader from "nextjs-toploader";
import { getServerSession } from "next-auth";
import "./globals.css";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { SessionProvider } from "@/components/SessionProvider";
import { StoreSplashProvider } from "@/components/StoreSplashProvider";
import { DeferredInspectGuard } from "@/components/DeferredInspectGuard";
import { ForceLogoutGuard } from "@/components/ForceLogoutGuard";
import { authOptions } from "@/lib/auth";
import {
  getHomepageSettings,
  userHasActivePlatformSubscription,
  getLatestPlatformSubscriptionExpiry,
} from "@/lib/db";
import { normalizeHeroHex } from "@/lib/hero-bg";
import { getDir, makeTranslator } from "@/lib/i18n/core";
import { getLocaleFromCookie } from "@/lib/i18n/server";
import { LocaleProvider } from "@/components/LocaleProvider";
import { homepageDefaultForLocale } from "@/lib/homepage-default-for-locale";
import { pickLocalizedText } from "@/lib/i18n/localized-field";
import {
  HOMEPAGE_DEFAULT_FOOTER_COPYRIGHT_AR,
  HOMEPAGE_DEFAULT_FOOTER_TAGLINE_AR,
  HOMEPAGE_DEFAULT_FOOTER_TITLE_AR,
} from "@/lib/homepage-known-defaults";

const cairo = localFont({
  src: "../public/fonts/Cairo-VariableFont_slnt,wght.ttf",
  variable: "--font-cairo",
  display: "swap",
  weight: "200 1000",
  style: "normal",
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export async function generateMetadata(): Promise<Metadata> {
  const [locale, settings] = await Promise.all([
    getLocaleFromCookie(),
    getHomepageSettings().catch(() => null),
  ]);
  const defaultTitle =
    locale === "ar"
      ? "Filseka Academy | دورات وتعلم أونلاين"
      : "Filseka Academy | Online Courses and Learning";
  const defaultDescription =
    locale === "ar"
      ? "اكتشف دورات تعليمية عملية في Filseka Academy وابدأ رحلتك في اكتساب مهارات جديدة."
      : "Explore practical courses at Filseka Academy and start building new skills.";
  const rawTitle = settings
    ? pickLocalizedText(locale, settings.pageTitle, settings.pageTitleEn) || defaultTitle
    : defaultTitle;
  const title = rawTitle.replace(/^filseka academy/i, "Filseka Academy");
  return { title, description: defaultDescription };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [locale, settingsResult, session] = await Promise.all([
    getLocaleFromCookie(),
    getHomepageSettings().catch(() => null),
    getServerSession(authOptions).catch(() => null),
  ]);
  const dir = getDir(locale);
  const t = makeTranslator(locale);
  let platformName: string | null = null;
  let headerLogoUrl: string | null = null;
  let platformPrimaryColor: string | null = null;
  let footerTitle = t("footer.defaultTitle", "منصتي التعليمية");
  let footerTagline = t("footer.defaultTagline", "تعلم بأسلوب حديث ومنهجية واضحة");
  let footerCopyright = t("footer.defaultCopyright", "منصتي التعليمية. جميع الحقوق محفوظة.");
  const settings = settingsResult;
  if (settings) {
    const configuredName = pickLocalizedText(locale, settings.platformName, settings.platformNameEn).trim();
    platformName =
      configuredName === "منصة أستاذ عصام محي" || configuredName.toLowerCase() === "filseka academy"
        ? "Filseka Academy"
        : configuredName || null;
    headerLogoUrl = settings.headerLogoUrl ?? null;
    platformPrimaryColor = normalizeHeroHex(String(settings.primaryColor ?? "")) ?? null;
    const rawFooterTitle = pickLocalizedText(locale, settings.footerTitle, settings.footerTitleEn);
    const rawFooterTagline = pickLocalizedText(locale, settings.footerTagline, settings.footerTaglineEn);
    const rawFooterCopyright = pickLocalizedText(locale, settings.footerCopyright, settings.footerCopyrightEn)
      .replace(/filseka academy/i, "Filseka Academy");
    footerTitle = homepageDefaultForLocale(
      locale,
      rawFooterTitle.toLowerCase() === "filseka academy" ? "Filseka Academy" : rawFooterTitle,
      HOMEPAGE_DEFAULT_FOOTER_TITLE_AR,
      "footer.defaultTitle",
      t,
      "My Learning Platform",
    );
    footerTagline = homepageDefaultForLocale(
      locale,
      rawFooterTagline,
      HOMEPAGE_DEFAULT_FOOTER_TAGLINE_AR,
      "footer.defaultTagline",
      t,
      "Learn with a modern and clear method",
    );
    footerCopyright = homepageDefaultForLocale(
      locale,
      rawFooterCopyright,
      HOMEPAGE_DEFAULT_FOOTER_COPYRIGHT_AR,
      "footer.defaultCopyright",
      t,
      "My Learning Platform. All rights reserved.",
    );
  }

  let platformSubscriptionExpiryLabel: string | null = null;
  try {
    if (session?.user?.role === "STUDENT" && session.user.id) {
      const active = await userHasActivePlatformSubscription(session.user.id);
      if (active) {
        const exp = await getLatestPlatformSubscriptionExpiry(session.user.id);
        if (exp) {
          platformSubscriptionExpiryLabel = new Intl.DateTimeFormat(locale === "ar" ? "ar-EG" : "en-US", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          }).format(exp);
        } else {
          platformSubscriptionExpiryLabel = t("header.active", "نشط");
        }
      }
    }
  } catch {
    platformSubscriptionExpiryLabel = null;
  }

  return (
    <html lang={locale} dir={dir} suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){var t=localStorage.getItem("theme");document.documentElement.classList.add(t==="light"?"light":"dark");})();`,
          }}
        />
        {platformPrimaryColor ? (
          <style
            dangerouslySetInnerHTML={{
              __html: `:root{--platform-primary:${platformPrimaryColor};}`,
            }}
          />
        ) : null}
        </head>
      <body className={`${cairo.className} ${cairo.variable} font-sans antialiased min-h-screen flex flex-col`}>
        <NextTopLoader
          color={platformPrimaryColor ?? "#e11d2e"}
          height={3}
          showSpinner={false}
          easing="ease"
          speed={300}
          shadow="0 0 10px rgba(225,29,46,0.4)"
        />
        <LocaleProvider locale={locale}>
          <SessionProvider>
            <StoreSplashProvider>
            <DeferredInspectGuard />
            <ForceLogoutGuard />
            <Header
              platformName={platformName}
              headerLogoUrl={headerLogoUrl}
              platformSubscriptionExpiryLabel={platformSubscriptionExpiryLabel}
            />
            <main className="flex-1">{children}</main>
            <Footer footerTitle={footerTitle} footerTagline={footerTagline} footerCopyright={footerCopyright} logoUrl={headerLogoUrl} />
            </StoreSplashProvider>
          </SessionProvider>
        </LocaleProvider>
      </body>
    </html>
  );
}
