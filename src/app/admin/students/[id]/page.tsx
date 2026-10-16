import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { getT } from "@/i18n/server";
import { pick } from "@/i18n";
import { getCourseState } from "@/lib/learning";
import { grantAccess, revokeAccess } from "@/app/actions/admin";
import { ProgressBar } from "@/components/ProgressBar";
import { LessonBadge } from "@/components/LessonBadge";

export default async function AdminStudent({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { t, locale } = await getT();
  const s = await db.user.findUnique({ where: { id }, include: { enrollments: true } });
  if (!s) notFound();
  const user = { id: s.id, email: s.email, name: s.name, role: s.role, locale: s.locale };
  const courses = await db.course.findMany({ orderBy: { order: "asc" } });
  const enrolled = new Set(s.enrollments.map((e) => e.courseId));
  const states = await Promise.all(courses.filter((c) => enrolled.has(c.id)).map((c) => getCourseState(user, c.id)));
  const attempts = await db.attempt.groupBy({ by: ["lessonId"], where: { userId: id }, _count: true });
  const attemptsBy = new Map(attempts.map((a) => [a.lessonId, a._count]));

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold">{s.name}</h2>
        <p className="muted">{s.email}</p>
      </div>

      <div className="card space-y-2">
        <h3 className="h2">{t("admin.access")}</h3>
        {courses.map((c) => (
          <div key={c.id} className="flex items-center justify-between gap-4 text-sm">
            <span>{pick(locale, c.titleEn, c.titleRu)}</span>
            {enrolled.has(c.id) ? (
              <form action={revokeAccess.bind(null, id, c.id)}><button className="btn-danger py-1">{t("admin.revoke")}</button></form>
            ) : (
              <form action={grantAccess.bind(null, id, c.id)}><button className="btn-secondary py-1">{t("admin.grant")}</button></form>
            )}
          </div>
        ))}
      </div>

      {states.map((st) => (
        <div key={st.course.id} className="card space-y-3 p-0">
          <div className="px-5 pt-5">
            <div className="flex justify-between">
              <h3 className="h2">{pick(locale, st.course.titleEn, st.course.titleRu)}</h3>
              <span className="font-semibold text-brand-700">{st.percent}%</span>
            </div>
            <ProgressBar value={st.percent} className="mt-2" />
          </div>
          <table className="table">
            <thead>
              <tr><th>#</th><th>{t("course.lessons")}</th><th>{t("lesson.step.video")}</th><th>{t("lesson.step.homework")}</th><th>{t("lesson.step.test")}</th><th>{t("lesson.attempts", { n: "" }).replace(/[:：]?\s*$/, "")}</th><th /></tr>
            </thead>
            <tbody>
              {st.lessons.map((l, i) => (
                <tr key={l.id}>
                  <td>{i + 1}</td>
                  <td>{pick(locale, l.titleEn, l.titleRu)}</td>
                  <td>{l.videoDone && l.status !== "locked" ? "✓" : "—"}</td>
                  <td>{l.homeworkScore != null ? `${l.homeworkScore}%` : l.homeworkDone ? "✓" : "—"}</td>
                  <td>{l.testScore != null ? `${l.testScore}%` : l.testDone ? "✓" : "—"}</td>
                  <td>{attemptsBy.get(l.id) ?? 0}</td>
                  <td><LessonBadge status={l.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}
    </div>
  );
}
