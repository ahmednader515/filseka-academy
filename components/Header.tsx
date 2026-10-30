"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import type { ResolvedHomepageCopy } from "@/lib/homepage-copy";
import { LanguageToggle } from "@/components/LanguageToggle";
import { ProfileDropdown } from "@/components/ProfileDropdown";
import controls from "@/components/HeaderControls.module.css";
import { useLocale, useT } from "@/components/LocaleProvider";

export function Header({
  platformSubscriptionExpiryLabel,
  homepageCopy,
}: {
  homepageCopy: ResolvedHomepageCopy;
  /** للطالب ذي اشتراك منصة نشط: نص تاريخ انتهاء الاشتراك (مُنسَّق من السيرفر) */
  platformSubscriptionExpiryLabel?: string | null;
}) {
  const { data: session, status } = useSession();
  const t = useT();
  const ar = useLocale() === "ar";
  const router = useRouter();
  const headerRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const element = headerRef.current;
    if (!element) return;
    const updateHeight = () => document.documentElement.style.setProperty("--platform-header-height", `${element.getBoundingClientRect().height}px`);
    updateHeight();
    const observer = new ResizeObserver(updateHeight);
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return (
    <header ref={headerRef} className="filseka-header sticky top-0 z-50 border-b border-white/10 bg-[#080808]/95 text-white backdrop-blur-xl">
      <div className="platform-header-inner mx-auto flex h-[68px] max-w-[1500px] items-center justify-between gap-2 px-3 sm:gap-3 sm:px-8 lg:px-12">
        <form role="search" action="/courses" className="platform-header-search" onSubmit={(event) => {
          event.preventDefault();
          const query = String(new FormData(event.currentTarget).get("q") ?? "").trim();
          router.push(query ? `/courses?q=${encodeURIComponent(query)}` : "/courses");
        }}>
          <label htmlFor="platform-search" className="sr-only">{homepageCopy.headerSearchLabel}</label>
          <input id="platform-search" name="q" type="search" placeholder={homepageCopy.headerSearchPlaceholder} autoComplete="off" />
          <button type="submit" aria-label={homepageCopy.headerSearchButton}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6.5" /><path d="m16 16 5 5" /></svg>
          </button>
        </form>

        <div className={controls.actions}>
          <LanguageToggle />
          {status === "loading" ? (
            <span className="text-sm text-white/60">...</span>
          ) : session ? (
            <ProfileDropdown user={session.user} />
          ) : (
            <>
              <Link href="/login" className="inline-flex whitespace-nowrap rounded-full px-1.5 py-2 text-[11px] font-semibold text-white/80 transition hover:text-white sm:px-3 sm:text-sm">{homepageCopy.headerLogin}</Link>
              <Link href="/register" className="filseka-primary-button whitespace-nowrap rounded-full px-2.5 py-2 text-[11px] font-bold text-white transition hover:-translate-y-0.5 sm:px-5 sm:py-2.5 sm:text-sm">{homepageCopy.headerRegister}</Link>
            </>
          )}
          
        </div>
      </div>
      {platformSubscriptionExpiryLabel ? (
        <div className="border-t border-red-500/35 bg-gradient-to-l from-red-950/80 to-slate-900/90 py-2.5 text-center text-xs leading-relaxed text-red-50 sm:text-sm">
          <span className="font-semibold text-red-200">{t("header.platformSubscriptionActive", "You are subscribed to the platform subscription")}</span>
          {" — "}
          <span className="text-teal-100/95">
            {t("header.endsAt", "Expires at:")} <time className="font-medium text-white">{platformSubscriptionExpiryLabel}</time>
          </span>
        </div>
      ) : null}
    </header>
  );
}
