import { listPortfolioWorks, listPortfolioCategories } from "@/lib/portfolio-db";
import { getLocaleFromCookie } from "@/lib/i18n/server";
import { PORTFOLIO_CATEGORIES, PORTFOLIO_DEMOS } from "@/lib/portfolio-content";
import { PortfolioGallery } from "./PortfolioGallery";

export const dynamic = "force-dynamic";
export async function generateMetadata() {
  const ar = (await getLocaleFromCookie()) === "ar";
  return { title: ar ? "معرض الأعمال | في السكة أكاديمي" : "Portfolio | Filsaka Academy", description: ar ? "اكتشف برامج الأكاديمية والبودكاست ومشاريع المتدربين وكواليس الإنتاج." : "Explore academy programs, podcasts, student projects and behind the scenes." };
}
export default async function PortfolioPage() {
  const works = await listPortfolioWorks().catch(() => []);
  const categories = await listPortfolioCategories().catch(() => PORTFOLIO_CATEGORIES);
  return <PortfolioGallery categories={categories} works={works.length ? works : PORTFOLIO_DEMOS.filter((work) => categories.some((category) => category.id === work.category))} />;
}
