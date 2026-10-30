import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import {
  getCoursesPublished,
  getCategories,
  getTeacherIdsExcludedFromPublicCourseLists,
  listActiveSubscriptionPlansPublic,
  listTeachersForHomepage,
  selectTeachersForHomepagePreview,
  userHasActivePlatformSubscription,
  getLatestPlatformSubscriptionExpiry,
} from "@/lib/db";
import type { HomepageSetting } from "@/lib/types";
import { HomeContentCategories } from "@/components/HomeContentCategories";
import { HOMEPAGE_DEMO_INSTRUCTORS } from "@/lib/homepage-demo-instructors";
import { getAcademyMilestones } from "@/lib/academy-milestones";
import { HomeTeachersSection } from "@/components/HomeTeachersSection";
import { HomeSubscriptionsSection } from "@/components/HomeSubscriptionsSection";
import { HomeStoreSection } from "@/components/HomeStoreSection";
import { HomePlatformDetailsSection } from "@/components/HomePlatformDetailsSection";
import { HomeMobileAppSection } from "@/components/HomeMobileAppSection";
import { parsePlatformDetailsItems } from "@/lib/platform-details";
import { parsePlatformNewsItems } from "@/lib/platform-news";
import { HomePlatformNewsSlider } from "@/components/HomePlatformNewsSlider";
import { getLocaleFromCookie, getServerTranslator } from "@/lib/i18n/server";
import {
  HOMEPAGE_DEFAULT_PLATFORM_DETAILS_SUBTITLE_AR,
  HOMEPAGE_DEFAULT_PLATFORM_DETAILS_TITLE_AR,
  HOMEPAGE_DEFAULT_PLATFORM_NEWS_TITLE_AR,
  HOMEPAGE_DEFAULT_SOCIAL_LEFT_LABEL_AR,
  HOMEPAGE_DEFAULT_SOCIAL_RIGHT_LABEL_AR,
  HOMEPAGE_DEFAULT_STORE_SECTION_DESCRIPTION_AR,
  HOMEPAGE_DEFAULT_STORE_SECTION_TITLE_AR,
} from "@/lib/homepage-known-defaults";
import { homepageDefaultForLocale } from "@/lib/homepage-default-for-locale";
import { pickLocalizedText } from "@/lib/i18n/localized-field";
import type { ResolvedHomepageCopy } from "@/lib/homepage-copy";

type CourseWithCategory = Awaited<ReturnType<typeof getCoursesPublished>>[number];

