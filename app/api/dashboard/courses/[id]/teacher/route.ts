import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { assignCourseToTeacher, removeCourseFromTeacher } from "@/lib/db";

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (session?.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let teacherId: string;
  try {
    const body = await request.json();
    if (typeof body?.teacherId !== "string" || !body.teacherId.trim()) {
      return NextResponse.json({ error: "Invalid teacher" }, { status: 400 });
    }
    teacherId = body.teacherId.trim();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const { id } = await params;
  const assigned = await assignCourseToTeacher(id, teacherId);
  if (!assigned) {
    return NextResponse.json({ error: "Course or teacher not found" }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (session?.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let teacherId: string;
  try {
    const body = await request.json();
    if (typeof body?.teacherId !== "string" || !body.teacherId.trim()) {
      return NextResponse.json({ error: "Invalid teacher" }, { status: 400 });
    }
    teacherId = body.teacherId.trim();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const { id } = await params;
  const removed = await removeCourseFromTeacher(id, teacherId, session.user.id);
  if (!removed) {
    return NextResponse.json({ error: "Course is no longer assigned to this teacher" }, { status: 409 });
  }
  return NextResponse.json({ ok: true });
}
