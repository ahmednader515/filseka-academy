"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useLocale } from "@/components/LocaleProvider";
import { ImageAttachField } from "@/components/ImageAttachField";
import styles from "../management.module.css";

type CategoryRow = { id: string; name: string; nameAr: string; slug: string; description: string; imageUrl: string; order: number; courses: number };
const empty = { name: "", nameAr: "", description: "", imageUrl: "", order: 0 };
export function CategoryManager({ categories }: { categories: CategoryRow[] }) {
  const ar = useLocale() === "ar";
  const text = (a: string, e: string) => ar ? a : e;
  const router = useRouter();
  const [form, setForm] = useState(empty);
  const [editing, setEditing] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  async function mutate(url: string, method: string, body?: unknown) {
    setBusy(true); setMessage("");
    try {
      const response = await fetch(url, { method, headers: { "Content-Type": "application/json" }, ...(body ? { body: JSON.stringify(body) } : {}) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || text("تعذر الحفظ", "Save failed"));
      setForm(empty); setEditing(null); setMessage(text("تم الحفظ بنجاح", "Saved successfully")); router.refresh();
    } catch (e) { setMessage(e instanceof Error ? e.message : text("تعذر الحفظ", "Save failed")); }
    finally { setBusy(false); }
  }
  return <div className={styles.manager}>
    <div className={styles.intro}><h2>{text("أقسام الكورسات", "Course categories")}</h2><p>{text("أنشئ الأقسام وعدّل أسماءها وصورها وترتيب ظهورها. حذف قسم لا يحذف كورساته.", "Create categories and edit their names, artwork and display order. Deleting a category keeps its courses.")}</p></div>
    <div className={styles.columns}><form className={styles.panel} onSubmit={(e) => { e.preventDefault(); void mutate(editing ? `/api/categories/${editing}` : "/api/categories", editing ? "PUT" : "POST", form); }}>
      <h3>{editing ? text("تعديل القسم", "Edit category") : text("إنشاء قسم", "Create category")}</h3>
      {([ ["nameAr", "الاسم بالعربية", "Arabic name"], ["name", "الاسم بالإنجليزية", "English name"] ] as const).map(([key, a, e]) => <label key={key}>{text(a, e)}<input required maxLength={150} dir={key === "nameAr" ? "rtl" : "ltr"} value={form[key]} onChange={(e) => setForm({ ...form, [key]: e.target.value })} /></label>)}
      <label>{text("الوصف", "Description")}<textarea maxLength={2000} rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></label>
      <label>{text("ترتيب العرض (الأقل أولًا)", "Display order (lowest first)")}<input required type="number" min={0} max={10000} value={form.order} onChange={(e) => setForm({ ...form, order: Number(e.target.value) })} /></label>
      <ImageAttachField label={text("صورة القسم", "Category artwork")} value={form.imageUrl} onChange={(imageUrl) => setForm({ ...form, imageUrl })} />
      <div className={styles.actions}><button disabled={busy} className={styles.button}>{busy ? text("جارٍ الحفظ…", "Saving…") : text("حفظ القسم", "Save category")}</button>{editing && <button type="button" onClick={() => { setForm(empty); setEditing(null); }}>{text("إلغاء", "Cancel")}</button>}</div>
    </form><section className={styles.panel}><label>{text("بحث في الأقسام", "Search categories")}<input type="search" value={query} onChange={(e) => setQuery(e.target.value)} /></label><div className={styles.list}>{categories.filter((c) => `${c.name} ${c.nameAr} ${c.slug}`.toLowerCase().includes(query.toLowerCase())).map((c) => <article key={c.id} className={styles.row}><div><strong>{ar ? c.nameAr : c.name}</strong><p>{c.slug} · {c.courses} {text("كورس", "courses")} · #{c.order}</p><p>{c.description}</p><Link href={`/courses?category=${encodeURIComponent(c.slug)}`}>{text("عرض الكورسات", "View courses")}</Link></div><div className={styles.actions}><button disabled={busy} onClick={() => { setEditing(c.id); setForm(c); }}>{text("تعديل", "Edit")}</button><button disabled={busy} onClick={() => { if (window.confirm(text("حذف القسم؟ ستظل الكورسات محفوظة بدون قسم.", "Delete this category? Its courses will remain uncategorized."))) void mutate(`/api/categories/${c.id}`, "DELETE"); }}>{text("حذف", "Delete")}</button></div></article>)}</div>{!categories.length && <p>{text("لا توجد أقسام بعد. أنشئ أول قسم.", "No categories yet. Create your first category.")}</p>}</section></div>
    {message && <p role="status" className={styles.notice}>{message}</p>}
  </div>;
}
