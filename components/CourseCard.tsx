"use client";

import Link from "next/link";
import { useLocale, useT } from "./LocaleProvider";

function normalizeCoursePrice(
  price: number | { toNumber?: () => number } | string | undefined,
): number | null {
  if (price === undefined || price === null || price === "") return null;
  if (typeof price === "object" && price !== null && typeof price.toNumber === "function") {
    const n = price.toNumber();
    return Number.isFinite(n) ? n : null;
  }
  const n = Number(price);
  return Number.isFinite(n) ? n : null;
}

type Course = {
  id: string;
  title?: string | null;
  titleAr?: string | null;
  title_ar?: string | null;
  slug?: string | null;
  shortDesc?: string | null;
  shortDescEn?: string | null;
  short_desc?: string | null;
  short_desc_en?: string | null;
  duration?: string | null;
  level?: string | null;
  imageUrl?: string | null;
  image_url?: string | null;
  price?: number | { toNumber?: () => number } | string;
  courseRating?: number | { toNumber?: () => number } | string | null;
  course_rating?: number | { toNumber?: () => number } | string | null;
  courseRatingCount?: number | { toNumber?: () => number } | string | null;
  course_rating_count?: number | { toNumber?: () => number } | string | null;
  category?: { name?: string | null; nameAr?: string | null; name_ar?: string | null; slug?: string | null } | null;
};

export function CourseCard({ course }: { course: Course }) {
  const locale = useLocale();
  const t = useT();
  const titleEn = course.title || course.titleAr || course.title_ar || "";
  const titleAr = course.titleAr || course.title_ar || course.title || "";
  const displayTitle = locale === "en" ? titleEn : titleAr;
  const categoryName =
    locale === "en"
      ? (course.category?.name || course.category?.nameAr || course.category?.name_ar)
      : (course.category?.nameAr || course.category?.name_ar || course.category?.name);
  const shortDescription =
    locale === "en"
      ? (course.shortDescEn || course.short_desc_en || course.shortDesc || course.short_desc)
      : (course.shortDesc || course.short_desc || course.shortDescEn || course.short_desc_en);
  const slugOrId = (course.slug && course.slug.trim()) ? encodeURIComponent(course.slug.trim()) : course.id;
  const href = slugOrId ? `/courses/${slugOrId}` : "/courses";
  const priceValue = normalizeCoursePrice(course.price);
  const courseRatingValue = normalizeCoursePrice(course.courseRating ?? course.course_rating ?? undefined);
  const courseRatingCountValue = normalizeCoursePrice(course.courseRatingCount ?? course.course_rating_count ?? undefined);
  const hasCourseRating =
    courseRatingValue !== null &&
    courseRatingValue > 0 &&
    courseRatingCountValue !== null &&
    courseRatingCountValue > 0;
  const priceDisplay =
    priceValue !== null && priceValue > 0 ? priceValue.toFixed(2) : null;
  const isPaid = priceDisplay !== null;

  return (
    <Link
      href={href}
      className="filseka-course-card group block snap-start overflow-hidden rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[var(--shadow-card)] transition hover:-translate-y-1 hover:shadow-[var(--shadow-hover)] hover:border-[var(--color-primary)]/30"
    >
      <div className="filseka-course-card-art relative aspect-video w-full overflow-hidden bg-gradient-to-br from-[var(--color-primary)]/20 to-[var(--color-primary-light)]/30 flex items-center justify-center">
        {(course.imageUrl || course.image_url) ? (
          <img
            src={course.imageUrl || course.image_url || undefined}
            alt=""
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
            decoding="async"
          />
        ) : (
          <span className="text-4xl opacity-50">📚</span>
        )}
        <span className="absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-transparent" aria-hidden />
        <span className="absolute bottom-3 end-3 flex h-9 w-9 items-center justify-center rounded-full border border-white/30 bg-black/45 text-white backdrop-blur" aria-hidden>
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8l1.1 1.1L12 21l7.8-7.5 1.1-1.1a5.5 5.5 0 0 0-.1-7.8Z" />
          </svg>
        </span>
      </div>
      <div className="flex min-h-[185px] flex-col p-4 sm:p-5">
        <div className="flex items-center justify-between gap-3">
          {categoryName ? (
          <span className="text-xs font-semibold text-[var(--color-primary)]">
            {categoryName}
          </span>
          ) : <span />}
          <span className="shrink-0 text-xs text-[var(--color-muted)]" dir="ltr">
            {hasCourseRating ? <><span className="text-amber-400">★</span> <span className="font-semibold text-white">{courseRatingValue.toFixed(1)}</span> <span>({Math.round(courseRatingCountValue)})</span></> : null}
          </span>
        </div>
        <h3 className="mt-2 min-h-[3.25rem] text-[17px] font-bold leading-6 text-[var(--color-foreground)] group-hover:text-[var(--color-primary)]">
          {displayTitle}
        </h3>
        {shortDescription ? <p className="mt-1 line-clamp-2 text-sm leading-6 text-[var(--color-muted)]">{shortDescription}</p> : null}
        {/* السعر أولًا في DOM ليظهر على يمين الصف في RTL */}
        <div className="mt-auto flex flex-wrap items-center justify-between gap-x-3 gap-y-2 border-t border-white/10 pt-3">
          <div className="shrink-0">
            {isPaid ? (
              <span
                className="inline-flex items-stretch overflow-hidden rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[var(--shadow-card)]"
                dir="ltr"
              >
                <span className="flex items-center px-2.5 py-2 text-sm font-semibold tabular-nums text-[var(--color-foreground)]">
                  {priceDisplay}
                </span>
                <span className="flex items-center border-s border-[var(--color-border)] bg-[color-mix(in_srgb,var(--color-primary)_14%,var(--color-surface))] px-2 py-2 text-[11px] font-semibold uppercase tracking-wide text-[var(--color-muted)]">
                  {t("common.egyptianPoundShort", "EGP")}
                </span>
              </span>
            ) : (
              <span className="inline-flex items-center rounded-[var(--radius-btn)] border border-[var(--color-success)]/35 bg-[color-mix(in_srgb,var(--color-success)_12%,var(--color-surface))] px-2.5 py-2 text-xs font-semibold text-[var(--color-success)]">
                {t("common.free", "Free")}
              </span>
            )}
          </div>
          <div className="flex min-w-0 flex-1 flex-wrap items-center justify-end gap-2">
            {course.duration && (
              <span className="rounded-full bg-[var(--color-primary-light)]/55 px-2.5 py-1 text-xs text-[var(--color-primary)]">
                ⏱ {course.duration}
              </span>
            )}
            {course.level && (
              <span className="rounded-full bg-[var(--color-border)] px-2.5 py-1 text-xs text-[var(--color-muted)]">
                {course.level === "beginner" && t("common.beginner", "Beginner")}
                {course.level === "intermediate" && t("common.intermediate", "Intermediate")}
                {course.level === "advanced" && t("common.advanced", "Advanced")}
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
