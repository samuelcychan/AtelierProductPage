import type { Lang } from "../../app/i18n";

// Relative imports only: studio/scripts/seed.ts loads this file through
// `sanity exec`, where the "@" alias from vite.config.ts does not exist.

export type PriceField = "usd" | "jpy" | "eur" | "cny" | "twd";
export type Prices = Record<PriceField, number>;

// Intl locales chosen to reproduce the storefront's existing price strings
// exactly (verified with Node 22 ICU). ja-JP renders a full-width "￥" and
// zh-TW renders a bare "$", so JPY and TWD go through en-US ("¥2,400", "NT$500").
export const MARKETS: Record<Lang, { field: PriceField; currency: string; locale: string }> = {
  en:      { field: "usd", currency: "USD", locale: "en-US" },
  ja:      { field: "jpy", currency: "JPY", locale: "en-US" },
  fr:      { field: "eur", currency: "EUR", locale: "fr-FR" },
  zh:      { field: "cny", currency: "CNY", locale: "zh-CN" },
  "zh-TW": { field: "twd", currency: "TWD", locale: "en-US" },
};

export function formatPrice(prices: Partial<Prices> | undefined, lang: Lang): string {
  const { field, currency, locale } = MARKETS[lang];
  const amount = prices?.[field];
  if (typeof amount !== "number" || !Number.isFinite(amount)) return "";
  // Whole amounts show no decimals ("$13"); anything else shows exactly two ("$13.50", never "$13.5").
  const digits = Number.isInteger(amount) ? 0 : 2;
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(amount);
}

export function formatSize(value: number | undefined, unit: string | undefined): string {
  return typeof value === "number" && unit ? `${value}${unit}` : "";
}
