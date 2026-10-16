import Link from "next/link";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { formatUsd, getCourseState } from "@/lib/learning";
import { currentMonth, getMonth } from "@/lib/budget";
import { getT } from "@/i18n/server";
import { pick } from "@/i18n";
import { ProgressBar } from "@/components/ProgressBar";

export default async function Dashboard() {
  const user = await requireUser();
  const { t, locale } = await getT();
  const enrollments = await db.enrollment.findMany({
    where: { userId: user.id },
    include: { course: true },
    orderBy: { createdAt: "asc" },
  });
  const courses = await Promise.all(enrollments.map((e) => getCourseState(user, e.courseId)));
  const done = courses.reduce((s, c) => s + c.done, 0);
  const total = courses.reduce((s, c) => s + c.total, 0);

  const passedTests = await db.lessonProgress.aggregate({
    where: { userId: user.id, testScore: { not: null } },
    _avg: { testScore: true },
  });
  const recent = await db.attempt.findMany({
    where: { userId: user.id },
    include: { lesson: true },
    orderBy: { createdAt: "desc" },
    take: 6,
  });
  const month = await getMonth(user.id, currentMonth());
  const dateFmt = new Intl.DateTimeFormat(locale === "ru" ? "ru-RU" : "en-US", { dateStyle: "medium", timeStyle: "short" });

  return (
    <div className="space-y-6">
      <h1 className="h1">{t("dash.hello", { name: user.name })}</h1>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="card">
          <p className="muted">{t("dash.progress")}</p>
          <p className="mt-1 text-3xl font-bold">{total ? Math.round((done / total) * 100) : 0}%</p>
          <ProgressBar value={total ? (done / total) * 100 : 0} className="mt-3" />
          <p className="muted mt-2">{t("dash.lessonsDone", { done, total })}</p>
        </div>
        <div className="card">
          <p className="muted">{t("dash.avgScore")}</p>
          <p className="mt-1 text-3xl font-bold">
            {passedTests._avg.testScore != null ? `${Math.round(passedTests._avg.testScore)}%` : "—"}
          </p>
        </div>
        <Link href="/tools/budget" className="card transition hover:border-brand-500">
          <p className="muted">{t("dash.monthBalance")}</p>
          <p className={`mt-1 text-3xl font-bold ${month.balance < 0 ? "text-red-600" : ""}`}>{formatUsd(month.balance)}</p>
          <p className="muted mt-2">
            +{formatUsd(month.income)} / −{formatUsd(month.expense)}
          </p>
        </Link>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <section className="space-y-3">
          <h2 className="h2">{t("dash.myCourses")}</h2>
          {courses.length === 0 && (
            <div className="card">
              <p className="muted">{t("dash.noCourses")}</p>
              <Link href="/courses" className="btn-primary mt-4">{t("dash.browse")}</Link>
            </div>
          )}
          {courses.map((c) => {
            const next = c.lessons.find((l) => l.status === "open");
            return (
              <div key={c.course.id} className="card">
                <div className="flex items-start justify-between gap-4">
                  <Link href={`/courses/${c.course.slug}`} className="font-semibold hover:text-brand-700">
                    {pick(locale, c.course.titleEn, c.course.titleRu)}
                  </Link>
                  <span className="text-sm font-semibold text-brand-700">{c.percent}%</span>
                </div>
                <ProgressBar value={c.percent} className="mt-3" />
                <div className="mt-3 flex items-center justify-between gap-4">
                  <p className="muted">{t("dash.lessonsDone", { done: c.done, total: c.total })}</p>
                  {next && (
                    <Link href={`/lessons/${next.id}`} className="btn-primary py-1.5">
                      {t("dash.continue")}: {pick(locale, next.titleEn, next.titleRu)}
                    </Link>
                  )}
                </div>
              </div>
            );
          })}
        </section>

        <section className="space-y-3">
          <h2 className="h2">{t("dash.recent")}</h2>
          <div className="card space-y-3">
            {recent.length === 0 && <p className="muted">{t("dash.noActivity")}</p>}
            {recent.map((a) => (
              <div key={a.id} className="flex items-center justify-between gap-3 text-sm">
                <div className="min-w-0">
                  <p className="truncate font-medium">{pick(locale, a.lesson.titleEn, a.lesson.titleRu)}</p>
                  <p className="text-xs text-slate-500">
                    {t(a.kind === "HOMEWORK" ? "lesson.step.homework" : "lesson.step.test")} · {dateFmt.format(a.createdAt)}
                  </p>
                </div>
                <span className={`badge ${a.passed ? "bg-brand-100 text-brand-700" : "bg-red-100 text-red-700"}`}>{a.score}%</span>
              </div>
            ))}
          </div>
          <h2 className="h2 pt-3">{t("dash.tools")}</h2>
          <div className="grid gap-2">
            <Link href="/tools/budget" className="btn-secondary justify-start">💵 {t("tools.budget")}</Link>
            <Link href="/tools/savings" className="btn-secondary justify-start">📊 {t("tools.savings")}</Link>
            <Link href="/tools/loan" className="btn-secondary justify-start">🏦 {t("tools.loan")}</Link>
          </div>
        </section>
      </div>
    </div>
  );
}
