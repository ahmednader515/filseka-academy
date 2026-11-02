import { getServerSession } from "next-auth";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { authOptions } from "@/lib/auth";
import { getServerTranslator } from "@/lib/i18n/server";
import { CreateCourseForm } from "./CreateCourseForm";
import { getUsersByRole } from "@/lib/db";

export default async function NewCoursePage({ searchParams }: { searchParams: Promise<{ teacherId?: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
  const role = session.user.role;
  if (role !== "ADMIN" && role !== "ASSISTANT_ADMIN" && role !== "TEACHER") {
    redirect("/dashboard");
  }
  const t = await getServerTranslator();
  const teachers = role === "ADMIN" ? (await getUsersByRole("TEACHER")).map(({ id, name, email }) => ({ id, name, email })) : [];
  const { teacherId } = await searchParams;
  const initialTeacherId = role === "ADMIN" ? teacherId ?? "" : "";
  if (initialTeacherId && !teachers.some((teacher) => teacher.id === initialTeacherId)) notFound();

  return (
    <div>
      <Link
        href="/dashboard"
        className="text-sm font-medium text-[var(--color-primary)] hover:underline"
      >
        {t("dashboard.backToDashboard")}
      </Link>
      <h2 className="mt-4 text-xl font-bold text-[var(--color-foreground)]">
        {t("dashboard.courseNewPage.title")}
      </h2>
      <CreateCourseForm teachers={teachers} canAssignTeacher={role === "ADMIN"} initialTeacherId={initialTeacherId} />
    </div>
  );
}
