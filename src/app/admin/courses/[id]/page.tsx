import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { getT } from "@/i18n/server";
import { pick } from "@/i18n";
import { createLesson, deleteCourse, updateCourse } from "@/app/actions/admin";
import { CourseForm, Field } from "@/components/admin/CourseForm";

export default async function AdminCourse({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { t, locale } = await getT();
  const course = await db.course.findUnique({
    where: { id },
    include: { lessons: { orderBy: { order: "asc" }, include: { _count: { select: { questions: true } } } } },
  });
  if (!course) notFound();
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-xl font-bold">{pick(locale, course.titleEn, course.titleRu)}</h2>
        <Link href={`/courses/${course.slug}`} className="btn-secondary py-1.5">↗</Link>
      </div>
      <CourseForm course={course} action={updateCourse.bind(null, id)} />

      <section className="space-y-3">
        <h2 className="h2">{t("course.lessons")}</h2>
        <div className="card p-0">
          <table className="table">
            <thead><tr><th>#</th><th>{t("admin.titleEn")}</th><th>YouTube</th><th>{t("admin.questions")}</th><th /></tr></thead>
            <tbody>
              {course.lessons.map((l) => (
                <tr key={l.id}>
                  <td>{l.order}</td>
                  <td><Link href={`/admin/lessons/${l.id}`} className="font-medium hover:text-brand-700">{pick(locale, l.titleEn, l.titleRu)}</Link></td>
                  <td>{l.youtubeId ? "✓" : "—"}</td>
                  <td>{l._count.questions}</td>
                  <td>{l.isPreview && <span className="badge bg-sky-100 text-sky-700">{t("course.preview")}</span>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <form action={createLesson.bind(null, id)} className="card flex flex-wrap items-end gap-3">
          <div className="min-w-60 flex-1"><Field label={t("admin.titleEn")} name="titleEn" required /></div>
          <div className="min-w-60 flex-1"><Field label={t("admin.titleRu")} name="titleRu" /></div>
          <input type="hidden" name="passScore" value="70" />
          <button className="btn-primary">{t("admin.newLesson")}</button>
        </form>
      </section>

      <form action={deleteCourse.bind(null, id)}>
        <button className="btn-danger">{t("admin.delete")}</button>
      </form>
    </div>
  );
}
