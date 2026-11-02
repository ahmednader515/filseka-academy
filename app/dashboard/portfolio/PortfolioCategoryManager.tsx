"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useLocale } from "@/components/LocaleProvider";
import { portfolioCategorySchema, type PortfolioCategory, type PortfolioWork } from "@/lib/portfolio-content";
import styles from "../management.module.css";

export function PortfolioCategoryManager({ initial, works }: { initial: PortfolioCategory[]; works: PortfolioWork[] }) {
  const ar = useLocale() === "ar";
  const text = (a: string, e: string) => ar ? a : e;
  const router = useRouter();
  const [categories, setCategories] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  function update(id: string, values: Partial<PortfolioCategory>) { setCategories((items) => items.map((item) => item.id === id ? { ...item, ...values } : item)); }
  function move(index: number, offset: number) {
    setCategories((items) => { const next = [...items]; [next[index], next[index + offset]] = [next[index + offset], next[index]]; return next; });
  }
  return <details className={`${styles.panel} mb-6`}><summary className="cursor-pointer text-lg font-bold">{text("إدارة أقسام معرض الأعمال", "Manage portfolio categories")}</summary>
    <p>{text("أضف الأقسام وعدّل أسماءها وأيقوناتها وترتيبها، ثم احفظ. لحذف قسم مستخدم، انقل أعماله إلى قسم آخر أولًا.", "Add categories and edit their names, icons and order, then save. Move a category's works elsewhere before deleting it.")}</p>
    <form className={styles.manager} onSubmit={async (event) => {
      event.preventDefault(); setBusy(true); setMessage("");
      try {
        const response = await fetch("/api/dashboard/portfolio/categories", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(categories) });
        const result = await response.json();
        if (!response.ok) throw new Error(result.error);
        setMessage(text("تم حفظ الأقسام.", "Categories saved.")); router.refresh();
      } catch (error) { setMessage(error instanceof Error ? error.message : text("تعذر الحفظ", "Could not save")); }
      finally { setBusy(false); }
    }}>
      {categories.map((category, index) => { const count = works.filter((work) => work.category === category.id).length; return <fieldset key={category.id} disabled={busy} className="grid gap-3 rounded-xl border border-white/15 p-4 sm:grid-cols-3">
        <legend className="px-2 text-sm"><span className="inline-flex flex-wrap items-center gap-3"><span>{text("الترتيب:", "Position:")} <bdi>{index + 1}</bdi></span><span className="text-[var(--color-muted)]">{text("عدد الأعمال:", "Works:")} <bdi>{count}</bdi></span></span></legend>
        <label>{text("الاسم بالعربية", "Arabic name")}<input required maxLength={120} value={category.ar} onChange={(event) => update(category.id, { ar: event.target.value })} dir="rtl" /></label>
        <label>{text("الاسم بالإنجليزية", "English name")}<input required maxLength={120} value={category.en} onChange={(event) => update(category.id, { en: event.target.value })} dir="ltr" /></label>
        <label>{text("الأيقونة", "Icon")}<select value={category.icon} onChange={(event) => update(category.id, { icon: event.target.value as PortfolioCategory["icon"] })}>{portfolioCategorySchema.shape.icon.options.map((icon) => <option key={icon} value={icon}>{({ video: text("فيديو", "Video"), mic: text("ميكروفون", "Microphone"), users: text("أشخاص", "People"), broadcast: text("بث", "Broadcast"), camera: text("كاميرا", "Camera"), layers: text("مجموعات", "Collections"), graduate: text("تدريب", "Training"), book: text("كتاب", "Book") })[icon]}</option>)}</select></label>
        <div className={`${styles.actions} sm:col-span-3`}>
          <button type="button" disabled={index === 0} onClick={() => move(index, -1)}>{text("لأعلى", "Move up")} ↑</button>
          <button type="button" disabled={index === categories.length - 1} onClick={() => move(index, 1)}>{text("لأسفل", "Move down")} ↓</button>
          <button type="button" disabled={count > 0 || categories.length === 1} title={count ? text("انقل أعمال هذا القسم أولًا", "Move this category's works first") : undefined} className="text-red-300" onClick={() => { if (window.confirm(text("حذف هذا القسم عند حفظ التغييرات؟", "Delete this category when changes are saved?"))) setCategories((items) => items.filter((item) => item.id !== category.id)); }}>{text("حذف القسم", "Delete category")}</button>
        </div>
      </fieldset>; })}
      <div className={styles.actions}><button type="button" disabled={busy || categories.length >= 50} onClick={() => setCategories((items) => [...items, { id: `category-${crypto.randomUUID()}`, ar: "", en: "", icon: "video" }])}>{text("إضافة قسم", "Add category")} +</button><button className={styles.button} disabled={busy}>{busy ? text("جارٍ الحفظ…", "Saving…") : text("حفظ الأقسام", "Save categories")}</button></div>
      {message && <p role="status">{message}</p>}
    </form>
  </details>;
}
