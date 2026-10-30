import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { listBlogPosts } from "@/lib/blog-db";
import { getLocaleFromCookie } from "@/lib/i18n/server";
import { BlogEditor } from "./BlogEditor";

export const dynamic = "force-dynamic";
export default async function BlogAdminPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login?callbackUrl=%2Fdashboard%2Fblog");
  if (!["ADMIN", "ASSISTANT_ADMIN"].includes(session.user.role)) redirect("/dashboard");
  const ar = (await getLocaleFromCookie()) === "ar";
  const result = await listBlogPosts(false).then((posts) => ({ posts, error: false })).catch(() => ({ posts: [], error: true }));
  return <section><h2 className="text-2xl font-bold">{ar ? "إدارة المدونة" : "Manage the blog"}</h2><p className="mt-2 mb-6 text-sm leading-7 text-[var(--color-muted)]">{ar ? "اكتب مقالات الأكاديمية، أضف صورة الغلاف، وراجع المقال قبل نشره. يمكنك حفظ المسودات وإخفاء المقالات بإلغاء النشر." : "Write academy articles, add covers and preview before publishing. Save drafts and unpublish articles when needed."}</p>{result.error ? <p role="alert" className="rounded-xl border border-red-400/40 p-5 text-red-100">{ar ? "تعذر تحميل المقالات. حدّث الصفحة للمحاولة مجددًا." : "Could not load articles. Refresh the page to try again."}</p> : <BlogEditor posts={result.posts} authorName={session.user.name || ""} />}</section>;
}
