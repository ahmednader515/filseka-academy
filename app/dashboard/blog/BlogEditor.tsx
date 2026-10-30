"use client";

import { useRef, useState, type ChangeEvent, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLocale } from "@/components/LocaleProvider";
import { BlogBody } from "@/components/BlogBody";
import { BLOG_CATEGORIES, blogImage, blogSchema, blogSlug, type BlogInput, type BlogPost } from "@/lib/blog-content";
import blogStyles from "@/app/blog/blog.module.css";
import styles from "./editor.module.css";

function newPost(authorName: string): BlogInput { return { title: "", titleEn: "", slug: "", excerpt: "", excerptEn: "", body: "", bodyEn: "", imageUrl: "", author: authorName || "في السكة أكاديمي", authorEn: "", category: "presenting", isFeatured: false, isPublished: false }; }

export function BlogEditor({ posts, authorName }: { posts: BlogPost[]; authorName: string }) {
  const ar = useLocale() === "ar";
  const text = (arabic: string, english: string) => ar ? arabic : english;
  const router = useRouter();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<BlogInput>(() => newPost(authorName));
  const [slugManual, setSlugManual] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState(false);
  const [previewEnglish, setPreviewEnglish] = useState(false);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [notice, setNotice] = useState<{ error?: string; success?: string }>({});
  const inFlight = useRef(false);
  const formStart = useRef<HTMLDivElement>(null);
  const visible = posts.filter((post) => (status === "all" || (status === "published" ? post.isPublished : !post.isPublished)) && `${post.title} ${post.titleEn}`.toLowerCase().includes(search.toLowerCase().trim()));
  const busy = saving || uploading;
  function update<K extends keyof BlogInput>(key: K, value: BlogInput[K]) { setDraft((current) => ({ ...current, [key]: value })); }
  function reset() { setEditingId(null); setDraft(newPost(authorName)); setSlugManual(false); setPreview(false); setNotice({}); }
  function edit(post: BlogPost) { setEditingId(post.id); setDraft({ ...post }); setSlugManual(true); setPreview(false); setNotice({}); requestAnimationFrame(() => formStart.current?.focus()); }

  async function uploadCover(event: ChangeEvent<HTMLInputElement>) {
    const file = event.currentTarget.files?.[0];
    event.currentTarget.value = "";
    if (!file || busy) return;
    if (file.size > 5 * 1024 * 1024 || !["image/jpeg", "image/png", "image/webp", "image/gif"].includes(file.type)) { setNotice({ error: text("استخدم صورة JPG أو PNG أو WebP أو GIF لا تتجاوز 5 ميجابايت.", "Use a JPG, PNG, WebP or GIF image up to 5 MB.") }); return; }
    setUploading(true); setNotice({});
    try {
      const data = new FormData(); data.set("file", file);
      const response = await fetch("/api/upload/image", { method: "POST", body: data }); const result = await response.json();
      if (!response.ok || !result.url) { setNotice({ error: text("تعذر رفع الصورة. يمكنك إدخال رابط صورة مباشر أو المحاولة بعد إعداد التخزين.", "Image upload failed. Enter a direct image URL or try again after storage is configured.") }); return; }
      update("imageUrl", result.url);
    } catch { setNotice({ error: text("تعذر الاتصال أثناء رفع الصورة.", "Connection failed while uploading.") }); }
    finally { setUploading(false); }
  }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (inFlight.current || busy) return;
    const parsed = blogSchema.safeParse(draft);
    if (!parsed.success) {
      const field = String(parsed.error.issues[0]?.path[0] || "");
      const messages: Record<string, string> = {
        title: text("اكتب عنوانًا من 2 إلى 180 حرفًا.", "Enter a title between 2 and 180 characters."),
        slug: text("استخدم رابطًا من حروف وأرقام وشرطات، ولا تبدأه بـ demo-.", "Use letters, numbers and hyphens for the slug; the demo- prefix is reserved."),
        body: text("نشر المقال يتطلب نصًا من 80 حرفًا على الأقل.", "Publishing requires at least 80 characters of article text."),
        excerpt: text("أضف ملخصًا من 10 أحرف على الأقل قبل النشر.", "Add an excerpt of at least 10 characters before publishing."),
        imageUrl: text("استخدم رابط صورة HTTP(S) أو مسارًا يبدأ بـ /.", "Use an HTTP(S) image URL or a path beginning with /."),
      };
      setNotice({ error: messages[field] || text("راجع الحقول وأطوال النصوص ثم حاول مجددًا.", "Check the fields and text lengths, then try again.") }); return;
    }
    inFlight.current = true; setSaving(true); setNotice({});
    try {
      const response = await fetch("/api/dashboard/blog", { method: editingId ? "PATCH" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...parsed.data, ...(editingId ? { id: editingId } : {}) }) });
      const result = await response.json();
      if (!response.ok) { setNotice({ error: result.code === "SLUG_EXISTS" ? text("رابط المقال مستخدم بالفعل. اختر رابطًا آخر.", "That slug is already in use. Choose another.") : text("تعذر حفظ المقال. بياناتك ما زالت في المحرّر، حاول مجددًا.", "Could not save. Your draft is still in the editor; please try again.") }); return; }
      setEditingId(result.id); setSlugManual(true); setNotice({ success: draft.isPublished ? text("تم حفظ المقال ونشره.", "Article saved and published.") : text("تم حفظ المقال كمسودة.", "Article saved as a draft.") }); router.refresh();
    } catch { setNotice({ error: text("تعذر الاتصال. بياناتك ما زالت في المحرّر.", "Connection failed. Your draft is still in the editor.") }); }
    finally { inFlight.current = false; setSaving(false); }
  }

  const fields: { key: "titleEn" | "author" | "authorEn"; ar: string; en: string; max: number; english?: boolean }[] = [{ key: "titleEn", ar: "العنوان بالإنجليزية (اختياري)", en: "English title (optional)", max: 180, english: true }, { key: "author", ar: "اسم الكاتب", en: "Arabic author name", max: 120 }, { key: "authorEn", ar: "اسم الكاتب بالإنجليزية (اختياري)", en: "English author name (optional)", max: 120, english: true }];
  return <div className={styles.editorLayout} dir={ar ? "rtl" : "ltr"}>
    <section className={styles.editorPanel} aria-labelledby="blog-editor-title"><div className={styles.editorHeading} ref={formStart} tabIndex={-1}><h3 id="blog-editor-title">{editingId ? text("تعديل المقال", "Edit article") : text("مقال جديد", "New article")}</h3><button type="button" disabled={busy} onClick={reset}>{text("مقال جديد +", "+ New article")}</button></div>
      <div className={styles.editorTabs}><button type="button" aria-pressed={!preview} onClick={() => setPreview(false)}>{text("الكتابة", "Write")}</button><button type="button" aria-pressed={preview} onClick={() => setPreview(true)}>{text("معاينة", "Preview")}</button></div>
      {preview ? <div className={styles.preview}><label className={styles.check}><input type="checkbox" checked={previewEnglish} onChange={(event) => setPreviewEnglish(event.target.checked)} />{text("معاينة الإنجليزية", "Preview English")}</label><div dir={previewEnglish ? "ltr" : "rtl"}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={blogImage(draft)} alt="" className={styles.coverPreview} /><h2>{(previewEnglish && draft.titleEn ? draft.titleEn : draft.title) || text("عنوان المقال", "Article title")}</h2><p>{previewEnglish && draft.excerptEn ? draft.excerptEn : draft.excerpt}</p><BlogBody className={blogStyles.body} body={previewEnglish && draft.bodyEn ? draft.bodyEn : draft.body} /></div><p className={styles.hint}>{text("هذه معاينة خاصة. ارجع إلى الكتابة لحفظ المقال أو نشره.", "This preview is private. Return to Write to save or publish.")}</p></div> : <form onSubmit={save} className={styles.form} aria-busy={busy}>
        <fieldset disabled={busy} className={styles.fields}>
          <label><span>{text("العنوان بالعربية", "Arabic title")} *</span><input required minLength={2} maxLength={180} value={draft.title} onChange={(event) => { const value = event.target.value; setDraft((current) => ({ ...current, title: value, ...(!slugManual ? { slug: blogSlug(value) } : {}) })); }} /></label>
          <label><span>{text("رابط المقال", "Article slug")} *</span><input required maxLength={160} value={draft.slug} dir="ltr" onChange={(event) => { setSlugManual(true); update("slug", event.target.value); }} /><small>/blog/{draft.slug || "article-title"}</small><small>{text("تغيير الرابط بعد النشر يجعل الرابط السابق غير متاح.", "Changing a published slug makes the old URL unavailable.")}</small></label>
          {fields.map((field) => <label key={field.key}><span>{text(field.ar, field.en)}</span><input maxLength={field.max} dir={field.english ? "ltr" : undefined} value={draft[field.key]} onChange={(event) => update(field.key, event.target.value)} /></label>)}
          <label><span>{text("قسم المقال", "Category")}</span><select value={draft.category} onChange={(event) => update("category", event.target.value as BlogInput["category"])}>{BLOG_CATEGORIES.map((category) => <option key={category.id} value={category.id}>{ar ? category.ar : category.en}</option>)}</select></label>
          <label><span>{text("صورة الغلاف", "Cover image")}</span><input value={draft.imageUrl} maxLength={2000} dir="ltr" placeholder="https://… /category-artwork/podcasting.webp" onChange={(event) => update("imageUrl", event.target.value)} /><small>{text("إذا تركت الرابط فارغًا ستُستخدم صورة القسم.", "Leave blank to use the category artwork.")}</small></label>
          <label className={styles.upload}><span>{uploading ? text("جارٍ رفع الصورة…", "Uploading…") : text("أو ارفع صورة (حتى 5 ميجابايت)", "Or upload an image (up to 5 MB)")}</span><input type="file" accept="image/jpeg,image/png,image/webp,image/gif" onChange={uploadCover} /></label>
          <label><span>{text("الملخص بالعربية", "Arabic excerpt")}</span><textarea rows={3} maxLength={500} value={draft.excerpt} onChange={(event) => update("excerpt", event.target.value)} /></label>
          <label><span>{text("الملخص بالإنجليزية (اختياري)", "English excerpt (optional)")}</span><textarea rows={3} maxLength={500} dir="ltr" value={draft.excerptEn} onChange={(event) => update("excerptEn", event.target.value)} /></label>
          <p className={styles.hint}>{text("التنسيق: ## لعنوان فرعي، ### لعنوان أصغر، - لقائمة، **نص بارز**، ورابط بصيغة [النص](https://…). اترك سطرًا فارغًا بين الفقرات.", "Formatting: ## heading, ### subheading, - list, **bold**, and [label](https://…) links. Leave a blank line between paragraphs.")}</p>
          <label><span>{text("نص المقال بالعربية", "Arabic article body")}</span><textarea className={styles.bodyInput} rows={15} maxLength={50000} value={draft.body} onChange={(event) => update("body", event.target.value)} /></label>
          <details className={styles.translation}><summary>{text("نص المقال بالإنجليزية (اختياري)", "English article body (optional)")}</summary><label><span className="sr-only">{text("نص المقال بالإنجليزية", "English article body")}</span><textarea rows={12} maxLength={50000} dir="ltr" value={draft.bodyEn} onChange={(event) => update("bodyEn", event.target.value)} /></label></details>
          <label className={styles.check}><input type="checkbox" checked={draft.isFeatured} onChange={(event) => update("isFeatured", event.target.checked)} />{text("مقال مميز", "Featured article")}</label><p className={styles.hint}>{text("عند تحديد أكثر من مقال مميز يظهر الأحدث نشرًا في المقدمة.", "If several posts are featured, the most recently published one leads.")}</p>
          <label className={styles.check}><input type="checkbox" checked={draft.isPublished} onChange={(event) => update("isPublished", event.target.checked)} />{text("نشر المقال للزوار", "Publish for visitors")}</label><p className={styles.hint}>{text("ألغِ التحديد ثم احفظ للاحتفاظ بمسودة أو إخفاء مقال منشور.", "Uncheck and save to keep a draft or hide a published post.")}</p>
        </fieldset>
        {notice.error && <p className={styles.error} role="alert">{notice.error}</p>}{notice.success && <p className={styles.success} role="status">{notice.success}</p>}
        <button className={styles.save} type="submit" disabled={busy}>{saving ? text("جارٍ الحفظ…", "Saving…") : draft.isPublished ? text("حفظ ونشر المقال", "Save and publish") : text("حفظ المسودة", "Save draft")}</button>
      </form>}
    </section>

    <section className={styles.postsPanel} aria-labelledby="saved-posts-title"><div className={styles.listHeading}><h3 id="saved-posts-title">{text("المقالات", "Articles")} ({posts.length})</h3><Link href="/blog">{text("فتح المدونة", "Open blog")}</Link></div><label><span className="sr-only">{text("بحث في المقالات المحفوظة", "Search saved posts")}</span><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder={text("ابحث بعنوان المقال…", "Search by title…")} /></label><label><span className="sr-only">{text("حالة المقالات", "Post status")}</span><select value={status} onChange={(event) => setStatus(event.target.value)}><option value="all">{text("كل الحالات", "All statuses")}</option><option value="published">{text("منشور", "Published")}</option><option value="draft">{text("مسودة", "Draft")}</option></select></label>
      <div className={styles.postList}>{visible.length ? visible.map((post) => <article key={post.id} className={editingId === post.id ? styles.selectedPost : undefined}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={blogImage(post)} alt="" loading="lazy" /><div><h4>{!ar && post.titleEn ? post.titleEn : post.title}</h4><p><span className={post.isPublished ? styles.published : styles.draft}>{post.isPublished ? text("منشور", "Published") : text("مسودة", "Draft")}</span>{post.isFeatured && <span>★ {text("مميز", "Featured")}</span>}</p><small>{ar ? BLOG_CATEGORIES.find((item) => item.id === post.category)?.ar : BLOG_CATEGORIES.find((item) => item.id === post.category)?.en}</small><div className={styles.postActions}><button type="button" disabled={busy} onClick={() => edit(post)}>{text("تعديل", "Edit")}</button>{post.isPublished && <Link href={`/blog/${encodeURIComponent(post.slug)}`}>{text("عرض المقال", "View article")}</Link>}</div></div>
      </article>) : <p className={styles.empty}>{text("لا توجد مقالات مطابقة. أنشئ مقالًا جديدًا أو غيّر التصفية.", "No matching articles. Create a new post or change the filter.")}</p>}</div>
    </section>
  </div>;
}
