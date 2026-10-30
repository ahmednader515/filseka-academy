"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { AcademyIcon } from "./AcademyIcon";
import type { ResolvedHomepageCopy } from "@/lib/homepage-copy";

export type HomeCourseCategory = { slug: string; name: string; imageUrl: string | null; count: number };

function nearestSlide(positions: number[], scrollLeft: number) {
  const position = Math.abs(scrollLeft);
  return positions.reduce((best, offset, index) =>
    Math.abs(offset - position) < Math.abs(positions[best] - position) ? index : best, 0);
}

export function HomeContentCategories({ locale, categories, copy }: {
  copy: ResolvedHomepageCopy;
  locale: "ar" | "en";
  categories: HomeCourseCategory[];
}) {
  const ar = locale === "ar";
  const track = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [slidePositions, setSlidePositions] = useState<number[]>([0]);

  useEffect(() => {
    const element = track.current;
    if (!element) return;
    const observer = new ResizeObserver(() => {
      const maximum = Math.max(0, element.scrollWidth - element.clientWidth);
      const cards = [...element.querySelectorAll<HTMLElement>(".academy-category-card")];
      const first = cards[0]?.getBoundingClientRect();
      const positions = [0];
      if (first && maximum > 2) {
        for (const card of cards.slice(1)) {
          const rect = card.getBoundingClientRect();
          const offset = Math.min(maximum, Math.abs(ar ? first.right - rect.right : rect.left - first.left));
          if (offset - positions[positions.length - 1] > 2) positions.push(offset);
        }
      }
      setSlidePositions(positions);
      setActiveIndex(nearestSlide(positions, element.scrollLeft));
    });
    observer.observe(element);
    for (const card of element.children) observer.observe(card);
    return () => observer.disconnect();
  }, [ar, categories]);

  function move(direction: 1 | -1) {
    const element = track.current;
    if (!element || slidePositions.length < 2) return;
    const current = nearestSlide(slidePositions, element.scrollLeft);
    const next = (current + direction + slidePositions.length) % slidePositions.length;
    const sign = ar ? -1 : 1;
    const behavior = window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth";
    element.scrollTo({ left: sign * slidePositions[next], behavior });
  }

  return <section className="academy-content-topics academy-neon-section" dir={ar ? "rtl" : "ltr"} aria-labelledby="academy-content-title" aria-roledescription="carousel">
    <div className="academy-categories-heading">
      <div>
        <h2 id="academy-content-title"><AcademyIcon name="layers" />{copy.categoriesTitle}</h2>
        <p>{copy.categoriesDescription}</p>
      </div>
      <div className="academy-category-controls">
        <Link href="/courses" className="academy-neon-button">{copy.categoriesButton}<span aria-hidden="true">{ar ? "←" : "→"}</span></Link>
        <div className="academy-category-arrows">
          <button type="button" className="academy-carousel-arrow" aria-controls="academy-category-track" aria-label={copy.categoriesPrevious} disabled={categories.length < 2} onClick={() => move(-1)}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d={ar ? "m9 5 7 7-7 7" : "m15 5-7 7 7 7"} /></svg></button>
          <button type="button" className="academy-carousel-arrow" aria-controls="academy-category-track" aria-label={copy.categoriesNext} disabled={categories.length < 2} onClick={() => move(1)}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d={ar ? "m15 5-7 7 7 7" : "m9 5 7 7-7 7"} /></svg></button>
        </div>
      </div>
    </div>
    <div ref={track} id="academy-category-track" className="academy-category-track" tabIndex={0} aria-label={copy.categoriesTrack} onScroll={() => {
      const element = track.current;
      if (!element) return;
      setActiveIndex(nearestSlide(slidePositions, element.scrollLeft));
    }} onKeyDown={(event) => {
      if (event.target !== event.currentTarget) return;
      if (event.key === "ArrowRight" || event.key === "ArrowLeft") {
        event.preventDefault();
        move((event.key === "ArrowRight") === ar ? -1 : 1);
      }
    }}>
      {categories.map((category, index) => <Link key={category.slug} href={`/courses?category=${encodeURIComponent(category.slug)}`} className="academy-category-card" aria-label={`${category.name} — ${index + 1} / ${categories.length}`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={category.imageUrl || "/background.png"} alt="" loading="lazy" />
        <div className="academy-category-copy">
          <span className="academy-category-count">{copy.categoriesCount.replace("{count}", String(category.count))}</span>
          <h3>{category.name}</h3>
          <span className="academy-category-action">{copy.categoriesAction}<span aria-hidden="true">{ar ? "↖" : "↗"}</span></span>
        </div>
      </Link>)}
      {categories.length === 0 && <p className="academy-categories-empty">{copy.categoriesEmpty}</p>}
    </div>
    {slidePositions.length > 1 && <div className="academy-category-progress" aria-hidden="true">{slidePositions.map((position, index) => <span key={position} data-active={index === activeIndex} />)}</div>}
  </section>;
}
