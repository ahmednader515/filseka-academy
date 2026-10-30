"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useLocale } from "@/components/LocaleProvider";
import type { HomepageSetting } from "@/lib/types";
import { getHomepageCopyEditorValues, HOMEPAGE_COPY_FIELDS } from "@/lib/homepage-copy";
import { HOMEPAGE_TEXT_SETTINGS } from "@/lib/homepage-text-settings";
import { parsePlatformDetailsItems } from "@/lib/platform-details";
import { parsePlatformNewsItems } from "@/lib/platform-news";
import styles from "../../management.module.css";

export function HomepageSettingsForm({ initialSettings }: { initialSettings: HomepageSetting }) {
  const ar = useLocale() === "ar";
  const text = (a: string, e: string) => ar ? a : e;
  const router = useRouter();
  const [copy, setCopy] = useState(() => getHomepageCopyEditorValues(initialSettings.homepageTextOverrides));
  const [values, setValues] = useState<Record<string, string>>(() => Object.fromEntries(HOMEPAGE_TEXT_SETTINGS.flatMap(([a, e]) => [a, e]).map((key) => [key, String(initialSettings[key as keyof HomepageSetting] ?? "")])));
  const [query, setQuery] = useState("");
  const [detailItems, setDetailItems] = useState(() => parsePlatformDetailsItems(initialSettings.platformDetailsItems));
  const [newsItems, setNewsItems] = useState(() => parsePlatformNewsItems(initialSettings.platformNewsItems));
  const socialKeys = ["youtubeUrl", "linkedinUrl", "whatsappUrl", "facebookUrl", "telegramUrl", "teamYoutubeUrl", "teamLinkedinUrl", "teamWhatsappUrl", "teamFacebookUrl", "teamTelegramUrl"] as const;
  const [social, setSocial] = useState(() => Object.fromEntries(socialKeys.map((key) => [key, String(initialSettings[key] ?? "")])));
  const [socialLeftEnabled, setSocialLeftEnabled] = useState(initialSettings.socialLeftEnabled !== false);
  const socialLabels: Record<string, string> = {
    youtubeUrl: text("يوتيوب الأكاديمية", "Academy YouTube"), linkedinUrl: text("لينكدإن الأكاديمية", "Academy LinkedIn"), whatsappUrl: text("واتساب الأكاديمية", "Academy WhatsApp"), facebookUrl: text("فيسبوك الأكاديمية", "Academy Facebook"), telegramUrl: text("تليجرام الأكاديمية", "Academy Telegram"),
    teamYoutubeUrl: text("يوتيوب فريق العمل", "Team YouTube"), teamLinkedinUrl: text("لينكدإن فريق العمل", "Team LinkedIn"), teamWhatsappUrl: text("واتساب فريق العمل", "Team WhatsApp"), teamFacebookUrl: text("فيسبوك فريق العمل", "Team Facebook"), teamTelegramUrl: text("تليجرام فريق العمل", "Team Telegram"),
  };
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const groups = [...new Set(HOMEPAGE_COPY_FIELDS.map((field) => field.group))];
  const labels: Record<string, string> = { Navigation: "التنقل والبحث", Hero: "الواجهة الرئيسية", Courses: "الكورسات", "Mobile app": "تطبيق الأكاديمية", Teachers: "المدربون", Achievements: "إنجازات الأكاديمية", Categories: "أقسام الكورسات", Footer: "التذييل", Subscriptions: "الاشتراكات", Store: "المكتبة الإعلامية", Reviews: "التقييمات", "Call to action": "الدعوة للتعلم", News: "الأخبار", "Editorial collections": "المجموعات التحريرية" };
  const match = (value: string) => value.toLowerCase().includes(query.trim().toLowerCase());
  function editor(label: string, arabic: string, english: string, update: (locale: "ar" | "en", value: string) => void, limit: number) {
    return <div className="rounded-xl border border-[#71304788] p-4"><p className="mb-3 text-sm font-bold">{label}</p><div className="grid gap-3 sm:grid-cols-2"><label>العربية<textarea dir="rtl" rows={2} maxLength={limit} value={arabic} onChange={(e) => update("ar", e.target.value)} /></label><label>English<textarea dir="ltr" rows={2} maxLength={limit} value={english} onChange={(e) => update("en", e.target.value)} /></label></div></div>;
  }
  return <form className={`${styles.manager} mt-6`} onSubmit={async (e) => {
    e.preventDefault(); setSaving(true); setMessage("");
    try {
      const response = await fetch("/api/dashboard/settings/homepage", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...values, ...social, socialLeftEnabled, homepageTextOverrides: copy, ...(detailItems.length ? { platformDetailsItems: detailItems } : {}), ...(newsItems.length ? { platformNewsItems: newsItems } : {}) }) });
      const data = await response.json(); if (!response.ok) throw new Error(data.error);
      setMessage(text("تم حفظ نصوص الصفحة الرئيسية.", "Homepage text saved.")); router.refresh();
    } catch (e) { setMessage(e instanceof Error ? e.message : text("تعذر حفظ النصوص", "Could not save text")); } finally { setSaving(false); }
  }}>
    <section className={styles.panel}><h2 className="text-xl font-bold">{text("نصوص الصفحة الرئيسية", "Homepage text")}</h2><p>{text("عدّل عناوين الصفحة وأوصافها وأزرارها باللغتين. تُدار أسماء الكورسات والأقسام والمدربين والمنتجات من صفحاتها الخاصة. إعدادات الصور والتصميم السابقة لا تتغير عند حفظ النصوص.", "Edit homepage headings, descriptions and buttons in both languages. Course, category, instructor and product content is managed on their own pages. Saving text preserves existing artwork and layout settings.")}</p><label>{text("ابحث عن نص أو حقل", "Search text or fields")}<input type="search" value={query} onChange={(e) => setQuery(e.target.value)} /></label></section>
    <details className={styles.panel}><summary className="cursor-pointer text-lg font-bold">{text("العناوين والأوصاف الأساسية", "Main headings and descriptions")}</summary>{HOMEPAGE_TEXT_SETTINGS.filter(([a, e, la, le]) => match(la + le + values[a] + values[e])).map(([a, e, la, le, limit]) => <div key={a}>{editor(text(la, le), values[a], values[e], (locale, value) => setValues((v) => ({ ...v, [locale === "ar" ? a : e]: value })), limit)}</div>)}</details>
    {groups.map((group) => {
      const fields = HOMEPAGE_COPY_FIELDS.filter((f) => f.group === group && match(f.labelAr + f.labelEn + copy[f.key]?.ar + copy[f.key]?.en));
      if (!fields.length) return null;
      return <details key={group} className={styles.panel}><summary className="cursor-pointer text-lg font-bold">{ar ? labels[group] || group : group}</summary>{fields.map((field) => <div key={field.key}>{editor(text(field.labelAr, field.labelEn), copy[field.key].ar, copy[field.key].en, (locale, value) => setCopy((current) => ({ ...current, [field.key]: { ...current[field.key], [locale]: value } })), 2000)}</div>)}</details>;
    })}
    {detailItems.length > 0 && <details className={styles.panel}><summary className="cursor-pointer text-lg font-bold">{text("نصوص بطاقات تفاصيل المنصة", "Platform detail cards")}</summary>{detailItems.map((item, index) => <div key={item.id}>{editor(text(`بطاقة ${index + 1} · العنوان`, `Card ${index + 1} · title`), item.title, item.titleEn || "", (locale, value) => setDetailItems((items) => items.map((row, i) => i === index ? { ...row, [locale === "ar" ? "title" : "titleEn"]: value } : row)), 120)}{editor(text("الوصف", "Description"), item.description, item.descriptionEn || "", (locale, value) => setDetailItems((items) => items.map((row, i) => i === index ? { ...row, [locale === "ar" ? "description" : "descriptionEn"]: value } : row)), 400)}</div>)}</details>}
    {newsItems.length > 0 && <details className={styles.panel}><summary className="cursor-pointer text-lg font-bold">{text("نصوص الأخبار الحالية", "Current news text")}</summary>{newsItems.map((item, index) => <div key={item.id}>{editor(text(`خبر ${index + 1}`, `News ${index + 1}`), item.description, item.descriptionEn || "", (locale, value) => setNewsItems((items) => items.map((row, i) => i === index ? { ...row, [locale === "ar" ? "description" : "descriptionEn"]: value } : row)), 1000)}</div>)}</details>}
    <details className={styles.panel}><summary className="cursor-pointer text-lg font-bold">{text("روابط التواصل الاجتماعي", "Social links")}</summary><label className={styles.checkbox}><input type="checkbox" checked={socialLeftEnabled} onChange={(e) => setSocialLeftEnabled(e.target.checked)} />{text("إظهار روابط فريق العمل", "Show team social links")}</label>{socialKeys.map((key) => <label key={key}>{socialLabels[key]}<input dir="ltr" maxLength={4000} value={social[key]} onChange={(e) => setSocial((v) => ({ ...v, [key]: e.target.value }))} /></label>)}</details>
    <div className="sticky bottom-4 z-10 flex flex-wrap items-center gap-4 rounded-2xl border border-[#97304f] bg-[#180c12]/95 p-4 shadow-xl backdrop-blur"><button disabled={saving} className={styles.button}>{saving ? text("جارٍ الحفظ…", "Saving…") : text("حفظ النصوص", "Save text")}</button>{message && <p role="status" className="text-sm">{message}</p>}</div>
  </form>;
}
