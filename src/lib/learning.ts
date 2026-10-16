import "server-only";
import { db } from "./db";
import type { SessionUser } from "./auth";

export type LessonStatus = "locked" | "open" | "done";

export type LessonState = {
  id: string;
  order: number;
  titleEn: string;
  titleRu: string;
  isPreview: boolean;
  passScore: number;
  youtubeId: string;
  hwCount: number;
  testCount: number;
  videoDone: boolean;
  homeworkDone: boolean;
  testDone: boolean;
  homeworkScore: number | null;
  testScore: number | null;
  status: LessonStatus;
  lockReason: "buy" | "previous" | null;
};

export async function hasCourseAccess(user: SessionUser | null, course: { id: string; priceCents: number }) {
  if (!user) return false;
  if (user.role === "ADMIN") return true;
  const enrollment = await db.enrollment.findUnique({
    where: { userId_courseId: { userId: user.id, courseId: course.id } },
  });
  return !!enrollment;
}

/**
 * Works out, lesson by lesson, what the student has finished and what is open.
 * A lesson opens when the previous one is complete: homework passed and the
 * test on that lesson passed. Steps with no questions count as passed.
 */
export async function getCourseState(user: SessionUser | null, courseId: string) {
  const course = await db.course.findUniqueOrThrow({
    where: { id: courseId },
    include: {
      lessons: {
        orderBy: { order: "asc" },
        include: { questions: { select: { kind: true } } },
      },
    },
  });
  const access = await hasCourseAccess(user, course);
  const progress = user
    ? await db.lessonProgress.findMany({
        where: { userId: user.id, lessonId: { in: course.lessons.map((l) => l.id) } },
      })
    : [];
  const byLesson = new Map(progress.map((p) => [p.lessonId, p]));
  const isAdmin = user?.role === "ADMIN";

  let previousDone = true;
  const lessons: LessonState[] = course.lessons.map((l) => {
    const p = byLesson.get(l.id);
    const hwCount = l.questions.filter((q) => q.kind === "HOMEWORK").length;
    const testCount = l.questions.filter((q) => q.kind === "TEST").length;
    const videoDone = !l.youtubeId || !!p?.videoWatchedAt;
    const homeworkDone = !!p?.homeworkPassedAt || (hwCount === 0 && videoDone);
    const testDone = !!p?.testPassedAt || (testCount === 0 && homeworkDone);
    const complete = videoDone && homeworkDone && testDone;

    let lockReason: LessonState["lockReason"] = null;
    if (!isAdmin) {
      if (!user || (!access && !l.isPreview)) lockReason = "buy";
      else if (!previousDone) lockReason = "previous";
    }
    const status: LessonStatus = lockReason ? "locked" : complete && user ? "done" : "open";
    previousDone = previousDone && complete && !!user;

    return {
      id: l.id,
      order: l.order,
      titleEn: l.titleEn,
      titleRu: l.titleRu,
      isPreview: l.isPreview,
      passScore: l.passScore,
      youtubeId: l.youtubeId,
      hwCount,
      testCount,
      videoDone,
      homeworkDone,
      testDone,
      homeworkScore: p?.homeworkScore ?? null,
      testScore: p?.testScore ?? null,
      status,
      lockReason,
    };
  });

  const done = lessons.filter((l) => l.status === "done").length;
  return {
    course,
    access,
    lessons,
    done,
    total: lessons.length,
    percent: lessons.length ? Math.round((done / lessons.length) * 100) : 0,
  };
}

/** Accepts a full YouTube URL (watch, youtu.be, embed, shorts) or a bare 11-char video id. */
export function parseYoutubeId(input: string) {
  const s = input.trim();
  if (!s) return "";
  if (/^[\w-]{11}$/.test(s)) return s;
  const m = s.match(/(?:v=|youtu\.be\/|embed\/|shorts\/|live\/)([\w-]{11})/);
  return m ? m[1] : "";
}

export function formatUsd(cents: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(cents / 100);
}
