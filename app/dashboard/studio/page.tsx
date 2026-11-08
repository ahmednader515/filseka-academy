import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { StudioClient } from "./StudioClient";

export default async function StudioPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
  if (session.user.role === "ADMIN") redirect("/dashboard/studio/manage");
  if (session.user.role !== "STUDENT") redirect("/dashboard");
  return <StudioClient />;
}
