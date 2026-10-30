import Image from "next/image";
import Link from "next/link";
import { AcademyIcon, type AcademyIconName } from "./AcademyIcon";
import type { ResolvedHomepageCopy } from "@/lib/homepage-copy";

export function HomeMarketplaceHero({ title, subtitle, ctaLabel, eyebrow, locale, copy }: {
  copy: ResolvedHomepageCopy;
  title: string;
  subtitle: string;
  ctaLabel: string;
  eyebrow: string;
  locale: "ar" | "en";
}) {
  const ar = locale === "ar";
  const features: { icon: AcademyIconName; label: string }[] = [
    { icon: "broadcast", label: copy.heroPodcast },
    { icon: "camera", label: copy.heroFilming },
    { icon: "mic", label: copy.heroTraining },
    { icon: "video", label: copy.heroContent },
  ];
  return (
    <section className="academy-studio-hero academy-neon-section" aria-label={title}>
      <Image src="/background.png" alt="" fill priority sizes="100vw" className="academy-studio-scene" />
      <div className="academy-studio-shade" aria-hidden="true" />
      <div className="academy-hero-copy" dir={ar ? "rtl" : "ltr"}>
        <p className="sr-only">{eyebrow}</p>
        <h1>{ar && title === "في السكة أكاديمي" ? <>في السكة <span>أكاديمي</span></> : title}</h1>
        <p className="academy-hero-subtitle">{subtitle}</p>
        <span className="academy-heading-stroke" aria-hidden="true" />
        <nav className="academy-hero-features" aria-label={ctaLabel}>
          {features.map((feature) => <Link key={feature.label} href="/courses"><AcademyIcon name={feature.icon} /><span>{feature.label}</span></Link>)}
        </nav>
      </div>
      <div className="academy-hero-microphone" aria-hidden="true" />
    </section>
  );
}
