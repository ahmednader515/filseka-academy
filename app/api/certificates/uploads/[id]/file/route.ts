import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getUploadedCertificateFile } from "@/lib/uploaded-certificates-db";
import { readR2File } from "@/lib/r2";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session || !["ADMIN", "STUDENT"].includes(session.user.role)) return new NextResponse(null, { status: 403 });
  const { id } = await params;
  const certificate = await getUploadedCertificateFile(id, session.user.id, session.user.role === "ADMIN");
  if (!certificate) return new NextResponse(null, { status: 404 });
  try {
    const bytes = await readR2File(certificate.file_key);
    const ext = certificate.file_type === "application/pdf" ? "pdf" : certificate.file_type.split("/")[1];
    const download = new URL(request.url).searchParams.get("download") === "1";
    return new NextResponse(new Blob([new Uint8Array(bytes)]), { headers: {
      "Content-Type": certificate.file_type,
      "Content-Disposition": `${download ? "attachment" : "inline"}; filename="certificate.${ext}"`,
      "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff",
    } });
  } catch (error) {
    console.error("Certificate file failed", error);
    return new NextResponse(null, { status: 502 });
  }
}
