"use client";

import { useEffect, type ReactNode } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

export function MobileHomeEntry({ children }: { children: ReactNode }) {
  const { status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status !== "authenticated") return;

    const mobile = window.matchMedia("(max-width: 767px)");
    const openEntryPage = () => {
      if (!mobile.matches) router.replace("/dashboard");
    };

    openEntryPage();
    mobile.addEventListener("change", openEntryPage);
    return () => mobile.removeEventListener("change", openEntryPage);
  }, [router, status]);

  // Hide the homepage while checking the session or redirecting visitors.
  if (status === "loading") return null;

  return (
    <div className={status === "authenticated" ? "contents md:hidden" : "contents"}>
      {children}
    </div>
  );
}