export async function HomePageBelowFold({
  homepageSettings,
  homepageCopy,
}: {
  homepageSettings: HomepageSetting;
  homepageCopy: ResolvedHomepageCopy;
}) {
  const [t, locale, session] = await Promise.all([
    getServerTranslator(),
    getLocaleFromCookie(),
    getServerSession(authOptions),
  ]);

  const emptyTeachers: Awaited<ReturnType<typeof listTeachersForHomepage>> = [];
  const emptyPlans: Awaited<ReturnType<typeof listActiveSubscriptionPlansPublic>> = [];

  const [
    teachersResult,
    subscriptionPlansResult,
    coursesResult,
    categoriesResult,
    excludedTeacherIds,
  ] = await Promise.all([
    homepageSettings.teachersEnabled
      ? listTeachersForHomepage().catch(() => emptyTeachers)
      : Promise.resolve(emptyTeachers),
    homepageSettings.subscriptionsEnabled
      ? listActiveSubscriptionPlansPublic().catch(() => emptyPlans)
      : Promise.resolve(emptyPlans),
    getCoursesPublished(true).catch(() => [] as CourseWithCategory[]),
    getCategories().catch(() => []),
    getTeacherIdsExcludedFromPublicCourseLists(),
  ]);

  const teachersForHome = teachersResult;
  const subscriptionPlansHome = subscriptionPlansResult;
  const teachersSectionEnabled = homepageSettings.teachersEnabled;
  const subscriptionsSectionEnabled = homepageSettings.subscriptionsEnabled;
  const storeSectionEnabled = homepageSettings.storeEnabled;

  let studentPlatformSubscription: { active: boolean; expiresAtIso: string | null } | null = null;
  if (
    homepageSettings.subscriptionsEnabled &&
    session?.user?.role === "STUDENT" &&
    session.user.id
  ) {
    try {
      const active = await userHasActivePlatformSubscription(session.user.id);
      const exp = active ? await getLatestPlatformSubscriptionExpiry(session.user.id) : null;
      studentPlatformSubscription = {
        active,
        expiresAtIso: exp ? exp.toISOString() : null,
      };
    } catch {
      studentPlatformSubscription = { active: false, expiresAtIso: null };
    }
  }

  const configuredPlatformNewsSlides = parsePlatformNewsItems(homepageSettings.platformNewsItems);
  const localizedPlatformNewsSlides = configuredPlatformNewsSlides.map((item) => ({
    ...item,
    description: pickLocalizedText(locale, item.description, item.descriptionEn),
  }));
  const showPlatformNewsSection =
    localizedPlatformNewsSlides.length > 0 &&
    Boolean(homepageSettings.platformNewsEnabled);

  const teachersHomePreview =
    teachersForHome.length > 0
      ? selectTeachersForHomepagePreview(teachersForHome, teachersForHome.length).map(({ homepageOrder, ...row }) => {
          void homepageOrder;
          return row;
        })
      : [];

  const platformDetailsItems = parsePlatformDetailsItems(homepageSettings.platformDetailsItems);
  const localizedPlatformDetailsItems = platformDetailsItems.map((item) => ({
    ...item,
    title: pickLocalizedText(locale, item.title, item.titleEn),
    description: pickLocalizedText(locale, item.description, item.descriptionEn),
  }));

  const platformDetailsTitle = homepageDefaultForLocale(
    locale,
    pickLocalizedText(locale, homepageSettings.platformDetailsTitle, homepageSettings.platformDetailsTitleEn),
    HOMEPAGE_DEFAULT_PLATFORM_DETAILS_TITLE_AR,
    "home.platformDetailsDefaultTitle",
    t,
    "Qalam, the ideal solution!",
  );
  const platformDetailsSubtitle = homepageDefaultForLocale(
    locale,
    pickLocalizedText(locale, homepageSettings.platformDetailsSubtitle, homepageSettings.platformDetailsSubtitleEn),
    HOMEPAGE_DEFAULT_PLATFORM_DETAILS_SUBTITLE_AR,
    "home.platformDetailsDefaultSubtitle",
    t,
    "Discover what makes the platform stand out",
  );
  const storeSectionTitle = homepageDefaultForLocale(
    locale,
    pickLocalizedText(locale, homepageSettings.storeSectionTitle, homepageSettings.storeSectionTitleEn),
    HOMEPAGE_DEFAULT_STORE_SECTION_TITLE_AR,
    "home.storeSectionDefaultTitle",
    t,
    "Platform Store",
  );
  const storeSectionDescription = homepageDefaultForLocale(
    locale,
    pickLocalizedText(
      locale,
      homepageSettings.storeSectionDescription,
      homepageSettings.storeSectionDescriptionEn,
    ),
    HOMEPAGE_DEFAULT_STORE_SECTION_DESCRIPTION_AR,
    "home.storeSectionDefaultDescription",
    t,
    "Welcome to the platform store with essential study materials and books. Choose what suits your needs and benefit from organized digital content that supports your learning journey.",
  );
  const platformNewsTitle = homepageDefaultForLocale(
    locale,
    pickLocalizedText(
      locale,
      homepageSettings.platformNewsSectionTitle,
      homepageSettings.platformNewsSectionTitleEn,
    ),
    HOMEPAGE_DEFAULT_PLATFORM_NEWS_TITLE_AR,
    "home.platformNewsDefaultTitle",
    t,
    "Platform News",
  );
  return (
    <>
      {teachersSectionEnabled ? <HomeTeachersSection enabled initialTeachers={[...HOMEPAGE_DEMO_INSTRUCTORS.map((teacher) => ({ ...teacher, name: homepageCopy[`demoTeacher.${teacher.id}.name`], nameEn: homepageCopy[`demoTeacher.${teacher.id}.name`], teacherSubject: homepageCopy[`demoTeacher.${teacher.id}.subject`], teacherSubjectEn: homepageCopy[`demoTeacher.${teacher.id}.subject`] })), ...teachersHomePreview]} copy={homepageCopy} variant="spotlight" /> : null}
      <HomePlatformDetailsSection
        variant="achievements"
        title={homepageCopy.achievementsTitle}
        subtitle={homepageCopy.achievementsDescription}
        items={getAcademyMilestones(locale).map((item) => ({ ...item, title: homepageCopy[`milestone.${item.id}.value`], description: homepageCopy[`milestone.${item.id}.label`] }))}
      />
      <HomeContentCategories locale={locale} copy={homepageCopy} categories={categoriesResult.map((category) => {
        const row = category as typeof category & { nameAr?: string | null; imageUrl?: string | null };
        const categoryCourses = coursesResult.filter((course) => {
          const c = course as CourseWithCategory & { category?: { slug?: string }; createdById?: string | null; imageUrl?: string | null };
          return c.category?.slug === category.slug && (!c.createdById || !excludedTeacherIds.has(c.createdById));
        });
        const firstCourse = categoryCourses[0] as (CourseWithCategory & { imageUrl?: string | null }) | undefined;
        return {
          slug: category.slug,
          name: pickLocalizedText(locale, row.nameAr ?? row.name_ar, row.name),
          imageUrl: row.imageUrl || row.image_url || firstCourse?.imageUrl || firstCourse?.image_url || null,
          count: categoryCourses.length,
        };
      })} />
      <HomeMobileAppSection locale={locale} copy={homepageCopy} />



      {homepageSettings.platformDetailsEnabled && platformDetailsItems.length > 0 ? (
        <HomePlatformDetailsSection
          title={platformDetailsTitle}
          subtitle={platformDetailsSubtitle || null}
          backgroundColor={homepageSettings.platformDetailsBackgroundColor?.trim() || null}
          items={localizedPlatformDetailsItems}
        />
      ) : null}

      {subscriptionsSectionEnabled ? (
        <HomeSubscriptionsSection
          enabled
          plans={subscriptionPlansHome}
          isStudent={session?.user?.role === "STUDENT"}
          isLoggedIn={!!session}
          studentPlatformSubscription={studentPlatformSubscription}
          copy={homepageCopy}
        />
      ) : null}

      {storeSectionEnabled ? (
        <HomeStoreSection
          sectionTitle={storeSectionTitle}
          sectionDescription={storeSectionDescription}
          copy={homepageCopy}
        />
      ) : null}

      {showPlatformNewsSection ? (
        <section className="border-t border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-12 sm:px-6">
          <div className="mx-auto max-w-6xl">
            <h2 className="mb-6 text-2xl font-bold text-[var(--color-foreground)]">
              {platformNewsTitle}
            </h2>
            <HomePlatformNewsSlider items={localizedPlatformNewsSlides} copy={homepageCopy} />
          </div>
        </section>
      ) : null}

      {(() => {
        const ytIcon = (
          <svg className="h-7 w-7" fill="currentColor" viewBox="0 0 24 24" aria-hidden>
            <path d="M23.5 6.2a3 3 0 0 0-2.1-2.1C19.5 3.5 12 3.5 12 3.5s-7.5 0-9.4.6A3 3 0 0 0 .5 6.2 31 31 0 0 0 0 12a31 31 0 0 0 .5 5.8 3 3 0 0 0 2.1 2.1c1.9.6 9.4.6 9.4.6s7.5 0 9.4-.6a3 3 0 0 0 2.1-2.1A31 31 0 0 0 24 12a31 31 0 0 0-.5-5.8M9.6 15.8V8.2L16.2 12z" />
          </svg>
        );
        const liIcon = (
          <svg className="h-7 w-7" fill="currentColor" viewBox="0 0 24 24" aria-hidden>
            <path d="M20.45 20.45h-3.56v-5.57c0-1.33-.02-3.04-1.85-3.04-1.86 0-2.14 1.45-2.14 2.95v5.66H9.34V9h3.42v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46zM5.34 7.43a2.06 2.06 0 1 1 0-4.12 2.06 2.06 0 0 1 0 4.12M7.12 20.45H3.56V9h3.56z" />
          </svg>
        );
        const fbIcon = (
          <svg className="h-7 w-7" fill="currentColor" viewBox="0 0 24 24" aria-hidden>
            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
          </svg>
        );
        const waIcon = (
          <svg className="h-7 w-7" fill="currentColor" viewBox="0 0 24 24" aria-hidden>
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
          </svg>
        );
        const tgIcon = (
          <svg className="h-7 w-7" fill="currentColor" viewBox="0 0 24 24" aria-hidden>
            <path d="M9.78 15.87 9.4 21c.54 0 .78-.23 1.06-.5l2.55-2.44 5.28 3.87c.97.53 1.65.25 1.91-.9L23.65 4.8c.34-1.4-.5-1.95-1.44-1.6L1.85 11.09c-1.39.54-1.37 1.32-.24 1.67l5.2 1.62L18.9 6.7c.57-.35 1.1-.16.67.22" />
          </svg>
        );

        const baseBtn =
          "group fixed z-50 hidden items-center gap-2 rounded-full border border-white/15 bg-black/25 p-2 text-white shadow-[0_12px_30px_rgba(0,0,0,0.25)] backdrop-blur-md transition hover:bg-black/35 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60 md:inline-flex";
        const circle =
          "flex h-11 w-11 items-center justify-center rounded-full shadow-sm transition group-hover:scale-[1.03]";
        const label =
          "pointer-events-none hidden select-none rounded-full bg-black/50 px-3 py-1 text-xs font-semibold tracking-wide text-white/95 shadow-sm md:inline-flex md:translate-x-0 md:opacity-100 group-hover:inline-flex group-hover:opacity-100 group-focus-visible:inline-flex";

        const verticalPositions = ["bottom-6", "bottom-24", "bottom-42", "bottom-60", "bottom-78"] as const;
        const rightLabelWord = homepageDefaultForLocale(
          locale,
          pickLocalizedText(locale, homepageSettings.socialRightLabel, homepageSettings.socialRightLabelEn),
          HOMEPAGE_DEFAULT_SOCIAL_RIGHT_LABEL_AR,
          "home.socialRightDefaultLabel",
          t,
          "Support",
        );
        const leftLabelWord = homepageDefaultForLocale(
          locale,
          pickLocalizedText(locale, homepageSettings.socialLeftLabel, homepageSettings.socialLeftLabelEn),
          HOMEPAGE_DEFAULT_SOCIAL_LEFT_LABEL_AR,
          "home.socialLeftDefaultLabel",
          t,
          "Team support",
        );
        const leftEnabled = homepageSettings.socialLeftEnabled !== false;

        const rightLinks = [
          {
            href: homepageSettings.youtubeUrl?.trim() || null,
            label: `${rightLabelWord} (YouTube)`,
            title: `YouTube — ${rightLabelWord}`,
            ariaLabel: `يوتيوب ${rightLabelWord} (يمين)`,
            icon: ytIcon,
            bg: "bg-[#FF0000]",
          },
          {
            href: homepageSettings.linkedinUrl?.trim() || null,
            label: `${rightLabelWord} (LinkedIn)`,
            title: `LinkedIn — ${rightLabelWord}`,
            ariaLabel: `لينكدإن ${rightLabelWord} (يمين)`,
            icon: liIcon,
            bg: "bg-[#0A66C2]",
          },
          {
            href: homepageSettings.facebookUrl?.trim() || null,
            label: `${rightLabelWord} (Facebook)`,
            title: `فيسبوك — ${rightLabelWord}`,
            ariaLabel: `فيسبوك ${rightLabelWord} (يمين)`,
            icon: fbIcon,
            bg: "bg-[#1877F2]",
          },
          {
            href: homepageSettings.whatsappUrl?.trim() || null,
            label: `${rightLabelWord} (WhatsApp)`,
            title: `واتساب — ${rightLabelWord}`,
            ariaLabel: `واتساب ${rightLabelWord} (يمين)`,
            icon: waIcon,
            bg: "bg-[#25D366]",
          },
          {
            href: homepageSettings.telegramUrl?.trim() || null,
            label: `${rightLabelWord} (Telegram)`,
            title: `Telegram — ${rightLabelWord}`,
            ariaLabel: `تليجرام ${rightLabelWord} (يمين)`,
            icon: tgIcon,
            bg: "bg-[#229ED9]",
          },
        ].filter((item) => item.href);

        const leftLinks = leftEnabled
          ? [
          {
            href: homepageSettings.teamYoutubeUrl?.trim() || null,
            label: `${leftLabelWord} (YouTube)`,
            title: `YouTube — ${leftLabelWord}`,
            ariaLabel: `يوتيوب ${leftLabelWord} (يسار)`,
            icon: ytIcon,
            bg: "bg-[#FF0000]",
          },
          {
            href: homepageSettings.teamLinkedinUrl?.trim() || null,
            label: `${leftLabelWord} (LinkedIn)`,
            title: `LinkedIn — ${leftLabelWord}`,
            ariaLabel: `لينكدإن ${leftLabelWord} (يسار)`,
            icon: liIcon,
            bg: "bg-[#0A66C2]",
          },
          {
            href: homepageSettings.teamFacebookUrl?.trim() || null,
            label: `${leftLabelWord} (Facebook)`,
            title: `فيسبوك — ${leftLabelWord}`,
            ariaLabel: `فيسبوك ${leftLabelWord} (يسار)`,
            icon: fbIcon,
            bg: "bg-[#1877F2]",
          },
          {
            href: homepageSettings.teamWhatsappUrl?.trim() || null,
            label: `${leftLabelWord} (WhatsApp)`,
            title: `واتساب — ${leftLabelWord}`,
            ariaLabel: `واتساب ${leftLabelWord} (يسار)`,
            icon: waIcon,
            bg: "bg-[#25D366]",
          },
          {
            href: homepageSettings.teamTelegramUrl?.trim() || null,
            label: `${leftLabelWord} (Telegram)`,
            title: `Telegram — ${leftLabelWord}`,
            ariaLabel: `تليجرام ${leftLabelWord} (يسار)`,
            icon: tgIcon,
            bg: "bg-[#229ED9]",
          },
        ].filter((item) => item.href)
          : [];

        return (
          <>
            {rightLinks.map((item, idx) => (
              <a
                key={`right-${item.label}`}
                href={item.href!}
                target="_blank"
                rel="noopener noreferrer"
                className={`${baseBtn} ${verticalPositions[Math.min(idx, verticalPositions.length - 1)]} right-4 md:right-6`}
                aria-label={item.ariaLabel}
                title={item.title}
              >
                <span className={`${circle} ${item.bg}`}>{item.icon}</span>
                <span className={label}>{item.label}</span>
              </a>
            ))}
            {leftLinks.map((item, idx) => (
              <a
                key={`left-${item.label}`}
                href={item.href!}
                target="_blank"
                rel="noopener noreferrer"
                className={`${baseBtn} ${verticalPositions[Math.min(idx, verticalPositions.length - 1)]} left-4 md:left-6`}
                aria-label={item.ariaLabel}
                title={item.title}
              >
                <span className={`${circle} ${item.bg}`}>{item.icon}</span>
                <span className={label}>{item.label}</span>
              </a>
            ))}
          </>
        );
      })()}
    </>
  );
}

export function HomePageBelowFoldFallback() {
  return (
    <div className="min-h-[40vh] animate-pulse bg-[var(--color-surface)]" aria-busy="true" aria-label="Loading content">
      <div className="mx-auto max-w-6xl space-y-6 px-4 py-16 sm:px-6">
        <div className="h-8 w-48 rounded bg-[var(--color-border)]" />
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-48 rounded-[var(--radius-card)] bg-[var(--color-border)]/60" />
          ))}
        </div>
      </div>
    </div>
  );
}
