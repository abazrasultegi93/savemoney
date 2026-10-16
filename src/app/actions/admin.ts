"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { parseYoutubeId } from "@/lib/learning";

const str = (f: FormData, k: string) => String(f.get(k) ?? "").trim();
const int = (f: FormData, k: string, d = 0) => {
  const n = Number(str(f, k).replace(",", "."));
  return Number.isFinite(n) ? n : d;
};
const lines = (s: string) => s.split("\n").map((x) => x.trim()).filter(Boolean);
const slugify = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || `course-${Date.now()}`;

function courseData(f: FormData) {
  return {
    titleEn: str(f, "titleEn"),
    titleRu: str(f, "titleRu"),
    descriptionEn: str(f, "descriptionEn"),
    descriptionRu: str(f, "descriptionRu"),
    priceCents: Math.max(0, Math.round(int(f, "price") * 100)),
    order: Math.round(int(f, "order")),
    published: f.get("published") === "on",
  };
}

export async function createCourse(f: FormData) {
  await requireAdmin();
  const data = courseData(f);
  const course = await db.course.create({ data: { ...data, slug: slugify(str(f, "slug") || data.titleEn) } });
  redirect(`/admin/courses/${course.id}`);
}

export async function updateCourse(id: string, f: FormData) {
  await requireAdmin();
  await db.course.update({ where: { id }, data: { ...courseData(f), slug: slugify(str(f, "slug")) } });
  revalidatePath(`/admin/courses/${id}`);
}

export async function deleteCourse(id: string) {
  await requireAdmin();
  await db.course.delete({ where: { id } });
  redirect("/admin");
}

function lessonData(f: FormData) {
  return {
    titleEn: str(f, "titleEn"),
    titleRu: str(f, "titleRu"),
    contentEn: str(f, "contentEn"),
    contentRu: str(f, "contentRu"),
    youtubeId: parseYoutubeId(str(f, "youtube")),
    isPreview: f.get("isPreview") === "on",
    passScore: Math.min(100, Math.max(0, Math.round(int(f, "passScore", 70)))),
    order: Math.round(int(f, "order")),
  };
}

export async function createLesson(courseId: string, f: FormData) {
  await requireAdmin();
  const last = await db.lesson.findFirst({ where: { courseId }, orderBy: { order: "desc" } });
  const data = lessonData(f);
  const lesson = await db.lesson.create({ data: { ...data, courseId, order: (last?.order ?? 0) + 1 } });
  redirect(`/admin/lessons/${lesson.id}`);
}

export async function updateLesson(id: string, f: FormData) {
  await requireAdmin();
  await db.lesson.update({ where: { id }, data: lessonData(f) });
  revalidatePath(`/admin/lessons/${id}`);
}

export async function deleteLesson(id: string) {
  await requireAdmin();
  const lesson = await db.lesson.delete({ where: { id } });
  redirect(`/admin/courses/${lesson.courseId}`);
}

export async function createQuestion(lessonId: string, f: FormData) {
  await requireAdmin();
  const type = str(f, "type") === "NUMBER" ? "NUMBER" : "CHOICE";
  const count = await db.question.count({ where: { lessonId } });
  await db.question.create({
    data: {
      lessonId,
      kind: str(f, "kind") === "TEST" ? "TEST" : "HOMEWORK",
      type,
      order: count + 1,
      promptEn: str(f, "promptEn"),
      promptRu: str(f, "promptRu"),
      optionsEn: type === "CHOICE" ? lines(str(f, "optionsEn")) : [],
      optionsRu: type === "CHOICE" ? lines(str(f, "optionsRu")) : [],
      correctIndex: type === "CHOICE" ? Math.max(0, Math.round(int(f, "correctIndex", 1)) - 1) : null,
      correctNumber: type === "NUMBER" ? int(f, "correctNumber") : null,
      tolerance: type === "NUMBER" ? Math.abs(int(f, "tolerance", 0.01)) : 0.01,
    },
  });
  revalidatePath(`/admin/lessons/${lessonId}`);
}

export async function deleteQuestion(id: string) {
  await requireAdmin();
  const q = await db.question.delete({ where: { id } });
  revalidatePath(`/admin/lessons/${q.lessonId}`);
}

export async function grantAccess(userId: string, courseId: string) {
  await requireAdmin();
  await db.enrollment.upsert({
    where: { userId_courseId: { userId, courseId } },
    create: { userId, courseId, source: "admin" },
    update: {},
  });
  revalidatePath("/admin/students");
  revalidatePath(`/admin/students/${userId}`);
}

export async function revokeAccess(userId: string, courseId: string) {
  await requireAdmin();
  await db.enrollment.deleteMany({ where: { userId, courseId } });
  revalidatePath("/admin/students");
  revalidatePath(`/admin/students/${userId}`);
}
