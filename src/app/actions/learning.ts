"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { getCourseState } from "@/lib/learning";
import { appUrl, getStripe, stripeEnabled } from "@/lib/stripe";
import { getLocale } from "@/i18n/server";

export async function startCheckout(courseId: string) {
  const user = await requireUser();
  const course = await db.course.findUniqueOrThrow({ where: { id: courseId } });
  const locale = await getLocale();

  if (course.priceCents === 0) {
    await db.enrollment.upsert({
      where: { userId_courseId: { userId: user.id, courseId } },
      create: { userId: user.id, courseId, source: "free" },
      update: {},
    });
    redirect(`/courses/${course.slug}`);
  }

  if (!stripeEnabled) {
    // Development fallback so the full flow can be tried without Stripe keys.
    if (process.env.NODE_ENV === "production") throw new Error("Stripe is not configured");
    await db.enrollment.upsert({
      where: { userId_courseId: { userId: user.id, courseId } },
      create: { userId: user.id, courseId, source: "dev" },
      update: {},
    });
    redirect(`/courses/${course.slug}?paid=1`);
  }

  const session = await getStripe().checkout.sessions.create({
    mode: "payment",
    customer_email: user.email,
    locale: locale === "ru" ? "ru" : "en",
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: "usd",
          unit_amount: course.priceCents,
          product_data: { name: locale === "ru" ? course.titleRu || course.titleEn : course.titleEn },
        },
      },
    ],
    metadata: { userId: user.id, courseId: course.id },
    success_url: `${appUrl()}/courses/${course.slug}?paid=1&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${appUrl()}/courses/${course.slug}?canceled=1`,
  });
  redirect(session.url!);
}

async function lessonForUser(lessonId: string) {
  const user = await requireUser();
  const lesson = await db.lesson.findUniqueOrThrow({ where: { id: lessonId } });
  const state = await getCourseState(user, lesson.courseId);
  const ls = state.lessons.find((l) => l.id === lessonId)!;
  if (ls.status === "locked") throw new Error("Lesson is locked");
  return { user, lesson, ls };
}

export async function markVideoWatched(lessonId: string) {
  const { user } = await lessonForUser(lessonId);
  await db.lessonProgress.upsert({
    where: { userId_lessonId: { userId: user.id, lessonId } },
    create: { userId: user.id, lessonId, videoWatchedAt: new Date() },
    update: { videoWatchedAt: new Date() },
  });
  revalidatePath(`/lessons/${lessonId}`);
}

export type QuizResult = { score: number; passed: boolean; need: number; correct: Record<string, boolean> } | null;

/** Grades homework or the end-of-lesson test on the server; correct answers never reach the browser. */
export async function submitQuiz(
  lessonId: string,
  kind: "HOMEWORK" | "TEST",
  _prev: QuizResult,
  form: FormData,
): Promise<QuizResult> {
  const { user, lesson, ls } = await lessonForUser(lessonId);
  if (kind === "HOMEWORK" && !ls.videoDone) throw new Error("Watch the video first");
  if (kind === "TEST" && !ls.homeworkDone) throw new Error("Pass the homework first");

  const questions = await db.question.findMany({ where: { lessonId, kind } });
  const correct: Record<string, boolean> = {};
  const answers: Record<string, string> = {};
  for (const q of questions) {
    const raw = String(form.get(q.id) ?? "").trim();
    answers[q.id] = raw;
    if (q.type === "CHOICE") {
      correct[q.id] = raw !== "" && Number(raw) === q.correctIndex;
    } else {
      const n = Number(raw.replace(/\s/g, "").replace(",", "."));
      correct[q.id] = raw !== "" && Number.isFinite(n) && q.correctNumber != null && Math.abs(n - q.correctNumber) <= q.tolerance;
    }
  }
  const right = Object.values(correct).filter(Boolean).length;
  const score = questions.length ? Math.round((right / questions.length) * 100) : 100;
  const passed = score >= lesson.passScore;

  await db.attempt.create({ data: { userId: user.id, lessonId, kind, score, passed, answers } });
  if (passed) {
    const now = new Date();
    const data = kind === "HOMEWORK" ? { homeworkPassedAt: now, homeworkScore: score } : { testPassedAt: now, testScore: score };
    await db.lessonProgress.upsert({
      where: { userId_lessonId: { userId: user.id, lessonId } },
      create: { userId: user.id, lessonId, ...data },
      update: data,
    });
  }
  revalidatePath(`/lessons/${lessonId}`);
  return { score, passed, need: lesson.passScore, correct };
}
