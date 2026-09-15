import type { Lang } from "@/app/i18n";

export interface CartLine {
  slug: string;
  quantity: number;
}

export const CART_KEY = "ym-cart-v1";
export const MAX_QUANTITY = 10;

const SLUG = /^[a-z0-9-]{1,64}$/;

/** Drops malformed lines, merges duplicates and clamps quantities to 1..10. */
export function sanitizeLines(value: unknown): CartLine[] {
  if (!Array.isArray(value)) return [];
  const merged = new Map<string, number>();
  for (const item of value) {
    if (item === null || typeof item !== "object") continue;
    const { slug, quantity } = item as Partial<CartLine>;
    if (typeof slug !== "string" || !SLUG.test(slug)) continue;
    if (typeof quantity !== "number" || !Number.isFinite(quantity)) continue;
    merged.set(slug, (merged.get(slug) ?? 0) + Math.floor(quantity));
  }
  return [...merged]
    .map(([slug, quantity]) => ({ slug, quantity: Math.min(quantity, MAX_QUANTITY) }))
    .filter((line) => line.quantity > 0);
}

export function readCart(): CartLine[] {
  try {
    const raw = window.localStorage.getItem(CART_KEY);
    return raw ? sanitizeLines(JSON.parse(raw)) : [];
  } catch {
    return []; // storage blocked, private mode, or corrupt JSON
  }
}

export function writeCart(lines: CartLine[]) {
  try {
    if (lines.length) window.localStorage.setItem(CART_KEY, JSON.stringify(lines));
    else window.localStorage.removeItem(CART_KEY);
  } catch {
    // quota exceeded or storage blocked; the cart still works for this page view
  }
}

// The language a checkout was started in, so /order/complete (whose URL Stripe
// builds) and the cancel return can speak it. Session storage: this tab only.
const CHECKOUT_LANG_KEY = "ym-checkout-lang";
const LANGS: Lang[] = ["en", "ja", "fr", "zh", "zh-TW"];

export function rememberCheckoutLang(lang: Lang) {
  try {
    window.sessionStorage.setItem(CHECKOUT_LANG_KEY, lang);
  } catch {
    // storage blocked; the order page falls back to the browser language
  }
}

export function checkoutLang(): Lang | null {
  try {
    const saved = window.sessionStorage.getItem(CHECKOUT_LANG_KEY);
    return LANGS.find((l) => l === saved) ?? null;
  } catch {
    return null;
  }
}

/** Saved checkout language, else the first browser language we support, else English. */
export function preferredLang(): Lang {
  const saved = checkoutLang();
  if (saved) return saved;
  for (const tag of navigator.languages ?? [navigator.language]) {
    const lower = tag.toLowerCase();
    if (lower === "zh-tw" || lower === "zh-hk" || lower.startsWith("zh-hant")) return "zh-TW";
    const base = lower.split("-")[0];
    const match = LANGS.find((l) => l === base);
    if (match) return match;
  }
  return "en";
}

/**
 * Initial language for "/" and "/story": English as before, except when the
 * buyer returns from Stripe's cancel link (`?cart=open`), where the language
 * the checkout was started in is restored.
 */
export function initialPageLang(): Lang {
  try {
    if (new URLSearchParams(window.location.search).get("cart") === "open") {
      return checkoutLang() ?? "en";
    }
  } catch {
    // fall through
  }
  return "en";
}
