"use client";

import { useEffect, type ReactNode } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

export function MobileHomeEntry({ children }: { children: ReactNode }) {
  const { status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "authenticated") {
      router.replace("/dashboard");
      return;
    }
    if (status !== "unauthenticated") return;

    const mobile = window.matchMedia("(max-width: 767px)");
    const openSignIn = () => {
      if (mobile.matches) router.replace("/login");
    };

    openSignIn();
    mobile.addEventListener("change", openSignIn);
    return () => mobile.removeEventListener("change", openSignIn);
  }, [router, status]);

  // Only show the public homepage once we know this is a signed-out visitor.
  if (status !== "unauthenticated") return null;

  return (
    <div className="contents max-md:hidden">
      {children}
    </div>
  );
}
