"use client";

import { SubscriptionPlanCard, type SubscriptionPlanCardData } from "@/components/SubscriptionPlanCard";
import { AcademyIcon } from "./AcademyIcon";
import type { ResolvedHomepageCopy } from "@/lib/homepage-copy";
import styles from "./HomeSubscriptionsSection.module.css";

export function HomeSubscriptionsSection({
  enabled, plans, isStudent, isLoggedIn, studentPlatformSubscription, copy,
}: {
  enabled: boolean;
  plans: SubscriptionPlanCardData[];
  isStudent: boolean;
  isLoggedIn: boolean;
  studentPlatformSubscription?: { active: boolean; expiresAtIso: string | null } | null;
  copy: ResolvedHomepageCopy;
}) {
  if (!enabled) return null;

  return (
    <section className={styles.section} dir="rtl" aria-labelledby="home-subscriptions-heading">
      <div className={styles.inner}>
        <div className={styles.heading}>
          <span className={styles.headingIcon}><AcademyIcon name="layers" /></span>
          <div>
            <h2 id="home-subscriptions-heading">{copy.subscriptionsTitle}</h2>
            <p>{copy.subscriptionsSubtitle}</p>
          </div>
          <span className={styles.headingLine} aria-hidden="true" />
        </div>
        {plans.length === 0 ? (
          <p className={styles.empty}>{copy.subscriptionsEmpty}</p>
        ) : (
          <div className={styles.plans}>
            {plans.map((plan) => (
              <SubscriptionPlanCard
                homepageCopy={copy}
                key={plan.id}
                plan={plan}
                isStudent={isStudent}
                isLoggedIn={isLoggedIn}
                hasActivePlatformSubscription={!!studentPlatformSubscription?.active}
                activePlatformSubscriptionExpiresAtIso={studentPlatformSubscription?.expiresAtIso ?? null}
                variant="academy"
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
