import Image from "next/image";
import Link from "next/link";
import { AcademyIcon, type AcademyIconName } from "@/components/AcademyIcon";
import { getCategories } from "@/lib/db";
import { getAcademyMilestones } from "@/lib/academy-milestones";
import { getLocaleFromCookie } from "@/lib/i18n/server";
import { pickLocalizedText } from "@/lib/i18n/localized-field";
import { AboutIcon } from "./AboutIcon";
import styles from "./about.module.css";

export const revalidate = 60;
export async function generateMetadata() {
  const ar = (await getLocaleFromCookie()) === "ar";
  return { title: ar ? "من نحن | في السكة أكاديمي" : "About us | Filsaka Academy", description: ar ? "تعرّف على في السكة أكاديمي، رؤيتنا ورسالتنا في التدريب الإعلامي والبودكاست وصناعة المحتوى." : "Discover Filsaka Academy, our vision and our approach to media training, podcasts and content creation." };
}

function categoryVisual(slug: string, title: string): { image: string; icon: AcademyIconName } {
  const value = `${slug} ${title}`.toLowerCase();
  if (/podcast|بودكاست/.test(value)) return { image: "/category-artwork/podcasting.webp", icon: "mic" };
  if (/present|إذاع|اذاع|تقديم/.test(value)) return { image: "/category-artwork/presenting.webp", icon: "broadcast" };
  if (/act|تمثيل/.test(value)) return { image: "/category-artwork/acting.webp", icon: "video" };
  if (/edit|content|مونتاج|محتوى/.test(value)) return { image: "/category-artwork/content-editing.webp", icon: "layers" };
  if (/film|تصوير|إنتاج|انتاج/.test(value)) return { image: "/category-artwork/filmmaking.webp", icon: "camera" };
  return { image: "/category-artwork/general.webp", icon: "book" };
}

