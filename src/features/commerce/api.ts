import type { Lang } from "@/app/i18n";
import type { CartLine } from "./cart";

// Typed to the HTTP API contract in progress/README.md ("Shared contracts").

export interface CatalogProduct {
  slug: string;
  forSale: boolean;
  available: boolean;
  unitAmount: number | null;
  currency: "JPY";
}

export type CatalogResult =
  | { kind: "off" }
  | { kind: "ready"; products: CatalogProduct[] }
  | { kind: "unavailable" };

export type ReturnPath = "/" | "/story";

export interface CheckoutLine extends CartLine {
  unitAmount: number;
}

export type CheckoutResult =
  | { kind: "redirect"; url: string }
  | { kind: "price_changed"; slug: string; unitAmount: number }
  | { kind: "insufficient_stock"; slug: string; available: number }
  | { kind: "not_for_sale"; slug: string }
  | { kind: "unavailable" }
  | { kind: "error" };

export interface OrderSummary {
  status: "open" | "complete" | "expired";
  paymentStatus: "paid" | "unpaid" | "no_payment_required";
  orderNumber: string | null;
  total: number | null;
  currency: string | undefined;
  lines: Array<{ name: string; quantity: number | null; amount: number }>;
}

export type OrderResult = { kind: "found"; order: OrderSummary } | { kind: "not_found" } | { kind: "error" };

export const STRIPE_CHECKOUT_ORIGIN = "https://checkout.stripe.com/";

const CATALOG_TIMEOUT_MS = 8000;

interface Reply {
  status: number;
  body: unknown;
  mocked: boolean;
}

async function send(path: string, init: RequestInit = {}): Promise<Reply> {
  // Development only: `?commerce=mock` answers from ./mock. Vite replaces
  // import.meta.env.DEV with `false` in production builds, so this branch and
  // the mock module are removed from the bundle.
  if (import.meta.env.DEV) {
    const mock = await import("./mock");
    if (mock.mockScenario()) return { ...(await mock.mockSend(path, init)), mocked: true };
  }
  const res = await fetch(path, { credentials: "same-origin", ...init });
  let body: unknown = null;
  try {
    body = await res.json();
  } catch {
    body = null; // HTML fallback page, empty body, or invalid JSON
  }
  return { status: res.status, body, mocked: false };
}

const isObject = (value: unknown): value is Record<string, unknown> =>
  value !== null && typeof value === "object" && !Array.isArray(value);

function toCatalogProduct(value: unknown): CatalogProduct | null {
  if (!isObject(value) || typeof value.slug !== "string") return null;
  const unitAmount =
    typeof value.unitAmount === "number" && Number.isInteger(value.unitAmount) && value.unitAmount >= 0
      ? value.unitAmount
      : null;
  return {
    slug: value.slug,
    forSale: value.forSale === true,
    available: value.available === true,
    unitAmount,
    currency: "JPY",
  };
}

export async function fetchCatalog(): Promise<CatalogResult> {
  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), CATALOG_TIMEOUT_MS);
  try {
    const { status, body } = await send("/api/catalog", {
      headers: { Accept: "application/json" },
      signal: controller.signal,
    });
    if (status !== 200 || !isObject(body)) return { kind: "unavailable" };
    if (body.enabled === false) return { kind: "off" };
    if (body.enabled !== true || body.unavailable === true || !Array.isArray(body.products)) {
      return { kind: "unavailable" };
    }
    const products = body.products.map(toCatalogProduct).filter((p): p is CatalogProduct => p !== null);
    return { kind: "ready", products };
  } catch (err) {
    console.warn("[commerce] catalog request failed", err);
    return { kind: "unavailable" };
  } finally {
    window.clearTimeout(timer);
  }
}

export async function startCheckout(lines: CheckoutLine[], lang: Lang, returnPath: ReturnPath): Promise<CheckoutResult> {
  try {
    const { status, body, mocked } = await send("/api/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({
        lang,
        returnPath,
        lines: lines.map(({ slug, quantity, unitAmount }) => ({ slug, quantity, unitAmount })),
      }),
    });
    const data = isObject(body) ? body : {};

    if (status === 200 && typeof data.url === "string") {
      const url = data.url;
      // Only ever leave the site for Stripe. The development mock completes
      // on this origin's order page instead.
      const allowed =
        url.startsWith(STRIPE_CHECKOUT_ORIGIN) ||
        (mocked && url.startsWith(`${window.location.origin}/order/complete?`));
      return allowed ? { kind: "redirect", url } : { kind: "error" };
    }

    const slug = typeof data.slug === "string" ? data.slug : "";
    if (status === 409 && slug) {
      if (data.error === "price_changed" && typeof data.unitAmount === "number") {
        return { kind: "price_changed", slug, unitAmount: data.unitAmount };
      }
      if (data.error === "insufficient_stock" && typeof data.available === "number") {
        return { kind: "insufficient_stock", slug, available: Math.max(0, Math.floor(data.available)) };
      }
      if (data.error === "not_for_sale") return { kind: "not_for_sale", slug };
    }
    if (data.error === "unavailable") return { kind: "unavailable" };
    return { kind: "error" };
  } catch (err) {
    console.warn("[commerce] checkout request failed", err);
    return { kind: "error" };
  }
}

function toOrderSummary(value: unknown): OrderSummary | null {
  if (!isObject(value)) return null;
  const { status, paymentStatus } = value;
  if (status !== "open" && status !== "complete" && status !== "expired") return null;
  if (paymentStatus !== "paid" && paymentStatus !== "unpaid" && paymentStatus !== "no_payment_required") return null;
  const lines = Array.isArray(value.lines)
    ? value.lines.filter(isObject).map((line) => ({
        name: typeof line.name === "string" ? line.name : "",
        quantity: typeof line.quantity === "number" ? line.quantity : null,
        amount: typeof line.amount === "number" ? line.amount : 0,
      }))
    : [];
  return {
    status,
    paymentStatus,
    orderNumber: typeof value.orderNumber === "string" ? value.orderNumber : null,
    total: typeof value.total === "number" ? value.total : null,
    currency: typeof value.currency === "string" ? value.currency : undefined,
    lines,
  };
}

export async function fetchOrder(sessionId: string): Promise<OrderResult> {
  try {
    const { status, body } = await send(`/api/order?session_id=${encodeURIComponent(sessionId)}`, {
      headers: { Accept: "application/json" },
    });
    if (status === 404) return { kind: "not_found" };
    const order = status === 200 ? toOrderSummary(body) : null;
    return order ? { kind: "found", order } : { kind: "error" };
  } catch (err) {
    console.warn("[commerce] order request failed", err);
    return { kind: "error" };
  }
}
