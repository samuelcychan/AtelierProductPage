import type Stripe from "stripe";
import { loadCatalog } from "./catalog.js";
import { isShippoConfigured } from "./env.js";
import { sanity } from "./sanity.js";
import { createShippoOrder, productOf } from "./shippo.js";
import { stripe } from "./stripe.js";

const MAX_ATTEMPTS = 4;

// Contains "." → readable only with a token, never through the public API.
const logId = (sessionId: string) => `fulfilment.${sessionId}`;

interface FulfilmentLine {
  _key: string;
  slug: string;
  sku: string;
  quantity: number;
}

const message = (error: unknown) => (error instanceof Error ? error.message : String(error));

/**
 * Fulfils one paid Checkout Session. Safe to call several times, even
 * concurrently (Stripe retries, the daily reconcile): the Sanity transaction
 * that creates `fulfilment.<sessionId>` also decrements stock, and fails as a
 * whole if the log document already exists.
 */
export async function fulfilCheckout(sessionId: string): Promise<void> {
  const session = await stripe().checkout.sessions.retrieve(sessionId, {
    expand: ["line_items.data.price.product"],
  });
  if (session.status !== "complete" || session.payment_status === "unpaid") return; // async method still pending

  const existing = await sanity().getDocument(logId(session.id));
  if (!existing) await applyOnce(session);

  if (!isShippoConfigured) return;
  const log = await sanity().getDocument<{ shippoOrderId?: string }>(logId(session.id));
  if (!log || log.shippoOrderId) return;
  try {
    const orderId = await createShippoOrder(session);
    await sanity().patch(logId(session.id)).setIfMissing({ shippoOrderId: orderId }).commit();
    const paymentIntent = typeof session.payment_intent === "string" ? session.payment_intent : session.payment_intent?.id;
    if (paymentIntent) {
      await stripe().paymentIntents.update(paymentIntent, { metadata: { shippo_order_id: orderId } });
    }
  } catch (error) {
    // The payment is safe and stock is applied; the daily reconcile retries Shippo.
    console.error("[fulfil] Shippo order failed", session.metadata?.order_number ?? session.id, message(error));
  }
}

async function applyOnce(session: Stripe.Checkout.Session, attempt = 1): Promise<void> {
  const catalog = await loadCatalog(); // fresh _rev values
  // Only Stripe's record of what was paid is trusted: slug and SKU come from the
  // product_data metadata that /api/checkout set on each line.
  const lines: FulfilmentLine[] = (session.line_items?.data ?? []).map((l, index) => {
    const metadata = productOf(l)?.metadata ?? {};
    return { _key: `line${index}`, slug: metadata.slug ?? "", sku: metadata.sku ?? "", quantity: l.quantity ?? 0 };
  });

  const oversold = lines.some((line) => (catalog.get(line.slug)?.stock?.available ?? 0) < line.quantity);
  const tx = sanity().transaction().create({
    _id: logId(session.id),
    _type: "fulfilment",
    orderNumber: session.metadata?.order_number ?? "",
    paidAt: new Date().toISOString(),
    lines,
    oversold,
  });
  for (const line of lines) {
    const stock = catalog.get(line.slug)?.stock;
    if (stock && line.quantity > 0) {
      tx.patch(stock._id, (p) => p.ifRevisionId(stock._rev).dec({ available: line.quantity }));
    }
  }

  try {
    await tx.commit();
  } catch (error) {
    if (await sanity().getDocument(logId(session.id))) return; // another delivery won
    if (attempt < MAX_ATTEMPTS) return applyOnce(session, attempt + 1); // stock edited meanwhile: retry
    throw error; // 500 → Stripe retries later; the reconcile is the final safety net
  }
  if (oversold) console.error("[fulfil] OVERSOLD — refund or restock", session.metadata?.order_number ?? session.id);
}
