import Image from "next/image";

export function HomeHeroTemplateThree({
  title,
  subtitle,
  phoneImageUrl,
  phoneBgColor,
  badge1ImageUrl,
  badge1Link,
  badge2ImageUrl,
  badge2Link,
  badge1Fallback,
  badge2Fallback,
}: {
  title: string;
  subtitle: string;
  phoneImageUrl: string | null;
  phoneBgColor: string;
  badge1ImageUrl: string | null;
  badge1Link: string | null;
  badge2ImageUrl: string | null;
  badge2Link: string | null;
  badge1Fallback: string;
  badge2Fallback: string;
}) {
  const renderBadge = (imageUrl: string | null, href: string | null, fallbackLabel: string) => {
    const content = imageUrl ? (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={imageUrl} alt={fallbackLabel} className="h-9 w-auto object-contain" loading="lazy" decoding="async" />
    ) : (
      <span className="text-sm font-semibold">{fallbackLabel}</span>
    );
    if (href?.trim()) {
      return (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex min-h-11 items-center justify-center rounded-xl border border-black/15 bg-black px-4 text-white transition hover:opacity-90"
        >
          {content}
        </a>
      );
    }
    return (
      <div className="inline-flex min-h-11 items-center justify-center rounded-xl border border-black/15 bg-black px-4 text-white">
        {content}
      </div>
    );
  };

  return (
    <section className="filseka-hero relative isolate min-h-screen overflow-hidden border-b border-white/10 bg-black px-4 pt-14 text-white sm:px-6">
      <video
        className="absolute inset-0 -z-20 h-full w-full bg-black object-contain"
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
        poster="/logo.png"
        aria-hidden="true"
      >
        <source src="/logo.MP4" type="video/mp4" />
      </video>
      <div className="filseka-hero-shade absolute inset-0 -z-10" aria-hidden="true" />
      <div className="mx-auto flex min-h-[calc(100vh-3.5rem)] w-full max-w-6xl flex-col">
        <div className="mt-32 text-center sm:mt-36">
          <h1 className="text-4xl font-extrabold text-white sm:text-6xl">{title}</h1>
          <p className="mt-3 text-lg font-semibold text-red-200 sm:text-2xl">{subtitle}</p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-2 sm:gap-3">
            {renderBadge(badge1ImageUrl, badge1Link, badge1Fallback)}
            {renderBadge(badge2ImageUrl, badge2Link, badge2Fallback)}
          </div>
        </div>

        <div className="relative mx-auto mt-auto h-[430px] w-full max-w-[540px] sm:h-[560px]">
          <div
            className="absolute inset-x-2 bottom-0 h-72 rounded-t-full sm:inset-x-0 sm:h-80"
            style={{ backgroundColor: phoneBgColor }}
            aria-hidden
          />
          <div className="absolute inset-x-0 bottom-0 flex justify-center">
            {phoneImageUrl?.trim() ? (
              <Image
                src={phoneImageUrl}
                alt="صورة تطبيق المنصة"
                width={320}
                height={530}
                priority
                fetchPriority="high"
                quality={90}
                sizes="(max-width: 640px) 195px, 235px"
                className="h-[400px] w-auto object-contain drop-shadow-[0_20px_50px_rgba(15,23,42,0.35)] sm:h-[530px]"
              />
            ) : (
              <div className="mb-6 flex h-[360px] w-[195px] items-center justify-center rounded-[2rem] border-4 border-slate-300 bg-white text-xs font-semibold text-slate-500 shadow-2xl sm:h-[450px] sm:w-[235px]">
                أضف صورة الهاتف
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
