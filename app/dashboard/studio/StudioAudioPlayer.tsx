"use client";

import { useRef, useState, type CSSProperties } from "react";
import styles from "./audio-player.module.css";

function formatTime(seconds: number) {
  if (!Number.isFinite(seconds) || seconds < 0) return "--:--";
  return `${Math.floor(seconds / 60)}:${Math.floor(seconds % 60).toString().padStart(2, "0")}`;
}

export function StudioAudioPlayer({ src, downloadUrl, downloadName }: { src: string; downloadUrl?: string; downloadName?: string }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [loading, setLoading] = useState(false);
  const [current, setCurrent] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [muted, setMuted] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [failed, setFailed] = useState(false);

  async function togglePlayback() {
    const audio = audioRef.current;
    if (!audio) return;
    if (!audio.paused) { audio.pause(); return; }
    setFailed(false); setLoading(true);
    try { if (audio.error) audio.load(); await audio.play(); }
    catch { setLoading(false); setFailed(true); }
  }

  function syncTime() {
    const audio = audioRef.current;
    if (!audio) return;
    setCurrent(audio.currentTime);
    const length = Number.isFinite(audio.duration) ? audio.duration : audio.seekable.length ? audio.seekable.end(audio.seekable.length - 1) : 0;
    setDuration(length > 0 ? length : 0);
  }

  if (!src) return null;
  const effectiveVolume = muted ? 0 : volume;
  return <div className={styles.player} role="group" aria-label="مشغل الصوت" dir="ltr">
    <audio ref={audioRef} src={src} preload="none" className={styles.media}
      onLoadedMetadata={syncTime} onDurationChange={syncTime} onTimeUpdate={syncTime}
      onPlay={(event) => {
        document.querySelectorAll("audio").forEach((audio) => { if (audio !== event.currentTarget) audio.pause(); });
        setPlaying(true); setFailed(false);
      }}
      onPlaying={() => setLoading(false)} onWaiting={() => setLoading(true)}
      onPause={() => { setPlaying(false); setLoading(false); }}
      onEnded={() => { setPlaying(false); setLoading(false); syncTime(); }}
      onError={() => { setFailed(true); setLoading(false); setPlaying(false); }}
      onVolumeChange={(event) => { setVolume(event.currentTarget.volume); setMuted(event.currentTarget.muted); }}
    />
    <button type="button" className={styles.play} onClick={() => void togglePlayback()} aria-label={playing ? "إيقاف الصوت مؤقتًا" : "تشغيل الصوت"} aria-pressed={playing}>
      <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">{playing ? <path d="M7 5h4v14H7zm6 0h4v14h-4z" /> : <path d="m9 5 11 7-11 7z" />}</svg>
    </button>
    <div className={styles.timeline}>
      <input className={styles.slider} type="range" min={0} max={duration || 1} step={0.1} value={Math.min(current, duration || 0)} disabled={!duration} aria-label="موضع التشغيل" aria-valuetext={`${formatTime(current)} / ${duration ? formatTime(duration) : "--:--"}`} style={{ "--fill": `${duration ? Math.min(current / duration * 100, 100) : 0}%` } as CSSProperties} onChange={(event) => {
        const time = Number(event.target.value);
        if (audioRef.current) { audioRef.current.currentTime = time; setCurrent(time); }
      }} />
      <div className={styles.time}><span>{formatTime(current)} <span className={styles.separator}>/</span> {duration ? formatTime(duration) : "--:--"}</span><span className={styles.status} role="status">{failed ? "تعذر تشغيل الصوت" : loading ? "جارٍ التحميل…" : playing ? "جارٍ التشغيل" : ""}</span></div>
    </div>
    <div className={styles.volume}>
      <button type="button" aria-label={muted || !volume ? "إلغاء كتم الصوت" : "كتم الصوت"} onClick={() => {
        const audio = audioRef.current;
        if (!audio) return;
        if (audio.muted || audio.volume === 0) { audio.muted = false; if (!audio.volume) audio.volume = 1; } else audio.muted = true;
      }}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M4 9h4l5-4v14l-5-4H4Z" />{muted || !volume ? <path d="m17 9 5 6m0-6-5 6" /> : <><path d="M17 8a6 6 0 0 1 0 8M20 5a10 10 0 0 1 0 14" /></>}</svg></button>
      <input className={styles.slider} type="range" min={0} max={1} step={0.01} value={effectiveVolume} aria-label="مستوى الصوت" style={{ "--fill": `${effectiveVolume * 100}%` } as CSSProperties} onChange={(event) => { if (audioRef.current) { audioRef.current.volume = Number(event.target.value); audioRef.current.muted = false; } }} />
    </div>
    <select className={styles.speed} aria-label="سرعة التشغيل" value={speed} onChange={(event) => { const value = Number(event.target.value); if (audioRef.current) audioRef.current.playbackRate = value; setSpeed(value); }}>{[0.5, 0.75, 1, 1.25, 1.5, 2].map((value) => <option key={value} value={value}>{value}×</option>)}</select>
    {downloadUrl && <a className={styles.download} href={downloadUrl} download={downloadName || true} aria-label="تحميل التسجيل" title="تحميل التسجيل"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 3v12m-5-5 5 5 5-5M4 16v5h16v-5" /></svg></a>}
  </div>;
}
