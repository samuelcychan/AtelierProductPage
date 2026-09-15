// en-US reproduces the storefront's existing yen strings ("¥1,900"); ja-JP
// would render a full-width "￥". Same rule as src/features/products/format.ts.
const YEN = new Intl.NumberFormat("en-US", { style: "currency", currency: "JPY" });

export function formatYen(amount: number): string {
  return YEN.format(amount);
}

/**
 * An amount in the currency's smallest unit, as Stripe reports it. JPY has no
 * minor unit, so yen amounts are shown as-is.
 */
export function formatMoney(amount: number, currency: string | undefined): string {
  const code = (currency ?? "JPY").toUpperCase();
  if (code === "JPY") return formatYen(amount);
  try {
    return new Intl.NumberFormat("en-US", { style: "currency", currency: code }).format(amount / 100);
  } catch {
    return `${(amount / 100).toFixed(2)} ${code}`;
  }
}
