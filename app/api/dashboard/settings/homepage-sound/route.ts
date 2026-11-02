import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { isR2Configured, uploadToR2 } from "@/lib/r2";
import { saveHomepageSound, changeHomepageSound, getHomepageSound } from "@/lib/homepage-sound";
import { revalidateHomepageCaches } from "@/lib/revalidate-homepage";
import { isAllowedRequestOrigin } from "@/lib/request-origin";

async function authorizationError(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ code: "AUTH_REQUIRED", error: "انتهت الجلسة. سجل الدخول مجددًا / Your session expired. Please sign in again" }, { status: 401 });
  if (!["ADMIN", "ASSISTANT_ADMIN"].includes(session.user.role)) return NextResponse.json({ code: "FORBIDDEN", error: "هذه الميزة متاحة للإدارة فقط / Administrator access required" }, { status: 403 });
  if (!isAllowedRequestOrigin(request)) return NextResponse.json({ code: "INVALID_ORIGIN", error: "عنوان الموقع غير مطابق لإعدادات الخادم. تحقق من NEXTAUTH_URL / Site origin does not match server settings. Check NEXTAUTH_URL" }, { status: 403 });
  return null;
}
const extensions: Record<string, string> = { "audio/mpeg": "mp3", "audio/mp3": "mp3", "audio/wav": "wav", "audio/x-wav": "wav", "audio/wave": "wav", "audio/ogg": "ogg", "audio/mp4": "m4a", "audio/x-m4a": "m4a" };
export async function POST(request: Request) {
  const denied = await authorizationError(request);
  if (denied) return denied;
  const data = await request.formData().catch(() => null);
  const file = data?.get("file");
  if (!(file instanceof File) || !extensions[file.type] || !file.size || file.size > 10 * 1024 * 1024) return NextResponse.json({ error: "اختر ملف MP3 أو WAV أو OGG أو M4A حتى 10 MB / Choose MP3, WAV, OGG or M4A up to 10 MB" }, { status: 400 });
  if (!isR2Configured() || !process.env.R2_PUBLIC_URL?.trim()) return NextResponse.json({ error: "التخزين أو رابط R2 العام غير مضبوط / R2 storage and public URL must be configured" }, { status: 503 });
  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    const ext = extensions[file.type];
    const valid = ext === "mp3" ? buffer.subarray(0, 3).toString() === "ID3" || (buffer[0] === 0xff && (buffer[1] & 0xe0) === 0xe0)
      : ext === "wav" ? buffer.subarray(0, 4).toString() === "RIFF" && buffer.subarray(8, 12).toString() === "WAVE"
      : ext === "ogg" ? buffer.subarray(0, 4).toString() === "OggS"
      : buffer.subarray(4, 8).toString() === "ftyp";
    if (!valid) return NextResponse.json({ error: "محتوى الملف الصوتي غير صالح / Invalid audio file" }, { status: 400 });
    const type = ext === "mp3" ? "audio/mpeg" : ext === "m4a" ? "audio/mp4" : `audio/${ext}`;
    const { url } = await uploadToR2(buffer, `homepage-audio/${randomUUID()}.${ext}`, type);
    if (!url) throw new Error("Missing public audio URL");
    await saveHomepageSound(url, file.name.slice(0, 200));
    revalidateHomepageCaches();
    return NextResponse.json(await getHomepageSound());
  } catch (error) {
    console.error("Homepage audio upload failed", error);
    return NextResponse.json({ error: "تعذر حفظ الصوت / Could not save audio" }, { status: 500 });
  }
}
export async function PATCH(request: Request) {
  const denied = await authorizationError(request);
  if (denied) return denied;
  const body = await request.json().catch(() => null);
  if (!body || (body.remove !== true && typeof body.enabled !== "boolean")) return NextResponse.json({ error: "طلب غير صالح / Invalid request" }, { status: 400 });
  try {
    await changeHomepageSound(body.enabled === true, body.remove === true);
    revalidateHomepageCaches();
    return NextResponse.json(await getHomepageSound());
  } catch (error) {
    console.error("Homepage audio update failed", error);
    return NextResponse.json({ error: "تعذر حفظ الإعدادات / Could not save settings" }, { status: 500 });
  }
}
