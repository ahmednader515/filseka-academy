import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { listPortfolioWorks } from "@/lib/portfolio-db";
import { getLocaleFromCookie } from "@/lib/i18n/server";
import { PortfolioEditor } from "./PortfolioEditor";

export const dynamic = "force-dynamic";
export default async function PortfolioAdminPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login?callbackUrl=%2Fdashboard%2Fportfolio");
  if (!["ADMIN", "ASSISTANT_ADMIN"].includes(session.user.role)) redirect("/dashboard");
  const ar = (await getLocaleFromCookie()) === "ar";
  const result = await listPortfolioWorks(false).then((works) => ({ works, error: false })).catch(() => ({ works: [], error: true }));
  return <section><h2 className="text-2xl font-bold">{ar ? "إدارة معرض الأعمال" : "Manage portfolio"}</h2><p className="mt-2 mb-6 text-sm leading-7 text-[var(--color-muted)]">{ar ? "أضف أعمال الأكاديمية بصورها وروابط الفيديو. احفظ العمل كمسودة أو انشره ليظهر للزوار." : "Add academy productions with their thumbnails and video links. Save drafts or publish work for visitors."}</p>{result.error ? <p role="alert" className="rounded-xl border border-red-400/40 p-5 text-red-200">{ar ? "تعذر تحميل الأعمال. يرجى تحديث الصفحة والمحاولة مجددًا." : "Could not load portfolio work. Refresh the page to try again."}</p> : <PortfolioEditor works={result.works} />}</section>;
}
