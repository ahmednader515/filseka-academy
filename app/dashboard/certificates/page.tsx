import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { sql } from "@/lib/db";
import { getCertificateSettings } from "@/lib/certificates-db";
import { CertificateDesigner } from "./CertificateDesigner";
import Link from "next/link";
import { ensureCertificateSchema } from "@/lib/certificates-db";
import { getLocaleFromCookie } from "@/lib/i18n/server";
import { listUploadedCertificates } from "@/lib/uploaded-certificates-db";
import { UploadedCertificates } from "./UploadedCertificates";

export default async function CertificatesPage() {
  const session = await getServerSession(authOptions);
  if (session?.user.role === "STUDENT") {
    await ensureCertificateSchema();
    const ar = (await getLocaleFromCookie()) === "ar";
    const uploaded = await listUploadedCertificates(session.user.id);
    const certificates = await sql`SELECT id, course_title, issued_at FROM "CourseCertificate" WHERE user_id = ${session.user.id} ORDER BY issued_at DESC`;
    return <div className="space-y-8"><h2 className="text-xl font-bold">{ar ? "شهاداتي" : "My certificates"}</h2><UploadedCertificates certificates={uploaded} /><section className="space-y-5"><h3 className="text-lg font-semibold">{ar ? "شهادات إتمام الكورسات" : "Course completion certificates"}</h3>{certificates.length ? certificates.map((c) => <Link key={String(c.id)} href={`/certificates/${c.id}`} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#97304f] bg-[#180c12] p-5"><strong>{String(c.course_title)}</strong><span className="text-sm text-pink-300">{ar ? "عرض الشهادة وطباعتها" : "View and print certificate"} ↗</span></Link>) : <p className="text-[#c1a3b0]">{ar ? "أكمل جميع دروس كورس يمنح شهادة لتظهر شهادتك هنا." : "Complete all lessons in a course awarding certificates to see yours here."}</p>}</section></div>;
  }
  if (session?.user.role !== "ADMIN") redirect("/dashboard");
  const [settings, courses] = await Promise.all([getCertificateSettings(), sql`SELECT id, title, title_ar FROM "Course" ORDER BY title ASC`]);
  const uploaded = await listUploadedCertificates();
  return <div className="space-y-10"><UploadedCertificates admin certificates={uploaded} /><CertificateDesigner initial={settings} courses={courses.map((c) => ({ id: String(c.id), title: String(c.title_ar || c.title) }))} /></div>;
}
