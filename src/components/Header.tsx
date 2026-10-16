import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { getT } from "@/i18n/server";
import { logout } from "@/app/actions/auth";
import { LocaleSwitcher } from "./LocaleSwitcher";

export async function Header() {
  const user = await getCurrentUser();
  const { t } = await getT();
  return (
    <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/90 backdrop-blur">
      <div className="container-page flex h-14 items-center gap-4">
        <Link href="/" className="flex items-center gap-2 font-bold text-brand-700">
          <span className="grid h-7 w-7 place-items-center rounded-lg bg-brand-600 text-sm text-white">$</span>
          {t("app.name")}
        </Link>
        <nav className="hidden items-center gap-4 text-sm font-medium text-slate-600 sm:flex">
          <Link href="/courses" className="hover:text-slate-900">{t("nav.courses")}</Link>
          {user && <Link href="/dashboard" className="hover:text-slate-900">{t("nav.dashboard")}</Link>}
          {user && <Link href="/tools" className="hover:text-slate-900">{t("nav.tools")}</Link>}
          {user?.role === "ADMIN" && <Link href="/admin" className="hover:text-slate-900">{t("nav.admin")}</Link>}
        </nav>
        <div className="ml-auto flex items-center gap-3">
          <LocaleSwitcher />
          {user ? (
            <form action={logout}>
              <button className="btn-secondary py-1.5">{t("nav.logout")}</button>
            </form>
          ) : (
            <>
              <Link href="/login" className="text-sm font-medium text-slate-700">{t("nav.login")}</Link>
              <Link href="/register" className="btn-primary py-1.5">{t("nav.register")}</Link>
            </>
          )}
        </div>
      </div>
      {user && (
        <nav className="container-page flex gap-4 overflow-x-auto pb-2 text-sm font-medium text-slate-600 sm:hidden">
          <Link href="/dashboard">{t("nav.dashboard")}</Link>
          <Link href="/courses">{t("nav.courses")}</Link>
          <Link href="/tools">{t("nav.tools")}</Link>
          {user.role === "ADMIN" && <Link href="/admin">{t("nav.admin")}</Link>}
        </nav>
      )}
    </header>
  );
}
