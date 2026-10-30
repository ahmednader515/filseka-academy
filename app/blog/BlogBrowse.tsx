"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import { AcademyIcon } from "@/components/AcademyIcon";
import { useLocale } from "@/components/LocaleProvider";
import { BLOG_CATEGORIES, blogImage, readingLabel, type BlogSummary } from "@/lib/blog-content";
import styles from "./blog.module.css";

function normalize(value: string) { return value.normalize("NFKD").replace(/[\u064B-\u065F\u0670\u0640]/g, "").replace(/[أإآ]/g, "ا").toLowerCase().trim(); }
function ArticleMeta({ post, ar }: { post: BlogSummary; ar: boolean }) {
  return <div className={styles.meta}>{post.isDemo ? <span className={styles.demoBadge}>{ar ? "مقال تجريبي" : "Demo article"}</span> : post.publishedAt && <time dateTime={post.publishedAt}><AcademyIcon name="clock" />{new Intl.DateTimeFormat(ar ? "ar-EG" : "en-GB", { dateStyle: "medium", timeZone: "Africa/Cairo" }).format(new Date(post.publishedAt))}</time>}<span><AcademyIcon name="book" />{readingLabel(ar ? post.readingMinutes : post.readingMinutesEn, ar)}</span></div>;
}
export function BlogBrowse({ posts, unavailable }: { posts: BlogSummary[]; unavailable: boolean }) {
  const ar = useLocale() === "ar";
  const text = (arabic: string, english: string) => ar ? arabic : english;
  const [category, setCategory] = useState("all");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const title = (post: BlogSummary) => !ar && post.titleEn ? post.titleEn : post.title;
  const excerpt = (post: BlogSummary) => !ar && post.excerptEn ? post.excerptEn : post.excerpt;
  const featured = category === "all" && !query.trim() ? posts.find((post) => post.isFeatured) || posts[0] : undefined;
  const filtered = useMemo(() => posts.filter((post) => post.id !== featured?.id && (category === "all" || post.category === category) && (!normalize(query) || normalize([post.title, post.titleEn, post.excerpt, post.excerptEn, post.author, post.authorEn].join(" ")).includes(normalize(query)))), [posts, featured, category, query]);
  const pageCount = Math.max(1, Math.ceil(filtered.length / 4));
  const currentPage = Math.min(page, pageCount);
  const visible = filtered.slice((currentPage - 1) * 4, currentPage * 4);
  function selectCategory(value: string) { setCategory(value); setPage(1); }
  const demoMode = posts.every((post) => post.isDemo);

  return <div className={styles.page} dir={ar ? "rtl" : "ltr"}>
    <header className={styles.hero}><Image src="/background.png" fill priority alt="" sizes="100vw" className={styles.heroImage} /><div className={styles.heroCopy}><nav className={styles.breadcrumb} aria-label={text("مسار التنقل", "Breadcrumb")}><Link href="/">{text("الرئيسية", "Home")}</Link><span aria-hidden="true">/</span><span aria-current="page">{text("المدونة", "Blog")}</span></nav><div className={styles.heading}><span className={styles.headingIcon}><AcademyIcon name="book" /></span><div><h1>{text("المدونة", "The blog")}</h1><span className={styles.stroke} aria-hidden="true" /></div></div><p>{text("مقالات وأفكار تلهمك في الإذاعة والبودكاست وصناعة المحتوى.", "Articles and ideas to inspire your journey in presenting, podcasts and content creation.")}</p></div></header>
    <div className={styles.layout}>
      <section className={styles.mainContent} aria-label={text("مقالات المدونة", "Blog articles")}>
        <div className={styles.topFilters} role="group" aria-label={text("أقسام المقالات", "Article categories")}><button type="button" aria-pressed={category === "all"} onClick={() => selectCategory("all")}><AcademyIcon name="layers" />{text("كل المقالات", "All articles")}</button>{BLOG_CATEGORIES.map((item) => <button key={item.id} type="button" aria-pressed={category === item.id} onClick={() => selectCategory(item.id)}><AcademyIcon name={item.icon} />{ar ? item.ar : item.en}</button>)}</div>
        {demoMode && <p className={styles.demoNotice}>{unavailable ? text("تعذر تحميل المقالات المنشورة. نعرض مقالات تجريبية للتصفح.", "Published articles could not be loaded. Demo articles are available to browse.") : text("مقالات تجريبية للتصفح · تظهر مقالات الأكاديمية هنا عند نشرها", "Demo articles to explore · Academy articles appear here once published")}</p>}
        {featured && <article className={styles.featured}><Link href={`/blog/${encodeURIComponent(featured.slug)}`} className={styles.featuredImage} aria-label={title(featured)}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={blogImage(featured)} alt="" />
        </Link><div className={styles.featuredCopy}><span className={styles.featuredBadge}><AcademyIcon name="star" />{text("مقال مميز", "Featured article")}</span><h2><Link href={`/blog/${encodeURIComponent(featured.slug)}`}>{title(featured)}</Link></h2><p>{excerpt(featured)}</p><ArticleMeta post={featured} ar={ar} /><Link className={styles.button} href={`/blog/${encodeURIComponent(featured.slug)}`}>{text("اقرأ المقال كاملًا", "Read the full article")}<span aria-hidden="true">{ar ? "‹" : "›"}</span></Link></div></article>}
        <div className={styles.sectionHeading}><h2>{category === "all" && !query ? text("أحدث المقالات", "Latest articles") : text("نتائج المقالات", "Article results")}</h2><p role="status">{text(`${filtered.length} مقال`, `${filtered.length} articles`)}</p></div>
        {visible.length ? <div className={styles.articleGrid}>{visible.map((post) => <article key={post.id} className={styles.card}><Link href={`/blog/${encodeURIComponent(post.slug)}`} className={styles.cardImage} aria-label={title(post)}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={blogImage(post)} alt="" loading="lazy" /><span>{ar ? BLOG_CATEGORIES.find((item) => item.id === post.category)?.ar : BLOG_CATEGORIES.find((item) => item.id === post.category)?.en}</span>
        </Link><div className={styles.cardCopy}><h3><Link href={`/blog/${encodeURIComponent(post.slug)}`}>{title(post)}</Link></h3><p>{excerpt(post)}</p><ArticleMeta post={post} ar={ar} /><Link href={`/blog/${encodeURIComponent(post.slug)}`} className={styles.readMore}>{text("اقرأ المزيد", "Read more")}<span aria-hidden="true">{ar ? "‹" : "›"}</span></Link></div></article>)}</div> : <div className={styles.empty}><AcademyIcon name="book" /><h3>{featured ? text("ترقّب المزيد من المقالات", "More articles to come") : text("لا توجد مقالات مطابقة", "No matching articles")}</h3><p>{text("تصفح الأقسام أو جرّب البحث بكلمات أخرى.", "Browse the categories or try another search.")}</p><button type="button" className={styles.button} onClick={() => { selectCategory("all"); setQuery(""); }}>{text("كل المقالات", "All articles")}</button></div>}
        {pageCount > 1 && <nav className={styles.pagination} aria-label={text("صفحات المقالات", "Article pages")}><button type="button" disabled={currentPage === 1} onClick={() => setPage(currentPage - 1)} aria-label={text("الصفحة السابقة", "Previous page")}>{ar ? "›" : "‹"}</button><span>{text(`صفحة ${currentPage} من ${pageCount}`, `Page ${currentPage} of ${pageCount}`)}</span><button type="button" disabled={currentPage === pageCount} onClick={() => setPage(currentPage + 1)} aria-label={text("الصفحة التالية", "Next page")}>{ar ? "‹" : "›"}</button></nav>}
      </section>

      <aside className={styles.sidebar} aria-label={text("استكشف المدونة", "Explore the blog")}>
        <label className={styles.search}><span className="sr-only">{text("ابحث في المدونة", "Search the blog")}</span><input type="search" value={query} onChange={(event) => { setQuery(event.target.value); setPage(1); }} placeholder={text("ابحث في المدونة…", "Search the blog…")} /><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><circle cx="10" cy="10" r="7" /><path d="m15 15 6 6" /></svg></label>
        <section className={styles.sidePanel}><h2><AcademyIcon name="layers" />{text("أقسام المدونة", "Categories")}</h2><div className={styles.sideCategories}>{BLOG_CATEGORIES.map((item) => <button type="button" key={item.id} aria-pressed={category === item.id} onClick={() => selectCategory(item.id)}><AcademyIcon name={item.icon} /><span>{ar ? item.ar : item.en}</span><small>{posts.filter((post) => post.category === item.id).length}</small></button>)}</div></section>
        <section className={styles.sidePanel}><h2><AcademyIcon name="book" />{text("مقالات للقراءة", "Keep reading")}</h2><div className={styles.recommended}>{posts.slice(0, 3).map((post) => <Link key={post.id} href={`/blog/${encodeURIComponent(post.slug)}`}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={blogImage(post)} alt="" loading="lazy" /><span><strong>{title(post)}</strong><small>{readingLabel(ar ? post.readingMinutes : post.readingMinutesEn, ar)}</small></span>
        </Link>)}</div></section>
        <section className={styles.keepInTouch}><AcademyIcon name="mentor" /><h2>{text("فكرة تستحق المشاركة؟", "Have an idea to share?")}</h2><p>{text("اقترح موضوعًا تحب تقرأ عنه أو تواصل مع فريق الأكاديمية.", "Suggest a topic you’d like to read about or get in touch with the academy.")}</p><Link href="/contact" className={styles.button}>{text("تواصل معنا", "Contact us")}<span aria-hidden="true">{ar ? "‹" : "›"}</span></Link></section>
      </aside>
    </div>
  </div>;
}
