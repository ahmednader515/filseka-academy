"use client";

import { SessionProvider as NextAuthSessionProvider } from "next-auth/react";
import { ReactNode } from "react";
import type { Session } from "next-auth";

/** إعادة التحقق من الجلسة دورياً لاكتشاف تسجيل الدخول من جهاز آخر — ٣٠ث توازن بين الاستجابة وحمل الشبكة */
const SESSION_REFETCH_INTERVAL = 30;

export function SessionProvider({ children, session }: { children: ReactNode; session?: Session | null }) {
  return (
    <NextAuthSessionProvider session={session} refetchInterval={SESSION_REFETCH_INTERVAL}>
      {children}
    </NextAuthSessionProvider>
  );
}
