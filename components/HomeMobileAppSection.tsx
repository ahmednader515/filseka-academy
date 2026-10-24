import Image from "next/image";
import Link from "next/link";
import type { ResolvedHomepageCopy } from "@/lib/homepage-copy";

export function HomeMobileAppSection({
  locale,
  copy,
}: {
  locale: "ar" | "en";
  copy: ResolvedHomepageCopy;
}) {
  const features = [
    copy.mobileAppFeature1,
    copy.mobileAppFeature2,
    copy.mobileAppFeature3,
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
    <section
      aria-labelledby="mobile-app-heading"
      className="filseka-mobile-app-section relative isolate overflow-hidden border-y border-white/10 bg-black px-4 py-16 text-white sm:px-6 sm:py-20"
      dir="ltr"
    >
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_18%_70%,rgba(180,0,12,0.2),transparent_42%),radial-gradient(ellipse_at_78%_45%,rgba(80,12,18,0.2),transparent_38%)]" />
      <div className="mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-2 lg:gap-16">
        <div className="relative mx-auto flex min-h-[390px] w-full max-w-[460px] items-center justify-center sm:min-h-[470px]">
          <div aria-hidden="true" className="absolute bottom-8 left-1/2 h-40 w-72 -translate-x-1/2 rounded-full bg-red-700/20 blur-3xl" />

          <div className="absolute left-0 top-[15%] z-10 hidden rounded-2xl border border-white/15 bg-white/[0.08] px-4 py-3 text-sm font-semibold shadow-xl backdrop-blur-md sm:block">
            <span className="me-2 text-red-400">◉</span>{features[0]}
          </div>
          <div className="absolute right-0 top-[28%] z-10 hidden rounded-2xl border border-white/15 bg-white/[0.08] px-4 py-3 text-sm font-semibold shadow-xl backdrop-blur-md sm:block">
            <span className="me-2 text-red-400">♫</span>{features[1]}
          </div>
          <div className="absolute bottom-[18%] left-0 z-10 hidden rounded-2xl border border-white/15 bg-white/[0.08] px-4 py-3 text-sm font-semibold shadow-xl backdrop-blur-md sm:block">
            <span className="me-2 text-red-400">✓</span>{features[2]}
          </div>

          <div className="relative h-[360px] w-[185px] rounded-[2.2rem] border-[5px] border-zinc-700 bg-zinc-950 p-2 shadow-[0_25px_90px_rgba(0,0,0,0.75),0_0_60px_rgba(180,0,12,0.14)] sm:h-[420px] sm:w-[215px]">
            <div className="relative flex h-full flex-col overflow-hidden rounded-[1.65rem] bg-[#101010]">
              <div className="absolute left-1/2 top-0 z-10 h-5 w-20 -translate-x-1/2 rounded-b-xl bg-black" />
              <div className="flex items-center justify-between px-4 pb-4 pt-8">
                <span className="text-[9px] font-bold tracking-[0.18em] text-red-400">{copy.mobileAppScreenLabel}</span>
                <Image src="/logo.png" alt="" width={28} height={28} className="h-7 w-7 rounded-full object-cover" />
              </div>
              <div className="mx-3 overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-red-950 via-[#261012] to-black p-4">
                <span className="inline-flex rounded-full bg-red-600/20 px-2 py-1 text-[8px] font-semibold text-red-300">
                  FILSEKA ACADEMY
                </span>
                <div aria-hidden="true" className="mt-5 flex h-20 items-end gap-1.5">
                  {[34, 52, 42, 72, 58, 86, 63, 76, 48, 67, 40].map((height, index) => (
                    <span key={index} className="flex-1 rounded-t-sm bg-gradient-to-t from-red-800 to-red-400/80" style={{ height: `${height}%` }} />
                  ))}
                </div>
              </div>
              <div className="px-4 pt-5" dir={locale === "ar" ? "rtl" : "ltr"}>
                <p className="text-[9px] font-semibold text-red-400">{copy.mobileAppScreenMeta}</p>
                <h3 className="mt-2 text-sm font-bold leading-6 text-white">{copy.mobileAppScreenTitle}</h3>
                <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/10">
                  <div className="h-full w-2/3 rounded-full bg-red-500" />
                </div>
                <p className="mt-2 text-[9px] text-white/45">65%</p>
              </div>
              <div className="mt-auto flex items-center justify-around border-t border-white/10 px-3 py-4 text-[8px] text-white/55">
                <span className="text-red-400">●</span><span>◉</span><span>▤</span><span>⌂</span>
              </div>
            </div>
          </div>
        </div>

        <div className={locale === "ar" ? "text-right" : "text-left"} dir={locale === "ar" ? "rtl" : "ltr"}>
          <p className="text-xs font-bold tracking-[0.2em] text-red-400">{copy.mobileAppEyebrow}</p>
          <h2 id="mobile-app-heading" className="mt-4 text-3xl font-extrabold leading-tight sm:text-4xl lg:text-[2.75rem]">
            {copy.mobileAppTitle}
          </h2>
          <p className="mt-5 max-w-xl text-base leading-8 text-white/65 sm:text-lg">{copy.mobileAppDescription}</p>
          <ul className="mt-7 space-y-4 text-sm font-medium text-white/85 sm:text-base">
            {features.map((feature) => (
              <li key={feature} className="flex items-center gap-3">
                <span aria-hidden="true" className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-red-600/15 text-sm text-red-400">✓</span>
                {feature}
              </li>
            ))}
          </ul>
          <Link href={appDownloadUrl} className="filseka-primary-button mt-8 inline-flex items-center gap-2 rounded-full px-6 py-3 font-bold text-white transition hover:-translate-y-0.5">
            {copy.mobileAppCta}<span aria-hidden="true">{locale === "ar" ? "←" : "→"}</span>
          </Link>
        </div>
      </div>
    </section>
  );
}
