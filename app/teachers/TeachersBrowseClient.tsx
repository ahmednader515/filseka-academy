"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import { AcademyIcon, type AcademyIconName } from "@/components/AcademyIcon";
import { useLocale } from "@/components/LocaleProvider";
import type { TeacherCardCourse } from "@/components/TeacherPublicCard";
import styles from "./trainers.module.css";

export type TeacherPublic = {
  id: string;
  name: string;
  teacherSubject: string | null;
  teacherAvatarUrl: string | null;
  courses: TeacherCardCourse[];
  nameEn?: string;
  teacherSubjectEn?: string;
  isDemo?: boolean;
  demoAvatarPosition?: string;
};

function normalizeSearch(value: string) {
  return value.toLowerCase().normalize("NFKD").replace(/[\u064B-\u065F\u0670\u0640]/g, "").replace(/[أإآ]/g, "ا").replace(/\s+/g, " ").trim();
}

function specialtyLabel(subject: string) {
  return subject.replace(/^مدرب(?=$|[\s_ـ:：\-–—])\s*[\s_ـ:：\-–—]*/, "").trim();
}

function specialtyIcon(subject: string): AcademyIconName {
  const label = normalizeSearch(subject);
  if (/بودكاست|podcast/.test(label)) return "broadcast";
  if (/تصوير|filming|production/.test(label)) return "camera";
  if (/محتوى|content/.test(label)) return "video";
  if (/تليفزيون|تمثيل|acting|television/.test(label)) return "video";
  if (/اذاع|صوت|تقديم|radio|voice|present/.test(label)) return "mic";
  return "mentor";
}

