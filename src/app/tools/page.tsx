import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { getT } from "@/i18n/server";

export default async function ToolsPage() {
  await requireUser();
  const { t } = await getT();
  const tools = [
    { href: "/tools/budget", icon: "💵", title: t("tools.budget"), desc: t("tools.budget.desc") },
    { href: "/tools/savings", icon: "📊", title: t("tools.savings"), desc: t("tools.savings.desc") },
    { href: "/tools/loan", icon: "🏦", title: t("tools.loan"), desc: t("tools.loan.desc") },
  ];
  return (
    <div className="space-y-6">
      <h1 className="h1">{t("tools.title")}</h1>
      <div className="grid gap-4 sm:grid-cols-3">
        {tools.map((x) => (
          <Link key={x.href} href={x.href} className="card transition hover:border-brand-500">
            <div className="text-3xl">{x.icon}</div>
            <h2 className="h2 mt-3">{x.title}</h2>
            <p className="muted mt-1">{x.desc}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
