"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { useLocale } from "./LocaleProvider";
import { AcademyIcon } from "./AcademyIcon";
import { TeacherPublicCard, type TeacherCardCourse } from "@/components/TeacherPublicCard";
import type { ResolvedHomepageCopy } from "@/lib/homepage-copy";

export type HomeTeacher = {
  id: string;
  name: string;
  teacherSubject: string | null;
  teacherAvatarUrl: string | null;
  createdAt: string;
  courses: TeacherCardCourse[];
  nameEn?: string;
  teacherSubjectEn?: string;
  isDemo?: boolean;
  demoAvatarPosition?: string;
};

/** قسم الصفحة الرئيسية «اختر المعلمين» — يظهر فقط عند تفعيل الميزة من السيرفر */
export function HomeTeachersSection({
  enabled,
  initialTeachers,
  copy,
  variant = "default",
}: {
  enabled: boolean;
  initialTeachers: HomeTeacher[];
  copy: ResolvedHomepageCopy;
  variant?: "default" | "spotlight";
}) {
  const [startIndex, setStartIndex] = useState(0);
  const visible = variant === "spotlight"
    ? [...initialTeachers.slice(startIndex), ...initialTeachers.slice(0, startIndex)]
    : initialTeachers;
  const ar = useLocale() === "ar";
  const track = useRef<HTMLDivElement>(null);

  function move(direction: 1 | -1) {
    const element = track.current;
    if (!element || initialTeachers.length < 2) return;
    const maximum = element.scrollWidth - element.clientWidth;
    if (maximum <= 2) {
      // Cycle the actual profiles when the viewport can show all of them.
      setStartIndex((current) => (current + direction + initialTeachers.length) % initialTeachers.length);
      return;
    }
    const position = Math.abs(element.scrollLeft);
    const sign = ar ? -1 : 1;
    const behavior = window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth";
    if (direction === 1 && position >= maximum - 2) element.scrollTo({ left: 0, behavior });
    else if (direction === -1 && position <= 2) element.scrollTo({ left: maximum * sign, behavior });
    else {
      const cardWidth = element.firstElementChild?.getBoundingClientRect().width ?? 220;
      element.scrollBy({ left: sign * direction * (cardWidth + 12), behavior });
    }
  }

  if (!enabled) return null;

  if (variant === "spotlight") {
    return <section className="academy-trainers academy-neon-section" dir={ar ? "rtl" : "ltr"} aria-labelledby="academy-trainers-title" aria-roledescription="carousel">
      <div className="academy-section-intro">
        <h2 id="academy-trainers-title"><AcademyIcon name="graduate" />{copy.trainersHeading}</h2>
        <span className="academy-heading-stroke" aria-hidden="true" />
        <p>{copy.trainersDescription}</p>
        <Link href="/teachers" className="academy-neon-button">{copy.trainersButton}<span aria-hidden="true">‹</span></Link>
      </div>
      <div className="academy-trainer-carousel">
        <button type="button" disabled={visible.length < 2} className="academy-carousel-arrow" aria-label={copy.trainersPrevious} onClick={() => move(-1)}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={ar ? "m9 5 7 7-7 7" : "m15 5-7 7 7 7"} /></svg></button>
        <div ref={track} className="academy-trainer-track" tabIndex={0} aria-label={copy.trainersTrack} onKeyDown={(event) => {
          if (event.target !== event.currentTarget) return;
          if (event.key === "ArrowRight" || event.key === "ArrowLeft") {
            event.preventDefault();
            move((event.key === "ArrowRight") === ar ? -1 : 1);
          }
        }}>
          {visible.length ? visible.map((teacher) => <TeacherPublicCard key={teacher.id} teacherId={teacher.id} name={!ar && teacher.nameEn ? teacher.nameEn : teacher.name} teacherSubject={!ar && teacher.teacherSubjectEn ? teacher.teacherSubjectEn : teacher.teacherSubject} teacherAvatarUrl={teacher.teacherAvatarUrl} courses={teacher.courses} titleTag="h3" variant="spotlight" isDemo={teacher.isDemo} demoAvatarPosition={teacher.demoAvatarPosition} demoLabel={copy.trainersDemo} />) : <p className="academy-empty-trainers">{copy.teachersEmpty}</p>}
        </div>
        <button type="button" disabled={visible.length < 2} className="academy-carousel-arrow" aria-label={copy.trainersNext} onClick={() => move(1)}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={ar ? "m15 5-7 7 7 7" : "m9 5 7 7-7 7"} /></svg></button>
      </div>
    </section>;
  }

  return (
    <section
      className="home-teachers-hero-blend py-14"
      dir="rtl"
      aria-labelledby="home-teachers-heading"
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="flex flex-col items-center text-center">
          <h2
            id="home-teachers-heading"
            className="text-4xl font-bold leading-tight text-[var(--color-primary)] sm:text-5xl"
          >
            {copy.teachersTitle}
          </h2>
          <svg
            className="mt-3 h-8 w-[17.5rem] text-[var(--color-primary)] sm:h-9 sm:w-[21rem] md:w-[26rem]"
            viewBox="0 0 200 28"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden
          >
            <path
              d="M4 20 Q 100 3 196 20"
              stroke="currentColor"
              strokeWidth="3.5"
              strokeLinecap="round"
            />
          </svg>
          <p className="mt-3 max-w-xl text-sm text-[var(--color-muted)]">
            {copy.teachersSubtitle}
          </p>
        </div>

        {visible.length === 0 ? (
          <p className="mt-14 text-center text-[var(--color-muted)]">
            {copy.teachersEmpty}
          </p>
        ) : (
          <>
            <div className="mt-10 grid justify-items-center gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {visible.map((t) => (
                <TeacherPublicCard
                  key={t.id}
                  teacherId={t.id}
                  name={t.name}
                  teacherSubject={t.teacherSubject}
                  teacherAvatarUrl={t.teacherAvatarUrl}
                  courses={t.courses}
                  titleTag="h3"
                />
              ))}
            </div>
            <div className="mt-8 text-center">
              <Link
                href="/teachers"
                className="text-sm font-semibold text-[var(--color-primary)] underline-offset-4 hover:underline"
              >
                {copy.teachersAllLink} ←
              </Link>
            </div>
          </>
        )}
      </div>
    </section>
  );
}
