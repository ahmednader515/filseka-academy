"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LoginIcon, LoginScene } from "@/components/AuthScene";
import { useLocale, useT } from "@/components/LocaleProvider";

export default function RegisterPage() {
  const t = useT();
  const ar = useLocale() === "ar";
  const [showPassword, setShowPassword] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [studentNumber, setStudentNumber] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const digits = studentNumber.replace(/\D/g, "");
    if (digits.length !== 11) {
      setError(t("auth.register.phoneMustBe11", "Phone number must be 11 digits"));
      return;
    }
    setLoading(true);
    const res = await fetch("/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email,
        password,
        name,
        student_number: studentNumber.trim() || undefined,
      }),
    });
    const data = await res.json().catch(() => ({}));
    setLoading(false);
    if (!res.ok) {
      setError(data.error ?? t("auth.register.createFailed", "Failed to create account"));
      return;
    }
    router.push(`/login?message=${encodeURIComponent(t("auth.register.signupSuccessMessage", "Account created successfully, you can now log in"))}`);
    router.refresh();
  }

  return (
    <LoginScene>
      <section className="login-card register-card" dir={ar ? "rtl" : "ltr"} aria-labelledby="register-title">
        <div className="login-user-badge"><LoginIcon name="user-plus" /></div>
        <h1 id="register-title">{t("auth.register.title", "Create account")}</h1>
        <span className="login-brush" aria-hidden="true" />
        <p className="login-welcome">{t("auth.register.subtitle")}</p>
        <form onSubmit={handleSubmit} className="login-form register-form">
          {error && <p className="login-error" role="alert">{error}</p>}
          <div className="login-field">
            <label htmlFor="name" className="sr-only">{t("auth.register.nameLabel")}</label>
            <LoginIcon name="user" />
            <input id="name" type="text" autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} required minLength={2} placeholder={t("auth.register.nameLabel")} />
          </div>
          <div className="login-field">
            <label htmlFor="email" className="sr-only">{t("auth.register.emailLabel")}</label>
            <LoginIcon name="mail" />
            <input id="email" type="email" autoComplete="email" autoCapitalize="none" spellCheck={false} value={email} onChange={(e) => setEmail(e.target.value)} required placeholder={t("auth.register.emailLabel")} />
          </div>
          <div className="login-field">
            <label htmlFor="student_number" className="sr-only">{t("auth.register.phoneLabel")}</label>
            <LoginIcon name="phone" />
            <input id="student_number" type="tel" inputMode="numeric" autoComplete="tel" value={studentNumber} onChange={(e) => setStudentNumber(e.target.value)} required placeholder={t("auth.register.phoneLabel")} title={t("auth.register.phoneMustBe11")} />
          </div>
          <div className="login-field">
            <label htmlFor="password" className="sr-only">{t("auth.register.passwordLabel")}</label>
            <LoginIcon name="lock" />
            <input id="password" type={showPassword ? "text" : "password"} autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} placeholder={t("auth.register.passwordPlaceholder")} />
            <button type="button" className="login-password-toggle" aria-label={showPassword ? (ar ? "إخفاء كلمة المرور" : "Hide password") : (ar ? "إظهار كلمة المرور" : "Show password")} aria-pressed={showPassword} onClick={() => setShowPassword(!showPassword)}><LoginIcon name={showPassword ? "eye-off" : "eye"} /></button>
          </div>
          <button type="submit" disabled={loading} className="login-submit"><LoginIcon name="user-plus" />{loading ? t("auth.register.submitting") : t("auth.register.submit")}</button>
        </form>
        <div className="login-register">
          <span>{t("auth.register.hasAccount")}</span>
          <Link href="/login"><LoginIcon name="enter" />{t("auth.register.login")}</Link>
        </div>
      </section>
    </LoginScene>
  );
}
