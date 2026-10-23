"use client";

import Link from "next/link";

export function HomeMarketplaceHero({
  title,
  subtitle,
  ctaLabel,
  eyebrow,
  locale,
}: {
  title: string;
  subtitle: string;
  ctaLabel: string;
  eyebrow: string;
  locale: "ar" | "en";
}) {
  return (
    <section className="filseka-hero relative isolate min-h-[calc(100svh-68px)] overflow-hidden sm:min-h-[560px]" aria-label={title}>
      <video
        className="filseka-hero-video absolute inset-0 z-0 h-full w-full object-cover sm:-z-20 sm:inset-y-0 sm:left-[2.5%] sm:right-auto sm:w-1/2 sm:object-contain"
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
        poster="/logo.png"
        aria-hidden="true"
      >
        <source src="/logo.MP4" type="video/mp4" />
      </video>
      <div className="filseka-hero-shade absolute inset-0 z-[2] sm:-z-10" />
      <div className="pointer-events-none absolute inset-0 z-[3] overflow-hidden sm:-z-10" aria-hidden>
        <div className="filseka-orbit filseka-orbit-one" />
        <div className="filseka-orbit filseka-orbit-two" />
        <div className="filseka-hero-glow" />
      </div>

      <div dir="ltr" className="relative z-10 mx-auto flex min-h-[calc(100svh-68px)] max-w-[1440px] items-end justify-end px-5 pb-10 pt-24 sm:min-h-[560px] sm:px-10 sm:pb-24 sm:pt-28 lg:px-16">
        <div className="w-full max-w-3xl sm:w-[47%]" dir={locale === "ar" ? "rtl" : "ltr"}>
          <p className="mb-3 inline-flex items-center gap-2 text-xs font-bold tracking-[0.22em] text-white/75 sm:mb-5 sm:text-sm">
            <span className="h-2 w-2 rounded-full bg-[var(--color-primary)] shadow-[0_0_16px_var(--color-primary)]" />
            {eyebrow}
          </p>
          <h1 className="max-w-3xl text-3xl font-black leading-[1.16] tracking-tight text-white sm:text-6xl lg:text-7xl">
            {title}
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-6 text-white/75 sm:mt-5 sm:text-xl sm:leading-9">
            {subtitle}
          </p>
          <div className="mt-6 flex flex-wrap items-center gap-4 sm:mt-8">
            <Link href="/courses" className="filseka-primary-button inline-flex min-h-12 items-center gap-3 rounded-full px-7 py-3 text-sm font-bold text-white transition hover:-translate-y-0.5 sm:text-base">
              {ctaLabel}<span aria-hidden>↗</span>
            </Link>
          </div>
        </div>
      </div>

      <div className="pointer-events-none absolute bottom-0 inset-x-0 z-[4] h-20 bg-gradient-to-t from-black to-transparent" aria-hidden />
    </section>
  );
}