export default async function AboutPage() {
  const [locale, categories] = await Promise.all([getLocaleFromCookie(), getCategories().catch(() => [])]);
  const ar = locale === "ar";
  const text = (arabic: string, english: string) => ar ? arabic : english;
  const values: { icon: AcademyIconName; title: string }[] = [
    { icon: "star", title: text("الاحترافية", "Professionalism") },
    { icon: "video", title: text("التطبيق العملي", "Hands-on practice") },
    { icon: "users", title: text("دعم المواهب", "Supporting talent") },
    { icon: "layers", title: text("الإبداع", "Creativity") },
    { icon: "book", title: text("التعلم المستمر", "Lifelong learning") },
  ];
  const offerings = categories.slice(0, 6).map((category) => {
    const row = category as typeof category & { nameAr?: string | null; imageUrl?: string | null };
    const title = pickLocalizedText(locale, row.nameAr ?? category.name_ar, category.name);
    const visual = categoryVisual(category.slug, title);
    return { id: category.id, title, image: row.imageUrl || category.image_url || visual.image, icon: visual.icon, href: `/courses?category=${encodeURIComponent(category.slug)}` };
  });
  const milestones = getAcademyMilestones(locale);

  return <div className={styles.page} dir={ar ? "rtl" : "ltr"}>
    <header className={styles.hero}><Image src="/background.png" alt="" fill priority sizes="100vw" className={styles.heroImage} /><div className={styles.heroCopy}>
      <nav className={styles.breadcrumb} aria-label={text("مسار التنقل", "Breadcrumb")}><Link href="/">{text("الرئيسية", "Home")}</Link><span aria-hidden="true">/</span><span aria-current="page">{text("من نحن", "About us")}</span></nav>
      <div className={styles.heading}><span className={styles.headingIcon}><AcademyIcon name="users" /></span><div><h1>{text("من نحن", "About us")}</h1><span className={styles.stroke} aria-hidden="true" /></div></div>
      <p>{text("في السكة أكاديمي.. مساحة للتعلّم والإبداع، وخطوتك نحو عالم الإعلام وصناعة المحتوى.", "Filsaka Academy. A place to learn, create and take your next step into media and content production.")}</p>
    </div></header>

    <div className={styles.content}>
      <section className={styles.overview} aria-label={text("تعرّف على الأكاديمية", "Discover the academy")}>
        <div className={styles.story}><h2>{text("عن الأكاديمية", "Our story")}</h2><p>{text("في السكة أكاديمي منصة للتعلّم والتدريب في مجالات الإعلام والإذاعة والبودكاست وصناعة المحتوى.", "Filsaka Academy is a learning and training platform for media, broadcasting, podcasts and content creation.")}</p><p>{text("نجمع المعرفة بالممارسة، ونساعدك على تطوير مهاراتك خطوة بخطوة من خلال الكورسات وتجارب التعلّم التي تقدمها الأكاديمية.", "We bring knowledge and practice together, helping you build your skills step by step through the academy’s courses and learning experiences.")}</p><Link href="/teachers" className={styles.textLink}>{text("تعرّف على مدربينا", "Meet our trainers")}<span aria-hidden="true">{ar ? "←" : "→"}</span></Link></div>
        <article className={styles.mission}><h2><span><AboutIcon name="target" /></span>{text("رسالتنا", "Our mission")}</h2><p>{text("تقديم تجربة تعلّم تربط المعرفة بالممارسة، وتمنح المواهب أدوات تساعدها على التعبير عن أفكارها وتطوير مهاراتها في الإعلام والإنتاج.", "To connect knowledge with practice and give emerging talent the tools to express ideas and develop skills in media and production.")}</p></article>
        <article className={styles.vision}><h2><span><AboutIcon name="eye" /></span>{text("رؤيتنا", "Our vision")}</h2><p>{text("أن نكون مساحة ملهمة للتدريب والإبداع، تسهم في تأهيل جيل قادر على تقديم محتوى مؤثر وصناعة حكايات تستحق أن تُسمع وتُشاهد.", "To be an inspiring space for learning and creativity, helping a new generation make meaningful content and tell stories worth hearing and watching.")}</p></article>
        <div className={styles.brandArt} aria-hidden="true"><div className={styles.brandPlaque}><Image src="/logo-1.png" width={440} height={220} alt="" sizes="260px" /></div><div className={styles.brandBase} /><span>F I L S A K A &nbsp; A C A D E M Y</span></div>
      </section>

      <section className={styles.values} aria-labelledby="about-values-title"><h2 id="about-values-title"><AboutIcon name="diamond" />{text("قيمنا", "Our values")}</h2><ul>{values.map((value) => <li key={value.icon}><AcademyIcon name={value.icon} /><span>{value.title}</span></li>)}</ul></section>

      <section className={styles.milestones} aria-label={text("الأكاديمية في أرقام", "Academy milestones")}>{milestones.map((milestone) => <div key={milestone.id}><AcademyIcon name={milestone.academyIcon} /><span><strong dir="ltr">{milestone.title}</strong><small>{milestone.description}</small></span></div>)}</section>

      <section className={styles.offerings} aria-labelledby="about-offerings-title"><div className={styles.sectionHeading}><div><h2 id="about-offerings-title">{text("ماذا نقدم؟", "What we offer")}</h2><p>{text("اكتشف مجالات التعلّم المتاحة في الأكاديمية.", "Explore the academy’s available learning areas.")}</p></div><Link href="/courses" className={styles.textLink}>{text("جميع الكورسات", "All courses")}<span aria-hidden="true">{ar ? "←" : "→"}</span></Link></div>
        {offerings.length ? <div className={styles.offeringGrid}>{offerings.map((offering) => <Link key={offering.id} href={offering.href} className={styles.offeringCard}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={offering.image} alt="" loading="lazy" /><span className={styles.offeringShade} /><div><span className={styles.offeringIcon}><AcademyIcon name={offering.icon} /></span><h3>{offering.title}</h3></div><span className={styles.offeringArrow} aria-hidden="true">{ar ? "↖" : "↗"}</span>
        </Link>)}</div> : <div className={styles.empty}><AcademyIcon name="book" /><p>{text("ستظهر هنا مسارات التعلّم عند إضافة أقسام الكورسات.", "Learning areas will appear here as course categories are added.")}</p><Link href="/courses" className={styles.button}>{text("تصفح الكورسات", "Explore courses")}</Link></div>}
      </section>

      <section className={styles.cta} aria-labelledby="about-cta-title"><span className={styles.ctaIcon}><AcademyIcon name="graduate" /></span><div><h2 id="about-cta-title">{text("خد خطوتك.. وابدأ حكايتك", "Take your next step. Start your story.")}</h2><p>{text("اختر مجالك، أو تواصل معنا لنساعدك في معرفة المزيد عن الأكاديمية.", "Choose your field or get in touch to learn more about the academy.")}</p></div><div className={styles.ctaActions}><Link href="/courses" className={styles.button}>{text("اكتشف الكورسات", "Explore courses")}<span aria-hidden="true">{ar ? "‹" : "›"}</span></Link><Link href="/contact" className={styles.secondaryButton}>{text("تواصل معنا", "Contact us")}</Link></div></section>
    </div>
  </div>;
}
