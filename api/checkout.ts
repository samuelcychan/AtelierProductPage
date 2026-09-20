import type Stripe from "stripe";
import type { Lang } from "../src/app/i18n.js";
import { checkoutName, isForSale, loadCatalog } from "../server/catalog.js";
import { env, isCommerceConfigured } from "../server/env.js";
import { json, readJson, sameOrigin } from "../server/http.js";
import { stripe } from "../server/stripe.js";

const LANGS: Lang[] = ["en", "ja", "fr", "zh", "zh-TW"];
const MAX_LINES = 2;
const MAX_PER_LINE = 10;
const RETURN_PATHS = new Set(["/", "/story"]);
const SLUG = /^[a-z0-9-]{1,64}$/;
const CHECKOUT_ORIGIN = "https://checkout.stripe.com/";

type Line = { slug: string; quantity: number; unitAmount: number };
type Cart = { lang: Lang; returnPath: string; lines: Line[] };

function isLine(value: unknown): value is Line {
  if (!value || typeof value !== "object") return false;
  const { slug, quantity, unitAmount } = value as Record<string, unknown>;
  return (
    typeof slug === "string" &&
    SLUG.test(slug) &&
    Number.isInteger(quantity) &&
    (quantity as number) >= 1 &&
    (quantity as number) <= MAX_PER_LINE &&
    Number.isInteger(unitAmount)
  );
}

function parse(body: unknown): Cart | null {
  if (!body || typeof body !== "object") return null;
  const { lang, returnPath, lines } = body as Record<string, unknown>;
  if (!LANGS.includes(lang as Lang)) return null;
  if (!Array.isArray(lines) || lines.length < 1 || lines.length > MAX_LINES) return null;
  if (!lines.every(isLine)) return null;
  if (new Set(lines.map((l) => l.slug)).size !== lines.length) return null;
  return {
    lang: lang as Lang,
    returnPath: RETURN_PATHS.has(String(returnPath)) ? String(returnPath) : "/",
    lines: lines.map(({ slug, quantity, unitAmount }) => ({ slug, quantity, unitAmount })),
  };
}

function orderNumber(): string {
  const d = new Date();
  const yy = String(d.getUTCFullYear() % 100).padStart(2, "0");
  const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(d.getUTCDate()).padStart(2, "0");
  return `KJ-${yy}${mm}${dd}-${crypto.randomUUID().slice(0, 6).toUpperCase()}`;
}

export async function POST(request: Request): Promise<Response> {
  if (!isCommerceConfigured) return json({ error: "unavailable" }, 503);
  if (!sameOrigin(request, env.siteUrl)) return json({ error: "forbidden" }, 403);
  if (!request.headers.get("content-type")?.toLowerCase().includes("application/json")) {
    return json({ error: "invalid_request" }, 415);
  }

  const cart = parse(await readJson(request));
  if (!cart) return json({ error: "invalid_cart" }, 400);

  try {
    const catalog = await loadCatalog();
    const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = [];
    for (const line of cart.lines) {
      const item = catalog.get(line.slug);
      if (!isForSale(item)) return json({ error: "not_for_sale", slug: line.slug }, 409);
      if (item.jpy !== line.unitAmount) {
        return json({ error: "price_changed", slug: line.slug, unitAmount: item.jpy }, 409);
      }
      if (item.stock.available < line.quantity) {
        return json({ error: "insufficient_stock", slug: line.slug, available: Math.max(0, item.stock.available) }, 409);
      }
      lineItems.push({
        quantity: line.quantity,
        price_data: {
          currency: "jpy", // zero-decimal currency: 1900 means ¥1,900
          unit_amount: item.jpy,
          product_data: { name: checkoutName(item, cart.lang), metadata: { slug: item.slug, sku: item.sku } },
        },
      });
    }

    const number = orderNumber();
    const session = await stripe().checkout.sessions.create({
      mode: "payment",
      ui_mode: "hosted_page",
      locale: cart.lang, // Stripe accepts en, ja, fr, zh and zh-TW
      line_items: lineItems,
      shipping_address_collection: { allowed_countries: ["JP"] }, // D2
      shipping_options: [
        {
          shipping_rate_data: {
            type: "fixed_amount",
            display_name: cart.lang === "ja" ? "送料無料" : "Free shipping",
            fixed_amount: { amount: 0, currency: "jpy" },
            // Placeholder until Kimie confirms processing plus transit time.
            delivery_estimate: {
              minimum: { unit: "business_day", value: 2 },
              maximum: { unit: "business_day", value: 5 },
            },
          },
        },
      ],
      phone_number_collection: { enabled: true }, // carriers need a recipient phone number
      // D7: Stripe's minimum is 30 minutes after creation; one extra minute absorbs request latency.
      expires_at: Math.floor(Date.now() / 1000) + 31 * 60,
      success_url: `${env.siteUrl}/order/complete?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${env.siteUrl}${cart.returnPath}?cart=open`,
      metadata: { order_number: number, lang: cart.lang },
      payment_intent_data: { metadata: { order_number: number } },
    });

    if (!session.url?.startsWith(CHECKOUT_ORIGIN)) return json({ error: "unavailable" }, 502);
    return json({ url: session.url });
  } catch (error) {
    console.error("[checkout] failed", error instanceof Error ? error.message : String(error));
    return json({ error: "unavailable" }, 502);
  }
}
