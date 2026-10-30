"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { useEffect, useId, useRef, useState } from "react";
import { useLocale } from "./LocaleProvider";
import { getSidebarGroups, isSidebarLinkActive, type SidebarIcon } from "@/lib/sidebar-navigation";

function Icon({ name }: { name: SidebarIcon }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {name === "home" && <><path d="m2 10 10-8 10 8M5 9v12h5v-7h4v7h5V9" /></>}
      {name === "chart" && <><path d="M3 3v18h18M7 16v-5m5 5V6m5 10v-8" /></>}
      {name === "plus" && <><rect x="3" y="3" width="18" height="18" rx="4" /><path d="M12 7v10M7 12h10" /></>}
      {name === "settings" && <><path d="m9 3-1 3-3 1-2 4 2 2v4l4 3 3-1 3 1 4-3v-4l2-2-2-4-3-1-1-3Z" /><circle cx="12" cy="12" r="3" /></>}
      {name === "shield" && <><path d="m12 2 9 4v6c0 5-9 10-9 10S3 17 3 12V6Zm-4 10 3 3 5-6" /></>}
      {name === "users" && <><circle cx="9" cy="7" r="4" /><path d="M2 22v-3a7 7 0 0 1 14 0v3M17 3a4 4 0 0 1 0 8m2 4a6 6 0 0 1 3 5v2" /></>}
      {name === "play" && <><rect x="2" y="3" width="20" height="18" rx="3" /><path d="m10 8 6 4-6 4Z" /></>}
      {name === "broadcast" && <><circle cx="12" cy="9" r="2" /><path d="M8 5a6 6 0 0 0 0 8m8-8a6 6 0 0 1 0 8M5 2a10 10 0 0 0 0 14M19 2a10 10 0 0 1 0 14m-7-5v11" /></>}
      {name === "tasks" && <><rect x="4" y="4" width="16" height="18" rx="2" /><rect x="8" y="2" width="8" height="4" rx="1" /><path d="m8 13 2 2 6-6M8 19h8" /></>}
      {name === "film" && <><path d="m3 7 17-4-1-3L2 4Zm0 0h19v14H3ZM6 3l3 3m3-5 3 3m3-4 3 3m-11 8 6 3-6 3Z" /></>}
      {name === "folder" && <path d="M3 5h6l2 3h10v13H3Zm0 3V3h6l2 2h8v3" />}
      {name === "mail" && <><rect x="2" y="4" width="20" height="16" rx="3" /><path d="m3 6 9 7 9-7" /></>}
      {name === "info" && <><circle cx="12" cy="12" r="10" /><path d="M12 11v6m0-10h.01" /></>}
      {name === "article" && <><path d="M14 3H4v18h16V11M8 8h4M8 12h3m-3 5h5m1-5 7-7-3-3-7 7-1 4Z" /></>}
      {name === "dashboard" && <><rect x="3" y="3" width="7" height="7" rx="2" /><rect x="14" y="3" width="7" height="7" rx="2" /><rect x="3" y="14" width="7" height="7" rx="2" /><rect x="14" y="14" width="7" height="7" rx="2" /></>}
      {name === "profile" && <><circle cx="12" cy="7" r="4" /><path d="M4 22v-3a8 8 0 0 1 16 0v3" /></>}
      {name === "wallet" && <><path d="M21 7H5a2 2 0 0 1 0-4h14v4M3 5v15a2 2 0 0 0 2 2h16V7" /><path d="M21 12h-6v6h6m-3-3h.01" /></>}
      {name === "ticket" && <><path d="M3 5h18v5a2 2 0 0 0 0 4v5H3v-5a2 2 0 0 0 0-4Zm12 0v3m0 3v2m0 3v3" /></>}
      {name === "subscription" && <><rect x="3" y="4" width="18" height="17" rx="3" /><path d="M7 2v4m10-4v4M3 10h18m-13 5 3 3 5-5" /></>}
      {name === "support" && <><path d="M4 13v-2a8 8 0 0 1 16 0v2m0 5v2a2 2 0 0 1-2 2h-5" /><rect x="2" y="11" width="5" height="8" rx="2" /><rect x="17" y="11" width="5" height="8" rx="2" /></>}
    </svg>
  );
}

