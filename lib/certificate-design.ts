import { z } from "zod";

const imageUrl = z.string().max(4000).refine((v) => !v || /^\/(?!\/)/.test(v) || /^https?:\/\//.test(v));
export const certificateDesignSchema = z.object({
  academy: z.string().trim().min(1).max(150),
  title: z.string().trim().min(1).max(150),
  subtitle: z.string().trim().max(150),
  introduction: z.string().trim().min(1).max(300),
  completion: z.string().trim().min(1).max(400),
  signatory: z.string().trim().min(1).max(150),
  signatoryRole: z.string().trim().max(150),
  logoUrl: imageUrl,
  signatureUrl: imageUrl,
  accent: z.string().regex(/^#[0-9a-fA-F]{6}$/),
});
export type CertificateDesign = z.infer<typeof certificateDesignSchema>;
export const DEFAULT_CERTIFICATE_DESIGN: CertificateDesign = {
  academy: "في السكة أكاديمي", title: "شهادة إتمام تدريب", subtitle: "CERTIFICATE OF COMPLETION",
  introduction: "تشهد أكاديمية في السكة بأن", completion: "قد أتمّ بنجاح جميع دروس البرنامج التدريبي",
  signatory: "إدارة الأكاديمية", signatoryRole: "في السكة أكاديمي", logoUrl: "/logo-1.png", signatureUrl: "", accent: "#a3001b",
};
