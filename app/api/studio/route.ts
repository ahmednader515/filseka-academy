import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { completeStudioUpload, createStudioUpload, deleteStudioRecording, editStudioRecording, getStudioData, getStudioFile, replaceStudioRecording, reviewStudioRecording, saveStudioExercise } from "@/lib/studio";
import { deleteStudioAudio, inspectStudioUpload, isR2Configured, signStudioUpload } from "@/lib/r2";
import { STUDIO_MAX_BYTES, studioAudioType } from "@/lib/studio-shared";

export const runtime = "nodejs";
const error = (message: string, status = 400) => NextResponse.json({ error: message }, { status });

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || !["ADMIN", "STUDENT"].includes(session.user.role)) return error("غير مصرح", 403);
  try {
    return NextResponse.json(await getStudioData(session.user.id, session.user.role === "ADMIN"), { headers: { "Cache-Control": "private, no-store" } });
  } catch (cause) {
    console.error("Studio load failed", cause);
    return error("تعذر تحميل الاستوديو. حاول مرة أخرى.", 500);
  }
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || !["ADMIN", "STUDENT"].includes(session.user.role)) return error("غير مصرح", 403);
  let body;
  try { body = await request.json(); } catch { return error("طلب غير صالح"); }
  if (!body || typeof body !== "object") return error("طلب غير صالح");
  const admin = session.user.role === "ADMIN";
  try {
    if (body.action === "exercise") {
      if (!admin) return error("غير مصرح", 403);
      if (typeof body.title !== "string" || !body.title.trim() || body.title.length > 200 || typeof body.instructions !== "string" || !body.instructions.trim() || body.instructions.length > 20000 || typeof body.active !== "boolean" || (body.id != null && typeof body.id !== "string")) return error("أدخل عنوان التدريب وتعليماته بصورة صحيحة");
      const saved = await saveStudioExercise(body.id || null, body.title.trim(), body.instructions.trim(), body.active, session.user.id);
      return saved ? NextResponse.json({ ok: true }) : error("التدريب غير موجود", 404);
    }
    if (body.action === "review") {
      if (!admin) return error("غير مصرح", 403);
      if (typeof body.id !== "string" || typeof body.feedback !== "string" || !body.feedback.trim() || body.feedback.length > 20000 || (body.score !== null && (!Number.isInteger(body.score) || body.score < 0 || body.score > 100))) return error("أدخل ملاحظات التقييم ودرجة صحيحة من 0 إلى 100");
      const saved = await reviewStudioRecording(body.id, body.feedback.trim(), body.score, session.user.id);
      return saved ? NextResponse.json({ ok: true }) : error("التسجيل غير موجود", 404);
    }
    if (admin) return error("هذه الميزة للطلاب فقط", 403);
    if (body.action === "edit") {
      if (typeof body.id !== "string" || typeof body.title !== "string" || !body.title.trim() || body.title.length > 200 || (body.exerciseId !== null && typeof body.exerciseId !== "string")) return error("أدخل عنوانًا وتدريبًا صحيحين");
      const saved = await editStudioRecording(body.id, session.user.id, body.title.trim(), body.exerciseId || null);
      return saved ? NextResponse.json({ ok: true }) : error("التسجيل أو التدريب غير متاح", 404);
    }
    if (!isR2Configured()) return error("تخزين الصوت غير مُعدّ. تواصل مع الإدارة.", 503);
    if (body.action === "delete") {
      if (typeof body.id !== "string") return error("طلب غير صالح");
      const file = await getStudioFile(body.id, session.user.id, false);
      if (!file || file.status !== "ready") return error("التسجيل غير موجود", 404);
      await deleteStudioAudio(file.object_key);
      const removed = await deleteStudioRecording(body.id, session.user.id, file.object_key);
      return removed ? NextResponse.json({ ok: true }) : error("التسجيل غير موجود", 404);
    }
    if (body.action === "upload") {
      if (typeof body.fileName !== "string" || typeof body.mime !== "string" || !Number.isInteger(body.size) || body.size <= 0 || body.size > STUDIO_MAX_BYTES || typeof body.title !== "string" || !body.title.trim() || body.title.length > 200 || !["recording", "upload"].includes(body.source) || (body.exerciseId != null && typeof body.exerciseId !== "string")) return error("أدخل عنوانًا وملفًا صوتيًا لا يتجاوز 100 ميجابايت");
      const mime = studioAudioType(body.fileName, body.mime);
      if (!mime) return error("اختر ملفًا صوتيًا");
      if (body.originalId !== undefined && typeof body.originalId !== "string") return error("طلب استبدال غير صالح");
      const upload = await createStudioUpload({ studentId: session.user.id, title: body.title.trim(), exerciseId: body.exerciseId || null, source: body.source, mime, size: body.size, originalId: body.originalId });
      if (!upload) return error("التدريب غير متاح");
      return NextResponse.json({ id: upload.id, url: await signStudioUpload(upload.key, mime, body.size), mime });
    }
    if (["complete", "replace"].includes(body.action) && typeof body.id === "string") {
      if (body.action === "replace" && (typeof body.originalId !== "string" || body.originalId === body.id)) return error("طلب استبدال غير صالح");
      const file = await getStudioFile(body.id, session.user.id, false);
      if (!file) return error("التسجيل غير موجود", 404);
      if (body.action === "replace" && file.status !== "pending") return error("ملف الاستبدال غير متاح", 409);
      const uploaded = await inspectStudioUpload(file.object_key);
      if (uploaded.ContentLength !== file.size_bytes || uploaded.ContentLength > STUDIO_MAX_BYTES || uploaded.ContentType !== file.mime_type) return error("الملف المرفوع لا يطابق الملف المختار");
      if (body.action === "replace") {
        const oldKey = await replaceStudioRecording(body.originalId, body.id, session.user.id);
        if (!oldKey) return error("التسجيل الأصلي غير متاح. حدّث الصفحة وحاول مرة أخرى.", 409);
        // A cleanup failure must not report a failed replacement after the commit.
        try { await deleteStudioAudio(oldKey); } catch (cause) { console.error("Studio replaced audio cleanup failed", cause); }
      } else {
        await completeStudioUpload(body.id, session.user.id);
      }
      return NextResponse.json({ ok: true });
    }
    return error("طلب غير صالح");
  } catch (cause) {
    console.error("Studio operation failed", cause);
    return error("تعذر حفظ البيانات. تحقق من الاتصال وحاول مرة أخرى.", 500);
  }
}
