"use client";
import { createContext, useContext } from "react";
import { dictionaries, translate, type Locale, type TKey } from ".";

const LocaleContext = createContext<Locale>("en");

export function LocaleProvider({ locale, children }: { locale: Locale; children: React.ReactNode }) {
  return <LocaleContext.Provider value={locale}>{children}</LocaleContext.Provider>;
}

export function useT() {
  const locale = useContext(LocaleContext);
  const dict = dictionaries[locale];
  return {
    locale,
    t: (key: TKey, vars?: Record<string, string | number>) => translate(dict, key, vars),
  };
}
