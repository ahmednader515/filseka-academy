import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { getServerTranslator } from "@/lib/i18n/server";
import { HomeworkSubmissionsList } from "./HomeworkSubmissionsList";
import { HOMEWORK_UI_ENABLED } from "@/lib/ui-features";

export default async function DashboardHomeworkPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
  if (!HOMEWORK_UI_ENABLED) redirect("/dashboard");
  const isStaff = session.user.role === "ADMIN" || session.user.role === "ASSISTANT_ADMIN";
  const isTeacher = session.user.role === "TEACHER";
  if (!isStaff && !isTeacher) redirect("/dashboard");
  const t = await getServerTranslator();

  return (
    <div>
      <h2 className="text-xl font-bold text-[var(--color-foreground)]">
        {t(
          isTeacher
            ? "dashboard.homeworkPage.titleTeacher"
            : "dashboard.homeworkPage.titleStaff",
        )}
      </h2>
      <p className="mt-1 text-sm text-[var(--color-muted)]">
        {isTeacher
          ? t("dashboard.homeworkPage.subtitleTeacher")
          : t("dashboard.homeworkPage.subtitleStaff")}
      </p>
      <HomeworkSubmissionsList allowDeleteAll={isStaff} />
    </div>
  );
}
