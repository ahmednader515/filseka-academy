import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { getCategoriesForDashboard, sql } from "@/lib/db";
import { CategoryManager } from "./CategoryManager";

export default async function CategoriesPage() {
  const session = await getServerSession(authOptions);
  if (!session || !["ADMIN", "ASSISTANT_ADMIN"].includes(session.user.role)) redirect("/dashboard");
  const categories = await getCategoriesForDashboard(session.user.id, session.user.role);
  const counts = await sql`SELECT category_id, COUNT(*)::int AS count FROM "Course" GROUP BY category_id`;
  return <CategoryManager categories={categories.map((category) => {
    const row = category as unknown as Record<string, unknown>;
    return { id: category.id, name: category.name, nameAr: String(row.nameAr ?? row.name_ar ?? ""), slug: category.slug, description: String(row.description ?? ""), imageUrl: String(row.imageUrl ?? row.image_url ?? ""), order: Number(row.order ?? 0), courses: Number(counts.find((c) => c.category_id === category.id)?.count ?? 0) };
  })} />;
}
