import "server-only";
import { cookies, headers } from "next/headers";
import { dictionaries, isLocale, translate, type Locale, type TKey } from ".";

export async function getLocale(): Promise<Locale> {
  const c = (await cookies()).get("locale")?.value;
  if (isLocale(c)) return c;
  const accept = (await headers()).get("accept-language") ?? "";
  return accept.toLowerCase().startsWith("ru") ? "ru" : "en";
}

export async function getT() {
  const locale = await getLocale();
  const dict = dictionaries[locale];
  return {
    locale,
    t: (key: TKey, vars?: Record<string, string | number>) => translate(dict, key, vars),
  };
}
