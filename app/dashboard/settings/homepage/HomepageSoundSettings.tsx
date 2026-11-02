"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useLocale } from "@/components/LocaleProvider";
import type { HomepageSoundSetting } from "@/lib/homepage-sound";
import styles from "../../management.module.css";

export function HomepageSoundSettings({ initial }: { initial: HomepageSoundSetting }) {
  const ar = useLocale() === "ar";
  const text = (a: string, e: string) => ar ? a : e;
  const router = useRouter();
  const [sound, setSound] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  async function save(file?: File, update?: { enabled?: boolean; remove?: boolean }) {
    if (busy) return;
    setBusy(true); setMessage("");
    try {
      const data = new FormData();
      if (file) data.set("file", file);
      const response = await fetch("/api/dashboard/settings/homepage-sound", file ? { method: "POST", body: data } : { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(update) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error);
      setSound(result); setMessage(text("تم حفظ إعدادات الصوت.", "Sound settings saved.")); router.refresh();
    } catch (error) { setMessage(error instanceof Error ? error.message : text("تعذر الحفظ", "Could not save")); }
    finally { setBusy(false); }
  }
  return <section className={`${styles.panel} mt-6`}>
    <h2>{text("صوت الصفحة الرئيسية", "Homepage welcome sound")}</h2>
    <p>{text("ارفع صوتًا ليُشغّل تلقائيًا مرة واحدة لكل جلسة، دون تكراره عند العودة للصفحة الرئيسية أو تحديثها. يُتاح مجددًا في جلسة جديدة بعد إغلاق علامة التبويب. إذا منع المتصفح التشغيل التلقائي، يبدأ بعد أول نقرة أو ضغطة مفتاح. يمكن للزائر تشغيله يدويًا من شريط التنقل. تُحفظ إعدادات الصوت مباشرة.", "Upload a sound to play automatically once per session, without repeating when returning to the homepage or refreshing. It becomes available again in a new session after closing the tab. If autoplay is blocked, it starts after the first click or keypress. Visitors can replay it from the navbar. Sound settings save immediately.")}</p>
    <label>{text("رفع ملف صوتي (MP3، WAV، OGG، M4A — حتى 10 MB)", "Upload audio (MP3, WAV, OGG, M4A — up to 10 MB)")}<input type="file" accept="audio/mpeg,audio/mp3,audio/wav,audio/x-wav,audio/ogg,audio/mp4,audio/x-m4a,.mp3,.wav,.ogg,.m4a" disabled={busy} onChange={(event) => { const file = event.target.files?.[0]; event.target.value = ""; if (file) void save(file); }} /></label>
    {sound.url && <><p>{sound.name}</p><audio key={sound.url} src={sound.url} controls preload="metadata" className="w-full" /><label className={styles.checkbox}><input type="checkbox" disabled={busy} checked={sound.enabled} onChange={(event) => void save(undefined, { enabled: event.target.checked })} />{text("تشغيل الصوت عند زيارة الصفحة الرئيسية", "Play sound when the homepage is visited")}</label><button type="button" disabled={busy} className="justify-self-start text-sm text-red-300 disabled:opacity-50" onClick={() => void save(undefined, { remove: true })}>{text("إزالة الصوت", "Remove sound")}</button></>}
    {busy && <p role="status">{text("جارٍ الحفظ…", "Saving…")}</p>}{message && <p role="status">{message}</p>}
  </section>;
}
