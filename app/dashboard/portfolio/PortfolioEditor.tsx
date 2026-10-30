"use client";

import Link from "next/link";
import { useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useLocale } from "@/components/LocaleProvider";
import { PORTFOLIO_CATEGORIES, type PortfolioWork } from "@/lib/portfolio-content";

export function PortfolioEditor({ works }: { works: PortfolioWork[] }) {
  const ar = useLocale() === "ar";
  const text = (arabic: string, english: string) => ar ? arabic : english;
  const router = useRouter();
  const [editing, setEditing] = useState<PortfolioWork | null>(null);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<{ error?: string; success?: string }>({});
  const inFlight = useRef(false);
  const fieldClass = "w-full rounded-xl border border-white/25 bg-black/30 px-3 py-3 text-sm text-white focus:border-rose-400 focus:outline-none focus:ring-2 focus:ring-rose-400/30";
  const fields = [
    { name: "title", label: text("العنوان بالعربية", "Arabic title"), required: true, max: 150 },
    { name: "titleEn", label: text("العنوان بالإنجليزية", "English title"), max: 150 },
    { name: "credit", label: text("جهة الإنتاج / اسم صاحب العمل", "Production credit / creator"), max: 150 },
    { name: "creditEn", label: text("جهة الإنتاج بالإنجليزية", "English production credit"), max: 150 },
    { name: "imageUrl", label: text("رابط صورة الغلاف", "Thumbnail URL"), required: true, max: 2000, placeholder: "/category-artwork/filmmaking.webp" },
    { name: "videoUrl", label: text("رابط الفيديو (YouTube أو MP4/WebM)", "Video URL (YouTube or MP4/WebM)"), max: 2000, placeholder: "https://…" },
    { name: "duration", label: text("المدة (دقائق:ثوانٍ، اختياري)", "Duration (mm:ss, optional)"), max: 9, placeholder: "12:30" },
  ] as const;

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (inFlight.current) return;
    const form = event.currentTarget;
    const data = new FormData(form);
    const payload = { ...Object.fromEntries(data), order: Number(data.get("order") || 0), isPublished: data.get("isPublished") === "on", ...(editing ? { id: editing.id } : {}) };
    inFlight.current = true; setSaving(true); setNotice({});
    try {
      const response = await fetch("/api/dashboard/portfolio", { method: editing ? "PATCH" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      if (!response.ok) { setNotice({ error: response.status === 400 ? text("راجع البيانات: النشر يتطلب عنوانًا وصورة ورابط YouTube أو فيديو MP4/WebM صالحًا. أدخل المدة بصيغة 12:30.", "Check the fields. Publishing requires a title, thumbnail and valid YouTube or MP4/WebM video URL. Use a duration like 12:30.") : text("تعذر الحفظ. يرجى المحاولة مجددًا.", "Could not save. Please try again.") }); return; }
      setNotice({ success: text("تم حفظ العمل بنجاح.", "Work saved successfully.") }); setEditing(null); form.reset(); router.refresh();
    } catch { setNotice({ error: text("تعذر الاتصال. يرجى المحاولة مجددًا.", "Connection failed. Please try again.") }); }
    finally { inFlight.current = false; setSaving(false); }
  }

  return <div className="grid items-start gap-6 lg:grid-cols-2" dir={ar ? "rtl" : "ltr"}>
    <div className="rounded-2xl border border-rose-400/30 bg-white/5 p-5"><h3 className="mb-5 text-xl font-bold">{editing ? text("تعديل العمل", "Edit work") : text("إضافة عمل جديد", "Add new work")}</h3>
      <form key={editing?.id || "new"} onSubmit={save} className="grid gap-4" aria-busy={saving}>
        {fields.map((field) => <label key={field.name} className="grid gap-2 text-sm"><span>{field.label}{"required" in field && field.required ? " *" : ""}</span><input className={fieldClass} name={field.name} required={"required" in field && field.required} minLength={field.name === "title" ? 2 : undefined} maxLength={field.max} defaultValue={editing?.[field.name] || ""} placeholder={"placeholder" in field ? field.placeholder : undefined} dir={["imageUrl", "videoUrl", "duration", "titleEn", "creditEn"].includes(field.name) ? "ltr" : undefined} /></label>)}
        <label className="grid gap-2 text-sm"><span>{text("القسم", "Category")}</span><select name="category" defaultValue={editing?.category || "programs"} className={fieldClass}>{PORTFOLIO_CATEGORIES.map((category) => <option key={category.id} value={category.id} className="bg-neutral-900">{ar ? category.ar : category.en}</option>)}</select></label>
        <label className="grid gap-2 text-sm"><span>{text("الوصف بالعربية", "Arabic description")}</span><textarea name="description" rows={3} maxLength={3000} defaultValue={editing?.description || ""} className={fieldClass} /></label>
        <label className="grid gap-2 text-sm"><span>{text("الوصف بالإنجليزية", "English description")}</span><textarea name="descriptionEn" rows={3} maxLength={3000} defaultValue={editing?.descriptionEn || ""} className={fieldClass} dir="ltr" /></label>
        <label className="grid gap-2 text-sm"><span>{text("ترتيب العرض (الأقل أولًا)", "Display order (lowest first)")}</span><input type="number" name="order" min={0} max={10000} step={1} defaultValue={editing?.order || 0} className={fieldClass} /></label>
        <label className="flex items-center gap-3 text-sm"><input type="checkbox" name="isPublished" defaultChecked={editing?.isPublished || false} className="h-5 w-5 accent-rose-500" />{text("نشر العمل في المعرض", "Publish this work in the gallery")}</label>
        <p className="text-xs leading-6 text-[var(--color-muted)]">{text("اترك النشر غير مفعّل للاحتفاظ بالعمل كمسودة أو إخفائه عن الزوار. استخدم أعمالًا وصورًا مصرحًا بنشرها.", "Leave publishing unchecked to keep a draft or hide a work from visitors. Use productions and images cleared for publication.")}</p>
        {notice.error && <p role="alert" className="rounded-xl border border-red-400/30 bg-red-950/50 p-3 text-sm text-red-100">{notice.error}</p>}{notice.success && <p role="status" className="rounded-xl border border-emerald-400/30 bg-emerald-950/40 p-3 text-sm text-emerald-100">{notice.success}</p>}
        <div className="flex flex-wrap gap-3"><button disabled={saving} type="submit" className="min-h-11 rounded-xl bg-rose-600 px-6 py-2 font-bold disabled:opacity-50">{saving ? text("جارٍ الحفظ…", "Saving…") : text("حفظ العمل", "Save work")}</button>{editing && <button type="button" disabled={saving} className="rounded-xl border border-white/25 px-4 py-2" onClick={() => { setEditing(null); setNotice({}); }}>{text("إلغاء التعديل", "Cancel edit")}</button>}</div>
      </form>
    </div>
    <div className="grid gap-4"><div className="flex flex-wrap items-center justify-between gap-3"><h3 className="text-xl font-bold">{text("الأعمال المحفوظة", "Saved work")} ({works.length})</h3><Link href="/portfolio" className="text-sm text-rose-300 underline">{text("فتح المعرض", "Open gallery")}</Link></div>{works.length ? works.map((work) => <article key={work.id} className="flex items-center gap-4 rounded-2xl border border-white/20 bg-white/5 p-4"><div className="min-w-0 flex-1"><h4 className="font-bold [overflow-wrap:anywhere]">{!ar && work.titleEn ? work.titleEn : work.title}</h4><p className="mt-2 text-xs text-[var(--color-muted)]">{work.isPublished ? text("منشور", "Published") : text("مسودة", "Draft")} · {ar ? PORTFOLIO_CATEGORIES.find((category) => category.id === work.category)?.ar : PORTFOLIO_CATEGORIES.find((category) => category.id === work.category)?.en}</p></div><button type="button" disabled={saving} className="min-h-11 rounded-xl border border-rose-400/40 px-4 py-2 text-sm text-rose-200" onClick={() => { setEditing(work); setNotice({}); }}>{text("تعديل", "Edit")}</button></article>) : <p className="rounded-xl border border-dashed border-white/20 p-8 text-center text-sm leading-7 text-[var(--color-muted)]">{text("لا توجد أعمال محفوظة. أضف أول عمل؛ تظهر النماذج التجريبية في المعرض إلى أن يُنشر عمل حقيقي.", "No saved work yet. Add your first production; demo previews appear until a real work is published.")}</p>}</div>
  </div>;
}
