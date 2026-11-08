"use client";

import { useState } from "react";
import type { StudioExercise, StudioRecording } from "@/lib/studio-shared";
import { StudioAudio, StudioIcon, studioRequest, useStudioData } from "./studio-ui";
import styles from "./studio.module.css";

function ReviewForm({ item, onSaved }: { item: StudioRecording; onSaved: () => Promise<void> }) {
  const [feedback, setFeedback] = useState(item.feedback ?? "");
  const [score, setScore] = useState(item.score?.toString() ?? "");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  return <form className={styles.reviewForm} onSubmit={async (event) => {
    event.preventDefault(); setBusy(true); setMessage("");
    try {
      await studioRequest({ action: "review", id: item.id, feedback, score: score === "" ? null : Number(score) });
      setMessage("تم إرسال التقييم للطالب."); await onSaved();
    } catch (cause) { setMessage(cause instanceof Error ? cause.message : "تعذر حفظ التقييم"); }
    finally { setBusy(false); }
  }}>
    <label>ملاحظات للطالب<textarea value={feedback} onChange={(event) => setFeedback(event.target.value)} rows={3} maxLength={20000} required disabled={busy} /></label>
    <div className={styles.formActions}><label>الدرجة / 100 (اختياري)<input type="number" min={0} max={100} step={1} value={score} onChange={(event) => setScore(event.target.value)} disabled={busy} /></label><button type="submit" className={styles.primary} disabled={busy}>{busy ? "جارٍ الحفظ…" : "حفظ وإرسال التقييم"}</button></div>
    {message && <p role="status" className={styles.hint}>{message}</p>}
  </form>;
}

export function StudioAdmin() {
  const { data, loading, error, refresh } = useStudioData();
  const [editing, setEditing] = useState<StudioExercise | null>(null);
  const [title, setTitle] = useState("");
  const [instructions, setInstructions] = useState("");
  const [active, setActive] = useState(true);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");
  const [exerciseFilter, setExerciseFilter] = useState("");
  function reset() { setEditing(null); setTitle(""); setInstructions(""); setActive(true); }
  const filtered = data.recordings.filter((item) => {
    const matches = `${item.title} ${item.student_name} ${item.exercise_title ?? ""}`.toLowerCase().includes(query.trim().toLowerCase());
    return matches && (filter === "all" || (filter === "pending" ? !item.reviewed_at : !!item.reviewed_at)) && (!exerciseFilter || item.exercise_id === exerciseFilter);
  });
  return <section className={`${styles.studio} ${styles.admin}`} dir="rtl" aria-label="إدارة الاستوديو الافتراضي">
    <div className={styles.adminHeading}><div><h1><StudioIcon name="mic" />إدارة الاستوديو الافتراضي</h1><p>أضف التدريبات، استمع لتسجيلات الطلاب، وأرسل ملاحظاتك وتقييمك.</p></div><button className={styles.pill} onClick={() => void refresh()}>تحديث ↻</button></div>
    {error && <div role="alert" className={styles.notice}>{error}<button onClick={() => void refresh()}>إعادة المحاولة</button></div>}
    <div className={styles.adminGrid}>
      <section className={styles.panel}><h2><StudioIcon name="tasks" />{editing ? "تعديل التدريب" : "إضافة تدريب"}</h2>
        <form className={styles.exerciseForm} onSubmit={async (event) => {
          event.preventDefault(); setBusy(true); setMessage("");
          try {
            await studioRequest({ action: "exercise", id: editing?.id ?? null, title, instructions, active });
            setMessage("تم حفظ التدريب."); reset(); await refresh();
          } catch (cause) { setMessage(cause instanceof Error ? cause.message : "تعذر حفظ التدريب"); }
          finally { setBusy(false); }
        }}>
          <label>عنوان التدريب<input value={title} onChange={(event) => setTitle(event.target.value)} required maxLength={200} disabled={busy} /></label>
          <label>نص وتعليمات التدريب<textarea value={instructions} onChange={(event) => setInstructions(event.target.value)} rows={6} required maxLength={20000} disabled={busy} /></label>
          <label className={styles.checkbox}><input type="checkbox" checked={active} onChange={(event) => setActive(event.target.checked)} disabled={busy} />إظهار للطلاب</label>
          <div className={styles.formActions}><button type="submit" className={styles.primary} disabled={busy}>{busy ? "جارٍ الحفظ…" : "حفظ التدريب"}</button>{editing && <button type="button" className={styles.pill} onClick={reset} disabled={busy}>إلغاء</button>}</div>
          {message && <p role="status" className={styles.hint}>{message}</p>}
        </form>
        <div className={styles.adminExercises}><h3>التدريبات الحالية</h3>{data.exercises.length ? data.exercises.map((item) => <button disabled={busy} key={item.id} onClick={() => { setEditing(item); setTitle(item.title); setInstructions(item.instructions); setActive(item.active); setMessage(""); }}><strong>{item.title}</strong><small>{item.active ? "ظاهر للطلاب" : "مخفي"} · تعديل</small></button>) : <p className={styles.empty}>أضف التدريب الأول ليظهر في استوديو الطلاب.</p>}</div>
      </section>
      <section className={styles.panel}><h2><StudioIcon name="listen" />تسجيلات الطلاب <span className={styles.count}>{data.recordings.length}</span></h2>
        <div className={styles.filters}><label>بحث<input type="search" placeholder="اسم الطالب أو التسجيل…" value={query} onChange={(event) => setQuery(event.target.value)} /></label><label>حالة التقييم<select value={filter} onChange={(event) => setFilter(event.target.value)}><option value="all">الكل</option><option value="pending">بانتظار التقييم</option><option value="reviewed">تم التقييم</option></select></label><label>التدريب<select value={exerciseFilter} onChange={(event) => setExerciseFilter(event.target.value)}><option value="">كل التدريبات</option>{data.exercises.map((item) => <option key={item.id} value={item.id}>{item.title}</option>)}</select></label></div>
        <div className={styles.adminSubmissions}>{loading ? <p className={styles.empty}>جارٍ تحميل التسجيلات…</p> : filtered.length ? filtered.map((item) => <article className={styles.recordingItem} key={item.id}>
          <div className={styles.submissionHeading}><div><h3>{item.title}</h3><p>{item.student_name} · {item.exercise_title || "تسجيل حر"}</p></div><span>{item.reviewed_at ? "تم التقييم ✓" : "بانتظار التقييم"}</span></div>
          <p className={styles.hint}>{new Date(item.created_at).toLocaleString("ar-EG")} · {item.source === "recording" ? "تسجيل مباشر" : "ملف مرفوع"} · {(item.size_bytes / 1024 / 1024).toFixed(1)} MB</p>
          <StudioAudio id={item.id} />
          <details><summary>{item.reviewed_at ? "عرض وتعديل التقييم" : "إضافة تقييم"}</summary><ReviewForm key={`${item.id}-${item.reviewed_at ?? "new"}`} item={item} onSaved={() => refresh()} /></details>
        </article>) : <p className={styles.empty}>لا توجد تسجيلات مطابقة.</p>}</div>
      </section>
    </div>
  </section>;
}
