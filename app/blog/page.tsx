import { listBlogPosts } from "@/lib/blog-db";
import { BLOG_DEMOS, blogSummary } from "@/lib/blog-content";
import { getLocaleFromCookie } from "@/lib/i18n/server";
import { BlogBrowse } from "./BlogBrowse";

export const dynamic = "force-dynamic";
export async function generateMetadata() {
  const ar = (await getLocaleFromCookie()) === "ar";
  return { title: ar ? "المدونة | في السكة أكاديمي" : "Blog | Filsaka Academy", description: ar ? "مقالات وأفكار في التقديم الإذاعي والبودكاست وصناعة المحتوى والإنتاج الإعلامي." : "Articles and ideas on presenting, podcasts, content creation and media production." };
}
export default async function BlogPage() {
  const result = await listBlogPosts().then((posts) => ({ posts, unavailable: false })).catch(() => ({ posts: [], unavailable: true }));
  return <BlogBrowse posts={(result.posts.length ? result.posts : BLOG_DEMOS).map(blogSummary)} unavailable={result.unavailable} />;
}
