import type { CSSProperties } from "react";
import type { CertificateDesign } from "@/lib/certificate-design";
import { AcademyIcon } from "./AcademyIcon";
import styles from "./CertificateDocument.module.css";

export function CertificateDocument({ design, studentName, courseTitle, issuedAt, verificationId }: { design: CertificateDesign; studentName: string; courseTitle: string; issuedAt?: string; verificationId?: string }) {
  return <article className={styles.document} data-certificate-document dir="rtl" style={{ "--certificate-accent": design.accent } as CSSProperties}>
    <div className={styles.ribbon} aria-hidden="true" />
    <div className={styles.inner}>
      {design.logoUrl && <img src={design.logoUrl} alt={design.academy} className={styles.logo} />}
      <p className={styles.academy}>{design.academy}</p>
      <h2>{design.title}</h2><p className={styles.subtitle}>{design.subtitle}</p>
      <p className={styles.introduction}>{design.introduction}</p>
      <strong className={styles.name} style={studentName.length > 40 ? { fontSize: "2.7cqw" } : undefined}>{studentName}</strong>
      <p className={styles.completion}>{design.completion}</p>
      <h3 style={courseTitle.length > 60 ? { fontSize: "1.8cqw" } : undefined}>{courseTitle}</h3>
      <div className={styles.bottom}><div className={styles.signature}>{design.signatureUrl ? <img src={design.signatureUrl} alt="التوقيع" /> : <span className={styles.signatureLine} />}<strong>{design.signatory}</strong><span>{design.signatoryRole}</span></div><div className={styles.seal} aria-label="شهادة إتمام"><AcademyIcon name="mic" /><span>إتمام التدريب</span></div><div className={styles.verification}>{issuedAt && <time dateTime={issuedAt}>{new Intl.DateTimeFormat("ar-EG", { dateStyle: "long", timeZone: "Africa/Cairo" }).format(new Date(issuedAt))}</time>}<small>{verificationId ? "رقم التحقق" : "معاينة التصميم"}</small><span dir="ltr">{verificationId || "PREVIEW"}</span></div></div>
    </div>
  </article>;
}
