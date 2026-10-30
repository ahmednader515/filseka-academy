"use client";

import { useLayoutEffect, useRef } from "react";
import { usePathname } from "next/navigation";

/** Start new pages at the top while leaving history and anchor scrolling to Next. */
export function NavigationScrollReset() {
  const pathname = usePathname();
  const previousPathname = useRef(pathname);
  const historyPathname = useRef<string | null>(null);

  useLayoutEffect(() => {
    const onPopState = () => {
      historyPathname.current = window.location.pathname;
    };
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  useLayoutEffect(() => {
    if (previousPathname.current === pathname) return;
    previousPathname.current = pathname;

    const isHistoryNavigation = historyPathname.current === pathname;
    historyPathname.current = null;
    if (isHistoryNavigation || window.location.hash) return;

    // Override global smooth scrolling so the old page's offset isn't visible.
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  }, [pathname]);

  return null;
}
