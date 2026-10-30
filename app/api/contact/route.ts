import { NextRequest, NextResponse } from "next/server";
import { contactSchema } from "@/lib/contact-validation";
import { saveContactInquiry } from "@/lib/contact-inquiries";

export async function POST(request: NextRequest) {
  const origin = request.headers.get("origin");
  if (origin && origin !== request.nextUrl.origin) return NextResponse.json({ code: "INVALID_ORIGIN" }, { status: 403 });
  if (Number(request.headers.get("content-length") || 0) > 24_000) return NextResponse.json({ code: "TOO_LARGE" }, { status: 413 });
  let body: unknown;
  try {
    const raw = await request.text();
    if (raw.length > 24_000) return NextResponse.json({ code: "TOO_LARGE" }, { status: 413 });
    body = JSON.parse(raw);
  } catch { return NextResponse.json({ code: "INVALID_INPUT" }, { status: 400 }); }
  const result = contactSchema.safeParse(body);
  if (!result.success || result.data.website) return NextResponse.json({ code: "INVALID_INPUT" }, { status: 400 });
  try {
    const { name, email, phone, interest, message } = result.data;
    const id = await saveContactInquiry({ name, email, phone, interest, message });
    if (!id) return NextResponse.json({ code: "RATE_LIMITED" }, { status: 429, headers: { "Retry-After": "60" } });
    return NextResponse.json({ id }, { status: 201 });
  } catch { return NextResponse.json({ code: "UNAVAILABLE" }, { status: 503 }); }
}
