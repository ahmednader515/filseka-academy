"use client";

import { useId, useState } from "react";
import Link from "next/link";
import { useLocale } from "@/components/LocaleProvider";
import { SupportIcon } from "@/app/support/SupportIcon";
import { BalanceIcon } from "./BalanceIcon";
import { CopyButton } from "./CopyButton";
import styles from "./balance.module.css";

export type PaymentMethodCard = { id: "vodafone" | "instapay"; title: string; transferInstruction: string; destination: string; copyLabel: string; copiedLabel: string; copyAriaLabel: string };
type Props = { methods: PaymentMethodCard[]; confirmationNote: string; waitingNote: string; whatsappNumber: string; whatsappButtonText: string };

export function PaymentMethodCards({ methods, confirmationNote, waitingNote, whatsappNumber, whatsappButtonText }: Props) {
  const ar = useLocale() === "ar";
  const text = (arabic: string, english: string) => ar ? arabic : english;
  const available = methods.filter((method) => method.destination.trim());
  const [selectedId, setSelectedId] = useState(available[0]?.id || "vodafone");
  const selected = available.find((method) => method.id === selectedId) || available[0];
  const detailsId = useId();
  const whatsapp = whatsappNumber.replace(/\D/g, "");
  const canConfirm = /^[1-9]\d{6,14}$/.test(whatsapp);

  if (!selected) return <section className={styles.noMethods}><BalanceIcon name="wallet" /><h2>{text("وسائل الشحن ستظهر هنا", "Funding methods will appear here")}</h2><p>{text("لا توجد طرق شحن متاحة حاليًا. تواصل مع الدعم لمعرفة التفاصيل.", "No funding methods are available yet. Contact support for details.")}</p><Link className={styles.button} href="/support">{text("تواصل مع الدعم الفني", "Contact support")}</Link></section>;

  return <section className={styles.paymentPanel} aria-labelledby={`${detailsId}-title`}>
    <div className={styles.paymentHeading}><span><BalanceIcon name="wallet" /></span><div><h2 id={`${detailsId}-title`}>{text("وسائل الشحن المتاحة", "Available funding methods")}</h2><p>{text("اختر وسيلة التحويل لعرض بياناتها", "Select a method to view its transfer details")}</p></div></div>
    <div className={styles.methods} role="group" aria-label={text("اختر وسيلة الشحن", "Choose a funding method")}>{available.map((method) => <button key={method.id} type="button" aria-pressed={selected.id === method.id} aria-controls={detailsId} onClick={() => setSelectedId(method.id)}><span className={method.id === "vodafone" ? styles.cashLogo : styles.instaLogo}>{method.id === "vodafone" ? <BalanceIcon name="wallet" /> : <span aria-hidden="true">IP</span>}</span><span><strong>{method.title}</strong><small>{method.id === "vodafone" ? text("تحويل إلى المحفظة", "Transfer to wallet") : text("تحويل إلى حساب InstaPay", "Transfer to an InstaPay address")}</small></span><span className={styles.methodChoice} aria-hidden="true">{selected.id === method.id ? "✓" : ""}</span></button>)}</div>
    <div id={detailsId} className={styles.transferDetails} aria-live="polite"><div className={styles.detailHeading}><span className={styles.detailNumber}>2</span><div><h3>{selected.title}</h3><p>{selected.transferInstruction}</p></div></div><div className={styles.destination}><div><span>{selected.id === "vodafone" ? text("رقم المحفظة", "Wallet number") : text("عنوان التحويل", "Transfer address")}</span><strong dir="ltr">{selected.destination}</strong></div><CopyButton key={`${selected.id}-${selected.destination}`} text={selected.destination} copyLabel={selected.copyLabel} copiedLabel={selected.copiedLabel} ariaLabel={selected.copyAriaLabel} /></div><p className={styles.transferHint}>{text("راجع بيانات الوجهة في تطبيق الدفع قبل تأكيد التحويل، واحتفظ بالإيصال.", "Check the recipient details in your payment app before confirming, and keep your receipt.")}</p></div>
    <div className={styles.confirmation}><div className={styles.detailHeading}><span className={styles.detailNumber}>3</span><div><h3>{text("أرسل صورة إيصال التحويل", "Send your transfer receipt")}</h3><p>{confirmationNote}</p></div></div>{canConfirm ? <><div className={styles.confirmationContact}><SupportIcon name="whatsapp" /><span>{text("رقم إرسال التأكيد", "Confirmation contact")}</span><a href={`https://wa.me/${whatsapp}`} target="_blank" rel="noopener noreferrer" dir="ltr">+{whatsapp}</a></div><a className={styles.whatsappButton} href={`https://wa.me/${whatsapp}`} target="_blank" rel="noopener noreferrer"><SupportIcon name="whatsapp" /><span>{whatsappButtonText}</span><span aria-hidden="true">↗</span></a></> : <Link className={styles.button} href="/support">{text("تواصل مع الدعم لتأكيد التحويل", "Contact support to confirm the transfer")}</Link>}<div className={styles.waiting}><BalanceIcon name="clock" /><p>{waitingNote}</p></div></div>
  </section>;
}
