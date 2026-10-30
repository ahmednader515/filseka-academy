import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getCategoriesForDashboard, createCategory } from "@/lib/db";
import { categoryInput, generateCategorySlug } from "@/lib/category-validation";
import { revalidateHomepageCaches } from "@/lib/revalidate-homepage";

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session || !["ADMIN", "ASSISTANT_ADMIN"].includes(session.user.role)) return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
  const parsed = categoryInput.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "أدخل اسم القسم باللغتين وترتيبًا من 0 إلى 10000." }, { status: 400 });
  try {
    const d = parsed.data;
    const slug = generateCategorySlug(d.name || d.nameAr, randomUUID().replace(/-/g, "").slice(0, 12));
    const category = await createCategory({ name: d.name, name_ar: d.nameAr, slug, description: d.description, image_url: d.imageUrl || null, order: d.order, created_by_id: session.user.id });
    revalidateHomepageCaches();
    return NextResponse.json(category, { status: 201 });
  } catch (error) {
    const duplicate = (error as { code?: string }).code === "23505";
    return NextResponse.json({ error: duplicate ? "رابط القسم مستخدم بالفعل." : "تعذر إنشاء القسم." }, { status: duplicate ? 409 : 500 });
  }
}

/** أقسام لوحة الكورسات — الخبير يرى أقسامه فقط؛ الأدمن/المساعد يرون أقسام المنصة والأدمن */
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
    }
    const role = session.user.role;
    if (role !== "ADMIN" && role !== "ASSISTANT_ADMIN" && role !== "TEACHER") {
      return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
    }
    const categories = await getCategoriesForDashboard(session.user.id, role);
    return NextResponse.json(categories);
  } catch (error) {
    console.error("API categories:", error);
    return NextResponse.json(
      { error: "فشل جلب التصنيفات" },
      { status: 500 }
    );
  }
}
