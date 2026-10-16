import Link from "next/link";
import { getT } from "@/i18n/server";
import { getCurrentUser } from "@/lib/auth";

export default async function Home() {
  const { t } = await getT();
  const user = await getCurrentUser();
  const features = [
    { icon: "🎬", title: t("home.f1.title"), text: t("home.f1.text") },
    { icon: "📈", title: t("home.f2.title"), text: t("home.f2.text") },
    { icon: "🧮", title: t("home.f3.title"), text: t("home.f3.text") },
  ];
  return (
    <div className="space-y-12">
      <section className="rounded-3xl bg-gradient-to-br from-brand-700 to-brand-500 px-6 py-14 text-white sm:px-12">
        <p className="text-sm font-semibold uppercase tracking-wider text-brand-100">{t("app.tagline")}</p>
        <h1 className="mt-3 max-w-2xl text-3xl font-bold sm:text-5xl">{t("home.hero")}</h1>
        <p className="mt-4 max-w-2xl text-brand-50">{t("home.sub")}</p>
        <Link href={user ? "/dashboard" : "/register"} className="btn mt-8 bg-white text-brand-700 hover:bg-brand-50">
          {t("home.cta")}
        </Link>
      </section>
      <section className="grid gap-4 sm:grid-cols-3">
        {features.map((f) => (
          <div key={f.title} className="card">
            <div className="text-3xl">{f.icon}</div>
            <h3 className="h2 mt-3">{f.title}</h3>
            <p className="muted mt-1">{f.text}</p>
          </div>
        ))}
      </section>
    </div>
  );
}
