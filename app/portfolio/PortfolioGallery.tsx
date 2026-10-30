"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useLocale } from "@/components/LocaleProvider";
import { AcademyIcon } from "@/components/AcademyIcon";
import { PORTFOLIO_CATEGORIES, portfolioMedia, type PortfolioWork } from "@/lib/portfolio-content";
import styles from "./portfolio.module.css";

function normalize(value: string) { return value.normalize("NFKD").replace(/[\u064B-\u065F\u0670\u0640]/g, "").replace(/[أإآ]/g, "ا").toLowerCase().trim(); }

function WorkDialog({ work, onClose, ar }: { work: PortfolioWork; onClose: () => void; ar: boolean }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const title = !ar && work.titleEn ? work.titleEn : work.title;
  const description = !ar && work.descriptionEn ? work.descriptionEn : work.description;
  const media = portfolioMedia(work.videoUrl);
  useEffect(() => {
    dialog.current?.showModal();
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = previous; };
  }, []);
  return <dialog ref={dialog} className={styles.dialog} dir={ar ? "rtl" : "ltr"} aria-labelledby="portfolio-preview-title" onClose={onClose}>
    <div className={styles.dialogHeader}><h2 id="portfolio-preview-title">{title}</h2><button type="button" autoFocus onClick={onClose} aria-label={ar ? "إغلاق العرض" : "Close preview"}>×</button></div>
    {media?.kind === "youtube" ? <iframe className={styles.player} src={media.src} title={title} allow="encrypted-media; picture-in-picture; fullscreen" allowFullScreen referrerPolicy="strict-origin-when-cross-origin" /> : media?.kind === "video" ? <video className={styles.player} src={media.src} controls playsInline preload="metadata" /> : <div className={styles.demoPreview}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={work.imageUrl} alt="" /><span>{ar ? "نموذج تجريبي" : "Demo preview"}</span>
    </div>}
    <div className={styles.dialogCopy}><p>{description}</p>{work.isDemo && <Link href="/courses" className={styles.button}>{ar ? "اكتشف كورسات الأكاديمية" : "Explore academy courses"}<span aria-hidden="true">{ar ? "‹" : "›"}</span></Link>}</div>
  </dialog>;
}

