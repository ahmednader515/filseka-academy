"use client";

import Image from "next/image";
import Link from "next/link";
import { useLocale } from "./LocaleProvider";

export type IconName = "user" | "user-plus" | "mail" | "lock" | "eye" | "eye-off" | "enter" | "phone";

export function LoginIcon({ name }: { name: IconName }) {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {(name === "user" || name === "user-plus") && <><circle cx="12" cy="7" r="4" /><path d="M4 22v-3a8 8 0 0 1 16 0v3Z" />{name === "user-plus" && <path d="M21 7v6m-3-3h6" />}</>}
    {name === "phone" && <path d="M5 3h4l2 5-3 2a15 15 0 0 0 6 6l2-3 5 2v4a2 2 0 0 1-2 2C10 21 3 14 3 5a2 2 0 0 1 2-2Z" />}
    {name === "mail" && <><rect x="2" y="4" width="20" height="16" rx="2" /><path d="m3 6 9 7 9-7" /></>}
    {name === "lock" && <><rect x="4" y="10" width="16" height="12" rx="2" /><path d="M7 10V7a5 5 0 0 1 10 0v3" /><circle cx="12" cy="16" r=".7" /></>}
    {(name === "eye" || name === "eye-off") && <><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" /><circle cx="12" cy="12" r="3" />{name === "eye-off" && <path d="m3 3 18 18" />}</>}
    {name === "enter" && <><path d="M13 3h6a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-6M3 12h12m-5-5 5 5-5 5" /></>}
  </svg>;
}

export function LoginScene({ children }: { children: React.ReactNode }) {
  const ar = useLocale() === "ar";
  return <div className="login-page">
    <Image src="/background.png" alt="" fill priority sizes="100vw" className="login-studio-background" />
    <svg className="login-ribbons" viewBox="0 0 1600 900" preserveAspectRatio="none" fill="none" aria-hidden="true">
      <defs><linearGradient id="login-ribbon" x1="0" y1="1" x2="1" y2="0"><stop stopColor="#ff001c" stopOpacity="0" /><stop offset=".5" stopColor="#ff001c" stopOpacity=".5" /><stop offset="1" stopColor="#ff001c" stopOpacity=".06" /></linearGradient><filter id="login-glow"><feGaussianBlur stdDeviation="5" /></filter></defs>
      <path d="M-60 210Q100-90 380-35M400 950C790 850 815 620 1100 650S1500 580 1670 210" stroke="url(#login-ribbon)" strokeWidth="30" />
      <path d="M-60 210Q100-90 380-35M400 950C790 850 815 620 1100 650S1500 580 1670 210" stroke="#ff1230" strokeWidth="5" filter="url(#login-glow)" />
      <path d="M-60 210Q100-90 380-35M400 950C790 850 815 620 1100 650S1500 580 1670 210" stroke="#ff4b56" strokeOpacity=".8" strokeWidth="1.5" />
    </svg>
    <div className="login-composition">
      <aside className="login-brand" dir={ar ? "rtl" : "ltr"}>
        <Link href="/" aria-label={ar ? "الصفحة الرئيسية" : "Homepage"}><Image src="/logo-1.png" alt="في السكة أكاديمي — Filsaka Academy" width={1774} height={887} priority className="login-brand-logo" /></Link>
        <div className="login-brand-tagline"><span className="login-soundwave" aria-hidden="true">▂▅▃█▂▆▂</span><p>{ar ? <>منصة التدريب المتخصصة في<br />الإعلام والإذاعة والبودكاست</> : <>Specialist training in<br />media, radio & podcasting</>}</p><span className="login-soundwave" aria-hidden="true">▂▆▂█▃▅▂</span></div>
      </aside>
      {children}
    </div>
  </div>;
}

