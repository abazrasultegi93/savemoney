import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { getT } from "@/i18n/server";
import { formatUsd } from "@/lib/learning";
import { currentMonth, getMonth } from "@/lib/budget";
import { addTransaction, deleteTransaction } from "@/app/actions/budget";

const CATEGORIES = {
  en: ["Salary", "Freelance", "Food", "Housing", "Transport", "Utilities", "Health", "Entertainment", "Education", "Savings", "Other"],
  ru: ["Зарплата", "Подработка", "Еда", "Жильё", "Транспорт", "Коммунальные", "Здоровье", "Развлечения", "Обучение", "Накопления", "Другое"],
};

function shiftMonth(month: string, delta: number) {
  const [y, m] = month.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1 + delta, 1)).toISOString().slice(0, 7);
}

export default async function BudgetPage({ searchParams }: { searchParams: Promise<{ month?: string }> }) {
  const user = await requireUser();
  const { t, locale } = await getT();
  const sp = await searchParams;
  const month = /^\d{4}-\d{2}$/.test(sp.month ?? "") ? sp.month! : currentMonth();
  const data = await getMonth(user.id, month);
  const monthLabel = new Date(`${month}-01T00:00:00Z`).toLocaleDateString(locale === "ru" ? "ru-RU" : "en-US", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
  const savingsRate = data.income ? Math.round((data.balance / data.income) * 100) : 0;
  const today = new Date().toISOString().slice(0, 10);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="h1">{t("tools.budget")}</h1>
        <div className="flex items-center gap-2">
          <Link href={`?month=${shiftMonth(month, -1)}`} className="btn-secondary px-3">←</Link>
          <span className="min-w-36 text-center font-semibold capitalize">{monthLabel}</span>
          <Link href={`?month=${shiftMonth(month, 1)}`} className="btn-secondary px-3">→</Link>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat label={t("budget.totalIncome")} value={formatUsd(data.income)} tone="text-brand-700" />
        <Stat label={t("budget.totalExpense")} value={formatUsd(data.expense)} tone="text-red-600" />
        <Stat label={t("budget.balance")} value={formatUsd(data.balance)} tone={data.balance >= 0 ? "text-slate-900" : "text-red-600"} />
        <Stat label={t("budget.savingsRate")} value={`${savingsRate}%`} tone="text-slate-900" />
      </div>

      <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
        <div className="space-y-6">
          <form action={addTransaction} className="card space-y-3">
            <h2 className="h2">{t("budget.add")}</h2>
            <div className="grid grid-cols-2 gap-2">
              <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-slate-300 py-2 text-sm has-[:checked]:border-red-400 has-[:checked]:bg-red-50">
                <input type="radio" name="type" value="EXPENSE" defaultChecked className="sr-only" />
                {t("budget.expense")}
              </label>
              <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-slate-300 py-2 text-sm has-[:checked]:border-brand-500 has-[:checked]:bg-brand-50">
                <input type="radio" name="type" value="INCOME" className="sr-only" />
                {t("budget.income")}
              </label>
            </div>
            <div>
              <label className="label">{t("budget.amount")}, $</label>
              <input name="amount" type="number" step="0.01" min="0.01" required className="input" />
            </div>
            <div>
              <label className="label">{t("budget.category")}</label>
              <input name="category" list="categories" required className="input" />
              <datalist id="categories">
                {CATEGORIES[locale].map((c) => <option key={c} value={c} />)}
              </datalist>
            </div>
            <div>
              <label className="label">{t("budget.date")}</label>
              <input name="date" type="date" required defaultValue={month === currentMonth() ? today : `${month}-01`} className="input" />
            </div>
            <div>
              <label className="label">{t("budget.note")}</label>
              <input name="note" className="input" />
            </div>
            <button className="btn-primary w-full">{t("budget.add")}</button>
          </form>

          {data.categories.length > 0 && (
            <div className="card space-y-3">
              <h2 className="h2">{t("budget.byCategory")}</h2>
              {data.categories.map(([cat, cents]) => (
                <div key={cat}>
                  <div className="flex justify-between text-sm">
                    <span>{cat}</span>
                    <span className="font-medium">{formatUsd(cents)}</span>
                  </div>
                  <div className="mt-1 h-2 rounded-full bg-slate-100">
                    <div className="h-2 rounded-full bg-red-400" style={{ width: `${(cents / data.expense) * 100}%` }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="card overflow-x-auto p-0">
          {data.items.length === 0 ? (
            <p className="muted p-5">{t("budget.empty")}</p>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>{t("budget.date")}</th>
                  <th>{t("budget.category")}</th>
                  <th>{t("budget.note")}</th>
                  <th className="text-right">{t("budget.amount")}</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {data.items.map((tx) => (
                  <tr key={tx.id}>
                    <td className="whitespace-nowrap text-slate-500">{tx.date.toISOString().slice(0, 10)}</td>
                    <td>{tx.category}</td>
                    <td className="text-slate-500">{tx.note}</td>
                    <td className={`whitespace-nowrap text-right font-medium ${tx.type === "INCOME" ? "text-brand-700" : "text-red-600"}`}>
                      {tx.type === "INCOME" ? "+" : "−"}
                      {formatUsd(tx.amountCents)}
                    </td>
                    <td className="text-right">
                      <form action={deleteTransaction.bind(null, tx.id)}>
                        <button className="text-xs text-slate-400 hover:text-red-600" title={t("budget.delete")}>✕</button>
                      </form>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value, tone }: { label: string; value: string; tone: string }) {
  return (
    <div className="card">
      <p className="muted">{label}</p>
      <p className={`mt-1 text-2xl font-bold ${tone}`}>{value}</p>
    </div>
  );
}
