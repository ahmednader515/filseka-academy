import Image from "next/image";
import Link from "next/link";

export type HomeCourseFeature = {
  title: string;
  description: string;
  category: string;
  duration: string | null;
  imageUrl: string | null;
  slug: string;
};

export function HomeCourseShowcase({
  course,
  locale,
}: {
  course: HomeCourseFeature;
  locale: "ar" | "en";
}) {
  const ar = locale === "ar";
  const courseHref = `/courses/${encodeURIComponent(course.slug)}`;

  return (
    <section className="filseka-showcase mx-auto max-w-[1440px] px-5 py-8 sm:px-10 sm:py-12 lg:px-16" aria-label={ar ? "دورة مميزة" : "Featured course"}>
      <div>
        <article className="filseka-showcase-feature group relative grid min-h-[300px] overflow-hidden rounded-2xl border border-white/10 bg-[#101010] sm:min-h-[350px] sm:grid-cols-2">
          <div className="filseka-showcase-art relative min-h-[190px] overflow-hidden sm:min-h-full">
            {course.imageUrl ? (
              <Image src={course.imageUrl} alt="" fill sizes="(max-width: 640px) 100vw, 50vw" className="object-cover transition-transform duration-700 group-hover:scale-105" />
            ) : null}
            <div className="absolute inset-0 bg-gradient-to-t from-black/35 to-transparent sm:bg-gradient-to-l sm:from-transparent sm:to-black/30" />
          </div>
          <div className="relative flex flex-col justify-center p-6 sm:p-8 lg:p-10" dir={ar ? "rtl" : "ltr"}>
            <span className="mb-4 inline-flex w-fit items-center gap-2 rounded-full border border-[var(--color-primary)]/40 bg-[var(--color-primary)]/10 px-3 py-1 text-xs font-bold text-red-200">
              <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-primary)]" />
              {ar ? "اختيار هذا الأسبوع" : "THIS WEEK’S PICK"}
            </span>
            <p className="text-xs font-semibold text-white/50">{course.category}</p>
            <h2 className="mt-2 text-2xl font-extrabold leading-tight text-white sm:text-3xl">{course.title}</h2>
            <p className="mt-3 max-w-xl text-sm leading-7 text-white/65 sm:text-base">{course.description}</p>
            <div className="mt-5 flex flex-wrap items-center gap-3 text-xs text-white/60">
              {course.duration ? <span className="inline-flex items-center gap-2"><span aria-hidden>◷</span>{course.duration}</span> : null}
              <span className="h-1 w-1 rounded-full bg-white/35" aria-hidden />
              <span>{ar ? "دورة عملية خطوة بخطوة" : "A practical step-by-step course"}</span>
            </div>
            <Link href={courseHref} className="filseka-primary-button mt-6 inline-flex min-h-11 w-fit items-center gap-3 rounded-full px-5 py-2.5 text-sm font-bold text-white transition hover:-translate-y-0.5">
              {ar ? "ابدأ الآن" : "Start learning"}<span aria-hidden>↗</span>
            </Link>
          </div>
        </article>
      </div>
    </section>
  );
}
