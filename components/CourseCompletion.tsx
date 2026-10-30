"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useLocale } from "./LocaleProvider";

type Progress = { enabled: boolean; total: number; completedIds: string[]; certificateId: string | null };
export function CourseCompletion({ courseId, lessonId }: { courseId: string; lessonId?: string }) {
  const ar = useLocale() === "ar";
  const text = (a: string, e: string) => ar ? a : e;
  const [progress, setProgress] = useState<Progress | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    const controller = new AbortController();
    fetch(`/api/courses/${courseId}/completion`, { signal: controller.signal }).then(async (r) => { if (!r.ok) throw new Error(); setProgress(await r.json()); }).catch((e) => { if (e.name !== "AbortError") setError(text("تعذر تحميل التقدم. أعد تحميل الصفحة للمحاولة مرة أخرى.", "Could not load progress. Reload to retry.")); });
    return () => controller.abort();
    // Locale only changes labels, not the saved progress.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courseId]);
  async function markComplete() {
    const id = lessonId || progress?.completedIds[0];
    if (!id) return;
    setBusy(true); setError("");
    try { const response = await fetch(`/api/courses/${courseId}/completion`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ lessonId: id }) }); const data = await response.json(); if (!response.ok) throw new Error(data.error); setProgress(data); } catch (e) { setError(e instanceof Error ? e.message : text("تعذر حفظ التقدم", "Could not save progress")); } finally { setBusy(false); }
  }
  const completed = !!lessonId && !!progress?.completedIds.includes(lessonId);
  return <section className="my-6 rounded-2xl border border-[#97304f] bg-[#180c12] p-5 text-[#fff5f8]" aria-label={text("تقدم الكورس", "Course progress")}><div className="flex flex-wrap items-center justify-between gap-4"><div><h2 className="font-bold">{text("تقدمك في الكورس", "Your course progress")}</h2>{progress && <p className="mt-2 text-sm text-[#c1a3b0]">{progress.completedIds.length} / {progress.total} {text("درس مكتمل", "lessons completed")}{progress.enabled ? text(" · شهادة بعد إتمام جميع الدروس", " · Certificate after completing every lesson") : ""}</p>}</div>{lessonId && <button disabled={busy || !progress || (completed && !!progress.certificateId)} onClick={() => void markComplete()} className="rounded-full border border-[#f23159] bg-gradient-to-b from-[#d0002d] to-[#720016] px-5 py-2 text-sm disabled:opacity-50">{busy ? text("جارٍ الحفظ…", "Saving…") : completed ? text("تم إتمام الدرس ✓", "Lesson completed ✓") : text("تحديد الدرس كمكتمل", "Mark lesson complete")}</button>}{progress?.certificateId ? <Link className="text-sm font-bold text-pink-300 underline" href={`/certificates/${progress.certificateId}`}>{text("عرض شهادتك وطباعتها", "View and print your certificate")}</Link> : progress?.enabled && progress.total > 0 && progress.completedIds.length === progress.total ? <button disabled={busy} onClick={() => void markComplete()} className="text-sm font-bold text-pink-300 underline">{text("استلام الشهادة", "Claim certificate")}</button> : null}</div>{progress && <progress className="mt-4 h-2 w-full accent-[#ef1744]" value={progress.completedIds.length} max={progress.total || 1} aria-label={text("الدروس المكتملة", "Completed lessons")} />}{error && <p role="alert" className="mt-3 text-sm text-red-300">{error}</p>}</section>;
}
