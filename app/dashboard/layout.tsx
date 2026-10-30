import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { StudentDashboardShell } from "./StudentDashboardShell";
import { AdminDashboardShell } from "./AdminDashboardShell";

export default async function DashboardLayout({
  children,
}: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const isAdmin = session.user.role === "ADMIN";
  const isTeacher = session.user.role === "TEACHER";
  if (session.user.role === "STUDENT") return <StudentDashboardShell>{children}</StudentDashboardShell>;
  return <AdminDashboardShell isAdmin={isAdmin} isTeacher={isTeacher} userName={session.user.name || ""}>{children}</AdminDashboardShell>;
}
