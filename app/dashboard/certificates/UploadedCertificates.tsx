"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useLocale } from "@/components/LocaleProvider";
import styles from "../management.module.css";
import certificateStyles from "./uploaded-certificates.module.css";

type Certificate = { id: string; title: string; student_name: string | null; file_type: string; code?: string; redeemed_at: string | null };
export function UploadedCertificates({ admin = false, certificates }: { admin?: boolean; certificates: Certificate[] }) {
  const ar = useLocale() === "ar";
  const text = (a: string, e: string) => ar ? a : e;
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [newCode, setNewCode] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [failedPreviewId, setFailedPreviewId] = useState<string | null>(null);
  const selected = certificates.find((certificate) => certificate.id === selectedId) ?? certificates[0];
  const fileUrl = selected ? `/api/certificates/uploads/${selected.id}/file` : "";
  return <section className={styles.manager}>
    <div className={styles.intro}>
      <h2>{admin ? text("رفع شهادة", "Upload a certificate") : text("استرداد شهادة بكود", "Redeem a certificate code")}</h2>
      <p>{admin ? text("ارفع الشهادة للحصول على كود عشوائي وشاركه مع الطالب. تُضاف الشهادة إلى حساب أول طالب يسترد الكود، ويُستخدم مرة واحدة فقط.", "Upload a certificate to generate a random code and share it with the student. The first student to redeem the code receives the certificate on their account. Each code can be used only once.") : text("أدخل الكود الذي حصلت عليه من الإدارة لإضافة شهادتك إلى حسابك.", "Enter the code provided by the academy to add your certificate to your account.")}</p>
    </div>
    <div className={certificateStyles.layout}>
    <div className={certificateStyles.controls}>
    <form className={styles.panel} onSubmit={async (event) => {
      event.preventDefault();
      const form = event.currentTarget;
      const data = new FormData(form);
      setBusy(true); setMessage(""); setNewCode("");
      try {
        const response = await fetch(admin ? "/api/dashboard/certificates/uploads" : "/api/certificates/redeem", admin ? { method: "POST", body: data } : { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ code: data.get("code") }) });
        const result = await response.json();
        if (!response.ok) throw new Error(result.error);
        if (admin) setNewCode(result.code);
        setSelectedId(result.id);
        setMessage(admin ? text("تم حفظ الشهادة. شارك الكود مع الطالب.", "Certificate saved. Share the code with the student.") : text("تمت إضافة الشهادة إلى حسابك.", "Certificate added to your account."));
        form.reset(); router.refresh();
      } catch (error) { setMessage(error instanceof Error ? error.message : text("تعذر إتمام الطلب", "Request failed")); }
      finally { setBusy(false); }
    }}>
      {admin ? <>
        <label>{text("ملف الشهادة (PDF، JPG، PNG، WebP — حتى 10 MB)", "Certificate file (PDF, JPG, PNG, WebP — up to 10 MB)")}<input name="file" type="file" required accept="application/pdf,image/jpeg,image/png,image/webp" disabled={busy} /></label>
      </> : <label>{text("كود الشهادة", "Certificate code")}<input name="code" required maxLength={40} placeholder="CERT-…" autoComplete="off" dir="ltr" disabled={busy} /></label>}
      <button className={styles.button} disabled={busy}>{busy ? text("جارٍ الحفظ…", "Saving…") : admin ? text("رفع الشهادة وإنشاء الكود", "Upload and generate code") : text("استرداد الشهادة", "Redeem certificate")}</button>
      {message && <p role="status">{message}</p>}
      {newCode && <label>{text("الكود — انسخه وشاركه مع الطالب", "Code — copy and share with the student")}<input readOnly value={newCode} dir="ltr" onFocus={(event) => event.target.select()} /></label>}
    </form>
    <section className={styles.panel}>
      <h3>{admin ? text("الشهادات المرفوعة والأكواد", "Uploaded certificates and codes") : text("شهاداتي المرفوعة", "My uploaded certificates")}</h3>
      {!certificates.length && <p>{text("لا توجد شهادات مرفوعة بعد.", "No uploaded certificates yet.")}</p>}
      <div className={styles.list}>{certificates.map((certificate) => <article className={`${styles.row} ${selected?.id === certificate.id ? certificateStyles.selected : ""}`} key={certificate.id}><div>
        <strong className={certificateStyles.name}>{certificate.title}</strong>{certificate.student_name && <p>{certificate.student_name}</p>}
        {admin && <><p>{certificate.redeemed_at ? text("تم الاسترداد", "Redeemed") : text("بانتظار استرداد الطالب", "Awaiting student redemption")}</p><label>{text("الكود", "Code")}<input aria-label={text("كود الشهادة", "Certificate code")} readOnly value={certificate.code ?? ""} dir="ltr" onFocus={(event) => event.target.select()} /></label></>}
        <div className={styles.actions}><button type="button" className={certificateStyles.select} aria-pressed={selected?.id === certificate.id} onClick={() => { setSelectedId(certificate.id); setFailedPreviewId(null); }}>{text("معاينة الشهادة", "Preview certificate")}</button><a href={`/api/certificates/uploads/${certificate.id}/file?download=1`}>{text("تحميل الشهادة", "Download certificate")}</a></div>
      </div></article>)}</div>
    </section>
    </div>
    <section className={`${styles.panel} ${certificateStyles.preview}`} aria-label={text("معاينة الشهادة", "Certificate preview")}>
      <div className={certificateStyles.heading}><h3>{text("معاينة الشهادة", "Certificate preview")}</h3>{selected && <a href={fileUrl} target="_blank" rel="noreferrer" className={certificateStyles.select}>{text("فتح بالحجم الكامل", "Open full size")} ↗</a>}</div>
      {selected && <p className={certificateStyles.title}>{selected.title}</p>}
      <div className={certificateStyles.stage}>
        {!selected ? <p className={certificateStyles.empty}>{admin ? text("ارفع شهادة لتظهر معاينتها هنا.", "Upload a certificate to see its preview here.") : text("استرد شهادة بكود لتظهر معاينتها هنا.", "Redeem a certificate code to see its preview here.")}</p>
          : failedPreviewId === selected.id ? <p className={certificateStyles.empty}>{text("تعذر تحميل المعاينة. يمكنك فتح الشهادة بالحجم الكامل أو تحميلها.", "The preview could not load. You can open the certificate full size or download it.")}</p>
          : selected.file_type === "application/pdf" ? <iframe key={selected.id} className={certificateStyles.pdf} src={`${fileUrl}#view=FitH`} title={selected.title} />
          // eslint-disable-next-line @next/next/no-img-element
          : <img key={selected.id} className={certificateStyles.image} src={fileUrl} alt={selected.title} onError={() => setFailedPreviewId(selected.id)} />}
      </div>
      {selected && <a className={styles.button} href={`${fileUrl}?download=1`}>{text("تحميل الشهادة", "Download certificate")}</a>}
    </section>
    </div>
  </section>;
}
