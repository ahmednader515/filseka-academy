"use client";

import { useCallback, useEffect, useState } from "react";
import type { StudioData } from "@/lib/studio-shared";
import styles from "./studio.module.css";
import { StudioAudioPlayer } from "./StudioAudioPlayer";

export function StudioIcon({ name }: { name: "record" | "upload" | "listen" | "enhance" | "tasks" | "star" | "chart" | "mic" }) {
  return <svg viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {name === "record" && <><circle cx="16" cy="16" r="13" /><circle cx="16" cy="16" r="9" /><circle cx="16" cy="16" r="5" /></>}
    {name === "upload" && <><path d="M9 25H7a6 6 0 0 1-1-12 10 10 0 0 1 19-2 7 7 0 0 1 0 14h-2M16 29V13m-6 6 6-6 6 6" /></>}
    {name === "listen" && <><path d="M4 19v-4a12 12 0 0 1 24 0v4" /><rect x="3" y="16" width="6" height="12" rx="3" /><rect x="23" y="16" width="6" height="12" rx="3" /></>}
    {name === "enhance" && <><path d="M7 3v26M16 3v26M25 3v26" /><rect x="4" y="10" width="6" height="5" rx="1" fill="currentColor" /><rect x="13" y="19" width="6" height="5" rx="1" fill="currentColor" /><rect x="22" y="6" width="6" height="5" rx="1" fill="currentColor" /></>}
    {name === "tasks" && <><rect x="5" y="5" width="22" height="25" rx="3" /><rect x="11" y="2" width="10" height="6" rx="2" /><path d="m10 15 2 2 4-4m2 3h5m-13 8h13" /></>}
    {name === "star" && <path d="m16 2 4.5 9 10 1.5-7.2 7 1.7 10-9-4.8-9 4.8 1.7-10-7.2-7 10-1.5Z" />}
    {name === "chart" && <><path d="M4 29V18h5v11m5 0V12h5v17m5 0V5h5v24M3 11l8-6 7 2 9-5" /></>}
    {name === "mic" && <><rect x="11" y="2" width="10" height="19" rx="5" /><path d="M7 14v3a9 9 0 0 0 18 0v-3M16 26v4m-6 0h12" /></>}
  </svg>;
}

export async function studioRequest(body: Record<string, unknown>) {
  const response = await fetch("/api/studio", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || "تعذر حفظ البيانات");
  return data;
}

export function useStudioData() {
  const [data, setData] = useState<StudioData>({ exercises: [], recordings: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const refresh = useCallback(async (signal?: AbortSignal) => {
    try {
      const response = await fetch("/api/studio", { signal, cache: "no-store" });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "تعذر تحميل الاستوديو");
      setData(result);
      setError("");
    } catch (cause) {
      if (!signal?.aborted) setError(cause instanceof Error ? cause.message : "تعذر الاتصال");
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }, []);
  useEffect(() => {
    const controller = new AbortController();
    void refresh(controller.signal);
    const interval = window.setInterval(() => { if (!document.hidden) void refresh(controller.signal); }, 30000);
    return () => { controller.abort(); window.clearInterval(interval); };
  }, [refresh]);
  return { data, loading, error, refresh };
}

export function Waveform({ active = false }: { active?: boolean }) {
  return <div className={`${styles.waveform} ${active ? styles.liveWave : ""}`} aria-hidden="true">{Array.from({ length: 78 }, (_, i) => <i key={i} style={{ height: `${8 + Math.abs(Math.sin(i * 1.73) * Math.cos(i * .21)) * 85}%`, animationDelay: `${i * -.08}s` }} />)}</div>;
}

export function StudioAudio({ id }: { id: string }) {
  return <StudioAudioPlayer key={id} src={`/api/studio/audio/${encodeURIComponent(id)}`} downloadUrl={`/api/studio/audio/${encodeURIComponent(id)}?download=1`} />;
}
