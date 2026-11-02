import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { isR2Configured, uploadToR2 } from "@/lib/r2";
import { createUploadedCertificate } from "@/lib/uploaded-certificates-db";

const types: Record<string, string> = { "application/pdf": "pdf", "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" };
export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (session?.user.role !== "ADMIN") return NextResponse.json({ error: "غير مصرح / Unauthorized" }, { status: 403 });
  const form = await request.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "ارفع ملف الشهادة / Upload a certificate file" }, { status: 400 });
  }
  if (!types[file.type] || !file.size || file.size > 10 * 1024 * 1024) return NextResponse.json({ error: "استخدم PDF أو JPG أو PNG أو WebP بحد أقصى 10 MB / Use PDF, JPG, PNG or WebP up to 10 MB" }, { status: 400 });
  if (!isR2Configured()) return NextResponse.json({ error: "التخزين غير مضبوط / File storage is not configured" }, { status: 503 });
  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    const valid = file.type === "application/pdf" ? buffer.subarray(0, 5).toString() === "%PDF-"
      : file.type === "image/jpeg" ? buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff
      : file.type === "image/png" ? buffer.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))
      : buffer.subarray(0, 4).toString() === "RIFF" && buffer.subarray(8, 12).toString() === "WEBP";
    if (!valid) return NextResponse.json({ error: "محتوى الملف غير صالح / Invalid file contents" }, { status: 400 });
    const key = `certificates/${randomUUID()}.${types[file.type]}`;
    await uploadToR2(buffer, key, file.type);
    const title = file.name.trim().slice(0, 200) || "Certificate";
    const certificate = await createUploadedCertificate({ title, fileKey: key, fileType: file.type, adminId: session.user.id });
    return NextResponse.json(certificate, { status: 201 });
  } catch (error) {
    console.error("Certificate upload failed", error);
    return NextResponse.json({ error: "تعذر حفظ الشهادة. حاول مرة أخرى / Could not save certificate. Please retry" }, { status: 500 });
  }
}
