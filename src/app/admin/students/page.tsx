import Link from "next/link";
import { db } from "@/lib/db";
import { getT } from "@/i18n/server";
import { pick } from "@/i18n";
import { getCourseState } from "@/lib/learning";
import { ProgressBar } from "@/components/ProgressBar";

export default async function AdminStudents() {
  const { t, locale } = await getT();
  const students = await db.user.findMany({
    where: { role: "STUDENT" },
    orderBy: { createdAt: "desc" },
    include: { enrollments: { include: { course: true } } },
    take: 200,
  });
  const rows = await Promise.all(
    students.map(async (s) => {
      const user = { id: s.id, email: s.email, name: s.name, role: s.role, locale: s.locale };
      const states = await Promise.all(s.enrollments.map((e) => getCourseState(user, e.courseId)));
      return { s, states };
    }),
  );
  const fmt = new Intl.DateTimeFormat(locale === "ru" ? "ru-RU" : "en-US", { dateStyle: "medium" });

  return (
    <div className="card overflow-x-auto p-0">
      <table className="table">
        <thead>
          <tr><th>{t("admin.student")}</th><th>{t("admin.joined")}</th><th>{t("admin.progress")}</th></tr>
        </thead>
        <tbody>
          {rows.map(({ s, states }) => (
            <tr key={s.id}>
              <td>
                <Link href={`/admin/students/${s.id}`} className="font-medium hover:text-brand-700">{s.name}</Link>
                <p className="text-xs text-slate-500">{s.email}</p>
              </td>
              <td className="whitespace-nowrap text-slate-500">{fmt.format(s.createdAt)}</td>
              <td className="min-w-64 space-y-2">
                {states.length === 0 && <span className="text-slate-400">—</span>}
                {states.map((st) => (
                  <div key={st.course.id}>
                    <div className="flex justify-between text-xs">
                      <span>{pick(locale, st.course.titleEn, st.course.titleRu)}</span>
                      <span>{st.done}/{st.total}</span>
                    </div>
                    <ProgressBar value={st.percent} className="mt-1" />
                  </div>
                ))}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
