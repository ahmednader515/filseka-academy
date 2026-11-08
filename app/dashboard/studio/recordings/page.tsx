import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { StudioRecordings } from "../StudioRecordings";

export default async function RecordingsPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
  if (session.user.role === "ADMIN") redirect("/dashboard/studio/manage");
  if (session.user.role !== "STUDENT") redirect("/dashboard");
  return <StudioRecordings />;
}
