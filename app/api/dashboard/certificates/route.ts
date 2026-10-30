import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { sql } from "@/lib/db";
import { certificateDesignSchema } from "@/lib/certificate-design";
import { saveCertificateSettings } from "@/lib/certificates-db";

export async function PUT(request: Request) {
  const session = await getServerSession(authOptions);
  if (session?.user.role !== "ADMIN") return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
  const parsed = z.object({ design: certificateDesignSchema, courseIds: z.array(z.string().min(1).max(128)).max(5000) }).safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "تحقق من حقول تصميم الشهادة." }, { status: 400 });
  try {
    const ids = [...new Set(parsed.data.courseIds)];
    const courses = await sql`SELECT id FROM "Course" WHERE id IN (SELECT jsonb_array_elements_text(${JSON.stringify(ids)}::jsonb))`;
    if (courses.length !== ids.length) return NextResponse.json({ error: "أحد الكورسات غير موجود. حدّث الصفحة." }, { status: 400 });
    await saveCertificateSettings(parsed.data.design, ids);
    return NextResponse.json({ success: true });
  } catch { return NextResponse.json({ error: "تعذر حفظ إعدادات الشهادات." }, { status: 500 }); }
}
