"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { STUDIO_MAX_BYTES, studioAudioType, type StudioExercise, type StudioRecording } from "@/lib/studio-shared";
import { StudioAudio, StudioIcon, studioRequest, useStudioData } from "./studio-ui";
import styles from "./studio.module.css";
import { StudioAudioPlayer } from "./StudioAudioPlayer";

function RecordingCard({ item, exercises, onSaved }: { item: StudioRecording; exercises: StudioExercise[]; onSaved: () => Promise<void> }) {
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(item.title);
  const [exerciseId, setExerciseId] = useState(item.exercise_id ?? "");
  const [replacement, setReplacement] = useState<File | null>(null);
  const [preview, setPreview] = useState("");
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState<number | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const requestRef = useRef<XMLHttpRequest | null>(null);

  useEffect(() => {
    if (!replacement) { setPreview(""); return; }
    const url = URL.createObjectURL(replacement); setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [replacement]);
  useEffect(() => () => requestRef.current?.abort(), []);
  useEffect(() => {
    if (!editing && !busy) return;
    const warn = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [editing, busy]);

  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy || !title.trim()) return;
    setBusy(true); setError(""); setNotice("");
    try {
      if (replacement) {
        setProgress(0);
        const upload = await studioRequest({ action: "upload", title: title.trim(), exerciseId: exerciseId || null, source: "upload", fileName: replacement.name, mime: replacement.type, size: replacement.size, originalId: item.id });
        await new Promise<void>((resolve, reject) => {
          const request = new XMLHttpRequest(); requestRef.current = request;
          request.open("PUT", upload.url); request.setRequestHeader("Content-Type", upload.mime);
          request.upload.onprogress = (event) => { if (event.lengthComputable) setProgress(Math.min(99, Math.round(event.loaded / event.total * 100))); };
          request.onload = () => request.status >= 200 && request.status < 300 ? resolve() : reject(new Error("فشل رفع الصوت. تسجيلك الأصلي لم يتغير."));
          request.onerror = () => reject(new Error("تعذر الاتصال بالتخزين. تسجيلك الأصلي لم يتغير."));
          request.onabort = () => reject(new Error("تم إلغاء الرفع"));
          request.timeout = 15 * 60 * 1000;
          request.ontimeout = () => reject(new Error("انتهت مهلة الرفع. حاول مرة أخرى."));
          request.send(replacement);
        });
        await studioRequest({ action: "replace", id: upload.id, originalId: item.id });
      } else {
        await studioRequest({ action: "edit", id: item.id, title: title.trim(), exerciseId: exerciseId || null });
      }
      setEditing(false); setReplacement(null); setNotice("تم حفظ التعديلات."); await onSaved();
    } catch (cause) { setError(cause instanceof Error ? cause.message : "تعذر حفظ التعديلات"); }
    finally { setBusy(false); setProgress(null); requestRef.current = null; }
  }

  async function remove() {
    if (busy) return;
    setBusy(true); setError(""); setNotice("");
    try { await studioRequest({ action: "delete", id: item.id }); await onSaved(); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "تعذر حذف التسجيل"); }
    finally { setBusy(false); setConfirmDelete(false); }
  }

  return <article className={styles.recordingItem}>
    <div className={styles.submissionHeading}><div><h2>{item.title}</h2><p>{item.exercise_title || "تسجيل حر"}</p></div><span>{item.reviewed_at ? `تم التقييم${item.score !== null ? ` · ${item.score}%` : ""}` : "بانتظار التقييم"}</span></div>
    <p className={styles.hint}>{new Date(item.created_at).toLocaleString("ar-EG")} · {item.source === "recording" ? "تسجيل مباشر" : "ملف مرفوع"} · {(item.size_bytes / 1024 / 1024).toFixed(1)} MB</p>
    <StudioAudio id={item.id} />
    {item.feedback ? <div className={styles.feedback}><strong>{item.reviewer_name || "فريق الأكاديمية"}</strong><p>{item.feedback}</p>{item.reviewed_at && <small>{new Date(item.reviewed_at).toLocaleDateString("ar-EG")}</small>}</div> : <p className={styles.hint}>سيظهر تقييم المشرف وملاحظاته هنا بعد المراجعة.</p>}
    {!editing && !confirmDelete && <div className={styles.recordingActions}>
      <button className={styles.pill} disabled={busy} onClick={() => { setTitle(item.title); setExerciseId(item.exercise_id ?? ""); setReplacement(null); setError(""); setNotice(""); setEditing(true); }}>تعديل التسجيل</button>
      <button className={styles.deleteButton} disabled={busy} onClick={() => { setConfirmDelete(true); setNotice(""); }}>حذف التسجيل</button>
    </div>}
    {confirmDelete && <div className={styles.deleteConfirm} role="group" aria-label="تأكيد حذف التسجيل"><p>هل تريد حذف هذا التسجيل وتقييمه نهائيًا؟</p><div className={styles.formActions}><button className={styles.deleteButton} disabled={busy} onClick={() => void remove()}>{busy ? "جارٍ الحذف…" : "نعم، حذف نهائي"}</button><button className={styles.pill} disabled={busy} onClick={() => setConfirmDelete(false)}>إلغاء</button></div></div>}
    {editing && <form className={styles.recordingEdit} onSubmit={save}>
      <label>عنوان التسجيل<input value={title} maxLength={200} required disabled={busy} onChange={(event) => setTitle(event.target.value)} /></label>
      <label>التدريب<select value={exerciseId} disabled={busy} onChange={(event) => setExerciseId(event.target.value)}><option value="">تسجيل حر</option>{item.exercise_id && !exercises.some((exercise) => exercise.id === item.exercise_id) && <option value={item.exercise_id}>{item.exercise_title || "التدريب الحالي"}</option>}{exercises.map((exercise) => <option key={exercise.id} value={exercise.id}>{exercise.title}</option>)}</select></label>
      <label>استبدال الملف الصوتي (اختياري، حتى 100 ميجابايت)<input type="file" accept="audio/*,.m4a,.ogg,.opus,.flac,.wav,.aiff,.amr,.wma,.webm,.caf,.3gp" disabled={busy} onChange={(event) => {
        const file = event.target.files?.[0]; setError("");
        if (!file) return;
        if (!studioAudioType(file.name, file.type) || file.size <= 0 || file.size > STUDIO_MAX_BYTES) { setError("اختر ملفًا صوتيًا لا يتجاوز 100 ميجابايت."); event.target.value = ""; return; }
        setReplacement(file);
      }} /></label>
      {replacement && <div><p className={styles.hint}>{replacement.name} · سيُستبدل الصوت ويُرسل للتقييم من جديد. لن يُحذف الأصل قبل نجاح الرفع.</p>{preview && <StudioAudioPlayer key={preview} src={preview} downloadUrl={preview} downloadName={replacement.name} />}<button type="button" className={styles.textButton} disabled={busy} onClick={() => setReplacement(null)}>الاحتفاظ بالصوت الحالي</button></div>}
      {progress !== null && <progress max={100} value={progress} aria-label="تقدم استبدال الصوت" />}
      <div className={styles.formActions}><button type="submit" className={styles.primary} disabled={busy || !title.trim()}>{busy ? progress === null ? "جارٍ الحفظ…" : `جارٍ الرفع… ${progress}%` : "حفظ التعديلات"}</button><button type="button" className={styles.pill} disabled={busy} onClick={() => { setEditing(false); setReplacement(null); setError(""); }}>إلغاء</button></div>
    </form>}
    {error && <p className={styles.notice} role="alert">{error}</p>}{notice && <p className={styles.hint} role="status">{notice}</p>}
  </article>;
}

