"use client";

import { useRef, useState, type FormEvent } from "react";
import { useLocale } from "@/components/LocaleProvider";
import { ContactIcon } from "./ContactIcon";
import { SupportIcon } from "@/app/support/SupportIcon";
import styles from "./contact.module.css";

export function ContactForm({ courses, initialName, initialEmail }: { courses: { id: string; title: string }[]; initialName: string; initialEmail: string }) {
  const ar = useLocale() === "ar";
  const text = (arabic: string, english: string) => ar ? arabic : english;
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<{ error?: string; id?: string }>({});
  const inFlight = useRef(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (inFlight.current) return;
    const form = event.currentTarget;
    const data = Object.fromEntries(new FormData(form));
    inFlight.current = true;
    setSending(true); setResult({});
    try {
      const response = await fetch("/api/contact", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
      const payload = await response.json();
      if (!response.ok) {
        setResult({ error: payload.code === "RATE_LIMITED" ? text("يرجى الانتظار دقيقة قبل إرسال رسالة أخرى.", "Please wait a minute before sending another message.") : payload.code === "INVALID_INPUT" ? text("راجع البيانات وأدخل رسالة من 10 أحرف على الأقل.", "Check your details and enter a message of at least 10 characters.") : text("تعذر إرسال الرسالة. احتفظنا بالبيانات، يرجى المحاولة مرة أخرى.", "We couldn’t send your message. Your details are still here; please try again.") });
        return;
      }
      setResult({ id: payload.id }); form.reset();
    } catch { setResult({ error: text("تعذر الاتصال. يرجى المحاولة مرة أخرى.", "Connection failed. Please try again.") }); }
    finally { inFlight.current = false; setSending(false); }
  }

  return <section className={styles.formPanel} id="contact-form" aria-labelledby="contact-form-title">
    <h2 id="contact-form-title"><span><SupportIcon name="chat" /></span>{text("أرسل لنا رسالة", "Send us a message")}</h2>
    <p className={styles.formIntro}>{text("يسعدنا نسمع منك! اترك استفسارك وسيتابعه فريق الأكاديمية.", "We’d love to hear from you. Share your question with the academy team.")}</p>
    <form onSubmit={submit} className={styles.form} aria-busy={sending}>
      <div className={styles.formRow}>
        <label><span>{text("الاسم الكامل", "Full name")} *</span><div className={styles.inputWrap}><ContactIcon name="user" /><input name="name" autoComplete="name" required minLength={2} maxLength={120} defaultValue={initialName} placeholder={text("اكتب اسمك", "Your name")} /></div></label>
        <label><span>{text("رقم الهاتف", "Phone number")} <small>{text("(اختياري)", "(optional)")}</small></span><div className={styles.inputWrap}><ContactIcon name="phone" /><input name="phone" type="tel" autoComplete="tel" maxLength={30} pattern={"[+0-9 .\\(\\)\\-]{7,30}"} placeholder="+20 …" dir="ltr" /></div></label>
      </div>
      <label><span>{text("البريد الإلكتروني", "Email address")} *</span><div className={styles.inputWrap}><ContactIcon name="mail" /><input name="email" type="email" autoComplete="email" required maxLength={254} defaultValue={initialEmail} placeholder="name@example.com" dir="ltr" /></div></label>
      <label><span>{text("الاهتمام", "What are you interested in?")} *</span><div className={styles.inputWrap}><ContactIcon name="list" /><select name="interest" required defaultValue=""><option value="" disabled>{text("اختر الكورس أو نوع الاستفسار", "Choose a course or inquiry type")}</option><option value="general">{text("استفسار عام", "General inquiry")}</option><option value="partnership">{text("تعاون وشراكات", "Partnerships")}</option><option value="enrollment">{text("التسجيل والاشتراكات", "Enrollment and subscriptions")}</option>{courses.map((course) => <option key={course.id} value={course.id}>{course.title}</option>)}</select></div></label>
      <label><span>{text("رسالتك", "Your message")} *</span><textarea name="message" required minLength={10} maxLength={5000} rows={5} placeholder={text("اكتب رسالتك أو استفسارك هنا…", "Tell us how we can help…")} /></label>
      <div className={styles.honeypot} aria-hidden="true"><label>Website<input name="website" tabIndex={-1} autoComplete="off" /></label></div>
      <p className={styles.privacy}>{text("تُستخدم بيانات التواصل للرد على استفسارك من فريق الأكاديمية.", "Your contact details will be used by the academy team to respond to your inquiry.")}</p>
      {result.error && <p className={styles.error} role="alert">{result.error}</p>}
      {result.id && <div className={styles.success} role="status"><strong>{text("تم إرسال رسالتك بنجاح", "Your message has been sent")}</strong><p>{text("رقم الاستفسار:", "Reference:")} <bdi>{result.id}</bdi></p></div>}
      <button type="submit" className={styles.submit} disabled={sending}><ContactIcon name="send" />{sending ? text("جارٍ الإرسال…", "Sending…") : text("إرسال الرسالة", "Send message")}</button>
    </form>
  </section>;
}
