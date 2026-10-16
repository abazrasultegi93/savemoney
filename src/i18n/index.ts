import en, { type Dict, type TKey } from "./en";
import ru from "./ru";

export const locales = ["en", "ru"] as const;
export type Locale = (typeof locales)[number];
export const dictionaries: Record<Locale, Dict> = { en, ru };
export type { Dict, TKey };

export function isLocale(v: unknown): v is Locale {
  return typeof v === "string" && (locales as readonly string[]).includes(v);
}

export function translate(dict: Dict, key: TKey, vars?: Record<string, string | number>) {
  let s = dict[key] ?? key;
  if (vars) for (const [k, v] of Object.entries(vars)) s = s.replaceAll(`{${k}}`, String(v));
  return s;
}

/** Pick the English or Russian field of a bilingual record, falling back to English. */
export function pick(locale: Locale, en: string, ru: string) {
  return locale === "ru" && ru ? ru : en;
}
