import type { PlatformDetailsItem } from "@/lib/types";
import type { AcademyIconName } from "@/components/AcademyIcon";

// The same published academy milestones are used on the homepage and About page.
export function getAcademyMilestones(locale: "ar" | "en"): (PlatformDetailsItem & { academyIcon: AcademyIconName })[] {
  const ar = locale === "ar";
  return [
    { id: "training-hours", title: "+100", description: ar ? "ساعة محتوي تدريبي" : "Hours of training content", presetIcon: "book" as const, academyIcon: "clock" as const },
    { id: "content-audience", title: "+500k", description: ar ? "مهتمون بمحتوي الأكاديمية" : "People interested in academy content", presetIcon: "users" as const, academyIcon: "users" as const },
    { id: "podcast-productions", title: "+30", description: ar ? "برنامج بودكاست تم انتاجه" : "Podcast programs produced", presetIcon: "chat" as const, academyIcon: "mic" as const },
    { id: "professional-graduates", title: "+50", description: ar ? "متدرب أصبح اعلاميا محترفا" : "Trainees who became media professionals", presetIcon: "certificate" as const, academyIcon: "graduate" as const },
  ].map((item) => ({ ...item, iconType: "preset" as const, customIconUrl: null }));
}
