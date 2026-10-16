"use client";
import { useMemo, useState } from "react";
import { useT } from "@/i18n/client";
import { money, savingsProjection } from "@/lib/finance";
import { NumberField } from "@/components/NumberField";

export function SavingsCalculator() {
  const { t, locale } = useT();
  const [initial, setInitial] = useState(1000);
  const [monthly, setMonthly] = useState(200);
  const [rate, setRate] = useState(7);
  const [years, setYears] = useState(10);
  const rows = useMemo(() => savingsProjection(initial, monthly, rate, Math.min(years, 60)), [initial, monthly, rate, years]);
  const last = rows.at(-1) ?? { balance: initial, contributed: initial, interest: 0 };
  const max = Math.max(...rows.map((r) => r.balance), 1);

  return (
    <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
      <div className="card space-y-3">
        <NumberField label={`${t("calc.initial")}, $`} value={initial} onChange={setInitial} step={100} />
        <NumberField label={`${t("calc.monthly")}, $`} value={monthly} onChange={setMonthly} step={10} />
        <NumberField label={t("calc.rate")} value={rate} onChange={setRate} step={0.1} />
        <NumberField label={t("calc.years")} value={years} onChange={setYears} min={1} />
      </div>
      <div className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="card"><p className="muted">{t("calc.final")}</p><p className="mt-1 text-2xl font-bold text-brand-700">{money(last.balance, locale)}</p></div>
          <div className="card"><p className="muted">{t("calc.contributed")}</p><p className="mt-1 text-2xl font-bold">{money(last.contributed, locale)}</p></div>
          <div className="card"><p className="muted">{t("calc.interest")}</p><p className="mt-1 text-2xl font-bold">{money(last.interest, locale)}</p></div>
        </div>
        <div className="card">
          <div className="flex h-48 items-end gap-1">
            {rows.map((r) => (
              <div key={r.year} className="flex flex-1 flex-col justify-end" title={`${t("calc.year")} ${r.year}: ${money(r.balance, locale)}`}>
                <div className="bg-brand-500" style={{ height: `${(r.interest / max) * 180}px` }} />
                <div className="bg-slate-300" style={{ height: `${(r.contributed / max) * 180}px` }} />
              </div>
            ))}
          </div>
          <div className="mt-3 flex gap-4 text-xs text-slate-500">
            <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-sm bg-slate-300" />{t("calc.contributed")}</span>
            <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-sm bg-brand-500" />{t("calc.interest")}</span>
          </div>
        </div>
        <div className="card overflow-x-auto p-0">
          <table className="table">
            <thead><tr><th>{t("calc.year")}</th><th className="text-right">{t("calc.contributed")}</th><th className="text-right">{t("calc.interest")}</th><th className="text-right">{t("calc.balance")}</th></tr></thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.year}>
                  <td>{r.year}</td>
                  <td className="text-right">{money(r.contributed, locale)}</td>
                  <td className="text-right">{money(r.interest, locale)}</td>
                  <td className="text-right font-medium">{money(r.balance, locale)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
