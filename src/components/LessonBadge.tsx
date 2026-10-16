import { getT } from "@/i18n/server";
import type { LessonStatus } from "@/lib/learning";

export async function LessonBadge({ status }: { status: LessonStatus }) {
  const { t } = await getT();
  if (status === "done") return <span className="badge bg-brand-100 text-brand-700">✓ {t("course.done")}</span>;
  if (status === "locked") return <span className="badge bg-slate-100 text-slate-500">🔒 {t("course.locked")}</span>;
  return <span className="badge bg-amber-100 text-amber-700">{t("course.inProgress")}</span>;
}
