"use client";

import Link from "next/link";
import { useStoreSplash } from "@/components/StoreSplashProvider";
import { useLocale } from "./LocaleProvider";
import type { ResolvedHomepageCopy } from "@/lib/homepage-copy";
import styles from "./HomeStoreSection.module.css";

export function HomeStoreSection({ sectionTitle, sectionDescription, copy }: {
  sectionTitle: string;
  sectionDescription: string;
  copy: ResolvedHomepageCopy;
}) {
  const { startStoreSplashTransition } = useStoreSplash();
  const ar = useLocale() === "ar";

  function handleStoreClick(event: React.MouseEvent<HTMLAnchorElement>) {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) return;
    event.preventDefault();
    startStoreSplashTransition();
  }

  return (
    <section className={styles.section} dir={ar ? "rtl" : "ltr"} aria-labelledby="home-store-heading">
      <div className={styles.inner}>
        <div className={styles.heading}>
          <div className={styles.intro}>
            <span className={styles.headingIcon} aria-hidden="true"><svg viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M6 10h20l2 19H4ZM11 11V8a5 5 0 0 1 10 0v3" /></svg></span>
            <div>
              <h2 id="home-store-heading">{sectionTitle}</h2>
              <p>{sectionDescription}</p>
            </div>
          </div>
          <Link href="/store" onClick={handleStoreClick} className={styles.browseButton}>
            {copy.storeButton}<span aria-hidden="true">{ar ? "←" : "→"}</span>
          </Link>
        </div>

      </div>
    </section>
  );
}
