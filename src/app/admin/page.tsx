import Link from "next/link";
import { db } from "@/lib/db";
import { getT } from "@/i18n/server";
import { pick } from "@/i18n";
import { formatUsd } from "@/lib/learning";
import { createCourse } from "@/app/actions/admin";
import { CourseForm } from "@/components/admin/CourseForm";

export default async function AdminHome() {
  const { t, locale } = await getT();
  const courses = await db.course.findMany({
    orderBy: { order: "asc" },
    include: { _count: { select: { lessons: true, enrollments: true } } },
  });
  return (
    <div className="space-y-8">
      <div className="card overflow-x-auto p-0">
        <table className="table">
          <thead>
            <tr>
              <th>{t("admin.courses")}</th>
              <th>{t("course.lessons")}</th>
              <th>{t("admin.students")}</th>
              <th>$</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {courses.map((c) => (
              <tr key={c.id}>
                <td>
                  <Link href={`/admin/courses/${c.id}`} className="font-medium hover:text-brand-700">{pick(locale, c.titleEn, c.titleRu)}</Link>
                </td>
                <td>{c._count.lessons}</td>
                <td>{c._count.enrollments}</td>
                <td>{c.priceCents ? formatUsd(c.priceCents) : t("course.free")}</td>
                <td>
                  <span className={`badge ${c.published ? "bg-brand-100 text-brand-700" : "bg-slate-100 text-slate-500"}`}>
                    {c.published ? t("admin.published") : t("admin.draft")}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="space-y-3">
        <h2 className="h2">{t("admin.newCourse")}</h2>
        <CourseForm action={createCourse} />
      </div>
    </div>
  );
}
