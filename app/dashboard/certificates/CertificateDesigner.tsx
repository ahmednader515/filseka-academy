"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useLocale } from "@/components/LocaleProvider";
import { ImageAttachField } from "@/components/ImageAttachField";
import { CertificateDocument } from "@/components/CertificateDocument";
import type { CertificateDesign } from "@/lib/certificate-design";
import styles from "../management.module.css";

export function CertificateDesigner({ initial, courses }: { initial: { design: CertificateDesign; courseIds: string[] }; courses: { id: string; title: string }[] }) {
  const ar = useLocale() === "ar";
  const text = (a: string, e: string) => ar ? a : e;
  const router = useRouter();
  const [design, setDesign] = useState(initial.design);
  const [courseIds, setCourseIds] = useState(initial.courseIds);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [query, setQuery] = useState("");
  const fields: [keyof CertificateDesign, string, string][] = [["academy", "اسم الأكاديمية", "Academy name"], ["title", "عنوان الشهادة", "Certificate title"], ["subtitle", "العنوان الفرعي", "Subtitle"], ["introduction", "مقدمة الشهادة", "Introduction"], ["completion", "نص إتمام التدريب", "Completion text"], ["signatory", "اسم الموقّع", "Signatory"], ["signatoryRole", "صفة الموقّع", "Signatory role"]];
  return <div className={styles.manager}><div className={styles.intro}><h2>{text("تصميم شهادات الأكاديمية", "Certificate designer")}</h2><p>{text("تصميم مستوحى من cert.jpeg. تُصدر الشهادة تلقائيًا عند إتمام جميع دروس كورس مفعّل للشهادات. يحتفظ كل إصدار بتصميمه وأسماء الطالب والكورس وقت الإصدار.", "Inspired by cert.jpeg. Certificates are issued after all lessons in an enabled course are completed. Issued certificates retain their original design and names.")}</p></div>
    <form onSubmit={async (e) => { e.preventDefault(); setBusy(true); setMessage(""); try { const response = await fetch("/api/dashboard/certificates", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ design, courseIds }) }); const result = await response.json(); if (!response.ok) throw new Error(result.error); setMessage(text("تم حفظ التصميم والكورسات.", "Design and course settings saved.")); router.refresh(); } catch (e) { setMessage(e instanceof Error ? e.message : text("تعذر الحفظ", "Save failed")); } finally { setBusy(false); } }} className={styles.columns}>
      <div className={styles.panel}><h3>{text("إعدادات التصميم", "Design settings")}</h3>{fields.map(([key, a, e]) => <label key={key}>{text(a, e)}<input maxLength={key === "completion" ? 400 : key === "introduction" ? 300 : 150} required={!["subtitle", "signatoryRole"].includes(key)} value={design[key]} onChange={(e) => setDesign({ ...design, [key]: e.target.value })} /></label>)}<label>{text("لون الشريط والعناوين", "Ribbon and heading color")}<input type="color" value={design.accent} onChange={(e) => setDesign({ ...design, accent: e.target.value })} /></label><ImageAttachField label={text("شعار الأكاديمية", "Academy logo")} value={design.logoUrl} onChange={(logoUrl) => setDesign({ ...design, logoUrl })} /><ImageAttachField label={text("صورة التوقيع (اختياري)", "Signature image (optional)")} value={design.signatureUrl} onChange={(signatureUrl) => setDesign({ ...design, signatureUrl })} /><button className={styles.button} disabled={busy}>{busy ? text("جارٍ الحفظ…", "Saving…") : text("حفظ التصميم والكورسات", "Save design and courses")}</button>{message && <p role="status">{message}</p>}</div>
      <div className={styles.manager}><section className={styles.panel}><h3>{text("معاينة مباشرة", "Live preview")}</h3><div className={styles.preview}><CertificateDocument design={design} studentName={text("اسم الطالب / الطالبة", "Student name")} courseTitle={text("التقديم الإذاعي", "Radio presenting")} /></div><a href="/cert.jpeg" target="_blank" rel="noreferrer" className="text-sm text-pink-300">{text("عرض مرجع التصميم", "View design reference")}</a></section><section className={styles.panel}><h3>{text("الكورسات التي تمنح شهادة", "Courses awarding certificates")}</h3><p>{text("فعّل الكورسات المطلوبة ثم احفظ. إضافة دروس جديدة تتطلب إتمامها للشهادات التي لم تُصدر بعد.", "Enable courses and save. Newly added lessons must also be completed for certificates not yet issued.")}</p><label>{text("بحث عن كورس", "Search courses")}<input type="search" value={query} onChange={(e) => setQuery(e.target.value)} /></label><div className={styles.list}>{courses.filter((c) => c.title.toLowerCase().includes(query.toLowerCase())).map((c) => <label key={c.id} className={styles.checkbox}><input type="checkbox" checked={courseIds.includes(c.id)} onChange={(e) => setCourseIds(e.target.checked ? [...courseIds, c.id] : courseIds.filter((id) => id !== c.id))} />{c.title}</label>)}</div>{!courses.length && <p>{text("أنشئ كورسًا أولًا.", "Create a course first.")}</p>}</section></div>
    </form>
  </div>;
}
