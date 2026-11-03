"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import styles from "./HeaderControls.module.css";

const PLAYED_KEY = "filseka:homepage-sound-played";
let playedWithoutStorage = false;
function hasPlayedInSession() {
  try { return window.sessionStorage.getItem(PLAYED_KEY) === "1"; }
  catch { return playedWithoutStorage; }
}
function markPlayedInSession() {
  try { window.sessionStorage.setItem(PLAYED_KEY, "1"); }
  catch { playedWithoutStorage = true; }
}

export function HomepageWelcomeSound({ url, locale }: { url: string; locale: string }) {
  const pathname = usePathname();
  const lessonPath = /^\/courses\/[^/]+\/lessons\/[^/]+\/?$/.test(pathname) ? pathname : null;
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [failed, setFailed] = useState(false);
  const [muted, setMuted] = useState(false);
  const [volume, setVolume] = useState(70);
  const ar = locale === "ar";
  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = 0.7;
  }, [url]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    // Opening a lesson pauses site audio and disables autoplay retries there.
    if (lessonPath) {
      audio.pause();
      return;
    }
    let disposed = false;
    let started = hasPlayedInSession();
    const remove = () => { document.removeEventListener("click", interact); document.removeEventListener("keydown", interact); };
    const onStarted = () => { started = true; markPlayedInSession(); remove(); };
    const play = () => {
      if (disposed || started) return;
      void audio.play().then(() => {
        if (disposed) { audio.pause(); return; }
        started = true; remove();
      }).catch(() => { /* A user gesture retries playback when autoplay is blocked. */ });
    };
    const interact = (event: Event) => {
      if (event.target instanceof Element && event.target.closest("[data-homepage-sound-control]")) return;
      play();
    };
    if (!started) {
      document.addEventListener("click", interact);
      document.addEventListener("keydown", interact);
    }
    audio.addEventListener("play", onStarted);
    play();
    return () => { disposed = true; remove(); audio.removeEventListener("play", onStarted); audio.pause(); };
  }, [url, lessonPath]);
  return <>
    <audio ref={audioRef} src={url} preload="auto" onPlay={() => setPlaying(true)} onPause={() => setPlaying(false)} onEnded={() => setPlaying(false)} onError={() => setFailed(true)} />
    {!failed && <div className={styles.sound} data-homepage-sound-control role="group" aria-label={ar ? "التحكم في صوت الموقع" : "Site sound controls"}>
      <button type="button" aria-label={playing ? (ar ? "إيقاف مؤقت للصوت" : "Pause sound") : (ar ? "تشغيل الصوت" : "Play sound")} title={playing ? (ar ? "إيقاف مؤقت" : "Pause") : (ar ? "تشغيل" : "Play")} aria-pressed={playing} className={styles.soundButton} onClick={() => {
      const audio = audioRef.current;
      if (!audio) return;
      if (audio.paused) void audio.play().catch(() => {}); else audio.pause();
    }}><svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">{playing ? <path d="M6 5h4v14H6zm8 0h4v14h-4z" /> : <path d="m8 5 11 7-11 7z" />}</svg></button>
      <button type="button" className={styles.soundButton} aria-label={muted || volume === 0 ? (ar ? "إلغاء كتم الصوت" : "Unmute sound") : (ar ? "كتم الصوت" : "Mute sound")} title={muted || volume === 0 ? (ar ? "إلغاء الكتم" : "Unmute") : (ar ? "كتم الصوت" : "Mute")} aria-pressed={muted || volume === 0} onClick={() => {
        const audio = audioRef.current;
        if (!audio) return;
        const next = !(muted || volume === 0);
        if (!next && volume === 0) { audio.volume = 0.7; setVolume(70); }
        audio.muted = next; setMuted(next);
      }}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M11 5 6 9H3v6h3l5 4z" />{muted || volume === 0 ? <path d="m16 9 5 6m0-6-5 6" /> : <><path d="M15 8a6 6 0 0 1 0 8" /><path d="M18 5a10 10 0 0 1 0 14" /></>}</svg></button>
      <input className={styles.soundVolume} type="range" min={0} max={100} step={1} value={volume} dir="ltr" aria-label={ar ? "مستوى الصوت" : "Sound volume"} aria-valuetext={`${volume}%`} title={`${volume}%`} onChange={(event) => {
        const next = Number(event.target.value);
        const audio = audioRef.current;
        if (!audio) return;
        audio.volume = next / 100; audio.muted = false;
        setVolume(next); setMuted(false);
      }} />
    </div>}
  </>;
}
