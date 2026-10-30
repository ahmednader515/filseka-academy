import { notFound } from "next/navigation";
import { getIssuedCertificate } from "@/lib/certificates-db";
import { CertificateDocument } from "@/components/CertificateDocument";
import { PrintCertificate } from "./PrintCertificate";

export const dynamic = "force-dynamic";
export const metadata = { title: "التحقق من الشهادة | في السكة أكاديمي", robots: { index: false, follow: false } };
export default async function CertificatePage({ params }: { params: Promise<{ id: string }> }) {
  const certificate = await getIssuedCertificate((await params).id);
  if (!certificate) notFound();
  return <div className="mx-auto max-w-6xl px-4 py-8" dir="rtl"><div className="mb-6 flex flex-wrap items-center justify-between gap-4"><div><h1 className="text-2xl font-bold">شهادة إتمام موثقة</h1><p className="mt-2 text-sm text-[#c1a3b0]">هذه الشهادة صادرة من الأكاديمية بعد إتمام جميع دروس الكورس. رابط هذه الصفحة هو رابط التحقق الدائم.</p></div><PrintCertificate /></div><CertificateDocument design={certificate.design} studentName={certificate.student_name} courseTitle={certificate.course_title} issuedAt={new Date(certificate.issued_at).toISOString()} verificationId={certificate.id} /></div>;
}
