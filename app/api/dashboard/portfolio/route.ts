import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { portfolioSchema } from "@/lib/portfolio-content";
import { savePortfolioWork, deletePortfolioWork, listPortfolioCategories } from "@/lib/portfolio-db";
import { revalidatePath } from "next/cache";
import { isAllowedRequestOrigin } from "@/lib/request-origin";

async function save(request: NextRequest, updating: boolean) {
  const session = await getServerSession(authOptions);
  if (!session?.user || !["ADMIN", "ASSISTANT_ADMIN"].includes(session.user.role)) return NextResponse.json({ code: "FORBIDDEN" }, { status: 403 });
  if (!isAllowedRequestOrigin(request)) return NextResponse.json({ code: "FORBIDDEN" }, { status: 403 });
  let body: unknown;
  try { const raw = await request.text(); if (raw.length > 24000) return NextResponse.json({ code: "TOO_LARGE" }, { status: 413 }); body = JSON.parse(raw); }
  catch { return NextResponse.json({ code: "INVALID_INPUT" }, { status: 400 }); }
  const result = portfolioSchema.safeParse(body);
  const id = typeof body === "object" && body !== null && "id" in body && typeof body.id === "string" ? body.id : undefined;
  if (!result.success || (updating && (!id || !/^[\da-f-]{36}$/i.test(id)))) return NextResponse.json({ code: "INVALID_INPUT" }, { status: 400 });
  try {
    if (!(await listPortfolioCategories()).some((category) => category.id === result.data.category)) return NextResponse.json({ code: "INVALID_CATEGORY" }, { status: 400 });
    const savedId = await savePortfolioWork(result.data, updating ? id : undefined);
    if (!savedId) return NextResponse.json({ code: "NOT_FOUND" }, { status: 404 });
    return NextResponse.json({ id: savedId }, { status: updating ? 200 : 201 });
  } catch { return NextResponse.json({ code: "UNAVAILABLE" }, { status: 503 }); }
}
export async function POST(request: NextRequest) { return save(request, false); }
export async function PATCH(request: NextRequest) { return save(request, true); }

export async function DELETE(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user || !["ADMIN", "ASSISTANT_ADMIN"].includes(session.user.role)) return NextResponse.json({ code: "FORBIDDEN" }, { status: 403 });
  if (!isAllowedRequestOrigin(request)) return NextResponse.json({ code: "FORBIDDEN" }, { status: 403 });
  const id = request.nextUrl.searchParams.get("id");
  if (!id || !/^[\da-f]{8}-[\da-f]{4}-[\da-f]{4}-[\da-f]{4}-[\da-f]{12}$/i.test(id)) return NextResponse.json({ code: "INVALID_INPUT" }, { status: 400 });
  try {
    if (!await deletePortfolioWork(id)) return NextResponse.json({ code: "NOT_FOUND" }, { status: 404 });
    revalidatePath("/portfolio");
    revalidatePath("/dashboard/portfolio");
    return NextResponse.json({ deleted: true });
  } catch { return NextResponse.json({ code: "UNAVAILABLE" }, { status: 503 }); }
}
