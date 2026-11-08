import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { getStudioFile } from "@/lib/studio";
import { signStudioPlayback } from "@/lib/r2";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session || !["ADMIN", "STUDENT"].includes(session.user.role)) return new NextResponse(null, { status: 403 });
  try {
    const { id } = await params;
    const file = await getStudioFile(id, session.user.id, session.user.role === "ADMIN");
    if (!file || file.status !== "ready") return new NextResponse(null, { status: 404 });
    const download = new URL(_request.url).searchParams.get("download") === "1";
    const extensions: Record<string, string> = { "audio/mpeg": "mp3", "audio/wav": "wav", "audio/mp4": "m4a", "audio/webm": "webm", "audio/ogg": "ogg", "audio/flac": "flac", "audio/aac": "aac", "audio/aiff": "aiff", "audio/amr": "amr", "audio/x-ms-wma": "wma", "audio/x-caf": "caf", "audio/3gpp": "3gp" };
    const title = (file.title || "recording").replace(/[\x00-\x1f\x7f/\\:*?"<>|]/g, "_").slice(0, 160);
    const name = download ? `${title}.${extensions[file.mime_type] || "audio"}` : undefined;
    return NextResponse.redirect(await signStudioPlayback(file.object_key, file.mime_type, name), { status: 307, headers: { "Cache-Control": "private, no-store" } });
  } catch {
    return new NextResponse("تعذر تشغيل الصوت", { status: 503 });
  }
}
