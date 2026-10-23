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
    const updateOverflow = () => {
      const visibleCards = window.matchMedia("(min-width: 1024px)").matches
        ? 3
        : window.matchMedia("(min-width: 640px)").matches
          ? 2
          : 1;
      const gap = Number.parseFloat(window.getComputedStyle(track).columnGap) || 0;
      const cardWidth = (track.clientWidth - gap * (visibleCards - 1)) / visibleCards;
      track.style.setProperty("--filseka-carousel-card-basis", `${cardWidth}px`);
      setHasOverflow(track.scrollWidth > track.clientWidth + 1);
    };
    updateOverflow();
    const observer = new ResizeObserver(updateOverflow);
    observer.observe(track);
    return () => observer.disconnect();
  }, [children]);

  useEffect(() => {
    const track = trackRef.current;
    if (!track || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let cardIndex = 0;
    const advance = () => {
      const cards = Array.from(track.children) as HTMLElement[];
      const visibleCards = window.matchMedia("(min-width: 1024px)").matches
        ? 3
        : window.matchMedia("(min-width: 640px)").matches
          ? 2
          : 1;
      if (cards.length <= visibleCards || document.hidden || track.matches(":hover, :focus-within")) return;

      cardIndex = cardIndex >= cards.length - visibleCards
        ? 0
        : Math.min(cardIndex + visibleCards, cards.length - visibleCards);
      const trackBounds = track.getBoundingClientRect();
      const cardBounds = cards[cardIndex].getBoundingClientRect();
      const horizontalOffset = rtl
        ? cardBounds.right - trackBounds.right
        : cardBounds.left - trackBounds.left;
      track.scrollBy({ left: horizontalOffset, behavior: "smooth" });
    };
    const timer = window.setInterval(advance, 5000);
    return () => window.clearInterval(timer);
  }, [children, rtl]);

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
        aria-label={rtl ? "الكورسات السابقة" : "Previous courses"}
      >
        <span aria-hidden="true" dir="ltr">‹</span>
      </button>
      <div ref={trackRef} className="filseka-course-track filseka-course-track-three-cards flex snap-x snap-mandatory gap-4 overflow-x-auto pb-4">
        {children}
      </div>
      <button
        type="button"
        className={`filseka-carousel-arrow filseka-carousel-arrow-next ${hasOverflow ? "" : "invisible"}`}
        onClick={() => scroll("next")}
        tabIndex={hasOverflow ? 0 : -1}
        aria-label={rtl ? "الكورسات التالية" : "Next courses"}
      >
        <span aria-hidden="true" dir="ltr">›</span>
      </button>
    </div>
  );
}
