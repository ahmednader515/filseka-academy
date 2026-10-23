import Link from "next/link";
import {
  HOMEPAGE_LEARNING_PROGRAMS,
  HOMEPAGE_PODCASTS,
  HOMEPAGE_PODCOURSES,
  type EditorialCard,
} from "@/lib/homepage-editorial-content";
import type { ResolvedHomepageCopy } from "@/lib/homepage-copy";

type Locale = "ar" | "en";

function EditorialCollection({
  title,
  subtitle,
  items,
  locale,
  groupKey,
  copy,
}: {
  title: string;
  subtitle: string;
  items: EditorialCard[];
  locale: Locale;
  groupKey: string;
  copy: ResolvedHomepageCopy;
}) {
  const ar = locale === "ar";

  return (
    <section className="filseka-course-section px-5 py-12 sm:px-10 lg:px-16" dir={ar ? "rtl" : "ltr"}>
      <div className="mx-auto max-w-[1440px]">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl font-extrabold text-white sm:text-3xl">{title}</h2>
            <p className="mt-2 text-sm text-white/55">{subtitle}</p>
          </div>
          <Link href="/courses" className="text-sm font-semibold text-[var(--color-primary)] hover:underline">
            {copy.editorialExploreMore} <span aria-hidden>←</span>
          </Link>
        </div>
        <div className="filseka-course-track flex snap-x gap-4 overflow-x-auto pb-4">
          {items.map((item, index) => (
            <Link key={item.title} href="/courses" className="filseka-editorial-card group block w-[min(78vw,320px)] shrink-0 snap-start overflow-hidden rounded-xl border border-white/10 bg-[#111] transition hover:-translate-y-1 hover:border-[var(--color-primary)]/50 sm:w-[340px]">
              <div className="relative aspect-[16/10] overflow-hidden">
                <img src={item.imageUrl} alt="" className="h-full w-full object-cover transition duration-500 group-hover:scale-105" loading="lazy" />
                <span className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" aria-hidden />
                <span className="absolute bottom-3 start-3 rounded-full bg-black/55 px-3 py-1 text-xs text-white/85 backdrop-blur">{copy[`editorial.${groupKey}.card.${index}.meta`]}</span>
              </div>
              <div className="p-4">
                <h3 className="line-clamp-2 min-h-12 text-base font-bold leading-6 text-white">{copy[`editorial.${groupKey}.card.${index}.title`]}</h3>
                <p className="mt-2 line-clamp-2 min-h-12 text-sm leading-6 text-white/55">{copy[`editorial.${groupKey}.card.${index}.description`]}</p>
                <span className="mt-4 inline-flex items-center gap-2 text-xs font-bold text-[var(--color-primary)]">
                  {copy.editorialExploreCourses}<span aria-hidden>↗</span>
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

export function HomeEditorialCollections({ locale, copy }: { locale: Locale; copy: ResolvedHomepageCopy }) {
  const ar = locale === "ar";
  return (
    <>
      <EditorialCollection
        locale={locale}
        title={copy["editorial.podcourses.title"]}
        subtitle={copy["editorial.podcourses.subtitle"]}
        items={HOMEPAGE_PODCOURSES}
        groupKey="podcourses"
        copy={copy}
      />
      <EditorialCollection
        locale={locale}
        title={copy["editorial.podcasts.title"]}
        subtitle={copy["editorial.podcasts.subtitle"]}
        items={HOMEPAGE_PODCASTS}
        groupKey="podcasts"
        copy={copy}
      />
      <EditorialCollection
        locale={locale}
        title={copy["editorial.learningPrograms.title"]}
        subtitle={copy["editorial.learningPrograms.subtitle"]}
        items={HOMEPAGE_LEARNING_PROGRAMS}
        groupKey="learningPrograms"
        copy={copy}
      />
    </>
  );
}