export function HomeSidebar() {
  const ar = useLocale() === "ar";
  const pathname = usePathname();
  const { data: session } = useSession();
  const student = session?.user.role === "STUDENT";
  const admin = session?.user.role === "ADMIN" || session?.user.role === "ASSISTANT_ADMIN";
  const groups = getSidebarGroups(session?.user.role);
  const [hash, setHash] = useState("");
  const [open, setOpen] = useState(false);
  const panelId = useId();
  const panel = useRef<HTMLElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    const update = () => setHash(window.location.hash);
    const frame = requestAnimationFrame(update);
    window.addEventListener("hashchange", update);
    window.addEventListener("popstate", update);
    return () => { cancelAnimationFrame(frame); window.removeEventListener("hashchange", update); window.removeEventListener("popstate", update); };
  }, [pathname]);

  useEffect(() => {
    if (!open) return;
    const triggerButton = trigger.current;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    panel.current?.querySelector<HTMLAnchorElement>("a")?.focus();
    const desktop = window.matchMedia("(min-width: 1280px)");
    const closeOnDesktop = () => { if (desktop.matches) setOpen(false); };
    desktop.addEventListener("change", closeOnDesktop);
    return () => {
      document.body.style.overflow = previous;
      desktop.removeEventListener("change", closeOnDesktop);
      triggerButton?.focus();
    };
  }, [open]);

  return (
    <>
      <div className="home-sidebar-mobile-bar">
        <button ref={trigger} type="button" aria-expanded={open} aria-controls={panelId} onClick={() => setOpen(true)}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true"><path d="M3 6h18M3 12h18M3 18h18" /></svg>
          <span className="sr-only">{ar ? "قائمة الأكاديمية" : "Academy menu"}</span>
        </button>
      </div>
      {open && <button className="home-sidebar-backdrop" aria-label={ar ? "إغلاق القائمة" : "Close menu"} onClick={() => setOpen(false)} />}
      <aside
        id={panelId}
        ref={panel}
        className={`home-sidebar${open ? " is-open" : ""}`}
        data-audience={admin ? "admin" : student ? "student" : "academy"}
        role={open ? "dialog" : undefined}
        aria-modal={open || undefined}
        aria-label={ar ? "قائمة الأكاديمية" : "Academy menu"}
        onKeyDown={(event) => {
          if (!open) return;
          if (event.key === "Escape") setOpen(false);
          if (event.key === "Tab") {
            const elements = panel.current?.querySelectorAll<HTMLElement>("a[href], button:not(:disabled)");
            if (!elements?.length) return;
            const first = elements[0];
            const last = elements[elements.length - 1];
            if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
            else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
          }
        }}
      >
        <div className="home-sidebar-brand">
          <Link href="/" aria-current={pathname === "/" ? "page" : undefined} aria-label={ar ? "في السكة أكاديمي — الرئيسية" : "Filsaka Academy — Home"} onClick={() => setOpen(false)}>
            <Image src="/logo-1.png" alt="في السكة أكاديمي — Filsaka Academy" width={440} height={220} sizes="220px" priority />
          </Link>
          <button type="button" className="home-sidebar-close" aria-label={ar ? "إغلاق القائمة" : "Close menu"} onClick={() => setOpen(false)}>×</button>
        </div>
        <nav aria-label={ar ? "التنقل في الأكاديمية" : "Academy navigation"}>
          {groups.map((group) => <div key={group.id} className="home-sidebar-group">
            {group.ar && <h2 className="home-sidebar-group-title" id={`${panelId}-${group.id}`}>{ar ? group.ar : group.en}</h2>}
            <ul aria-labelledby={group.ar ? `${panelId}-${group.id}` : undefined}>
              {group.items.map((item) => <li key={item.href}>
                <Link href={item.href} aria-current={isSidebarLinkActive(item.href, pathname, hash) ? (item.href.includes("#") ? "location" : "page") : undefined} className="home-sidebar-link" onClick={() => { setHash(item.href.includes("#") ? `#${item.href.split("#")[1]}` : ""); setOpen(false); }}><Icon name={item.icon} /><span>{ar ? item.ar : item.en}</span></Link>
              </li>)}
            </ul>
          </div>)}
        </nav>
        <svg className="home-sidebar-ribbon" viewBox="0 0 260 210" fill="none" preserveAspectRatio="none" aria-hidden="true">
          <path d="M-35 230Q75 50 300 55" stroke="#f0001b" strokeOpacity=".22" strokeWidth="36" />
          <path d="M-35 230Q75 50 300 55" stroke="#ff0926" strokeWidth="3" />
          <path d="M-20 245Q90 80 300 80" stroke="#b00015" strokeWidth="22" strokeOpacity=".5" />
          <path d="M-35 230Q75 50 300 55" stroke="#ffb1b8" strokeWidth="1" />
        </svg>
      </aside>
    </>
  );
}
