import type { Lang } from "../../app/i18n";

/** A field edited in five languages, as sanity-plugin-internationalized-array v5 stores it. */
export type Localized = Array<{ _key?: string; language?: string; value?: string }>;

/** The value for `lang`; otherwise English; otherwise an empty string. */
export function pick(values: Localized | undefined, lang: Lang): string {
  const find = (language: string) =>
    values?.find((v) => v.language === language && v.value?.trim())?.value?.trim();
  return find(lang) ?? find("en") ?? "";
}
