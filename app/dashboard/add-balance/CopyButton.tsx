"use client";

import { useEffect, useRef, useState } from "react";
import { useLocale } from "@/components/LocaleProvider";
import { BalanceIcon } from "./BalanceIcon";
import styles from "./balance.module.css";

export function CopyButton({
  text,
  copyLabel,
  copiedLabel,
  ariaLabel,
}: {
  text: string;
  copyLabel: string;
  copiedLabel: string;
  ariaLabel: string;
}) {
  const [copied, setCopied] = useState(false);
  const [failed, setFailed] = useState(false);
  const ar = useLocale() === "ar";
  const timeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => { if (timeout.current) clearTimeout(timeout.current); }, []);

  async function handleCopy() {
    try {
      if (timeout.current) clearTimeout(timeout.current);
      setFailed(false);
      await navigator.clipboard.writeText(text);
      setCopied(true);
      timeout.current = setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
      setFailed(true);
    }
  }

  return (
    <span className={styles.copyControl}><button
      type="button"
      onClick={handleCopy}
      className={styles.copyButton}
      aria-label={ariaLabel}
    >
      <BalanceIcon name={copied ? "check" : "copy"} /><span>{copied ? copiedLabel : copyLabel}</span>
    </button><span className={failed ? styles.copyError : "sr-only"} role="status">{failed ? (ar ? "تعذر النسخ. يمكنك تحديد البيانات ونسخها يدويًا." : "Could not copy. Select and copy the details manually.") : copied ? copiedLabel : ""}</span></span>
  );
}
