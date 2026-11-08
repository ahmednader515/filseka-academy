"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useLocale, useT } from "@/components/LocaleProvider";

type CourseOption = { id: string; title: string; titleAr: string; owner: string };

export function AssignExistingCourse({ teacherId, courses }: { teacherId: string; courses: CourseOption[] }) {
  const t = useT();
  const locale = useLocale();
  const router = useRouter();
  const [courseId, setCourseId] = useState("");
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<"success" | "error" | null>(null);
  const prefix = "dashboard.coursesRoutePage";

  async function assign(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!courseId || busy) return;
    setBusy(true);
    setStatus(null);
    try {
      const response = await fetch(`/api/dashboard/courses/${encodeURIComponent(courseId)}/teacher`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ teacherId }),
      });
      if (!response.ok) throw new Error("Assignment failed");
      setCourseId("");
      setStatus("success");
      router.refresh();
    } catch {
      setStatus("error");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={assign} className="mb-6 space-y-3 rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
      <div className="flex flex-wrap items-end gap-3">
        <label className="min-w-0 flex-1 text-sm font-medium">
          {t(`${prefix}.existingCourse`)}
          <select value={courseId} onChange={(event) => { setCourseId(event.target.value); setStatus(null); }} required disabled={busy || courses.length === 0} className="mt-1 block w-full rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2">
            <option value="">{t(`${prefix}.selectExistingCourse`)}</option>
            {courses.map((course) => <option key={course.id} value={course.id}>{locale === "ar" ? course.titleAr || course.title : course.title || course.titleAr}{course.owner ? ` — ${course.owner}` : ""}</option>)}
          </select>
        </label>
        <button type="submit" disabled={busy || !courseId} className="rounded-[var(--radius-btn)] bg-[var(--color-primary)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--color-primary-hover)] disabled:cursor-not-allowed disabled:opacity-50">
          {t(`${prefix}.${busy ? "assigningCourse" : "assignCourse"}`)}
        </button>
      </div>
      <p className="text-sm text-[var(--color-muted)]">{t(`${prefix}.assignCourseHelp`)}</p>
      {courses.length === 0 && <p className="text-sm text-[var(--color-muted)]">{t(`${prefix}.noAvailableCourses`)}</p>}
      {status && <p role="status" className={`text-sm ${status === "error" ? "text-red-500" : "text-[var(--color-foreground)]"}`}>{t(`${prefix}.${status === "success" ? "courseAssigned" : "assignCourseFailed"}`)}</p>}
    </form>
  );
}
