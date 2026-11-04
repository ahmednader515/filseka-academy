"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useLocale } from "@/components/LocaleProvider";
import type { HomepageSoundSetting, HomepageSoundTrackAction } from "@/lib/homepage-sound";
import styles from "../../management.module.css";

export function HomepageSoundSettings({ initial }: { initial: HomepageSoundSetting }) {
  const ar = useLocale() === "ar";
  const text = (a: string, e: string) => ar ? a : e;
  const router = useRouter();
  const [sound, setSound] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  async function save(files?: File[], update?: { enabled?: boolean; remove?: boolean; trackUrl?: string; action?: HomepageSoundTrackAction }) {
    if (busy) return;
    if (files?.some((file) => !file.size || file.size > 100 * 1024 * 1024)) {
      setMessage(text("يجب أن يكون كل ملف غير فارغ ولا يتجاوز 100 MB.", "Each file must be nonempty and no larger than 100 MB."));
      return;
    }
    setBusy(true); setMessage("");
    let saved = 0;
    try {
      // Upload separately to keep each request within the per-file limit and preserve order.
      for (const file of files ?? [undefined]) {
        const data = new FormData();
        if (file) {
          data.set("file", file);
          setMessage(text(`جارٍ رفع الملف ${saved + 1} من ${files!.length}: ${file.name}`, `Uploading ${saved + 1} of ${files!.length}: ${file.name}`));
        }
        const response = await fetch("/api/dashboard/settings/homepage-sound", file ? { method: "POST", body: data } : { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(update) });
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || text("تعذر الحفظ", "Could not save"));
        setSound(result); saved++;
      }
      setMessage(text("تم حفظ إعدادات الصوت.", "Sound settings saved."));
    } catch (error) {
      const detail = error instanceof Error ? error.message : text("تعذر الحفظ", "Could not save");
      setMessage(files ? text(`تم رفع ${saved} من ${files.length} ملفات. توقف الرفع: ${detail}`, `Uploaded ${saved} of ${files.length} files. Upload stopped: ${detail}`) : detail);
    }
    finally { setBusy(false); if (saved) router.refresh(); }
  }
  return <section className={`${styles.panel} mt-6`}>
    <h2>{text("صوت الموقع", "Site sound")}</h2>
    <p>{text("ارفع عدة ملفات صوتية لتشغيلها بالترتيب، ثم تتكرر القائمة من البداية باستمرار أثناء التنقل بين الصفحات. تُضاف الملفات الجديدة إلى نهاية القائمة وتُحفظ مباشرة. يبدأ التشغيل مرة واحدة لكل جلسة، وبعد أول نقرة أو ضغطة مفتاح إذا منع المتصفح التشغيل التلقائي. يمكن للزائر الإيقاف المؤقت وكتم الصوت والتحكم في مستواه من شريط التنقل.", "Upload multiple sounds to play in order, then repeat the playlist continuously while navigating between pages. New uploads are appended to the playlist and saved immediately. Playback starts once per session, after the first click or keypress if autoplay is blocked. Visitors can pause, mute, and adjust the volume from the navbar.")}</p>
    <label>{text("إضافة ملفات صوتية (MP3، WAV، OGG، M4A — حتى 100 MB لكل ملف)", "Add audio files (MP3, WAV, OGG, M4A — up to 100 MB per file)")}<input type="file" multiple accept="audio/mpeg,audio/mp3,audio/wav,audio/x-wav,audio/ogg,audio/mp4,audio/x-m4a,.mp3,.wav,.ogg,.m4a" disabled={busy} onChange={(event) => { const files = Array.from(event.target.files ?? []); event.target.value = ""; if (files.length) void save(files); }} /></label>
    {sound.tracks.length > 0 && <>
      <ol className="grid gap-4" aria-label={text("ترتيب التشغيل", "Playback order")}>
        {sound.tracks.map((track, index) => <li key={track.url} className="rounded-xl border border-white/10 p-3">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
            <p className="min-w-0 break-words">{index + 1}. {track.name}</p>
            <div className="flex flex-wrap gap-2">
              <button type="button" disabled={busy || index === 0} aria-label={text(`نقل ${track.name} لأعلى`, `Move ${track.name} up`)} className="rounded-lg border border-white/20 px-3 py-2 text-sm disabled:opacity-40" onClick={() => void save(undefined, { trackUrl: track.url, action: "up" })}>{text("↑ لأعلى", "↑ Move up")}</button>
              <button type="button" disabled={busy || index === sound.tracks.length - 1} aria-label={text(`نقل ${track.name} لأسفل`, `Move ${track.name} down`)} className="rounded-lg border border-white/20 px-3 py-2 text-sm disabled:opacity-40" onClick={() => void save(undefined, { trackUrl: track.url, action: "down" })}>{text("↓ لأسفل", "↓ Move down")}</button>
              <button type="button" disabled={busy} aria-label={text(`حذف ${track.name}`, `Delete ${track.name}`)} className="rounded-lg border border-red-400/40 px-3 py-2 text-sm text-red-300 disabled:opacity-40" onClick={() => void save(undefined, { trackUrl: track.url, action: "remove" })}>{text("حذف", "Delete")}</button>
            </div>
          </div>
          <audio src={track.url} controls preload="none" className="w-full" />
        </li>)}
      </ol>
      <label className={styles.checkbox}><input type="checkbox" disabled={busy} checked={sound.enabled} onChange={(event) => void save(undefined, { enabled: event.target.checked })} />{text("تفعيل الصوت في جميع الصفحات", "Enable sound on every page")}</label><button type="button" disabled={busy} className="justify-self-start text-sm text-red-300 disabled:opacity-50" onClick={() => void save(undefined, { remove: true })}>{text("إزالة جميع الأصوات", "Remove all sounds")}</button>
    </>}
    {busy && <p role="status">{text("جارٍ الحفظ…", "Saving…")}</p>}{message && <p role="status">{message}</p>}
  </section>;
}
