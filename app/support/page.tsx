import Image from "next/image";
import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getHomepageSettings, getConversationsByStaffId, getConversationsByStudentId } from "@/lib/db";
import { getLocaleFromCookie } from "@/lib/i18n/server";
import { MessagesView } from "@/app/dashboard/messages/MessagesView";
import { SupportIcon, type SupportIconName } from "./SupportIcon";
import styles from "./support.module.css";

export const dynamic = "force-dynamic";

export async function generateMetadata() {
  const ar = (await getLocaleFromCookie()) === "ar";
  return { title: ar ? "الدعم الفني | في السكة أكاديمي" : "Support | Filsaka Academy", description: ar ? "تواصل مع فريق الأكاديمية واعثر على إجابات لأسئلتك حول الكورسات والحساب." : "Contact the academy team and find help with your courses and account." };
}

function contactUrl(value?: string | null) {
  try { const url = new URL(value?.trim() || ""); return ["https:", "http:"].includes(url.protocol) ? url.href : null; } catch { return null; }
}

export default async function SupportPage() {
  const [locale, session, settings] = await Promise.all([getLocaleFromCookie(), getServerSession(authOptions), getHomepageSettings().catch(() => null)]);
  const ar = locale === "ar";
  const text = (arabic: string, english: string) => ar ? arabic : english;
  const isStaff = ["ADMIN", "ASSISTANT_ADMIN", "TEACHER"].includes(session?.user.role || "");
  const canMessage = !!session?.user.id && (isStaff || session.user.role === "STUDENT");
  const messageHref = canMessage ? "#support-messages" : "/login?callbackUrl=%2Fsupport%23support-messages";
  let conversations: { id: string; staffName?: string; studentName?: string; updatedAt: Date }[] = [];
  let conversationsUnavailable = false;
  if (canMessage && session) {
    try { conversations = isStaff ? await getConversationsByStaffId(session.user.id) : await getConversationsByStudentId(session.user.id); }
    catch { conversationsUnavailable = true; }
  }
  const whatsapp = contactUrl(settings?.teamWhatsappUrl) || contactUrl(settings?.whatsappUrl);
  const telegram = contactUrl(settings?.teamTelegramUrl) || contactUrl(settings?.telegramUrl);
  const contacts: { icon: SupportIconName; title: string; description: string; action: string; href: string | null; external?: boolean; primary?: boolean }[] = [
    { icon: "chat", title: text("المحادثة المباشرة", "Private messages"), description: text("تواصل مع فريق الأكاديمية من حسابك", "Contact the academy team from your account"), action: text("ابدأ المحادثة", "Start a conversation"), href: messageHref, primary: true },
    { icon: "whatsapp", title: text("واتساب", "WhatsApp"), description: whatsapp ? text("تواصل معنا عبر واتساب", "Reach us on WhatsApp") : text("يمكنك التواصل عبر رسائل المنصة", "You can reach us through platform messages"), action: whatsapp ? text("محادثة واتساب", "Open WhatsApp") : text("غير متاح حاليًا", "Currently unavailable"), href: whatsapp, external: true },
    { icon: "telegram", title: text("تليجرام", "Telegram"), description: telegram ? text("ابقَ على تواصل مع فريقنا", "Stay connected with our team") : text("يمكنك التواصل عبر رسائل المنصة", "You can reach us through platform messages"), action: telegram ? text("تواصل عبر تليجرام", "Open Telegram") : text("غير متاح حاليًا", "Currently unavailable"), href: telegram, external: true },
    { icon: "book", title: text("مركز المساعدة", "Help center"), description: text("إجابات تساعدك في رحلتك التعليمية", "Answers for your learning journey"), action: text("تصفح الأسئلة الشائعة", "Browse common questions"), href: "#support-help" },
  ];
  const faqs: { icon: SupportIconName; question: string; answer: string; href?: string; action?: string }[] = [
    { icon: "play", question: text("كيف أبدأ الكورس؟", "How do I start a course?"), answer: text("سجّل الدخول إلى حسابك، ثم افتح «كورساتي» لاختيار الكورس المسجّل به ومشاهدة دروسه. يمكنك أيضًا تصفح الكورسات المتاحة من صفحة الكورسات.", "Sign in, open My courses and choose an enrolled course to watch its lessons. You can also browse available courses in the course catalog."), href: "/courses", action: text("تصفح الكورسات", "Browse courses") },
    { icon: "ticket", question: text("كيف أفعّل كود الاشتراك؟", "How do I activate a subscription code?"), answer: text("سجّل الدخول وافتح لوحة حسابك لاستخدام كود التفعيل. إذا لم يعمل الكود، أرسل تفاصيل المشكلة لفريق الدعم عبر رسائل المنصة.", "Sign in and open your dashboard to use your activation code. If it does not work, send the issue details to the support team through platform messages."), href: "/dashboard", action: text("افتح حسابك", "Open dashboard") },
    { icon: "headset", question: text("ماذا أفعل إذا لم يعمل الفيديو أو الصوت؟", "What if video or audio does not play?"), answer: text("تأكد من اتصال الإنترنت ومستوى الصوت، ثم حدّث الصفحة وجرّب متصفحًا آخر. إذا استمرت المشكلة، أرسل اسم الكورس والدرس ونوع الجهاز وصورة للمشكلة في رسالتك.", "Check your internet connection and volume, refresh the page and try another browser. If the problem continues, send the course and lesson names, your device type and a screenshot in your message.") },
    { icon: "user", question: text("كيف أدير بيانات حسابي؟", "How do I manage my account details?"), answer: text("يمكنك مراجعة بيانات حسابك وتحديث البيانات المتاحة من صفحة الملف الشخصي في لوحة التحكم. إذا تعذر تسجيل الدخول، استخدم صفحة طلب تغيير كلمة المرور.", "Review your account and update available details from the dashboard profile page. If you cannot sign in, use the password change request page."), href: "/dashboard/profile", action: text("الملف الشخصي", "Your profile") },
    { icon: "shield", question: text("نسيت كلمة المرور، كيف أستعيد حسابي؟", "I forgot my password. How do I recover my account?"), answer: text("افتح صفحة طلب تغيير كلمة المرور وأدخل بيانات الحساب المسجلة، ثم اتبع تعليمات النموذج لإرسال طلبك إلى إدارة الأكاديمية.", "Open the password change request page, enter your registered account details and follow the form instructions to send your request to the academy administrators."), href: "/login/forgot-password", action: text("طلب تغيير كلمة المرور", "Request a password change") },
  ];

  return <div className={styles.page} dir={ar ? "rtl" : "ltr"}>
    <header className={styles.hero}>
      <Image src="/background.png" alt="" fill priority sizes="100vw" className={styles.heroImage} />
      <div className={styles.heroCopy}>
        <nav className={styles.breadcrumb} aria-label={text("مسار التنقل", "Breadcrumb")}><Link href="/">{text("الرئيسية", "Home")}</Link><span aria-hidden="true">/</span><span aria-current="page">{text("الدعم الفني", "Support")}</span></nav>
        <h1><SupportIcon name="headset" />{text("الدعم الفني", "Here to help")}</h1>
        <p>{text("نحن معك في كل خطوة.. لمساعدتك في رحلتك التدريبية", "With you at every step of your learning journey.")}</p>
        <span className={styles.stroke} aria-hidden="true" />
      </div>
      <div className={styles.heroArt} aria-hidden="true"><div className={styles.laptop}><Image src="/logo-1.png" width={220} height={110} alt="" /></div><div className={styles.headphones}><SupportIcon name="headset" /></div></div>
    </header>

    <div className={styles.content}>
      <section className={styles.contactSection} aria-labelledby="contact-title"><h2 id="contact-title" className={styles.sectionBadge}><SupportIcon name="headset" />{text("تواصل معنا الآن", "Let’s get you help")}</h2><div className={styles.contactGrid}>{contacts.map((contact) => <article key={contact.icon} className={`${styles.contactCard}${contact.primary ? ` ${styles.primaryCard}` : ""}`}><SupportIcon name={contact.icon} /><h3>{contact.title}</h3><p>{contact.description}</p>{contact.href ? <Link className={styles.button} href={contact.href} target={contact.external ? "_blank" : undefined} rel={contact.external ? "noopener noreferrer" : undefined}>{contact.action}<span aria-hidden="true">{ar ? "‹" : "›"}</span></Link> : <span className={styles.unavailable}>{contact.action}</span>}</article>)}</div></section>

      <div className={styles.panels}>
        <section className={styles.panel} id="support-help" aria-labelledby="help-title"><h2 id="help-title"><SupportIcon name="book" />{text("مركز المساعدة", "Help center")}</h2><p className={styles.panelIntro}>{text("إجابات سريعة لأكثر الأسئلة شيوعًا", "Quick answers to common questions")}</p><div className={styles.faqs}>{faqs.map((faq) => <details key={faq.question}><summary><SupportIcon name={faq.icon} /><span>{faq.question}</span><span className={styles.faqChevron} aria-hidden="true">⌄</span></summary><div className={styles.answer}><p>{faq.answer}</p>{faq.href && <Link href={faq.href}>{faq.action}<span aria-hidden="true"> {ar ? "←" : "→"}</span></Link>}</div></details>)}</div></section>

        <section className={styles.panel} aria-labelledby="requests-title"><h2 id="requests-title"><SupportIcon name="ticket" />{text("محادثات الدعم", "Your conversations")}</h2><p className={styles.panelIntro}>{text("تابع تواصلك مع فريق الأكاديمية", "Keep track of your messages with the academy")}</p>
          {!canMessage ? <div className={styles.empty}><SupportIcon name="chat" /><h3>{text("كل المساعدة في مكان واحد", "All your help in one place")}</h3><p>{text("سجّل الدخول لبدء محادثة ومتابعة ردود فريق الأكاديمية.", "Sign in to start a conversation and follow the team’s replies.")}</p><Link className={styles.button} href={messageHref}>{text("تسجيل الدخول والتواصل", "Sign in to get help")}<span aria-hidden="true">{ar ? "‹" : "›"}</span></Link></div> : conversations.length ? <><ul className={styles.conversations}>{conversations.slice(0, 3).map((conversation) => <li key={conversation.id}><span className={styles.conversationIcon}><SupportIcon name="chat" /></span><div><strong>{(isStaff ? conversation.studentName : conversation.staffName) || text("فريق الأكاديمية", "Academy team")}</strong><span>{text("آخر تواصل", "Last activity")}</span></div><time dateTime={new Date(conversation.updatedAt).toISOString()}>{new Intl.DateTimeFormat(ar ? "ar-EG" : "en-GB", { day: "numeric", month: "short", timeZone: "Africa/Cairo" }).format(new Date(conversation.updatedAt))}</time></li>)}</ul><Link className={styles.button} href="#support-messages">{text("عرض كل المحادثات", "Open all conversations")}<span aria-hidden="true">{ar ? "‹" : "›"}</span></Link></> : <div className={styles.empty}><SupportIcon name="chat" /><h3>{conversationsUnavailable ? text("تعذر تحميل المحادثات", "Could not load conversations") : text("كيف نقدر نساعدك؟", "How can we help?")}</h3><p>{conversationsUnavailable ? text("افتح الرسائل للمحاولة مجددًا أو استخدم إحدى قنوات التواصل المتاحة.", "Open messages to try again or use an available contact channel.") : text("ابدأ محادثتك الأولى وأرسل تفاصيل المشكلة لفريق الأكاديمية.", "Start your first conversation and share the details with the academy team.")}</p><Link className={styles.button} href="#support-messages">{text("افتح الرسائل", "Open messages")}<span aria-hidden="true">{ar ? "‹" : "›"}</span></Link></div>}
        </section>
      </div>

      <section className={styles.assurances} aria-label={text("مساعدتك تبدأ هنا", "Help starts here")}>{[{ icon: "headset" as const, title: text("تواصل مع فريق الأكاديمية", "Reach the academy team"), detail: text("للاستفسارات ومشكلات التعلم", "For questions and learning issues") }, { icon: "attach" as const, title: text("اشرح المشكلة بوضوح", "Share the details"), detail: text("أرفق صورة أو ملفًا في رسالتك", "Attach a screenshot or file to your message") }, { icon: "book" as const, title: text("مساعدة بخطوات بسيطة", "Practical guidance"), detail: text("إجابات تساعدك على المتابعة", "Answers to help you move forward") }, { icon: "shield" as const, title: text("محادثات خاصة", "Private conversations"), detail: text("داخل حسابك على المنصة", "Within your academy account") }].map((item) => <div key={item.icon}><SupportIcon name={item.icon} /><div><h3>{item.title}</h3><p>{item.detail}</p></div></div>)}</section>

      {canMessage && session && <section className={`${styles.panel} ${styles.messages}`} id="support-messages" aria-labelledby="messages-title"><h2 id="messages-title"><SupportIcon name="chat" />{text("رسائلك مع الأكاديمية", "Your academy messages")}</h2><p className={styles.panelIntro}>{text("اختر محادثة أو جهة تواصل لإرسال رسالتك.", "Select a conversation or contact to send your message.")}</p><MessagesView isStaff={isStaff} userId={session.user.id} userName={session.user.name ?? ""} /></section>}
    </div>
  </div>;
}
