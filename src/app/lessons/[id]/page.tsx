import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { getCourseState } from "@/lib/learning";
import { markVideoWatched } from "@/app/actions/learning";
import { getT } from "@/i18n/server";
import { pick } from "@/i18n";
import { Quiz, type QuizQuestion } from "@/components/Quiz";

export default async function LessonPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireUser();
  const { t, locale } = await getT();
  const lesson = await db.lesson.findUnique({
    where: { id },
    include: { course: true, questions: { orderBy: { order: "asc" } } },
  });
  if (!lesson) notFound();
  const state = await getCourseState(user, lesson.courseId);
  const idx = state.lessons.findIndex((l) => l.id === id);
  const ls = state.lessons[idx];
  const nextLesson = state.lessons[idx + 1];
  const title = pick(locale, lesson.titleEn, lesson.titleRu);
  const courseHref = `/courses/${lesson.course.slug}`;

  if (ls.status === "locked") {
    return (
      <div className="mx-auto max-w-lg card text-center">
        <div className="text-4xl">🔒</div>
        <h1 className="h1 mt-2">{t("lesson.lockedTitle")}</h1>
        <p className="muted mt-2">{ls.lockReason === "buy" ? t("lesson.lockedBuy") : t("lesson.lockedPrev")}</p>
        <Link href={courseHref} className="btn-primary mt-6">{t("lesson.back")}</Link>
      </div>
    );
  }

  const toQuiz = (kind: "HOMEWORK" | "TEST"): QuizQuestion[] =>
    lesson.questions
      .filter((q) => q.kind === kind)
      .map((q) => ({
        id: q.id,
        type: q.type,
        prompt: pick(locale, q.promptEn, q.promptRu),
        options: locale === "ru" && q.optionsRu.length ? q.optionsRu : q.optionsEn,
      }));
  const attempts = await db.attempt.groupBy({
    by: ["kind"],
    where: { userId: user.id, lessonId: id },
    _count: true,
  });
  const attemptCount = (k: "HOMEWORK" | "TEST") => attempts.find((a) => a.kind === k)?._count ?? 0;

  const steps = [
    { label: t("lesson.step.video"), done: ls.videoDone },
    { label: t("lesson.step.homework"), done: ls.homeworkDone },
    { label: t("lesson.step.test"), done: ls.testDone },
  ];
  const content = pick(locale, lesson.contentEn, lesson.contentRu);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <Link href={courseHref} className="muted hover:text-slate-900">← {pick(locale, lesson.course.titleEn, lesson.course.titleRu)}</Link>
        <p className="mt-3 text-sm font-semibold uppercase tracking-wide text-brand-700">{t("lesson.lesson", { n: idx + 1 })}</p>
        <h1 className="h1">{title}</h1>
        <ol className="mt-4 flex flex-wrap gap-2">
          {steps.map((s, i) => (
            <li key={i} className={`badge ${s.done ? "bg-brand-100 text-brand-700" : "bg-slate-100 text-slate-500"}`}>
              {s.done ? "✓" : i + 1} {s.label}
            </li>
          ))}
        </ol>
      </div>

      <section className="card space-y-4">
        {lesson.youtubeId ? (
          <div className="aspect-video overflow-hidden rounded-xl bg-black">
            <iframe
              className="h-full w-full"
              src={`https://www.youtube-nocookie.com/embed/${lesson.youtubeId}?rel=0&modestbranding=1`}
              title={title}
              allow="accelerometer; encrypted-media; gyroscope; picture-in-picture; fullscreen"
              allowFullScreen
            />
          </div>
        ) : (
          <p className="muted">{t("lesson.noVideo")}</p>
        )}
        {content && <div className="prose-lesson whitespace-pre-line text-slate-700">{content}</div>}
        {lesson.youtubeId &&
          (ls.videoDone ? (
            <p className="text-sm font-semibold text-brand-700">✓ {t("lesson.watched")}</p>
          ) : (
            <form action={markVideoWatched.bind(null, id)}>
              <button className="btn-primary">{t("lesson.markWatched")}</button>
            </form>
          ))}
      </section>

      <section className="card space-y-4">
        <div className="flex items-baseline justify-between gap-4">
          <h2 className="h2">{t("lesson.homework.title")}</h2>
          {attemptCount("HOMEWORK") > 0 && <span className="muted">{t("lesson.attempts", { n: attemptCount("HOMEWORK") })}</span>}
        </div>
        {!ls.videoDone ? (
          <p className="muted">{t("lesson.homework.locked")}</p>
        ) : ls.hwCount === 0 ? (
          <p className="muted">{t("lesson.noQuestions")}</p>
        ) : ls.homeworkDone ? (
          <p className="font-medium text-brand-700">✓ {t("lesson.homework.passed", { score: ls.homeworkScore ?? 100 })}</p>
        ) : (
          <>
            <p className="muted">{t("lesson.homework.intro", { score: lesson.passScore })}</p>
            <Quiz lessonId={id} kind="HOMEWORK" questions={toQuiz("HOMEWORK")} />
          </>
        )}
      </section>

      <section className="card space-y-4">
        <div className="flex items-baseline justify-between gap-4">
          <h2 className="h2">{t("lesson.test.title")}</h2>
          {attemptCount("TEST") > 0 && <span className="muted">{t("lesson.attempts", { n: attemptCount("TEST") })}</span>}
        </div>
        {!ls.homeworkDone ? (
          <p className="muted">{t("lesson.test.locked")}</p>
        ) : ls.testCount === 0 ? (
          <p className="muted">{t("lesson.noQuestions")}</p>
        ) : ls.testDone ? (
          <p className="font-medium text-brand-700">✓ {t("lesson.test.passed", { score: ls.testScore ?? 100 })}</p>
        ) : (
          <>
            <p className="muted">{t("lesson.test.intro", { score: lesson.passScore })}</p>
            <Quiz lessonId={id} kind="TEST" questions={toQuiz("TEST")} />
          </>
        )}
      </section>

      {ls.status === "done" && (
        <div className="flex justify-end">
          {nextLesson ? (
            nextLesson.status !== "locked" ? (
              <Link href={`/lessons/${nextLesson.id}`} className="btn-primary">{t("lesson.next")} →</Link>
            ) : (
              <Link href={courseHref} className="btn-primary">{t("lesson.lockedBuy")}</Link>
            )
          ) : (
            <p className="font-semibold text-brand-700">🎉 {t("lesson.courseDone")}</p>
          )}
        </div>
      )}
    </div>
  );
}
