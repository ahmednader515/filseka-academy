import { Suspense } from "react";
import { getHomepageSettings } from "@/lib/db";
import { HomeMarketplaceHero } from "@/components/HomeMarketplaceHero";
import { HomeHeroTemplateThree } from "@/components/HomeHeroTemplateThree";
import {
  HomePageBelowFold,
  HomePageBelowFoldFallback,
} from "@/components/HomePageBelowFold";
import { getLocaleFromCookie, getServerTranslator } from "@/lib/i18n/server";
import { pickLocalizedText } from "@/lib/i18n/localized-field";
import { resolveHomepageCopy } from "@/lib/homepage-copy";

/** كاش قصير + إبطال فوري عند حفظ الإعدادات/الكورسات عبر revalidateHomepageCaches */
export const revalidate = 60;

export default async function HomePage() {
  const [t, locale, homepageSettings] = await Promise.all([
    getServerTranslator(),
    getLocaleFromCookie(),
    getHomepageSettings(),
  ]);

  const heroTemplate = homepageSettings.heroTemplate === "coming_soon" ? "coming_soon" : "marketplace";
  const configuredHeroTitle = pickLocalizedText(locale, homepageSettings.heroTitle, homepageSettings.heroTitleEn);
  const configuredHeroSubtitle = pickLocalizedText(locale, homepageSettings.heroSlogan, homepageSettings.heroSloganEn);
  const heroCtaLabel = pickLocalizedText(locale, homepageSettings.ctaButtonText, homepageSettings.ctaButtonTextEn)
    || (locale === "ar" ? "اكتشف الكورسات" : "Explore courses");
  const homepageCopy = resolveHomepageCopy(homepageSettings.homepageTextOverrides, locale);
  const defaultHeroTitle = locale === "ar" ? "في السكة أكاديمي" : "Filsaka Academy";
  const defaultHeroSubtitle = locale === "ar"
    ? "منصة متكاملة لصناعة الإعلاميين"
    : "An integrated academy for the next generation of media professionals";
  const heroTitle =
    configuredHeroTitle === "أستاذ / عصام محي" ||
    configuredHeroTitle.toLowerCase() === "filseka academy" ||
    configuredHeroTitle === "ابدأ رحلتك التعليمية مع فِلسِكة" ||
    configuredHeroTitle.startsWith("ابدأ رحلتك التعليمية") ||
    configuredHeroTitle === "Your next learning journey starts here" ||
    (locale === "en" && configuredHeroTitle === "ابدأ رحلتك التعليمية مع فِلسِكة")
      ? defaultHeroTitle
      : configuredHeroTitle || defaultHeroTitle;
  const heroSubtitle =
    configuredHeroSubtitle === "ادرسها... يمكن تفهم المعلومة صح!" ||
    configuredHeroSubtitle === "كورسات عملية وخبراء يساعدونك على بناء مهاراتك وتحقيق أهدافك." ||
    configuredHeroSubtitle === "Practical courses and expert guidance to help you build skills and reach your goals." ||
    (locale === "en" && configuredHeroSubtitle === "كورسات عملية وخبراء يساعدونك على بناء مهاراتك وتحقيق أهدافك.")
      ? defaultHeroSubtitle
      : configuredHeroSubtitle || defaultHeroSubtitle;

  return (
    <div className="filseka-home academy-reference-home">
      {heroTemplate === "coming_soon" ? (
        <HomeHeroTemplateThree
          title={pickLocalizedText(locale, homepageSettings.hero3Title, homepageSettings.hero3TitleEn) || t("home.defaultHero3Title", "The #1 all-in-one platform")}
          subtitle={pickLocalizedText(locale, homepageSettings.hero3Subtitle, homepageSettings.hero3SubtitleEn) || t("home.defaultHero3Subtitle", "Join over one million students with our plan")}
          phoneImageUrl={homepageSettings.hero3PhoneImageUrl?.trim() || null}
          phoneBgColor={homepageSettings.hero3PhoneBgColor?.trim() || "#FACC15"}
          badge1ImageUrl={homepageSettings.hero3StoreBadge1ImageUrl?.trim() || null}
          badge1Link={homepageSettings.hero3StoreBadge1Link?.trim() || null}
          badge2ImageUrl={homepageSettings.hero3StoreBadge2ImageUrl?.trim() || null}
          badge2Link={homepageSettings.hero3StoreBadge2Link?.trim() || null}
          badge1Fallback={homepageCopy.hero3Badge1}
          badge2Fallback={homepageCopy.hero3Badge2}
        />
      ) : (
        <HomeMarketplaceHero
          copy={homepageCopy}
          title={heroTitle}
          subtitle={heroSubtitle}
          ctaLabel={heroCtaLabel}
          eyebrow={homepageCopy.heroEyebrow}
          locale={locale}
        />
      )}

      <div id="home-next-section" className="scroll-mt-20" />

      <Suspense fallback={<HomePageBelowFoldFallback />}>
        <HomePageBelowFold homepageSettings={homepageSettings} homepageCopy={homepageCopy} />
      </Suspense>
    </div>
  );
}