export function TeachersBrowseClient({ initialTeachers: records }: { initialTeachers: TeacherPublic[] }) {
  const ar = useLocale() === "ar";
  const initialTeachers = useMemo(() => records.map((teacher) => ({
    ...teacher,
    name: !ar && teacher.nameEn ? teacher.nameEn : teacher.name,
    teacherSubject: specialtyLabel((!ar && teacher.teacherSubjectEn ? teacher.teacherSubjectEn : teacher.teacherSubject) || ""),
  })), [records, ar]);
  const realTeachers = initialTeachers.filter((teacher) => !teacher.isDemo);
  const realSpecialtyCount = new Set(realTeachers.map((teacher) => teacher.teacherSubject).filter(Boolean)).size;
  const [query, setQuery] = useState("");
  const [subjects, setSubjects] = useState<string[]>([]);
  const [availability, setAvailability] = useState("all");
  const [sort, setSort] = useState("name");
  const filterTrack = useRef<HTMLDivElement>(null);
  const filterTrackId = useId();
  const [filterScroll, setFilterScroll] = useState({ previous: false, next: false });
  const specialties = useMemo(() => [...new Set(initialTeachers.map((teacher) => teacher.teacherSubject?.trim()).filter((subject): subject is string => !!subject))].sort((a, b) => a.localeCompare(b, ar ? "ar" : "en")), [initialTeachers, ar]);
  useEffect(() => {
    const track = filterTrack.current;
    if (!track) return;
    const update = () => {
      const position = Math.abs(track.scrollLeft);
      const maximum = track.scrollWidth - track.clientWidth;
      setFilterScroll({ previous: position > 2, next: position < maximum - 2 });
    };
    const frame = requestAnimationFrame(update);
    const observer = new ResizeObserver(update);
    observer.observe(track);
    for (const item of track.children) observer.observe(item);
    track.addEventListener("scroll", update, { passive: true });
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      track.removeEventListener("scroll", update);
    };
  }, [specialties]);

  function moveFilters(direction: 1 | -1) {
    const track = filterTrack.current;
    if (!track) return;
    track.scrollBy({
      left: (ar ? -1 : 1) * direction * Math.max(180, track.clientWidth * 0.75),
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth",
    });
  }
  const courseCount = new Set(initialTeachers.flatMap((teacher) => teacher.courses.map((course) => course.id))).size;
  const filtered = useMemo(() => {
    const search = normalizeSearch(query);
    return initialTeachers.filter((teacher) => {
      const matchesQuery = !search || normalizeSearch([teacher.name, teacher.teacherSubject, ...teacher.courses.map((course) => course.title)].join(" ")).includes(search);
      const matchesSubject = !subjects.length || subjects.includes(teacher.teacherSubject?.trim() || "");
      const matchesCourses = availability === "all" || (availability === "available" ? teacher.courses.length > 0 : teacher.courses.length === 0);
      return matchesQuery && matchesSubject && matchesCourses;
    }).sort((a, b) => (sort === "courses" ? b.courses.length - a.courses.length : 0) || a.name.localeCompare(b.name, ar ? "ar" : "en"));
  }, [initialTeachers, query, subjects, availability, sort, ar]);

  function reset() { setQuery(""); setSubjects([]); setAvailability("all"); setSort("name"); }
  function toggleSubject(subject: string) { setSubjects((current) => current.includes(subject) ? current.filter((item) => item !== subject) : [...current, subject]); }

  return <div className={styles.page} dir={ar ? "rtl" : "ltr"}>
    <header className={styles.hero}>
      <Image src="/background.png" alt="" fill priority sizes="100vw" className={styles.heroImage} />
      <div className={styles.heroContent}>
        <nav className={styles.breadcrumb} aria-label={ar ? "مسار التنقل" : "Breadcrumb"}><Link href="/">{ar ? "الرئيسية" : "Home"}</Link><span aria-hidden="true">/</span><span aria-current="page">{ar ? "المدربون" : "Trainers"}</span></nav>
        <div className={styles.heading}><span className={styles.headingIcon}><AcademyIcon name="users" /></span><div><h1>{ar ? "المدربون" : "Our trainers"}</h1><span className={styles.underline} aria-hidden="true" /></div></div>
        <p className={styles.subtitle}>{ar ? "خبرات تلهمك، ومهارات تصنع مستقبلك في الإعلام وصناعة المحتوى." : "Learn from experienced voices. Build your future in media and content creation."}</p>
        <div className={styles.stats}>
          {[{ value: realTeachers.length, label: ar ? "مدرب في الأكاديمية" : "academy trainers", icon: "users" as const }, { value: courseCount, label: ar ? "كورس متاح" : "available courses", icon: "layers" as const }, { value: realSpecialtyCount, label: ar ? "تخصص تدريبي" : "training specialties", icon: "mic" as const }].map((stat) => <div key={stat.icon}><AcademyIcon name={stat.icon} /><span><strong>{stat.value.toLocaleString(ar ? "ar-EG" : "en-US")}</strong><small>{stat.label}</small></span></div>)}
        </div>
      </div>
    </header>

    <div className={styles.directory}>
      <div className={styles.toolbar}>
        <div className={styles.filterCarousel}>
          <button type="button" className={styles.filterArrow} aria-label={ar ? "التخصصات السابقة" : "Previous specialties"} aria-controls={filterTrackId} disabled={!filterScroll.previous} onClick={() => moveFilters(-1)}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={ar ? "m9 5 7 7-7 7" : "m15 5-7 7 7 7"} /></svg></button>
        <div ref={filterTrack} id={filterTrackId} className={styles.tabs} role="group" aria-label={ar ? "تخصصات المدربين" : "Trainer specialties"}>
          <button type="button" aria-pressed={!subjects.length} onClick={() => setSubjects([])}><AcademyIcon name="users" />{ar ? "الكل" : "All"}</button>
          {specialties.map((subject) => <button key={subject} type="button" aria-pressed={subjects.includes(subject)} onClick={() => toggleSubject(subject)}><AcademyIcon name={specialtyIcon(subject)} />{subject}</button>)}
        </div>
          <button type="button" className={styles.filterArrow} aria-label={ar ? "التخصصات التالية" : "Next specialties"} aria-controls={filterTrackId} disabled={!filterScroll.next} onClick={() => moveFilters(1)}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={ar ? "m15 5-7 7 7 7" : "m9 5 7 7-7 7"} /></svg></button>
        </div>
        <label className={styles.search}><span className="sr-only">{ar ? "ابحث عن مدرب أو تخصص أو كورس" : "Search trainers, specialties or courses"}</span><input type="search" placeholder={ar ? "ابحث عن مدرب…" : "Search trainers…"} value={query} onChange={(event) => setQuery(event.target.value)} /><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><circle cx="10" cy="10" r="7" /><path d="m15 15 6 6" /></svg></label>
      </div>

      <div className={styles.layout}>
        <aside className={styles.filters} aria-labelledby="trainer-filters-title">
          <h2 id="trainer-filters-title"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><path d="M3 6h18M3 12h18M3 18h18M7 3v6m10 0v6M9 15v6" /></svg>{ar ? "تصفية النتائج" : "Filter results"}</h2>
          {!!specialties.length && <fieldset><legend>{ar ? "مجال التخصص" : "Specialty"}</legend>{specialties.map((subject) => <label key={subject}><input type="checkbox" checked={subjects.includes(subject)} onChange={() => toggleSubject(subject)} /><span>{subject}</span></label>)}</fieldset>}
          <fieldset><legend>{ar ? "الكورسات" : "Courses"}</legend>{[{ value: "all", label: ar ? "جميع المدربين" : "All trainers" }, { value: "available", label: ar ? "لديهم كورسات متاحة" : "With available courses" }, { value: "none", label: ar ? "بدون كورسات حاليًا" : "No courses yet" }].map((option) => <label key={option.value}><input type="radio" name="trainer-courses" value={option.value} checked={availability === option.value} onChange={() => setAvailability(option.value)} /><span>{option.label}</span></label>)}</fieldset>
          <button type="button" className={styles.reset} onClick={reset}><span aria-hidden="true">↻</span>{ar ? "إعادة تعيين" : "Reset filters"}</button>
        </aside>

        <section className={styles.results} aria-label={ar ? "مدربو الأكاديمية" : "Academy trainers"}>
          <div className={styles.resultsBar}><p role="status">{ar ? `عرض ${filtered.length} من ${initialTeachers.length} مدرب` : `Showing ${filtered.length} of ${initialTeachers.length} trainers`}</p><label>{ar ? "ترتيب حسب:" : "Sort by:"}<select value={sort} onChange={(event) => setSort(event.target.value)}><option value="name">{ar ? "الاسم" : "Name"}</option><option value="courses">{ar ? "الأكثر كورسات" : "Most courses"}</option></select></label></div>
          {filtered.length ? <div className={styles.grid}>{filtered.map((teacher) => <article key={teacher.id} className={styles.card}>
            <div className={styles.portrait}>
              {teacher.isDemo && teacher.demoAvatarPosition ? <span className={styles.demoPhoto} style={{ backgroundImage: `url("${teacher.teacherAvatarUrl}")`, backgroundPosition: teacher.demoAvatarPosition }} aria-hidden="true" /> : <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={teacher.teacherAvatarUrl || "/teacher-avatar.svg"} alt="" loading="lazy" />
              </>}
              {teacher.isDemo && <span className={styles.demoBadge}>{ar ? "تجريبي" : "Demo"}</span>}
              <div className={styles.identity}><h2>{teacher.name}</h2><p>{teacher.teacherSubject || (ar ? "مدرب بالأكاديمية" : "Academy trainer")}</p></div>
            </div>
            <div className={styles.cardBody}>
              <div className={styles.courseTags}>{teacher.courses.slice(0, 2).map((course) => <Link key={course.id} href={`/courses/${encodeURIComponent(course.slug)}`}>{course.title}</Link>)}{!teacher.courses.length && <span>{ar ? "لا توجد كورسات متاحة حاليًا" : "No courses available yet"}</span>}</div>
              <div className={styles.cardCount}><AcademyIcon name="book" /><strong>{teacher.courses.length}</strong><span>{ar ? "كورس متاح" : "available courses"}</span></div>
              {teacher.isDemo ? <span className={styles.demoNotice}>{ar ? "ملف تجريبي" : "Demo profile"}</span> : <Link className={styles.profileLink} href={`/courses?teacher=${encodeURIComponent(teacher.id)}`}>{ar ? "عرض كورسات المدرب" : "Explore trainer courses"}<span aria-hidden="true">{ar ? "‹" : "›"}</span></Link>}
            </div>
          </article>)}</div> : <div className={styles.empty}><AcademyIcon name="users" /><h2>{initialTeachers.length ? (ar ? "لا توجد نتائج مطابقة" : "No matching trainers") : (ar ? "تعرّف على مدربينا قريبًا" : "Meet our trainers soon")}</h2><p>{initialTeachers.length ? (ar ? "جرّب البحث بكلمات أخرى أو أعد تعيين التصفية." : "Try another search or reset your filters.") : (ar ? "ستظهر هنا ملفات مدربي الأكاديمية وكورساتهم عند إضافتها." : "Academy trainers and their courses will appear here once added.")}</p>{!!initialTeachers.length && <button type="button" onClick={reset}>{ar ? "عرض جميع المدربين" : "Show all trainers"}</button>}</div>}
        </section>
      </div>
    </div>
  </div>;
}