export function StudioRecordings() {
  const { data, loading, error, refresh } = useStudioData();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");
  const filtered = data.recordings.filter((item) => `${item.title} ${item.exercise_title ?? ""} ${item.feedback ?? ""}`.toLowerCase().includes(query.trim().toLowerCase()) && (filter === "all" || (filter === "reviewed" ? !!item.reviewed_at : !item.reviewed_at)));
  return <section className={`${styles.studio} ${styles.library}`} dir="rtl" aria-label="تسجيلاتي والتقييمات">
    <header className={styles.libraryHeader}><div><Link href="/dashboard/studio" className={styles.textButton}>الاستوديو الافتراضي /</Link><h1><StudioIcon name="listen" />تسجيلاتي والتقييمات</h1><p>كل تسجيلاتك وملاحظات المدربين في مكان واحد. استمع، عدّل، وتابع تطور أدائك.</p></div><Link href="/dashboard/studio" className={styles.primary}>+ تسجيل جديد</Link></header>
    {error && <div className={styles.notice} role="alert">{error}<button onClick={() => void refresh()}>إعادة المحاولة</button></div>}
    <div className={styles.libraryFilters}><label>البحث في التسجيلات<input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="عنوان التسجيل أو ملاحظات المدرب…" /></label><label>حالة التقييم<select value={filter} onChange={(event) => setFilter(event.target.value)}><option value="all">جميع التسجيلات</option><option value="reviewed">تم التقييم</option><option value="pending">بانتظار التقييم</option></select></label><button className={styles.pill} onClick={() => void refresh()}>تحديث ↻</button></div>
    <p className={styles.hint}>{filtered.length} من {data.recordings.length} تسجيلات</p>
    {loading ? <p className={styles.empty}>جارٍ تحميل التسجيلات…</p> : filtered.length ? <div className={styles.libraryGrid}>{filtered.map((item) => <RecordingCard key={item.id} item={item} exercises={data.exercises} onSaved={() => refresh()} />)}</div> : <div className={styles.panel}><p className={styles.empty}>{data.recordings.length ? "لا توجد تسجيلات مطابقة لبحثك." : "لم تضف أي تسجيل بعد. ابدأ من الاستوديو الافتراضي."}</p></div>}
  </section>;
}
