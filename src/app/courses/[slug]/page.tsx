import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { formatUsd, getCourseState } from "@/lib/learning";
import { fulfillCheckout, stripeEnabled } from "@/lib/stripe";
import { startCheckout } from "@/app/actions/learning";
import { getT } from "@/i18n/server";
import { pick } from "@/i18n";
import { ProgressBar } from "@/components/ProgressBar";
import { LessonBadge } from "@/components/LessonBadge";

export default async function CoursePage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ paid?: string; canceled?: string; session_id?: string }>;
}) {
  const { slug } = await params;
  const sp = await searchParams;
  const { t, locale } = await getT();
  const user = await getCurrentUser();
  const course = await db.course.findUnique({ where: { slug } });
  if (!course || (!course.published && user?.role !== "ADMIN")) notFound();
  // The webhook normally grants access; this covers the case where the student returns before it arrives.
  if (sp.session_id && stripeEnabled) await fulfillCheckout(sp.session_id).catch(() => false);
  const state = await getCourseState(user, course.id);
  const next = state.lessons.find((l) => l.status === "open");

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
      <div className="space-y-6">
        <div>
          <h1 className="h1">{pick(locale, course.titleEn, course.titleRu)}</h1>
          <p className="mt-2 whitespace-pre-line text-slate-600">{pick(locale, course.descriptionEn, course.descriptionRu)}</p>
        </div>
        {sp.paid && <p className="rounded-xl bg-brand-50 px-4 py-3 text-brand-900">{t("course.paid")}</p>}
        {sp.canceled && <p className="rounded-xl bg-amber-50 px-4 py-3 text-amber-900">{t("course.canceled")}</p>}
        <div className="card p-0">
          <h2 className="h2 border-b border-slate-100 px-5 py-4">{t("course.lessons")}</h2>
          <ol>
            {state.lessons.map((l, i) => (
              <li key={l.id} className="flex items-center gap-4 border-b border-slate-100 px-5 py-3 last:border-0">
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-slate-100 text-sm font-semibold">{i + 1}</span>
                <div className="min-w-0 flex-1">
                  {l.status === "locked" ? (
                    <span className="text-slate-400">{pick(locale, l.titleEn, l.titleRu)}</span>
                  ) : (
                    <Link href={`/lessons/${l.id}`} className="font-medium hover:text-brand-700">
                      {pick(locale, l.titleEn, l.titleRu)}
                    </Link>
                  )}
                  {l.isPreview && !state.access && <span className="badge ml-2 bg-sky-100 text-sky-700">{t("course.preview")}</span>}
                </div>
                <LessonBadge status={l.status} />
              </li>
            ))}
          </ol>
        </div>
      </div>

      <aside className="space-y-4">
        <div className="card space-y-4">
          {state.access ? (
            <>
              <p className="font-semibold text-brand-700">{t("course.owned")}</p>
              <div>
                <ProgressBar value={state.percent} />
                <p className="muted mt-2">{t("dash.lessonsDone", { done: state.done, total: state.total })}</p>
              </div>
              {next && <Link href={`/lessons/${next.id}`} className="btn-primary w-full">{t("dash.continue")}</Link>}
            </>
          ) : (
            <>
              <p className="text-3xl font-bold">{course.priceCents ? formatUsd(course.priceCents) : t("course.free")}</p>
              {user ? (
                <form action={startCheckout.bind(null, course.id)}>
                  <button className="btn-primary w-full">
                    {course.priceCents === 0
                      ? t("course.enroll")
                      : stripeEnabled
                        ? t("course.buy", { price: formatUsd(course.priceCents) })
                        : t("course.devUnlock")}
                  </button>
                </form>
              ) : (
                <Link href={`/login?next=/courses/${course.slug}`} className="btn-primary w-full">{t("course.loginToBuy")}</Link>
              )}
            </>
          )}
        </div>
      </aside>
    </div>
  );
}
