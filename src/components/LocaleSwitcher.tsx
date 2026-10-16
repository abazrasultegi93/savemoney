"use client";
import { useTransition } from "react";
import { setLocale } from "@/app/actions/locale";
import { useT } from "@/i18n/client";

export function LocaleSwitcher() {
  const { locale } = useT();
  const [pending, start] = useTransition();
  return (
    <div className="flex overflow-hidden rounded-lg border border-slate-300 text-xs font-semibold">
      {(["en", "ru"] as const).map((l) => (
        <button
          key={l}
          disabled={pending}
          onClick={() => start(() => setLocale(l))}
          className={`px-2 py-1 uppercase ${l === locale ? "bg-slate-900 text-white" : "bg-white text-slate-600 hover:bg-slate-100"}`}
        >
          {l}
        </button>
      ))}
    </div>
  );
}
