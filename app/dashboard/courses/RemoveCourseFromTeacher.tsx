"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useT } from "@/components/LocaleProvider";

export function RemoveCourseFromTeacher({ courseId, teacherId }: { courseId: string; teacherId: string }) {
  const t = useT();
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);
  const prefix = "dashboard.coursesList";

  async function remove() {
    if (busy) return;
    setBusy(true);
    setFailed(false);
    try {
      const response = await fetch(`/api/dashboard/courses/${encodeURIComponent(courseId)}/teacher`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ teacherId }),
      });
      if (!response.ok) throw new Error("Removal failed");
      router.refresh();
    } catch {
      setFailed(true);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <button type="button" onClick={remove} disabled={busy} title={t(`${prefix}.removeFromTeacherHelp`)} className="rounded-[var(--radius-btn)] border border-[var(--color-border)] px-3 py-1.5 text-sm font-medium hover:bg-[var(--color-background)] disabled:opacity-50">
        {t(`${prefix}.${busy ? "removingFromTeacher" : "removeFromTeacher"}`)}
      </button>
      {failed && <p role="alert" className="mt-1 text-xs text-red-500">{t(`${prefix}.removeFromTeacherFailed`)}</p>}
    </div>
  );
}
