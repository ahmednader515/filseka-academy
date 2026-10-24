"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { useState, useRef, useEffect } from "react";
import type { UserRole } from "@/lib/types";
import type { ResolvedHomepageCopy } from "@/lib/homepage-copy";
import { LanguageToggle } from "@/components/LanguageToggle";
import { useT, useLocalizedEnumValue } from "@/components/LocaleProvider";

function UserMenu() {
  const { data: session, status } = useSession();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const t = useT();

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (status !== "authenticated" || !session?.user) return null;

  const roleLabel: Record<UserRole, string> = {
    ADMIN: useLocalizedEnumValue("ADMIN", "header.role", "Admin"),
    ASSISTANT_ADMIN: useLocalizedEnumValue("ASSISTANT_ADMIN", "header.role", "Assistant admin"),
    STUDENT: useLocalizedEnumValue("STUDENT", "header.role", "Student"),
    TEACHER: useLocalizedEnumValue("TEACHER", "header.role", "Teacher"),
  };

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-surface)] px-2.5 py-2 text-sm font-medium text-[var(--color-foreground)] hover:bg-[var(--color-border)]/50 sm:px-3"
      >
        <span className="max-w-[96px] truncate sm:max-w-[120px]">{session.user.name}</span>
        <span className="text-[var(--color-muted)]">▼</span>
      </button>
      {open && (
        <div className="absolute left-0 top-full mt-1 w-48 rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-surface)] py-1 shadow-[var(--shadow-hover)]">
          <div className="border-b border-[var(--color-border)] px-3 py-2 text-xs text-[var(--color-muted)]">
            {roleLabel[session.user.role]}
          </div>
          <Link
            href="/dashboard"
            className="block px-3 py-2 text-sm hover:bg-[var(--color-border)]/50"
            onClick={() => setOpen(false)}
          >
            {t("header.dashboard", "Dashboard")}
          </Link>
          <Link
            href="/dashboard/profile"
            className="block px-3 py-2 text-sm hover:bg-[var(--color-border)]/50"
            onClick={() => setOpen(false)}
          >
            {t("header.editAccount", "Edit account")}
          </Link>
          <button
            type="button"
            className="w-full px-3 py-2 text-start text-sm text-red-600 hover:bg-[var(--color-border)]/50 dark:text-red-400"
            onClick={async () => {
              setOpen(false);
              try {
                await fetch("/api/auth/clear-session", { method: "POST", credentials: "include" });
              } catch {
                /* تجاهل خطأ الشبكة */
              }
              signOut({ callbackUrl: "/" });
            }}
          >
            {t("header.logout", "Log out")}
          </button>
        </div>
      )}
    </div>
  );
}

export function Header({
  platformName,
  headerLogoUrl,
  platformSubscriptionExpiryLabel,
  homepageCopy,
}: {
  platformName?: string | null;
  headerLogoUrl?: string | null;
  homepageCopy: ResolvedHomepageCopy;
  /** للطالب ذي اشتراك منصة نشط: نص تاريخ انتهاء الاشتراك (مُنسَّق من السيرفر) */
  platformSubscriptionExpiryLabel?: string | null;
}) {
  const { data: session, status } = useSession();
  const t = useT();
  const configuredName = platformName?.trim() ?? "";
  const trimmedName = configuredName === "منصة أستاذ عصام محي" || configuredName.toLowerCase() === "filseka academy"
    ? "Filseka Academy"
    : configuredName;
  const displayName = trimmedName || "Filseka Academy";
  const linkTitle = displayName || t("header.homePage", "Homepage");

  return (
    <header className="filseka-header sticky top-0 z-50 border-b border-white/10 bg-[#080808]/95 text-white backdrop-blur-xl">
      <div className="mx-auto flex h-[68px] max-w-[1500px] items-center justify-between gap-2 px-3 sm:gap-3 sm:px-8 lg:px-12">
        <Link href="/" className="flex min-w-0 shrink-0 items-center gap-1.5 sm:gap-3" title={linkTitle}>
          <span className="filseka-brand-mark relative grid h-9 w-9 shrink-0 place-items-center overflow-hidden sm:h-11 sm:w-11">
            {headerLogoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={headerLogoUrl} alt="" className="h-full w-full rounded-[10px] object-contain" />
            ) : (
              <video autoPlay muted loop playsInline preload="metadata" poster="/logo.png" aria-hidden className="h-full w-full object-contain">
                <source src="/logo.MP4" type="video/mp4" />
              </video>
            )}
          </span>
          <span className="max-w-[105px] truncate text-[13px] font-extrabold tracking-tight sm:max-w-none sm:text-lg">{displayName}</span>
        </Link>

        <nav className="hidden flex-1 items-center justify-center gap-5 lg:flex xl:gap-8" aria-label={homepageCopy.headerNavAria}>
          <Link href="/courses" className="text-sm font-medium text-white/75 transition hover:text-white">{homepageCopy.headerCourses}</Link>
          <Link href="/teachers" className="text-sm font-medium text-white/75 transition hover:text-white">{homepageCopy.headerTeachers}</Link>
          <Link href="/store" className="text-sm font-medium text-white/75 transition hover:text-white">{homepageCopy.headerStore}</Link>
          <Link href="/#home-next-section" className="text-sm font-medium text-white/75 transition hover:text-white">{homepageCopy.headerAbout}</Link>
        </nav>

        <div className="flex shrink-0 items-center gap-1 sm:gap-3">
          <span className="hidden sm:inline-flex"><LanguageToggle /></span>
          {status === "loading" ? (
            <span className="text-sm text-white/60">...</span>
          ) : session ? (
            <UserMenu />
          ) : (
            <>
              <Link href="/login" className="inline-flex whitespace-nowrap rounded-full px-1.5 py-2 text-[11px] font-semibold text-white/80 transition hover:text-white sm:px-3 sm:text-sm">{homepageCopy.headerLogin}</Link>
              <Link href="/register" className="filseka-primary-button whitespace-nowrap rounded-full px-2.5 py-2 text-[11px] font-bold text-white transition hover:-translate-y-0.5 sm:px-5 sm:py-2.5 sm:text-sm">{homepageCopy.headerRegister}</Link>
            </>
          )}
          <span className="sm:hidden"><LanguageToggle /></span>
        </div>
      </div>
      <div className="border-t border-white/5 lg:hidden">
        <nav className="mx-auto flex h-10 max-w-[1500px] items-center justify-around gap-3 overflow-x-auto px-3 sm:px-8" aria-label={homepageCopy.headerNavAria}>
          <Link href="/courses" className="shrink-0 whitespace-nowrap py-2 text-xs font-medium text-white/75 transition hover:text-white">{homepageCopy.headerCourses}</Link>
          <Link href="/teachers" className="shrink-0 whitespace-nowrap py-2 text-xs font-medium text-white/75 transition hover:text-white">{homepageCopy.headerTeachers}</Link>
          <Link href="/store" className="shrink-0 whitespace-nowrap py-2 text-xs font-medium text-white/75 transition hover:text-white">{homepageCopy.headerStore}</Link>
          <Link href="/#home-next-section" className="shrink-0 whitespace-nowrap py-2 text-xs font-medium text-white/75 transition hover:text-white">{homepageCopy.headerAbout}</Link>
        </nav>
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
