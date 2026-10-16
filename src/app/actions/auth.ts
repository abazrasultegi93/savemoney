"use server";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { createSession, destroySession } from "@/lib/auth";
import type { TKey } from "@/i18n";

export type AuthState = { error?: TKey } | undefined;

export async function register(_: AuthState, form: FormData): Promise<AuthState> {
  const name = String(form.get("name") ?? "").trim();
  const email = String(form.get("email") ?? "").trim().toLowerCase();
  const password = String(form.get("password") ?? "");
  if (!name || !email) return { error: "auth.error.fields" };
  if (password.length < 8) return { error: "auth.error.short" };
  if (await db.user.findUnique({ where: { email } })) return { error: "auth.error.exists" };
  const locale = (await cookies()).get("locale")?.value === "ru" ? "ru" : "en";
  const user = await db.user.create({
    data: { name, email, locale, passwordHash: await bcrypt.hash(password, 10) },
  });
  await createSession(user.id);
  redirect("/dashboard");
}

export async function login(_: AuthState, form: FormData): Promise<AuthState> {
  const email = String(form.get("email") ?? "").trim().toLowerCase();
  const password = String(form.get("password") ?? "");
  const user = await db.user.findUnique({ where: { email } });
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) return { error: "auth.error.invalid" };
  await createSession(user.id);
  (await cookies()).set("locale", user.locale, { path: "/", maxAge: 60 * 60 * 24 * 365, sameSite: "lax" });
  const next = String(form.get("next") ?? "");
  redirect(next.startsWith("/") && !next.startsWith("//") ? next : "/dashboard");
}

export async function logout() {
  await destroySession();
  redirect("/");
}
