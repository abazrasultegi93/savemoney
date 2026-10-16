"use client";
import { useActionState, startTransition } from "react";
import { submitQuiz, type QuizResult } from "@/app/actions/learning";
import { useT } from "@/i18n/client";

export type QuizQuestion = { id: string; type: "CHOICE" | "NUMBER"; prompt: string; options: string[] };

export function Quiz({ lessonId, kind, questions }: { lessonId: string; kind: "HOMEWORK" | "TEST"; questions: QuizQuestion[] }) {
  const { t } = useT();
  const [result, action, pending] = useActionState<QuizResult, FormData>(submitQuiz.bind(null, lessonId, kind), null);

  return (
    // onSubmit instead of action={...}: React resets action forms, and a student who failed should keep their answers.
    <form
      className="space-y-5"
      onSubmit={(e) => {
        e.preventDefault();
        const data = new FormData(e.currentTarget);
        startTransition(() => action(data));
      }}
    >
      {questions.map((q, i) => {
        const mark = result ? (result.correct[q.id] ? "border-brand-500 bg-brand-50" : "border-red-300 bg-red-50") : "border-slate-200";
        return (
          <fieldset key={q.id} className={`rounded-xl border p-4 ${mark}`}>
            <legend className="px-1 font-medium">
              {i + 1}. {q.prompt}
            </legend>
            {q.type === "CHOICE" ? (
              <div className="mt-2 space-y-2">
                {q.options.map((o, idx) => (
                  <label key={idx} className="flex cursor-pointer items-start gap-2 text-sm">
                    <input type="radio" name={q.id} value={idx} required className="mt-0.5 accent-brand-600" />
                    <span>{o}</span>
                  </label>
                ))}
              </div>
            ) : (
              <input name={q.id} inputMode="decimal" required placeholder={t("lesson.answerPlaceholder")} className="input mt-2 max-w-xs" />
            )}
          </fieldset>
        );
      })}
      {result && (
        <p className={`rounded-xl px-4 py-3 text-sm font-medium ${result.passed ? "bg-brand-50 text-brand-900" : "bg-red-50 text-red-800"}`}>
          {result.passed ? t("lesson.result.pass", { score: result.score }) : t("lesson.result.fail", { score: result.score, need: result.need })}
        </p>
      )}
      <button disabled={pending} className="btn-primary">{t("lesson.submit")}</button>
    </form>
  );
}
