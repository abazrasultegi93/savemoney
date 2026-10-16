import { getT } from "@/i18n/server";
import type { Course } from "@prisma/client";

export async function CourseForm({ course, action }: { course?: Course; action: (f: FormData) => Promise<void> }) {
  const { t } = await getT();
  return (
    <form action={action} className="card grid gap-4 sm:grid-cols-2">
      <Field label={t("admin.titleEn")} name="titleEn" defaultValue={course?.titleEn} required />
      <Field label={t("admin.titleRu")} name="titleRu" defaultValue={course?.titleRu} />
      <Area label={t("admin.descEn")} name="descriptionEn" defaultValue={course?.descriptionEn} />
      <Area label={t("admin.descRu")} name="descriptionRu" defaultValue={course?.descriptionRu} />
      <Field label={t("admin.slug")} name="slug" defaultValue={course?.slug} />
      <Field label={t("admin.price")} name="price" type="number" step="0.01" defaultValue={course ? String(course.priceCents / 100) : "0"} />
      <Field label={t("admin.order")} name="order" type="number" defaultValue={String(course?.order ?? 0)} />
      <label className="flex items-center gap-2 self-end pb-2 text-sm font-medium">
        <input type="checkbox" name="published" defaultChecked={course?.published} className="accent-brand-600" />
        {t("admin.published")}
      </label>
      <div className="sm:col-span-2">
        <button className="btn-primary">{t("admin.save")}</button>
      </div>
    </form>
  );
}

export function Field({ label, ...props }: { label: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div>
      <label className="label">{label}</label>
      <input className="input" {...props} />
    </div>
  );
}

export function Area({ label, ...props }: { label: string } & React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <div>
      <label className="label">{label}</label>
      <textarea className="input min-h-28" {...props} />
    </div>
  );
}
