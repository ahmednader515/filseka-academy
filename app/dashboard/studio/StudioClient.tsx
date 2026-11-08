"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { StudioAudioPlayer } from "./StudioAudioPlayer";
import { STUDIO_MAX_BYTES, studioAudioType } from "@/lib/studio-shared";
import { StudioAudio, StudioIcon, studioRequest, useStudioData, Waveform } from "./studio-ui";
import styles from "./studio.module.css";

type Mode = "record" | "upload" | "listen";
type CaptureState = "idle" | "requesting" | "recording" | "paused";

export function StudioClient() {
  const { data, loading, error, refresh } = useStudioData();
  const [mode, setMode] = useState<Mode>("record");
  const [capture, setCapture] = useState<CaptureState>("idle");
  const [seconds, setSeconds] = useState(0);
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [title, setTitle] = useState("");
  const [exerciseId, setExerciseId] = useState("");
  const [source, setSource] = useState<"recording" | "upload">("recording");
  const [progress, setProgress] = useState<number | null>(null);
  const [notice, setNotice] = useState("");
  const [failure, setFailure] = useState("");
  const recorder = useRef<MediaRecorder | null>(null);
  const stream = useRef<MediaStream | null>(null);
  const mounted = useRef(true);
  const xhr = useRef<XMLHttpRequest | null>(null);
  const input = useRef<HTMLInputElement>(null);
  const workspace = useRef<HTMLElement>(null);
  const recordings = useRef<HTMLElement>(null);
  const busy = progress !== null;
  const capturing = capture !== "idle";

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      if (recorder.current && recorder.current.state !== "inactive") { recorder.current.onstop = null; recorder.current.stop(); }
      stream.current?.getTracks().forEach((track) => track.stop());
      xhr.current?.abort();
    };
  }, []);
  useEffect(() => {
    if (!file) { setPreviewUrl(""); return; }
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);
  useEffect(() => {
    if (capture !== "recording") return;
    const timer = window.setInterval(() => setSeconds((value) => value + 1), 1000);
    return () => window.clearInterval(timer);
  }, [capture]);
  useEffect(() => {
    if (!capturing && !file && !busy) return;
    const warn = (event: BeforeUnloadEvent) => { event.preventDefault(); };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [capturing, file, busy]);

  function chooseMode(next: Mode) {
    setMode(next);
    (next === "listen" ? recordings.current : workspace.current)?.scrollIntoView({ behavior: "smooth", block: "center" });
    if (next === "upload" && !capturing && !busy) input.current?.click();
  }

  async function start() {
    setFailure(""); setNotice("");
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") { setFailure("متصفحك لا يدعم التسجيل. استخدم متصفحًا حديثًا أو ارفع ملفًا صوتيًا."); return; }
    setCapture("requesting");
    try {
      const media = await navigator.mediaDevices.getUserMedia({ audio: true });
      if (!mounted.current) { media.getTracks().forEach((track) => track.stop()); return; }
      stream.current = media;
      const mimeType = ["audio/webm;codecs=opus", "audio/mp4", "audio/ogg;codecs=opus"].find((type) => MediaRecorder.isTypeSupported(type));
      const recording = new MediaRecorder(media, mimeType ? { mimeType } : undefined);
      recorder.current = recording;
      const chunks: Blob[] = [];
      let bytes = 0;
      recording.ondataavailable = (event) => {
        if (!event.data.size) return;
        if (bytes + event.data.size > STUDIO_MAX_BYTES) {
          if (mounted.current) setFailure("وصل التسجيل إلى الحد الأقصى 100 ميجابايت. تم إيقافه ويمكنك حفظ الجزء المسجل.");
          if (recording.state !== "inactive") recording.stop();
          return;
        }
        bytes += event.data.size; chunks.push(event.data);
      };
      recording.onerror = () => {
        if (mounted.current) setFailure("تعذر إكمال التسجيل. تحقق من الميكروفون وحاول مرة أخرى.");
        if (recording.state !== "inactive") recording.stop();
        media.getTracks().forEach((track) => track.stop());
      };
      recording.onstop = () => {
        media.getTracks().forEach((track) => track.stop());
        if (!mounted.current) return;
        setCapture("idle");
        if (!bytes) { setFailure("لم يتم التقاط صوت. حاول مرة أخرى."); return; }
        const mime = recording.mimeType || mimeType || "audio/webm";
        const ext = mime.includes("mp4") ? "m4a" : mime.includes("ogg") ? "ogg" : "webm";
        setFile(new File(chunks, `studio-recording.${ext}`, { type: mime }));
        setSource("recording");
      };
      setFile(null); setSeconds(0); setCapture("recording");
      recording.start(1000);
    } catch (cause) {
      stream.current?.getTracks().forEach((track) => track.stop());
      setCapture("idle");
      setFailure(cause instanceof DOMException && cause.name === "NotAllowedError" ? "اسمح للموقع باستخدام الميكروفون من إعدادات المتصفح ثم حاول مجددًا." : "تعذر الوصول إلى الميكروفون. تحقق من توصيله وأنه غير مستخدم في تطبيق آخر.");
    }
  }

  function selectFile(selected?: File) {
    if (!selected) return;
    setFailure(""); setNotice("");
    if (!studioAudioType(selected.name, selected.type)) { setFailure("اختر ملفًا صوتيًا صالحًا."); return; }
    if (selected.size === 0 || selected.size > STUDIO_MAX_BYTES) { setFailure("يجب أن يكون حجم الملف بين 1 بايت و100 ميجابايت."); return; }
    setFile(selected); setSource("upload");
    if (!title) setTitle(selected.name.replace(/\.[^.]+$/, "").slice(0, 200));
  }

  async function save() {
    if (!file || !title.trim() || busy) return;
    setProgress(0); setFailure(""); setNotice("");
    try {
      const upload = await studioRequest({ action: "upload", fileName: file.name, mime: file.type, size: file.size, source, title: title.trim(), exerciseId: exerciseId || null });
      await new Promise<void>((resolve, reject) => {
        const request = new XMLHttpRequest(); xhr.current = request;
        request.open("PUT", upload.url);
        request.setRequestHeader("Content-Type", upload.mime);
        request.upload.onprogress = (event) => { if (event.lengthComputable && mounted.current) setProgress(Math.min(99, Math.round(event.loaded / event.total * 100))); };
        request.onload = () => request.status >= 200 && request.status < 300 ? resolve() : reject(new Error("فشل رفع الصوت إلى التخزين. حاول مرة أخرى."));
        request.onerror = () => reject(new Error("تعذر رفع الصوت. تحقق من اتصالك؛ قد تحتاج الإدارة إلى إعداد CORS في التخزين."));
        request.onabort = () => reject(new Error("تم إلغاء الرفع"));
        request.timeout = 15 * 60 * 1000;
        request.ontimeout = () => reject(new Error("انتهت مهلة الرفع. حاول مرة أخرى."));
        request.send(file);
      });
      await studioRequest({ action: "complete", id: upload.id });
      if (!mounted.current) return;
      setFile(null); setTitle(""); setSeconds(0); setNotice("تم حفظ تسجيلك وإرساله للتقييم بنجاح.");
      setMode("listen"); await refresh();
    } catch (cause) {
      if (mounted.current) setFailure(cause instanceof Error ? cause.message : "تعذر رفع التسجيل");
    } finally {
      xhr.current = null;
      if (mounted.current) setProgress(null);
    }
  }

  const reviewed = data.recordings.filter((item) => item.reviewed_at);
  const scored = reviewed.filter((item) => item.score !== null);
  const average = scored.length ? Math.round(scored.reduce((total, item) => total + (item.score ?? 0), 0) / scored.length) : null;
  const latestReview = [...reviewed].sort((a, b) => (b.reviewed_at ?? "").localeCompare(a.reviewed_at ?? ""))[0];
  const time = `${Math.floor(seconds / 60).toString().padStart(2, "0")}:${(seconds % 60).toString().padStart(2, "0")}`;

  return <section className={styles.studio} dir="rtl" aria-label="الاستوديو الافتراضي">
    <header className={styles.hero}>
      <div className={styles.heroCopy}><h1><StudioIcon name="record" /> الاستوديو الافتراضي</h1><p>مساحتك العملية للتدريب والتسجيل وتطوير أدائك الإعلامي</p><span className={styles.redStroke} />
        <nav className={styles.features} aria-label="أدوات الاستوديو">
          <button className={mode === "record" ? styles.selected : ""} onClick={() => chooseMode("record")}><StudioIcon name="record" /><span>تسجيل مباشر</span></button>
          <button className={mode === "upload" ? styles.selected : ""} onClick={() => chooseMode("upload")}><StudioIcon name="upload" /><span>رفع التسجيلات</span></button>
          <Link href="/dashboard/studio/recordings"><StudioIcon name="listen" /><span>الاستماع والتقييم</span></Link>
          <a href="https://myedit.online/en/audio-editor/speech-enhancement" target="_blank" rel="noopener noreferrer"><StudioIcon name="enhance" /><span>تحسين الصوت <small>(AI) ↗</small></span></a>
        </nav>
      </div>
    </header>
    {(error || failure || notice) && <div role={error || failure ? "alert" : "status"} className={styles.notice}>{error || failure || notice}{error && <button onClick={() => void refresh()}>إعادة المحاولة</button>}</div>}
    <div className={styles.topGrid}>
      <section className={styles.panel}><h2><StudioIcon name="tasks" />تدريبات الاستوديو</h2><div className={styles.exerciseList}>
        {loading ? <p className={styles.empty}>جارٍ تحميل التدريبات…</p> : data.exercises.length ? data.exercises.map((exercise) => <button key={exercise.id} className={exerciseId === exercise.id ? styles.exerciseSelected : ""} onClick={() => { setExerciseId(exercise.id); if (!file) setTitle(exercise.title); setMode("record"); }}><span className={styles.check}>✓</span>{exercise.title}</button>) : <p className={styles.empty}>ستظهر هنا التدريبات التي يضيفها المشرف.</p>}
      </div>{exerciseId && <div className={styles.instructions}><p>{data.exercises.find((item) => item.id === exerciseId)?.instructions}</p><button onClick={() => setExerciseId("")}>تسجيل حر ×</button></div>}</section>
      <section className={`${styles.panel} ${styles.recorder}`} ref={workspace} aria-label="مساحة التسجيل">
        <div className={styles.recordingBadge}><i className={capture === "recording" ? styles.blink : ""} />{capture === "recording" ? "جارٍ التسجيل…" : capture === "paused" ? "التسجيل متوقف مؤقتًا" : capture === "requesting" ? "بانتظار الميكروفون…" : "مساحتك على الهواء"}</div>
        <div className={styles.time}>{time}</div><Waveform active={capture === "recording"} />
        <div className={styles.transport}>
          <button aria-label="حذف التسجيل الحالي" disabled={capturing || busy || !file} onClick={() => { setFile(null); setSeconds(0); }}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><path d="M3 6h18M9 6V3h6v3M6 6l1 15h10l1-15M10 10v7m4-7v7" /></svg></button>
          <button disabled={capture !== "recording" && capture !== "paused"} aria-label={capture === "paused" ? "استئناف التسجيل" : "إيقاف مؤقت"} onClick={() => { if (capture === "recording") { recorder.current?.pause(); setCapture("paused"); } else { recorder.current?.resume(); setCapture("recording"); } }}>{capture === "paused" ? "▶" : "Ⅱ"}</button>
          <button className={styles.recordButton} disabled={busy || capture === "requesting" || (!!file && !capturing)} aria-label={capturing ? "إنهاء التسجيل" : "بدء التسجيل"} onClick={() => { if (recorder.current && recorder.current.state !== "inactive") recorder.current.stop(); else void start(); }}>{capturing ? <span className={styles.stopSquare} /> : <StudioIcon name="mic" />}</button>
          <button className={styles.uploadButton} disabled={capturing || busy} onClick={() => { setMode("upload"); input.current?.click(); }}><StudioIcon name="upload" />اختيار ملف</button>
        </div>
        <input ref={input} type="file" accept="audio/*,.m4a,.ogg,.opus,.flac,.wav,.aiff,.amr,.wma,.webm,.caf,.3gp" className={styles.hidden} onChange={(event) => { selectFile(event.target.files?.[0]); event.target.value = ""; }} />
        <p className={styles.hint}>سجّل صوتك مباشرة أو ارفع ملفًا صوتيًا حتى 100 ميجابايت</p>
        {(file || capturing) && <div className={styles.saveArea}>
          <label>عنوان التسجيل<input value={title} maxLength={200} disabled={busy} onChange={(event) => setTitle(event.target.value)} placeholder="مثال: مقدمة برنامج إذاعي" /></label>
          <label>التدريب<select value={exerciseId} disabled={busy} onChange={(event) => setExerciseId(event.target.value)}><option value="">تسجيل حر</option>{data.exercises.map((exercise) => <option key={exercise.id} value={exercise.id}>{exercise.title}</option>)}</select></label>
          {file && <><p className={styles.hint}>{file.name} · {(file.size / 1024 / 1024).toFixed(1)} MB</p>{previewUrl && <StudioAudioPlayer key={previewUrl} src={previewUrl} downloadUrl={previewUrl} downloadName={file.name} />}<button className={styles.primary} disabled={busy || !title.trim()} onClick={() => void save()}>{busy ? `جارٍ الرفع… ${progress}%` : "حفظ وإرسال للتقييم"}</button>{busy && <progress max={100} value={progress ?? 0} aria-label="تقدم رفع الصوت" />}</>}
        </div>}
      </section>
      <section className={styles.panel}><h2><StudioIcon name="tasks" />مهامك التدريبية</h2><div className={styles.taskList}>
        {data.exercises.length ? data.exercises.slice(0, 4).map((exercise) => {
          const submission = data.recordings.find((item) => item.exercise_id === exercise.id);
          return <button key={exercise.id} onClick={() => { setExerciseId(exercise.id); chooseMode(submission ? "listen" : "record"); }}><span className={submission?.reviewed_at ? styles.done : styles.taskDot}>{submission?.reviewed_at ? "✓" : "▷"}</span><span>{exercise.title}<small>{submission ? submission.reviewed_at ? `تم التقييم${submission.score !== null ? ` · ${submission.score}%` : ""}` : "بانتظار التقييم" : "ابدأ التدريب وأرسل تسجيلك"}</small></span></button>;
        }) : <p className={styles.empty}>لا توجد مهام بعد. يمكنك البدء بتسجيل حر.</p>}
      </div><Link className={styles.pill} href="/dashboard/studio/recordings">عرض جميع تسجيلاتي ‹</Link></section>
    </div>
    <div className={styles.bottomGrid}>
      <section className={styles.panel}><h2><StudioIcon name="chart" />تطور أدائك</h2><div className={styles.performance}><div className={styles.scoreRing} style={{ "--score": `${(average ?? 0) * 3.6}deg` } as React.CSSProperties}><strong>{average === null ? "—" : `${average}%`}</strong></div><div><p>متوسط التقييم العام</p><small>{scored.length ? `${scored.length} تسجيلات مُقيّمة` : "سيظهر بعد تقييم تسجيلاتك"}</small></div></div><div className={styles.stats}><span>التسجيلات<strong>{data.recordings.length}</strong></span><span>تم التقييم<strong>{reviewed.length}</strong></span><span>بانتظار التقييم<strong>{data.recordings.length - reviewed.length}</strong></span></div></section>
      <section className={styles.panel} ref={recordings}><h2><StudioIcon name="mic" />تسجيلاتي <Link className={styles.textButton} href="/dashboard/studio/recordings">عرض الكل ‹</Link></h2><div className={styles.recordingList}>
        {loading ? <p className={styles.empty}>جارٍ تحميل تسجيلاتك…</p> : data.recordings.length ? data.recordings.map((item) => <article key={item.id} className={styles.recordingItem}><div className={styles.recordingMeta}><span className={item.reviewed_at ? styles.done : styles.taskDot}>{item.reviewed_at ? "✓" : "◷"}</span><strong>{item.title}</strong><time>{new Date(item.created_at).toLocaleDateString("ar-EG")}</time></div><StudioAudio id={item.id} /><div className={styles.recordingDetails}><small>{item.source === "recording" ? "تسجيل مباشر" : "ملف مرفوع"} · {item.exercise_title || "تسجيل حر"}</small><span>{item.reviewed_at ? `تم التقييم${item.score !== null ? ` · ${item.score}%` : ""}` : "بانتظار التقييم"}</span></div>{item.feedback && <div className={styles.feedback}><strong>{item.reviewer_name || "المشرف"}</strong><p>{item.feedback}</p></div>}</article>) : <p className={styles.empty}>لم تحفظ أي تسجيل بعد. ابدأ التسجيل أو ارفع ملفك الأول.</p>}
      </div></section>
      <section className={styles.panel}><h2><StudioIcon name="star" />تقييم المدربين</h2>{latestReview ? <><div className={styles.reviewer}><span><StudioIcon name="mic" /></span><div><strong>{latestReview.reviewer_name || "فريق الأكاديمية"}</strong><small>{new Date(latestReview.reviewed_at!).toLocaleDateString("ar-EG")}</small></div><b>{latestReview.score !== null ? `${latestReview.score}%` : "تم التقييم"}</b></div><p className={styles.reviewTitle}>{latestReview.title}</p><StudioAudio id={latestReview.id} /><blockquote className={styles.quote}>{latestReview.feedback}</blockquote></> : <div className={styles.empty}><StudioIcon name="star" /><p>صوتك يستحق أن يُسمع</p><small>أرسل تسجيلك وسيظهر تقييم المشرف وملاحظاته هنا.</small></div>}</section>
    </div>
  </section>;
}
