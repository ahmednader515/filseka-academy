import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { isAllowedRequestOrigin } from "@/lib/request-origin";
import { portfolioCategoriesSchema } from "@/lib/portfolio-content";
import { savePortfolioCategories } from "@/lib/portfolio-db";
import { revalidatePath } from "next/cache";

export async function PUT(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session || !["ADMIN", "ASSISTANT_ADMIN"].includes(session.user.role) || !isAllowedRequestOrigin(request)) return NextResponse.json({ error: "غير مصرح / Unauthorized" }, { status: 403 });
  const raw = await request.text();
  if (raw.length > 40000) return NextResponse.json({ error: "الطلب كبير جدًا / Request too large" }, { status: 413 });
  let body;
  try { body = JSON.parse(raw); } catch { return NextResponse.json({ error: "طلب غير صالح / Invalid request" }, { status: 400 }); }
  const parsed = portfolioCategoriesSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "أدخل اسم كل قسم باللغتين. يجب الاحتفاظ بقسم واحد على الأقل / Enter both category names and keep at least one category" }, { status: 400 });
  try {
    if (!await savePortfolioCategories(parsed.data)) return NextResponse.json({ error: "لا يمكن حذف قسم يحتوي على أعمال. انقل الأعمال إلى قسم آخر أولًا / Move existing works to another category before deleting their category" }, { status: 409 });
    revalidatePath("/portfolio"); revalidatePath("/dashboard/portfolio");
    return NextResponse.json({ saved: true });
  } catch { return NextResponse.json({ error: "تعذر حفظ الأقسام / Could not save categories" }, { status: 503 }); }
}
