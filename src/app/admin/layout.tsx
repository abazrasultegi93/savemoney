import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { getT } from "@/i18n/server";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();
  const { t } = await getT();
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-4 border-b border-slate-200 pb-4">
        <h1 className="h1 mr-4">{t("admin.title")}</h1>
        <Link href="/admin" className="btn-secondary py-1.5">{t("admin.courses")}</Link>
        <Link href="/admin/students" className="btn-secondary py-1.5">{t("admin.students")}</Link>
      </div>
      {children}
    </div>
  );
}
