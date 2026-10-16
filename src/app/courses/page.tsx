import Link from "next/link";
import { db } from "@/lib/db";
import { getT } from "@/i18n/server";
import { pick } from "@/i18n";
import { formatUsd } from "@/lib/learning";

export default async function CoursesPage() {
  const { t, locale } = await getT();
  const courses = await db.course.findMany({
    where: { published: true },
    orderBy: { order: "asc" },
    include: { _count: { select: { lessons: true } } },
  });
  return (
    <div className="space-y-6">
      <h1 className="h1">{t("nav.courses")}</h1>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {courses.map((c) => (
          <Link key={c.id} href={`/courses/${c.slug}`} className="card transition hover:border-brand-500">
            <h2 className="h2">{pick(locale, c.titleEn, c.titleRu)}</h2>
            <p className="muted mt-2 line-clamp-3">{pick(locale, c.descriptionEn, c.descriptionRu)}</p>
            <div className="mt-4 flex items-center justify-between text-sm">
              <span className="text-slate-500">{c._count.lessons} {t("course.lessons").toLowerCase()}</span>
              <span className="font-semibold text-brand-700">{c.priceCents ? formatUsd(c.priceCents) : t("course.free")}</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
