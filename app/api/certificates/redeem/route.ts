import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redeemUploadedCertificate } from "@/lib/uploaded-certificates-db";

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (session?.user.role !== "STUDENT") return NextResponse.json({ error: "غير مصرح / Unauthorized" }, { status: 403 });
  const body = await request.json().catch(() => null);
  if (typeof body?.code !== "string" || !/^CERT-[A-F0-9]{24}$/i.test(body.code.trim())) return NextResponse.json({ error: "الكود غير صالح / Invalid code" }, { status: 400 });
  try {
    const id = await redeemUploadedCertificate(session.user.id, body.code);
    if (!id) return NextResponse.json({ error: "الكود غير صالح أو مستخدم بالفعل / Code is invalid or already redeemed" }, { status: 400 });
    return NextResponse.json({ id });
  } catch (error) {
    console.error("Certificate redemption failed", error);
    return NextResponse.json({ error: "تعذر استرداد الشهادة / Could not redeem certificate" }, { status: 500 });
  }
}
