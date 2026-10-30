import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { categoryIsManageableOnDashboard, deleteCategory, sql } from "@/lib/db";
import { categoryInput } from "@/lib/category-validation";
import { revalidateHomepageCaches } from "@/lib/revalidate-homepage";

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session || !["ADMIN", "ASSISTANT_ADMIN"].includes(session.user.role)) return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
  const { id } = await params;
  if (!await categoryIsManageableOnDashboard(id, session.user.id, session.user.role)) return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
  const parsed = categoryInput.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "تحقق من الأسماء والترتيب." }, { status: 400 });
  try {
    const d = parsed.data;
    const rows = await sql`UPDATE "Category" SET name = ${d.name}, name_ar = ${d.nameAr}, description = ${d.description}, image_url = ${d.imageUrl || null}, "order" = ${d.order}, updated_at = NOW() WHERE id = ${id} RETURNING id`;
    if (!rows.length) return NextResponse.json({ error: "القسم غير موجود" }, { status: 404 });
    revalidateHomepageCaches();
    return NextResponse.json({ success: true });
  } catch (error) {
    const duplicate = (error as { code?: string }).code === "23505";
    return NextResponse.json({ error: duplicate ? "رابط القسم مستخدم بالفعل." : "تعذر حفظ القسم." }, { status: duplicate ? 409 : 500 });
  }
}

/** حذف قسم — الأدمن/المساعد: أقسام المنصة وأقسام الأدمن فقط؛ الخبير: أقسامه فقط. الكورسات المرتبطة تصبح بدون قسم */
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
  }
  const role = session.user.role;
  if (role !== "ADMIN" && role !== "ASSISTANT_ADMIN" && role !== "TEACHER") {
    return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
  }

  const { id } = await params;
  if (!id?.trim()) {
    return NextResponse.json({ error: "معرّف القسم مطلوب" }, { status: 400 });
  }

  const allowed = await categoryIsManageableOnDashboard(id, session.user.id, role);
  if (!allowed) {
    return NextResponse.json({ error: "لا يمكن حذف هذا القسم" }, { status: 403 });
  }

  try {
    await deleteCategory(id);
    revalidateHomepageCaches();
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("API categories [id] DELETE:", e);
    return NextResponse.json({ error: "فشل حذف القسم" }, { status: 500 });
  }
}
