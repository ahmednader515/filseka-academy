import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { revalidatePath } from "next/cache";
import { authOptions } from "@/lib/auth";
import { blogSchema } from "@/lib/blog-content";
import { saveBlogPost } from "@/lib/blog-db";

async function save(request: NextRequest, updating: boolean) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || !["ADMIN", "ASSISTANT_ADMIN"].includes(session.user.role)) return NextResponse.json({ code: "FORBIDDEN" }, { status: 403 });
  const origin = request.headers.get("origin");
  if (origin && origin !== request.nextUrl.origin) return NextResponse.json({ code: "FORBIDDEN" }, { status: 403 });
  if (Number(request.headers.get("content-length") || 0) > 250000) return NextResponse.json({ code: "TOO_LARGE" }, { status: 413 });
  let body: unknown;
  try { const raw = await request.text(); if (raw.length > 140000) return NextResponse.json({ code: "TOO_LARGE" }, { status: 413 }); body = JSON.parse(raw); }
  catch { return NextResponse.json({ code: "INVALID_INPUT" }, { status: 400 }); }
  const result = blogSchema.safeParse(body);
  const id = typeof body === "object" && body !== null && "id" in body && typeof body.id === "string" ? body.id : undefined;
  if (!result.success || (updating && (!id || !/^[\da-f]{8}-(?:[\da-f]{4}-){3}[\da-f]{12}$/i.test(id)))) return NextResponse.json({ code: "INVALID_INPUT" }, { status: 400 });
  try {
    const savedId = await saveBlogPost(result.data, session.user.id, updating ? id : undefined);
    if (!savedId) return NextResponse.json({ code: "NOT_FOUND" }, { status: 404 });
    revalidatePath("/blog", "layout"); revalidatePath("/dashboard/blog");
    return NextResponse.json({ id: savedId }, { status: updating ? 200 : 201 });
  } catch (error) {
    if ((error as { code?: string }).code === "23505") return NextResponse.json({ code: "SLUG_EXISTS" }, { status: 409 });
    return NextResponse.json({ code: "UNAVAILABLE" }, { status: 503 });
  }
}
export async function POST(request: NextRequest) { return save(request, false); }
export async function PATCH(request: NextRequest) { return save(request, true); }
