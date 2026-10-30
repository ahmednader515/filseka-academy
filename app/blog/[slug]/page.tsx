import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BLOG_CATEGORIES, BLOG_DEMOS, blogImage, readingMinutes, readingLabel } from "@/lib/blog-content";
import { getPublicBlogPost, listBlogPosts } from "@/lib/blog-db";
import { getLocaleFromCookie } from "@/lib/i18n/server";
import { BlogBody } from "@/components/BlogBody";
import { AcademyIcon } from "@/components/AcademyIcon";
import styles from "../blog.module.css";

export const dynamic = "force-dynamic";
async function findPost(slug: string) { return slug.startsWith("demo-") ? BLOG_DEMOS.find((post) => post.slug === slug) || null : getPublicBlogPost(slug); }
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const [post, locale] = await Promise.all([findPost((await params).slug), getLocaleFromCookie()]);
  if (!post) return { title: locale === "ar" ? "المقال غير موجود" : "Article not found" };
  return { title: `${locale === "en" && post.titleEn ? post.titleEn : post.title} | ${locale === "ar" ? "في السكة أكاديمي" : "Filsaka Academy"}`, description: locale === "en" && post.excerptEn ? post.excerptEn : post.excerpt, robots: post.isDemo ? { index: false, follow: true } : undefined };
}
export default async function BlogArticle({ params }: { params: Promise<{ slug: string }> }) {
  const [post, locale] = await Promise.all([findPost((await params).slug), getLocaleFromCookie()]);
  if (!post) notFound();
  const ar = locale === "ar";
  const title = !ar && post.titleEn ? post.titleEn : post.title;
  const body = !ar && post.bodyEn ? post.bodyEn : post.body;
  const category = BLOG_CATEGORIES.find((item) => item.id === post.category)!;
  const related = post.isDemo ? BLOG_DEMOS.filter((item) => item.id !== post.id).sort((a, b) => Number(b.category === post.category) - Number(a.category === post.category)).slice(0, 3) : (await listBlogPosts().catch(() => [])).filter((item) => item.id !== post.id).sort((a, b) => Number(b.category === post.category) - Number(a.category === post.category)).slice(0, 3);
  return <div className={styles.page} dir={ar ? "rtl" : "ltr"}><div className={styles.articleContainer}>
    <nav className={styles.breadcrumb} aria-label={ar ? "مسار التنقل" : "Breadcrumb"}><Link href="/">{ar ? "الرئيسية" : "Home"}</Link><span aria-hidden="true">/</span><Link href="/blog">{ar ? "المدونة" : "Blog"}</Link><span aria-hidden="true">/</span><span aria-current="page">{ar ? category.ar : category.en}</span></nav>
    <article className={styles.article}><header><span className={styles.articleCategory}><AcademyIcon name={category.icon} />{ar ? category.ar : category.en}</span>{post.isDemo && <span className={styles.demoBadge}>{ar ? "مقال تجريبي" : "Demo article"}</span>}<h1>{title}</h1><p className={styles.articleExcerpt}>{!ar && post.excerptEn ? post.excerptEn : post.excerpt}</p><div className={styles.articleByline}><span>{(!ar && post.authorEn ? post.authorEn : post.author) || (ar ? "في السكة أكاديمي" : "Filsaka Academy")}</span>{post.publishedAt && <time dateTime={post.publishedAt}>{new Intl.DateTimeFormat(ar ? "ar-EG" : "en-GB", { dateStyle: "long", timeZone: "Africa/Cairo" }).format(new Date(post.publishedAt))}</time>}<span>{readingLabel(readingMinutes(body), ar)}</span></div></header>
      <div className={styles.articleCover}><Image src={blogImage(post)} alt="" fill priority sizes="(max-width: 900px) 100vw, 900px" unoptimized={!!post.imageUrl && !post.imageUrl.startsWith("/")} /></div>
      <BlogBody body={body} className={styles.body} />
      <footer className={styles.articleFooter}><Link className={styles.button} href="/blog">{ar ? "العودة للمدونة" : "Back to the blog"}</Link><Link href="/courses" className={styles.textLink}>{ar ? "حوّل المعرفة لتطبيق.. اكتشف الكورسات" : "Put it into practice. Explore our courses"}<span aria-hidden="true">{ar ? "←" : "→"}</span></Link></footer>
    </article>
    {!!related.length && <section className={styles.related}><h2>{ar ? "اقرأ أيضًا" : "Read next"}</h2><div>{related.map((item) => <Link key={item.id} href={`/blog/${encodeURIComponent(item.slug)}`}><strong>{!ar && item.titleEn ? item.titleEn : item.title}</strong><span aria-hidden="true">{ar ? "←" : "→"}</span></Link>)}</div></section>}
  </div></div>;
}
