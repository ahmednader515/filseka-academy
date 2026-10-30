import Image from "next/image";
import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getHomepageSettings, getCoursesPublished } from "@/lib/db";
import { getLocaleFromCookie } from "@/lib/i18n/server";
import { pickLocalizedText } from "@/lib/i18n/localized-field";
import { ContactForm } from "./ContactForm";
import { ContactIcon } from "./ContactIcon";
import { SupportIcon } from "@/app/support/SupportIcon";
import styles from "./contact.module.css";

export const dynamic = "force-dynamic";
export async function generateMetadata() {
  const ar = (await getLocaleFromCookie()) === "ar";
  return { title: ar ? "تواصل معنا | في السكة أكاديمي" : "Contact us | Filsaka Academy", description: ar ? "تواصل مع فريق في السكة أكاديمي للاستفسار عن الكورسات والتسجيل والشراكات." : "Contact Filsaka Academy about courses, enrollment and partnerships." };
}

function safeUrl(value?: string | null) {
  try { const url = new URL(value?.trim() || ""); return ["https:", "http:"].includes(url.protocol) ? url.href : null; } catch { return null; }
}

export default async function ContactPage() {
  const [locale, settings, session, publishedCourses] = await Promise.all([getLocaleFromCookie(), getHomepageSettings().catch(() => null), getServerSession(authOptions), getCoursesPublished(true).catch(() => [])]);
  const ar = locale === "ar";
  const text = (arabic: string, english: string) => ar ? arabic : english;
  const whatsapp = safeUrl(settings?.teamWhatsappUrl) || safeUrl(settings?.whatsappUrl);
  const email = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(process.env.CONTACT_EMAIL || "") ? process.env.CONTACT_EMAIL! : null;
  const phone = /^[+\d\s().-]{7,30}$/.test(process.env.CONTACT_PHONE || "") ? process.env.CONTACT_PHONE! : null;
  const address = ar ? process.env.CONTACT_ADDRESS_AR || process.env.CONTACT_ADDRESS : process.env.CONTACT_ADDRESS_EN || process.env.CONTACT_ADDRESS;
  const hours = ar ? process.env.CONTACT_HOURS_AR || process.env.CONTACT_HOURS : process.env.CONTACT_HOURS_EN || process.env.CONTACT_HOURS;
  const mapUrl = safeUrl(process.env.CONTACT_MAP_URL);
  const socialLinks = [
    { name: "Facebook", mark: "f", href: safeUrl(settings?.facebookUrl) },
    { name: "YouTube", mark: "▶", href: safeUrl(settings?.youtubeUrl) },
    { name: "LinkedIn", mark: "in", href: safeUrl(settings?.linkedinUrl) },
    { name: "Telegram", mark: "➤", href: safeUrl(settings?.telegramUrl) },
  ].filter((social) => !!social.href);
  const courses = publishedCourses.map((course) => ({ id: course.id, title: pickLocalizedText(locale, (course as typeof course & { titleAr?: string }).titleAr ?? course.title_ar, course.title) || course.title }));

  return <div className={styles.page} dir={ar ? "rtl" : "ltr"}>
    <header className={styles.hero}><Image src="/background.png" fill priority sizes="100vw" alt="" className={styles.heroImage} /><div className={styles.heroCopy}>
      <nav className={styles.breadcrumb} aria-label={text("مسار التنقل", "Breadcrumb")}><Link href="/">{text("الرئيسية", "Home")}</Link><span aria-hidden="true">/</span><span aria-current="page">{text("تواصل معنا", "Contact us")}</span></nav>
      <h1><span className={styles.heroIcon}><ContactIcon name="mail" /></span><span>{text("تواصل معنا", "Contact us")}<span className={styles.stroke} aria-hidden="true" /></span></h1><p>{text("نحن هنا للإجابة على استفساراتك ومساعدتك في اختيار خطوتك القادمة.", "We’re here to answer your questions and help you choose your next step.")}</p>
    </div></header>

    <div className={styles.content}>
      <ContactForm courses={courses} initialName={session?.user.name || ""} initialEmail={session?.user.email || ""} />
      <div className={styles.details}>
        <section className={styles.contactCards} aria-label={text("طرق التواصل", "Contact options")}>
          <article className={styles.contactCard}><span className={styles.channelIcon}><ContactIcon name="mail" /></span><h2>{text("البريد الإلكتروني", "Email us")}</h2><p>{email ? <bdi>{email}</bdi> : text("أرسل استفسارك عبر نموذج التواصل", "Send your inquiry through our contact form")}</p><a className={styles.button} href={email ? `mailto:${email}` : "#contact-form"}>{text("إرسال رسالة", "Send a message")}<ContactIcon name="send" /></a></article>
          <article className={styles.contactCard}><span className={styles.channelIcon}><ContactIcon name="phone" /></span><h2>{text("اتصل بنا", "Call us")}</h2><p>{phone ? <bdi>{phone}</bdi> : text("اترك رقمك وسيتابع الفريق استفسارك", "Leave your number with your inquiry")}</p>{phone ? <a className={styles.button} href={`tel:${phone.replace(/[^+\d]/g, "")}`}>{text("اتصال مباشر", "Call now")}<ContactIcon name="phone" /></a> : <a className={styles.button} href="#contact-form">{text("اطلب التواصل", "Request contact")}<ContactIcon name="phone" /></a>}</article>
          <article className={styles.contactCard}><span className={styles.channelIcon}><SupportIcon name="whatsapp" /></span><h2>{text("واتساب مباشر", "WhatsApp")}</h2><p>{whatsapp ? text("تواصل مع فريق الأكاديمية", "Contact the academy team") : text("تواصل معنا من خلال النموذج", "Reach us through the contact form")}</p>{whatsapp ? <a className={styles.button} href={whatsapp} target="_blank" rel="noopener noreferrer">{text("مراسلة عبر واتساب", "Open WhatsApp")}<span aria-hidden="true">↗</span></a> : <span className={styles.unavailable}>{text("غير متاح حاليًا", "Currently unavailable")}</span>}</article>
        </section>

        <div className={styles.infoGrid}>
          <section className={styles.hours}><h2><ContactIcon name="clock" />{text("مواعيد التواصل", "Getting in touch")}</h2><p>{hours || text("أرسل استفسارك في أي وقت", "Send your inquiry at any time")}</p><span>{text("يتابع فريق الأكاديمية الرسائل ويرد عبر بيانات التواصل المسجلة.", "The academy team follows up using the contact details you provide.")}</span></section>
          <section className={styles.social}><h2><ContactIcon name="share" />{text("تابعنا على منصاتنا", "Stay connected")}</h2><p>{text("كن على اطلاع بآخر الكورسات وأخبار الأكاديمية", "Keep up with the latest courses and academy news")}</p><div className={styles.socialLinks}>{socialLinks.length ? socialLinks.map((social) => <a key={social.name} href={social.href!} target="_blank" rel="noopener noreferrer" aria-label={social.name}><span aria-hidden="true">{social.mark}</span></a>) : <Link className={styles.button} href="/courses">{text("اكتشف الكورسات", "Explore courses")}</Link>}</div></section>
          <section className={styles.location}><div className={styles.mapArt} aria-hidden="true"><svg viewBox="0 0 420 210" preserveAspectRatio="xMidYMid slice"><path d="M-20 40 180 110 440 30M10 230 140 90 180-30M100 230 250 80 420 130M0 150 420 190M300-30 290 230" fill="none" stroke="#402435" strokeWidth="12" /><path d="M-20 40 180 110 440 30M10 230 140 90 180-30M100 230 250 80 420 130M0 150 420 190M300-30 290 230" fill="none" stroke="#7a2b40" strokeWidth="2" /></svg><span><ContactIcon name="pin" /></span></div><div className={styles.locationCopy}><h2><ContactIcon name="pin" />{text("موقعنا", "Visit the academy")}</h2><p>{address || text("تواصل معنا لتنسيق زيارتك ومعرفة التفاصيل", "Contact us for location details and to arrange a visit")}</p>{mapUrl ? <a className={styles.button} href={mapUrl} target="_blank" rel="noopener noreferrer">{text("عرض الموقع على الخريطة", "View on map")}<span aria-hidden="true">↗</span></a> : <a className={styles.button} href="#contact-form">{text("استفسر عن الزيارة", "Ask about visiting")}<span aria-hidden="true">{ar ? "‹" : "›"}</span></a>}</div></section>
        </div>
        <Link href="/support" className={styles.supportLink}><SupportIcon name="headset" /><span>{text("تحتاج مساعدة في حسابك أو كورساتك؟", "Need help with your account or courses?")}<strong>{text("اذهب إلى الدعم الفني", "Visit technical support")}</strong></span><span aria-hidden="true">{ar ? "‹" : "›"}</span></Link>
      </div>
    </div>
  </div>;
}
