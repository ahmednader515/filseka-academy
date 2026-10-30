"use client";

import { useEffect, useState, Suspense } from "react";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { LoginIcon, LoginScene } from "@/components/AuthScene";
import { CONCURRENT_SESSION_ERROR } from "@/lib/auth-constants";
import { useLocale, useT } from "@/components/LocaleProvider";

function LoginForm() {
  const t = useT();
  const ar = useLocale() === "ar";
  const [showPassword, setShowPassword] = useState(false);
  const [rememberEmail, setRememberEmail] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [concurrentSession, setConcurrentSession] = useState(false);
  const [forceLogoutLoading, setForceLogoutLoading] = useState(false);
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/dashboard";
  const reasonElsewhere = searchParams.get("reason") === "session_ended_elsewhere";

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      try {
        setEmail(localStorage.getItem("filseka-login-email") ?? "");
      } catch {
        // Login remains available when browser storage is disabled.
      }
    });
    return () => cancelAnimationFrame(frame);
  }, []);

  function rememberIdentifier() {
    try {
      if (rememberEmail) localStorage.setItem("filseka-login-email", email);
      else localStorage.removeItem("filseka-login-email");
    } catch {
      // Remembering the identifier is optional; never store the password.
    }
  }

  function navigateToCallback() {
    rememberIdentifier();
    try {
      const destination = new URL(callbackUrl, window.location.origin);
      const safeDestination =
        destination.origin === window.location.origin
          ? `${destination.pathname}${destination.search}${destination.hash}`
          : "/dashboard";
      window.location.assign(safeDestination);
    } catch {
      window.location.assign("/dashboard");
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setConcurrentSession(false);
    setLoading(true);
    try {
      const res = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });
      if (res?.error === CONCURRENT_SESSION_ERROR) {
        setConcurrentSession(true);
        setLoading(false);
        return;
      }
      if (res?.error) {
        setError(t("auth.login.invalidCredentials", "Email/phone or password is incorrect"));
        setLoading(false);
        return;
      }
      navigateToCallback();
    } finally {
      setLoading(false);
    }
  }

  async function handleForceLogoutOther(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setForceLogoutLoading(true);
    try {
      const r = await fetch("/api/auth/force-logout-other", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await r.json().catch(() => ({}));
      if (!r.ok) {
        setError(data.error ?? t("auth.login.forceLogoutFailed", "Failed to log out the other device"));
        return;
      }
      const res = await signIn("credentials", { email, password, redirect: false });
      if (res?.error) {
        setError(t("auth.login.loginAfterForceLogoutFailed", "Failed to log in after logging out the other device"));
        return;
      }
      navigateToCallback();
    } finally {
      setForceLogoutLoading(false);
    }
  }


  return (
    <LoginScene>
      <section className="login-card" aria-labelledby="login-title" dir={ar ? "rtl" : "ltr"}>
        <div className="login-user-badge"><LoginIcon name="user" /></div>
        <h1 id="login-title">{t("auth.login.title", "Log in")}</h1>
        <span className="login-brush" aria-hidden="true" />
        <p className="login-welcome">{ar ? "مرحبًا بعودتك إلى في السكة أكاديمي" : "Welcome back to Filsaka Academy"}</p>
        {concurrentSession ? (
          <div className="login-session-notice" role="alert">
            <h2>{t("auth.login.concurrentTitle")}</h2>
            <p>{t("auth.login.concurrentDescription")}</p>
            <p>{t("auth.login.concurrentSecurityHint")}</p>
            {error && <p className="login-error">{error}</p>}
            <form onSubmit={handleForceLogoutOther}>
              <button className="login-submit" disabled={forceLogoutLoading}>
                {forceLogoutLoading ? t("auth.login.concurrentActionLoading") : t("auth.login.concurrentAction")}
              </button>
            </form>
            <button type="button" className="login-cancel" onClick={() => setConcurrentSession(false)}>{t("auth.login.concurrentCancel")}</button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="login-form">
            {reasonElsewhere && <p className="login-notice" role="status">{t("auth.login.sessionEndedElsewhere")}</p>}
            {error && <p className="login-error" role="alert">{error}</p>}
            <div className="login-field">
              <label htmlFor="email" className="sr-only">{t("auth.login.emailOrPhoneLabel")}</label>
              <LoginIcon name="mail" />
              <input id="email" type="text" autoComplete="username" autoCapitalize="none" spellCheck={false} value={email} onChange={(e) => setEmail(e.target.value)} required placeholder={ar ? "البريد الإلكتروني أو رقم الهاتف" : "Email or phone number"} />
            </div>
            <div className="login-field">
              <label htmlFor="password" className="sr-only">{t("auth.login.passwordLabel")}</label>
              <LoginIcon name="lock" />
              <input id="password" type={showPassword ? "text" : "password"} autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} required placeholder={t("auth.login.passwordLabel")} />
              <button type="button" className="login-password-toggle" aria-label={showPassword ? (ar ? "إخفاء كلمة المرور" : "Hide password") : (ar ? "إظهار كلمة المرور" : "Show password")} aria-pressed={showPassword} onClick={() => setShowPassword(!showPassword)}><LoginIcon name={showPassword ? "eye-off" : "eye"} /></button>
            </div>
            <div className="login-options">
              <label className="login-remember" title={ar ? "حفظ البريد الإلكتروني أو رقم الهاتف على هذا الجهاز" : "Remember your email or phone on this device"}>
                <input type="checkbox" checked={rememberEmail} onChange={(e) => {
                  setRememberEmail(e.target.checked);
                  if (!e.target.checked) {
                    try { localStorage.removeItem("filseka-login-email"); } catch { /* Storage is optional. */ }
                  }
                }} />
                {ar ? "تذكرني" : "Remember me"}
              </label>
              <Link href="/login/forgot-password">{ar ? "نسيت كلمة المرور؟" : "Forgot password?"}</Link>
            </div>
            <button type="submit" disabled={loading} className="login-submit">
              <LoginIcon name="enter" />
              {loading ? t("auth.login.submitting") : t("auth.login.submit")}
            </button>
          </form>
        )}
        <div className="login-register">
          <span>{t("auth.login.noAccount")}</span>
          <Link href="/register"><LoginIcon name="user-plus" />{ar ? "إنشاء حساب جديد" : "Create an account"}</Link>
        </div>
      </section>
    </LoginScene>
  );
}

export default function LoginPage() {
  return <Suspense fallback={<LoginScene><div className="login-card login-skeleton" aria-busy="true"><div /><div /><div /></div></LoginScene>}><LoginForm /></Suspense>;
}
