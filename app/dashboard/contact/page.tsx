import Link from "next/link";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { getLocaleFromCookie } from "@/lib/i18n/server";
import { listContactInquiries } from "@/lib/contact-inquiries";
import { getCoursesPublished } from "@/lib/db";
import { pickLocalizedText } from "@/lib/i18n/localized-field";

export const dynamic = "force-dynamic";
export default async function ContactInbox({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login?callbackUrl=%2Fdashboard%2Fcontact");
  if (!["ADMIN", "ASSISTANT_ADMIN"].includes(session.user.role)) redirect("/dashboard");
  const ar = (await getLocaleFromCookie()) === "ar";
  const text = (arabic: string, english: string) => ar ? arabic : english;
  const rawPage = Number((await searchParams).page || 1);
  const page = Number.isSafeInteger(rawPage) && rawPage > 0 && rawPage <= 100_000 ? rawPage : 1;
  const [result, courses] = await Promise.all([listContactInquiries(page).then((items) => ({ items, error: false })).catch(() => ({ items: [], error: true })), getCoursesPublished(true).catch(() => [])]);
  const generalInterests: Record<string, string> = { general: text("استفسار عام", "General inquiry"), partnership: text("تعاون وشراكات", "Partnerships"), enrollment: text("التسجيل والاشتراكات", "Enrollment and subscriptions") };
  const interestLabel = (interest: string) => { const course = courses.find((item) => item.id === interest); return generalInterests[interest] || (course ? pickLocalizedText(ar ? "ar" : "en", (course as typeof course & { titleAr?: string }).titleAr ?? course.title_ar, course.title) : text("استفسار عن كورس", "Course inquiry")); };
  return <section dir={ar ? "rtl" : "ltr"}>
    <h2 className="text-2xl font-bold">{text("رسائل تواصل معنا", "Contact inquiries")}</h2><p className="mt-2 mb-6 text-sm text-[var(--color-muted)]">{text("استفسارات زوار الأكاديمية. استخدم بيانات التواصل للرد على صاحب الرسالة.", "Visitor inquiries. Use the provided contact details to reply to the sender.")}</p>
    {result.error ? <p role="alert" className="rounded-xl border border-red-400/40 p-5 text-red-200">{text("تعذر تحميل الرسائل. يرجى تحديث الصفحة والمحاولة مرة أخرى.", "Could not load inquiries. Refresh the page to try again.")}</p> : result.items.length ? <div className="grid gap-4">{result.items.slice(0, 25).map((item) => <article key={item.id} className="min-w-0 rounded-2xl border border-white/15 bg-white/5 p-5">
      <div className="flex flex-wrap items-start justify-between gap-3"><div><h3 className="text-lg font-bold [overflow-wrap:anywhere]">{item.name}</h3><p className="mt-1 text-sm text-rose-300">{interestLabel(item.interest)}</p></div><time className="text-xs text-[var(--color-muted)]" dateTime={new Date(item.created_at).toISOString()}>{new Intl.DateTimeFormat(ar ? "ar-EG" : "en-GB", { dateStyle: "medium", timeStyle: "short", timeZone: "Africa/Cairo" }).format(new Date(item.created_at))}</time></div>
      <p className="my-5 whitespace-pre-wrap text-sm leading-8 [overflow-wrap:anywhere]">{item.message}</p><div className="flex flex-wrap gap-4 text-sm"><a href={`mailto:${item.email}`} className="text-rose-200 underline [overflow-wrap:anywhere]"><bdi>{item.email}</bdi></a>{item.phone && <a href={`tel:${item.phone.replace(/[^+\d]/g, "")}`} className="text-rose-200 underline"><bdi>{item.phone}</bdi></a>}</div><p className="mt-4 text-xs text-[var(--color-muted)]">{text("رقم الاستفسار:", "Reference:")} <bdi>{item.id}</bdi></p>
    </article>)}</div> : <p className="rounded-xl border border-dashed border-white/20 p-10 text-center text-[var(--color-muted)]">{text("لا توجد رسائل في هذه الصفحة.", "No inquiries on this page.")}</p>}
    <nav className="mt-6 flex items-center gap-4 text-sm" aria-label={text("صفحات الرسائل", "Inquiry pages")}>{page > 1 && <Link href={`/dashboard/contact?page=${page - 1}`} className="rounded-xl border border-white/20 px-4 py-2">{text("السابق", "Previous")}</Link>}<span>{text("صفحة", "Page")} {page}</span>{result.items.length > 25 && <Link href={`/dashboard/contact?page=${page + 1}`} className="rounded-xl border border-white/20 px-4 py-2">{text("التالي", "Next")}</Link>}</nav>
  </section>;
}
