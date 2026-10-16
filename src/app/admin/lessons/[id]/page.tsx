import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { getT } from "@/i18n/server";
import { pick } from "@/i18n";
import { createQuestion, deleteLesson, deleteQuestion, updateLesson } from "@/app/actions/admin";
import { Area, Field } from "@/components/admin/CourseForm";

export default async function AdminLesson({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { t, locale } = await getT();
  const lesson = await db.lesson.findUnique({
    where: { id },
    include: { course: true, questions: { orderBy: [{ kind: "asc" }, { order: "asc" }] } },
  });
  if (!lesson) notFound();

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between gap-4">
        <div>
          <Link href={`/admin/courses/${lesson.courseId}`} className="muted">← {pick(locale, lesson.course.titleEn, lesson.course.titleRu)}</Link>
          <h2 className="text-xl font-bold">{pick(locale, lesson.titleEn, lesson.titleRu)}</h2>
        </div>
        <Link href={`/lessons/${id}`} className="btn-secondary py-1.5">↗</Link>
      </div>

      <form action={updateLesson.bind(null, id)} className="card grid gap-4 sm:grid-cols-2">
        <Field label={t("admin.titleEn")} name="titleEn" defaultValue={lesson.titleEn} required />
        <Field label={t("admin.titleRu")} name="titleRu" defaultValue={lesson.titleRu} />
        <Area label={t("admin.contentEn")} name="contentEn" defaultValue={lesson.contentEn} />
        <Area label={t("admin.contentRu")} name="contentRu" defaultValue={lesson.contentRu} />
        <Field label={t("admin.youtube")} name="youtube" defaultValue={lesson.youtubeId} placeholder="https://youtu.be/..." />
        <div className="grid grid-cols-2 gap-4">
          <Field label={t("admin.order")} name="order" type="number" defaultValue={String(lesson.order)} />
          <Field label={t("admin.passScore")} name="passScore" type="number" min={0} max={100} defaultValue={String(lesson.passScore)} />
        </div>
        <label className="flex items-center gap-2 text-sm font-medium">
          <input type="checkbox" name="isPreview" defaultChecked={lesson.isPreview} className="accent-brand-600" />
          {t("admin.isPreview")}
        </label>
        <div className="sm:col-span-2"><button className="btn-primary">{t("admin.save")}</button></div>
      </form>

      <section className="space-y-3">
        <h2 className="h2">{t("admin.questions")}</h2>
        {lesson.questions.map((q) => (
          <div key={q.id} className="card flex items-start justify-between gap-4">
            <div className="space-y-1 text-sm">
              <span className={`badge ${q.kind === "TEST" ? "bg-violet-100 text-violet-700" : "bg-amber-100 text-amber-700"}`}>
                {t(q.kind === "TEST" ? "lesson.step.test" : "lesson.step.homework")}
              </span>
              <p className="font-medium">{q.promptEn}</p>
              {q.promptRu && <p className="text-slate-500">{q.promptRu}</p>}
              {q.type === "CHOICE" ? (
                <ol className="list-decimal pl-5">
                  {q.optionsEn.map((o, i) => (
                    <li key={i} className={i === q.correctIndex ? "font-semibold text-brand-700" : ""}>
                      {o}
                      {q.optionsRu[i] ? ` / ${q.optionsRu[i]}` : ""}
                    </li>
                  ))}
                </ol>
              ) : (
                <p className="text-brand-700">= {q.correctNumber} (± {q.tolerance})</p>
              )}
            </div>
            <form action={deleteQuestion.bind(null, q.id)}>
              <button className="btn-danger py-1">{t("admin.delete")}</button>
            </form>
          </div>
        ))}

        <form action={createQuestion.bind(null, id)} className="card grid gap-4 sm:grid-cols-2">
          <h3 className="h2 sm:col-span-2">{t("admin.newQuestion")}</h3>
          <div>
            <label className="label">{t("admin.kind")}</label>
            <select name="kind" className="input">
              <option value="HOMEWORK">{t("lesson.step.homework")}</option>
              <option value="TEST">{t("lesson.step.test")}</option>
            </select>
          </div>
          <div>
            <label className="label">{t("admin.qtype")}</label>
            <select name="type" className="input">
              <option value="CHOICE">{t("admin.choice")}</option>
              <option value="NUMBER">{t("admin.number")}</option>
            </select>
          </div>
          <Field label={t("admin.promptEn")} name="promptEn" required />
          <Field label={t("admin.promptRu")} name="promptRu" />
          <Area label={t("admin.optionsEn")} name="optionsEn" />
          <Area label={t("admin.optionsRu")} name="optionsRu" />
          <Field label={t("admin.correctIndex")} name="correctIndex" type="number" min={1} defaultValue="1" />
          <div className="grid grid-cols-2 gap-4">
            <Field label={t("admin.correctNumber")} name="correctNumber" type="number" step="any" />
            <Field label={t("admin.tolerance")} name="tolerance" type="number" step="any" defaultValue="0.01" />
          </div>
          <div className="sm:col-span-2"><button className="btn-primary">{t("admin.newQuestion")}</button></div>
        </form>
      </section>

      <form action={deleteLesson.bind(null, id)}>
        <button className="btn-danger">{t("admin.delete")}</button>
      </form>
    </div>
  );
}
