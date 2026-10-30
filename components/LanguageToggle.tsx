"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { LOCALE_COOKIE_NAME } from "@/lib/i18n/constants";
import { useLocale, useT } from "./LocaleProvider";
import styles from "./HeaderControls.module.css";

export function LanguageToggle() {
  const locale = useLocale();
  const t = useT();
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const nextLocale = locale === "ar" ? "en" : "ar";

  function handleToggle() {
    document.cookie = `${LOCALE_COOKIE_NAME}=${nextLocale}; path=/; max-age=31536000; samesite=lax`;
    startTransition(() => router.refresh());
  }

  return (
    <button
      type="button"
      onClick={handleToggle}
      className={styles.language}
      disabled={pending}
      aria-busy={pending}
      aria-label={nextLocale === "ar" ? t("lang.switchToAr", "Switch to Arabic") : t("lang.switchToEn", "Switch to English")}
      title={nextLocale === "ar" ? t("lang.switchToAr", "Switch to Arabic") : t("lang.switchToEn", "Switch to English")}
    >
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3a17 17 0 0 1 0 18 17 17 0 0 1 0-18Z" /></svg>
      <span className={styles.languageLabel} lang={nextLocale}>{nextLocale === "ar" ? "العربية" : "English"}</span>
      <span className={styles.languageCode} lang={nextLocale}>{nextLocale === "ar" ? "ع" : "EN"}</span>
    </button>
  );
}