export function PortfolioGallery({ works }: { works: PortfolioWork[] }) {
  const ar = useLocale() === "ar";
  const text = (arabic: string, english: string) => ar ? arabic : english;
  const [category, setCategory] = useState("all");
  const [query, setQuery] = useState("");
  const [limit, setLimit] = useState(12);
  const [selected, setSelected] = useState<PortfolioWork | null>(null);
  const demoMode = works.length > 0 && works.every((work) => work.isDemo);
  const filtered = useMemo(() => works.filter((work) => (category === "all" || work.category === category) && (!normalize(query) || normalize([work.title, work.titleEn, work.description, work.descriptionEn, work.credit, work.creditEn].join(" ")).includes(normalize(query)))), [works, category, query]);
  const stats = [
    { icon: "layers" as const, value: works.length, label: demoMode ? text("نموذج في المعرض", "gallery previews") : text("عمل منشور", "published works") },
    { icon: "video" as const, value: works.filter((work) => work.category === "programs").length, label: text("برامج تلفزيونية", "TV programs") },
    { icon: "mic" as const, value: works.filter((work) => work.category === "podcasts").length, label: text("بودكاست", "podcasts") },
    { icon: "users" as const, value: works.filter((work) => work.category === "projects").length, label: text("مشاريع المتدربين", "student projects") },
  ];

  return <div className={styles.page} dir={ar ? "rtl" : "ltr"}>
    <header className={styles.hero}><Image src="/category-artwork/filmmaking.webp" alt="" fill priority sizes="100vw" className={styles.heroImage} /><div className={styles.heroCopy}>
      <nav className={styles.breadcrumb} aria-label={text("مسار التنقل", "Breadcrumb")}><Link href="/">{text("الرئيسية", "Home")}</Link><span aria-hidden="true">/</span><span aria-current="page">{text("معرض الأعمال", "Portfolio")}</span></nav>
      <div className={styles.heading}><span className={styles.headingIcon}><AcademyIcon name="video" /></span><h1>{ar ? <>معرض <em>أعمال</em> الأكاديمية</> : <>Academy <em>portfolio</em></>}</h1></div>
      <p className={styles.subtitle}>{text("أفكار تتحول لإبداع.. اكتشف برامجنا ومشاريع المتدربين وكواليس الإنتاج.", "Ideas brought to life. Explore our programs, student projects and behind the scenes.")}</p><span className={styles.stroke} aria-hidden="true" />
      {demoMode && <span className={styles.demoLabel}>{text("نماذج توضيحية للمعرض · الأعمال المنشورة تظهر هنا عند إضافتها", "Illustrative gallery previews · Published productions will appear here once added")}</span>}
    </div><div className={styles.stats}>{stats.map((stat) => <div key={stat.icon}><AcademyIcon name={stat.icon} /><span><strong>{stat.value.toLocaleString(ar ? "ar-EG" : "en-US")}</strong><small>{stat.label}</small></span></div>)}</div></header>

    <div className={styles.content}>
      <div className={styles.toolbar}><div className={styles.filters} role="group" aria-label={text("أقسام معرض الأعمال", "Portfolio categories")}><button type="button" aria-pressed={category === "all"} onClick={() => { setCategory("all"); setLimit(12); }}><AcademyIcon name="layers" />{text("الكل", "All")}</button>{PORTFOLIO_CATEGORIES.map((item) => <button key={item.id} type="button" aria-pressed={category === item.id} onClick={() => { setCategory(item.id); setLimit(12); }}><AcademyIcon name={item.icon} />{ar ? item.ar : item.en}</button>)}</div>
      <label className={styles.search}><span className="sr-only">{text("ابحث في الأعمال", "Search portfolio")}</span><input type="search" value={query} onChange={(event) => { setQuery(event.target.value); setLimit(12); }} placeholder={text("ابحث في الأعمال…", "Search our work…")} /><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><circle cx="10" cy="10" r="7" /><path d="m15 15 6 6" /></svg></label></div>
      <p className={styles.results} role="status">{text(`عرض ${Math.min(limit, filtered.length)} من ${filtered.length} عمل${demoMode ? " تجريبي" : ""}`, `Showing ${Math.min(limit, filtered.length)} of ${filtered.length}${demoMode ? " demo" : ""} works`)}</p>
      {filtered.length ? <div className={styles.grid}>{filtered.slice(0, limit).map((work) => {
        const group = PORTFOLIO_CATEGORIES.find((item) => item.id === work.category)!;
        const title = !ar && work.titleEn ? work.titleEn : work.title;
        return <article key={work.id} className={styles.card}><button type="button" className={styles.workButton} onClick={() => setSelected(work)} aria-label={`${work.isDemo ? text("تفاصيل النموذج", "Preview demo") : text("شاهد", "Watch")} — ${title}`} aria-haspopup="dialog"><div className={styles.thumbnail}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={work.imageUrl} alt="" loading="lazy" /><div className={styles.thumbnailShade} />
          {work.isDemo && <span className={styles.demoBadge}>{text("تجريبي", "Demo")}</span>}
          <span className={styles.artTitle}>{title}</span><span className={styles.categoryBadge}>{ar ? group.ar : group.en}</span>
          <span className={styles.play} aria-hidden="true">{work.isDemo ? <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12Z" /><circle cx="12" cy="12" r="3" /></svg> : <svg viewBox="0 0 24 24" fill="currentColor"><path d="m9 5 11 7-11 7Z" /></svg>}</span>
          {work.duration && <span className={styles.duration} dir="ltr">{work.duration}</span>}
        </div><h2>{title}</h2><p>{(!ar && work.creditEn ? work.creditEn : work.credit) || (ar ? group.ar : group.en)}</p></button></article>;
      })}</div> : <div className={styles.empty}><AcademyIcon name="video" /><h2>{text("لا توجد أعمال مطابقة", "No matching works")}</h2><p>{text("جرّب كلمة أخرى أو اعرض جميع الأقسام.", "Try another search or browse all categories.")}</p><button type="button" className={styles.button} onClick={() => { setQuery(""); setCategory("all"); setLimit(12); }}>{text("عرض كل الأعمال", "Show all work")}</button></div>}
      {filtered.length > limit && <button type="button" className={`${styles.button} ${styles.loadMore}`} onClick={() => setLimit((current) => current + 12)}>{text("المزيد من الأعمال", "Load more work")}</button>}
      <div className={styles.cta}><AcademyIcon name="graduate" /><div><h2>{text("إبداعك القادم يبدأ من هنا", "Your next creation starts here")}</h2><p>{text("تعلّم، جرّب، واصنع حكايتك مع في السكة أكاديمي.", "Learn, experiment and tell your story with Filsaka Academy.")}</p></div><Link href="/courses" className={styles.button}>{text("اكتشف الكورسات", "Explore courses")}<span aria-hidden="true">{ar ? "‹" : "›"}</span></Link></div>
    </div>
    {selected && <WorkDialog work={selected} ar={ar} onClose={() => setSelected(null)} />}
  </div>;
}
