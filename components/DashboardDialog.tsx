"use client";

import { useEffect, useRef, type ReactNode } from "react";
import styles from "./DashboardDialog.module.css";

/** The browser's top layer keeps dashboard dialogs above the footer and sidebar. */
export function DashboardDialog({ children, label, onDismiss, size = "md" }: { children: ReactNode; label: string; onDismiss: () => void; size?: "sm" | "md" | "lg" }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    dialog.showModal();
    return () => {
      dialog.close();
      document.body.style.overflow = previousOverflow;
    };
  }, []);
  return <dialog ref={dialogRef} className={`${styles.dialog} ${styles[size]}`} aria-label={label} onCancel={onDismiss}>{children}</dialog>;
}
