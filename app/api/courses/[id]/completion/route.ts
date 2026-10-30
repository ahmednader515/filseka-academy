import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { getAllowedLessonIdsForUserCourse, hasFullCourseAccessAsStudent } from "@/lib/db";
import { completeLesson, getCertificateProgress } from "@/lib/certificates-db";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (session?.user.role !== "STUDENT") return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
  const { id } = await params;
  try {
    if (!await hasFullCourseAccessAsStudent(session.user.id, id) && !(await getAllowedLessonIdsForUserCourse(session.user.id, id)).length) return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
    return NextResponse.json(await getCertificateProgress(session.user.id, id));
  } catch { return NextResponse.json({ error: "تعذر تحميل تقدم الكورس." }, { status: 500 }); }
}
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (session?.user.role !== "STUDENT") return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
  const { id } = await params;
  const body = await request.json().catch(() => null);
  if (typeof body?.lessonId !== "string" || body.lessonId.length > 128) return NextResponse.json({ error: "الحصة مطلوبة." }, { status: 400 });
  try { return NextResponse.json(await completeLesson(session.user.id, id, body.lessonId)); }
  catch (error) { const forbidden = error instanceof Error && error.message === "FORBIDDEN"; return NextResponse.json({ error: forbidden ? "لا يمكنك إتمام هذه الحصة." : "تعذر حفظ التقدم." }, { status: forbidden ? 403 : 500 }); }
}
