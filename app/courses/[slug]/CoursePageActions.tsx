"use client";

import { useEffect, useState } from "react";
import { useLocale, useT } from "@/components/LocaleProvider";

export function CoursePageActions({ courseId }: { courseId: string }) {
  const locale = useLocale();
  const t = useT();
  const [saved, setSaved] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    setSaved(window.localStorage.getItem(`saved-course:${courseId}`) === "true");
  }, [courseId]);

  function toggleSaved() {
    const next = !saved;
    setSaved(next);
    window.localStorage.setItem(`saved-course:${courseId}`, String(next));
  }

  async function shareCourse() {
    const shareData = { title: document.title, url: window.location.href };
    try {
      if (navigator.share) await navigator.share(shareData);
      else {
        await navigator.clipboard.writeText(shareData.url);
        setMessage(locale === "ar" ? "تم نسخ رابط الدورة" : "Course link copied");
      }
    } catch {
      setMessage(locale === "ar" ? "تعذرت مشاركة الدورة" : "Unable to share this course");
    }
  }

  return (
    <div className="mt-5 border-t border-white/10 pt-4">
      <div className="flex items-center gap-5">
        <button type="button" onClick={toggleSaved} className="inline-flex items-center gap-2 text-sm text-white/75 transition hover:text-white" aria-pressed={saved}>
          <svg className="h-5 w-5" viewBox="0 0 24 24" fill={saved ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.7" aria-hidden="true"><path d="M6 3.75h12a1 1 0 0 1 1 1v16l-7-4-7 4v-16a1 1 0 0 1 1-1Z" /></svg>
          {saved ? (locale === "ar" ? "تم حفظ الدورة" : "Course saved") : (locale === "ar" ? "حفظ الدورة" : "Save course")}
        </button>
        <button type="button" onClick={shareCourse} className="inline-flex items-center gap-2 text-sm text-white/75 transition hover:text-white">
          <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="m8.7 10.7 6.6-4.4m-6.6 7 6.6 4.4"/></svg>
          {t("common.share", locale === "ar" ? "شارك الدورة" : "Share course")}
        </button>
      </div>
      <p className="mt-2 min-h-4 text-xs text-white/55" aria-live="polite">{message}</p>
    </div>
  );
}
