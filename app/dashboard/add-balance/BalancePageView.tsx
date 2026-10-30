import Image from "next/image";
import Link from "next/link";
import { PaymentMethodCards, type PaymentMethodCard } from "./PaymentMethodCards";
import { BalanceIcon } from "./BalanceIcon";
import { SupportIcon } from "@/app/support/SupportIcon";
import styles from "./balance.module.css";

type Props = { locale: "ar" | "en"; title: string; subtitle: string; balance: number; methods: PaymentMethodCard[]; confirmationNote: string; waitingNote: string; whatsappNumber: string; whatsappButtonText: string };
export function BalancePageView({ locale, title, subtitle, balance, ...paymentProps }: Props) {
  const ar = locale === "ar";
  const text = (arabic: string, english: string) => ar ? arabic : english;
  const steps = [
    { icon: "wallet" as const, title: text("اختر وسيلة التحويل", "Choose a method"), detail: text("اختر وسيلة الشحن المناسبة من الخيارات المتاحة أدناه.", "Choose a funding method from the available options below.") },
    { icon: "transfer" as const, title: text("حوّل المبلغ", "Make the transfer"), detail: text("انسخ بيانات الوجهة وحوّل المبلغ المطلوب عبر تطبيق الدفع الخاص بك.", "Copy the destination and transfer your amount using your payment app.") },
    { icon: "receipt" as const, title: text("أرسل تأكيد التحويل", "Send confirmation"), detail: text("احتفظ بإيصال التحويل وأرسل صورته للفريق عبر واتساب.", "Keep your transfer receipt and send a screenshot to the team on WhatsApp.") },
    { icon: "check" as const, title: text("مراجعة وإضافة الرصيد", "Review and credit"), detail: text("بعد مراجعة التحويل وتأكيده، يضيف الفريق الرصيد لحسابك.", "The team adds the funds to your account after reviewing and confirming the transfer.") },
  ];
  return <div className={styles.page} dir={ar ? "rtl" : "ltr"}>
    <header className={styles.hero}><Image src="/background.png" alt="" fill priority sizes="100vw" className={styles.heroImage} /><div><nav className={styles.breadcrumb} aria-label={text("مسار التنقل", "Breadcrumb")}><Link href="/dashboard">{text("لوحة تعلمي", "My dashboard")}</Link><span aria-hidden="true">/</span><span aria-current="page">{title}</span></nav><div className={styles.heading}><span><BalanceIcon name="card" /></span><h1>{title}</h1></div><p>{subtitle}</p><span className={styles.stroke} aria-hidden="true" /></div></header>

    <div className={styles.layout}>
      <div className={styles.main}>
        <section aria-labelledby="balance-steps-title"><div className={styles.sectionHeading}><h2 id="balance-steps-title">{text("اشحن رصيدك في 4 خطوات بسيطة", "Add funds in four simple steps")}</h2><span>{text("تحويل ثم تأكيد", "Transfer, then confirm")}</span></div><ol className={styles.steps}>{steps.map((step, index) => <li key={step.icon}><span className={styles.stepNumber}>{index + 1}</span><h3>{step.title}</h3><span className={styles.stepIcon}><BalanceIcon name={step.icon} /></span><p>{step.detail}</p></li>)}</ol></section>
        <PaymentMethodCards {...paymentProps} />
        <section className={styles.assurances} aria-label={text("معلومات الشحن", "Funding information")}><div><BalanceIcon name="receipt" /><span><strong>{text("احتفظ بالإيصال", "Keep the receipt")}</strong><small>{text("لتسهيل مراجعة التحويل", "To help the team verify your transfer")}</small></span></div><div><BalanceIcon name="clock" /><span><strong>{text("الرصيد بعد المراجعة", "Credited after review")}</strong><small>{text("تابع رصيدك من لوحة تعلمك", "Check your balance in your dashboard")}</small></span></div><Link href="/support"><SupportIcon name="headset" /><span><strong>{text("تحتاج مساعدة؟", "Need a hand?")}</strong><small>{text("تواصل مع الدعم الفني", "Contact technical support")}</small></span></Link></section>
      </div>

      <aside className={styles.aside} aria-label={text("رصيدك ومساعدتك", "Your balance and help")}>
        <div className={styles.phoneArt} aria-hidden="true"><div className={styles.phoneCamera} /><Image src="/logo-1.png" width={220} height={110} alt="" /><span className={styles.phoneWallet}><BalanceIcon name="wallet" /></span><strong>{text("رصيدك للتعلّم", "Your learning wallet")}</strong><span className={styles.phoneCaption}>{text("خطوتك القادمة تبدأ هنا", "Your next step starts here")}</span><div className={styles.phoneReceipt}><BalanceIcon name="receipt" /><span /><span /><span /></div></div>
        <section className={styles.balanceCard}><h2><BalanceIcon name="wallet" />{text("رصيدك الحالي", "Current balance")}</h2><strong><bdi>{new Intl.NumberFormat(ar ? "ar-EG" : "en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(balance)}</bdi><small>{text("ج.م", "EGP")}</small></strong><p>{text("يُحدَّث الرصيد بعد مراجعة التحويل وإضافته إلى حسابك.", "Your balance updates after the transfer is reviewed and credited.")}</p><Link href="/dashboard" className={styles.textLink}>{text("العودة للوحة تعلمي", "Back to my dashboard")}<span aria-hidden="true">{ar ? "←" : "→"}</span></Link></section>
        <Link href="/support" className={styles.helpCard}><SupportIcon name="headset" /><span><strong>{text("نحن هنا لمساعدتك", "We’re here to help")}</strong><small>{text("واجهتك مشكلة في التحويل؟ تواصل معنا.", "Having trouble with a transfer? Get in touch.")}</small></span></Link>
      </aside>
    </div>
  </div>;
}
