import Image from "next/image";
import Link from "next/link";
import type { ResolvedHomepageCopy } from "@/lib/homepage-copy";
import { AcademyIcon, type AcademyIconName } from "./AcademyIcon";
import styles from "./HomeMobileAppSection.module.css";

export function HomeMobileAppSection({ locale, copy }: {
  locale: "ar" | "en";
  copy: ResolvedHomepageCopy;
}) {
  const ar = locale === "ar";
  const features: { text: string; icon: AcademyIconName; number: string }[] = [
    { text: copy.mobileAppFeature1, icon: "video", number: "01" },
    { text: copy.mobileAppFeature2, icon: "mic", number: "02" },
    { text: copy.mobileAppFeature3, icon: "graduate", number: "03" },
  ];
  const configuredAppUrl = copy.mobileAppUrl.trim();
  const appUrlIsSafe = configuredAppUrl.startsWith("/")
    ? !configuredAppUrl.startsWith("//")
    : (() => {
        try {
          return new URL(configuredAppUrl).protocol === "https:";
        } catch {
          return false;
        }
      })();
  const appDownloadUrl = appUrlIsSafe ? configuredAppUrl : "/courses";

  return (
    <section aria-labelledby="mobile-app-heading" className={`filseka-mobile-app-section ${styles.section}`} dir="ltr">
      <div className={styles.inner}>
        <div className={styles.copy} dir={ar ? "rtl" : "ltr"}>
          <Image src="/mobile-app-logo-transparent.png" width={280} height={138} alt={ar ? "في السكة أكاديمي" : "Filsaka Academy"} className={styles.logo} />
          <p className={styles.eyebrow}>{copy.mobileAppEyebrow}</p>
          <h2 id="mobile-app-heading">{copy.mobileAppTitle}</h2>
          <span className={styles.underline} aria-hidden="true" />
          <p className={styles.description}>{copy.mobileAppDescription}</p>
          <Link href={appDownloadUrl} className={styles.downloadButton}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 3v12m-5-5 5 5 5-5M4 16v4a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-4" /></svg>
            <span>{copy.mobileAppCta}</span>
          </Link>
        </div>

        <div className={styles.phones}>
          <Image src="/mobile-section.jpeg" width={1600} height={900} sizes="(max-width: 760px) 180vw, 100vw" alt={ar ? "معاينة تطبيق في السكة أكاديمي على آيفون وأندرويد" : "Filsaka Academy app preview on iPhone and Android"} className={styles.phoneArtwork} />
        </div>

        <div className={styles.features} dir={ar ? "rtl" : "ltr"}>
          <p className={styles.featureLabel}>{copy.mobileAppFeatureLabel}</p>
          <ul>
            {features.map((feature) => (
              <li key={feature.number}>
                <span className={styles.featureIcon}><AcademyIcon name={feature.icon} /></span>
                <span>{feature.text}</span>
                <span className={styles.featureNumber} aria-hidden="true">{feature.number}</span>
              </li>
            ))}
          </ul>
          <div className={styles.continue}>
            <span className={styles.statusDot} aria-hidden="true" />
            <span>{copy.mobileAppScreenMeta}</span>
            <AcademyIcon name="broadcast" />
          </div>
        </div>
      </div>
    </section>
  );
}

