"use client";
import { useActionState } from "react";
import Link from "next/link";
import { login, register, type AuthState } from "@/app/actions/auth";
import { useT } from "@/i18n/client";

export function AuthForm({ mode, next }: { mode: "login" | "register"; next?: string }) {
  const { t } = useT();
  const [state, action, pending] = useActionState<AuthState, FormData>(mode === "login" ? login : register, undefined);
  return (
    <div className="mx-auto max-w-md card">
      <h1 className="h1 mb-6">{t(mode === "login" ? "auth.login.title" : "auth.register.title")}</h1>
      <form action={action} className="space-y-4">
        {next && <input type="hidden" name="next" value={next} />}
        {mode === "register" && (
          <div>
            <label className="label">{t("auth.name")}</label>
            <input name="name" required className="input" autoComplete="name" />
          </div>
        )}
        <div>
          <label className="label">{t("auth.email")}</label>
          <input name="email" type="email" required className="input" autoComplete="email" />
        </div>
        <div>
          <label className="label">{t("auth.password")}</label>
          <input
            name="password"
            type="password"
            required
            minLength={mode === "register" ? 8 : undefined}
            className="input"
            autoComplete={mode === "login" ? "current-password" : "new-password"}
          />
        </div>
        {state?.error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{t(state.error)}</p>}
        <button disabled={pending} className="btn-primary w-full">
          {t(mode === "login" ? "auth.login.submit" : "auth.register.submit")}
        </button>
      </form>
      <p className="muted mt-4 text-center">
        {mode === "login" ? t("auth.noAccount") : t("auth.haveAccount")}{" "}
        <Link className="font-semibold text-brand-700" href={mode === "login" ? "/register" : "/login"}>
          {mode === "login" ? t("nav.register") : t("nav.login")}
        </Link>
      </p>
    </div>
  );
}
