import { unstable_noStore } from "next/cache";
import { listTeachersForHomepage } from "@/lib/db";
import { getLocaleFromCookie } from "@/lib/i18n/server";
import { HOMEPAGE_DEMO_INSTRUCTORS } from "@/lib/homepage-demo-instructors";
import { TeachersBrowseClient } from "./TeachersBrowseClient";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function generateMetadata() {
  const ar = (await getLocaleFromCookie()) === "ar";
  return {
    title: ar ? "المدربون | في السكة أكاديمي" : "Trainers | Filsaka Academy",
    description: ar ? "تعرّف على مدربي الأكاديمية واكتشف تخصصاتهم وكورساتهم المتاحة." : "Meet the academy trainers and explore their specialties and available courses.",
  };
}

export default async function TeachersPage() {
  unstable_noStore();
  const teachers = await listTeachersForHomepage().catch(() => []);

  return <TeachersBrowseClient initialTeachers={[...HOMEPAGE_DEMO_INSTRUCTORS, ...teachers]} />;
}
