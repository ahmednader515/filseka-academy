"use client";

import Link from "next/link";
import { signOut } from "next-auth/react";
import { useEffect, useId, useRef, useState } from "react";
import type { UserRole } from "@/lib/types";
import { useLocale, useT } from "./LocaleProvider";
import styles from "./HeaderControls.module.css";

type ProfileUser = { name?: string | null; email?: string | null; image?: string | null; role: UserRole };
type MenuIcon = "dashboard" | "profile" | "courses" | "logout";
function Icon({ name }: { name: MenuIcon }) {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {name === "dashboard" && <><rect x="3" y="3" width="7" height="7" rx="2" /><rect x="14" y="3" width="7" height="7" rx="2" /><rect x="3" y="14" width="7" height="7" rx="2" /><rect x="14" y="14" width="7" height="7" rx="2" /></>}
    {name === "profile" && <><circle cx="12" cy="7" r="4" /><path d="M4 22v-3a8 8 0 0 1 16 0v3" /></>}
    {name === "courses" && <><rect x="2" y="3" width="20" height="18" rx="3" /><path d="m10 8 6 4-6 4Z" /></>}
    {name === "logout" && <><path d="M9 4H4v16h5m5-13 5 5-5 5m-6-5h11" /></>}
  </svg>;
}
function Avatar({ user }: { user: ProfileUser }) {
  const [failed, setFailed] = useState(false);
  const initials = (user.name || user.email || "?").trim().split(/\s+/).slice(0, 2).map((word) => Array.from(word)[0]).join("").toUpperCase();
  return <span className={styles.avatar} aria-hidden="true">{user.image && !failed ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={user.image} alt="" onError={() => setFailed(true)} />
  ) : initials}</span>;
}

export function ProfileDropdown({ user }: { user: ProfileUser }) {
  const ar = useLocale() === "ar";
  const t = useT();
  const [open, setOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const wrapper = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const menu = useRef<HTMLDivElement>(null);
  const menuId = useId();
  const triggerId = useId();
  const roleLabels: Record<UserRole, string> = { ADMIN: t("header.role.ADMIN", "Admin"), ASSISTANT_ADMIN: t("header.role.ASSISTANT_ADMIN", "Assistant admin"), TEACHER: t("header.role.TEACHER", "Teacher"), STUDENT: t("header.role.STUDENT", "Student") };
  const staff = user.role !== "STUDENT";
  const name = user.name?.trim() || (ar ? "حسابي" : "My account");

  useEffect(() => {
    if (!open) return;
    const frame = requestAnimationFrame(() => menu.current?.querySelector<HTMLElement>('[role="menuitem"]')?.focus());
    const onPointerDown = (event: PointerEvent) => { if (wrapper.current && !wrapper.current.contains(event.target as Node)) setOpen(false); };
    document.addEventListener("pointerdown", onPointerDown);
    return () => { cancelAnimationFrame(frame); document.removeEventListener("pointerdown", onPointerDown); };
  }, [open]);

  async function logout() {
    if (loggingOut) return;
    setLoggingOut(true);
    try { await fetch("/api/auth/clear-session", { method: "POST", credentials: "include" }); }
    catch { /* The normal sign-out flow still clears the authentication cookie. */ }
    try { await signOut({ callbackUrl: "/" }); }
    finally { setLoggingOut(false); }
  }

  const links: { href: string; icon: MenuIcon; label: string }[] = [
    { href: "/dashboard", icon: "dashboard", label: t("header.dashboard", "Dashboard") },
    { href: "/dashboard/profile", icon: "profile", label: t("header.editAccount", "Edit account") },
    { href: staff ? "/dashboard/courses" : "/dashboard#my-courses", icon: "courses", label: ar ? "كورساتي" : "My courses" },
  ];
  return <div ref={wrapper} className={styles.profile} onBlur={(event) => {
    if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setOpen(false);
  }} onKeyDown={(event) => {
    if (event.key === "Escape" && open) { event.preventDefault(); setOpen(false); trigger.current?.focus(); }
  }}>
    <button ref={trigger} id={triggerId} type="button" className={styles.profileTrigger} aria-label={ar ? `قائمة حساب ${name}` : `${name} account menu`} aria-haspopup="menu" aria-expanded={open} aria-controls={open ? menuId : undefined} onClick={() => setOpen((current) => !current)} onKeyDown={(event) => {
      if (event.key === "ArrowDown" || event.key === "ArrowUp") { event.preventDefault(); setOpen(true); }
    }}><Avatar user={user} /><span className={styles.triggerCopy}><span className={styles.triggerName}>{name}</span><span className={styles.triggerRole}>{roleLabels[user.role]}</span></span><svg className={styles.chevron} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m5 7 5 5 5-5" /></svg></button>
    {open && <div className={styles.panel}>
      <div className={styles.panelHeader}><Avatar user={user} /><div className={styles.accountInfo}><strong>{name}</strong>{user.email && <small dir="ltr">{user.email}</small>}<span className={styles.roleBadge}>{roleLabels[user.role]}</span></div></div>
      <div ref={menu} id={menuId} role="menu" aria-labelledby={triggerId} onKeyDown={(event) => {
        const items = Array.from(menu.current?.querySelectorAll<HTMLElement>('[role="menuitem"]:not(:disabled)') || []);
        const index = items.indexOf(document.activeElement as HTMLElement);
        let next: number | undefined;
        if (event.key === "ArrowDown") next = (index + 1) % items.length;
        if (event.key === "ArrowUp") next = (index - 1 + items.length) % items.length;
        if (event.key === "Home") next = 0;
        if (event.key === "End") next = items.length - 1;
        if (next !== undefined) { event.preventDefault(); items[next]?.focus(); }
      }}>
        {links.map((link) => <Link key={link.icon} href={link.href} role="menuitem" tabIndex={-1} className={styles.menuLink} onClick={() => setOpen(false)}><Icon name={link.icon} /><span>{link.label}</span><span className={styles.menuArrow} aria-hidden="true">{ar ? "‹" : "›"}</span></Link>)}
        <div className={styles.logout} role="none"><button type="button" role="menuitem" tabIndex={-1} className={styles.menuLink} disabled={loggingOut} onClick={logout}><Icon name="logout" /><span>{loggingOut ? (ar ? "جارٍ تسجيل الخروج…" : "Signing out…") : t("header.logout", "Log out")}</span></button></div>
      </div>
    </div>}
  </div>;
}
