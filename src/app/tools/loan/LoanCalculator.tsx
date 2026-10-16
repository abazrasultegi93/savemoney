"use client";
import { useMemo, useState } from "react";
import { useT } from "@/i18n/client";
import { loanSchedule, money } from "@/lib/finance";
import { NumberField } from "@/components/NumberField";

export function LoanCalculator() {
  const { t, locale } = useT();
  const [amount, setAmount] = useState(20000);
  const [rate, setRate] = useState(9.5);
  const [months, setMonths] = useState(60);
  const [type, setType] = useState<"annuity" | "diff">("annuity");
  const term = Math.max(1, Math.min(Math.round(months), 600));
  const rows = useMemo(() => loanSchedule(amount, rate, term, type), [amount, rate, term, type]);
  const totalPaid = rows.reduce((s, r) => s + r.payment, 0);

  return (
    <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
      <div className="card space-y-3">
        <NumberField label={`${t("loan.amount")}, $`} value={amount} onChange={setAmount} step={500} />
        <NumberField label={t("loan.rate")} value={rate} onChange={setRate} step={0.1} />
        <NumberField label={t("loan.term")} value={months} onChange={setMonths} min={1} />
        <div>
          <label className="label">{t("loan.type")}</label>
          <select className="input" value={type} onChange={(e) => setType(e.target.value as "annuity" | "diff")}>
            <option value="annuity">{t("loan.annuity")}</option>
            <option value="diff">{t("loan.diff")}</option>
          </select>
        </div>
      </div>
      <div className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="card">
            <p className="muted">{type === "annuity" ? t("loan.monthly") : t("loan.firstLast")}</p>
            <p className="mt-1 text-2xl font-bold text-brand-700">
              {type === "annuity" ? money(rows[0]?.payment ?? 0, locale) : `${money(rows[0]?.payment ?? 0, locale)} / ${money(rows.at(-1)?.payment ?? 0, locale)}`}
            </p>
          </div>
          <div className="card"><p className="muted">{t("loan.totalInterest")}</p><p className="mt-1 text-2xl font-bold text-red-600">{money(totalPaid - amount, locale)}</p></div>
          <div className="card"><p className="muted">{t("loan.totalPaid")}</p><p className="mt-1 text-2xl font-bold">{money(totalPaid, locale)}</p></div>
        </div>
        <div className="card max-h-[480px] overflow-auto p-0">
          <table className="table">
            <thead className="sticky top-0 bg-white">
              <tr><th>{t("loan.month")}</th><th className="text-right">{t("loan.payment")}</th><th className="text-right">{t("loan.principal")}</th><th className="text-right">{t("loan.interest")}</th><th className="text-right">{t("loan.remaining")}</th></tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.month}>
                  <td>{r.month}</td>
                  <td className="text-right font-medium">{money(r.payment, locale)}</td>
                  <td className="text-right">{money(r.principal, locale)}</td>
                  <td className="text-right">{money(r.interest, locale)}</td>
                  <td className="text-right text-slate-500">{money(r.remaining, locale)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
