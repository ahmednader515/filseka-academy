"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

export function CourseCarousel({
  children,
  locale,
}: {
  children: ReactNode;
  locale: "ar" | "en";
}) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [hasOverflow, setHasOverflow] = useState(false);
  const rtl = locale === "ar";

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    const updateOverflow = () => setHasOverflow(track.scrollWidth > track.clientWidth + 1);
    updateOverflow();
    const observer = new ResizeObserver(updateOverflow);
    observer.observe(track);
    return () => observer.disconnect();
  }, [children]);

  const scroll = (direction: "previous" | "next") => {
    const track = trackRef.current;
    if (!track) return;
    // Keep each control aligned with the physical direction its chevron points.
    const towardRight = direction === "next";
    track.scrollBy({
      left: (towardRight ? 1 : -1) * track.clientWidth * 0.85,
      behavior: "smooth",
    });
  };

  return (
    <div className="filseka-carousel-shell relative mt-6" dir={rtl ? "rtl" : "ltr"}>
      <button
        type="button"
        className={`filseka-carousel-arrow filseka-carousel-arrow-previous ${hasOverflow ? "" : "invisible"}`}
        onClick={() => scroll("previous")}
        tabIndex={hasOverflow ? 0 : -1}
        aria-label={rtl ? "الدورات السابقة" : "Previous courses"}
      >
        <span aria-hidden="true" dir="ltr">‹</span>
      </button>
      <div ref={trackRef} className="filseka-course-track flex snap-x snap-mandatory gap-4 overflow-x-auto pb-4">
        {children}
      </div>
      <button
        type="button"
        className={`filseka-carousel-arrow filseka-carousel-arrow-next ${hasOverflow ? "" : "invisible"}`}
        onClick={() => scroll("next")}
        tabIndex={hasOverflow ? 0 : -1}
        aria-label={rtl ? "الدورات التالية" : "Next courses"}
      >
        <span aria-hidden="true" dir="ltr">›</span>
      </button>
    </div>
  );
}
