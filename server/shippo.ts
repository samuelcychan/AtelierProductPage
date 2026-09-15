import type Stripe from "stripe";
import { env } from "./env.js";

const SHIPPO = "https://api.goshippo.com";
const TIMEOUT_MS = 5_000; // the Stripe webhook must answer quickly (§10.2)

async function shippo<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${SHIPPO}${path}`, {
    method: "POST",
    headers: { Authorization: `ShippoToken ${env.shippoApiToken}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  // The response body is not included: Shippo validation errors can echo the address.
  if (!res.ok) throw new Error(`Shippo ${path} ${res.status}`);
  return res.json() as Promise<T>;
}

/**
 * Creates a PAID order in Shippo from a Checkout Session retrieved with
 * `expand: ["line_items.data.price.product"]`. Returns Shippo's order object_id.
 */
export async function createShippoOrder(session: Stripe.Checkout.Session): Promise<string> {
  // Current API versions store the address here; top-level shipping_details was removed in 2025-03-31.
  const ship = session.collected_information?.shipping_details;
  if (!ship) throw new Error("Checkout Session has no shipping details");
  const lines = session.line_items?.data ?? [];
  const order = await shippo<{ object_id: string }>("/orders/", {
    order_number: session.metadata?.order_number,
    order_status: "PAID",
    placed_at: new Date(session.created * 1000).toISOString(),
    to_address: {
      name: ship.name,
      street1: ship.address.line1 ?? "",
      street2: ship.address.line2 ?? "",
      city: ship.address.city ?? "",
      state: ship.address.state ?? "",
      zip: ship.address.postal_code ?? "",
      country: ship.address.country ?? "",
      phone: session.customer_details?.phone ?? "",
      email: session.customer_details?.email ?? "",
    },
    line_items: lines.map((l) => ({
      title: l.description ?? "",
      sku: productOf(l)?.metadata.sku,
      quantity: l.quantity,
      total_price: String(l.amount_total),
      currency: "JPY",
    })),
    total_price: String(session.amount_total),
    currency: "JPY",
  });
  if (typeof order.object_id !== "string" || !order.object_id) throw new Error("Shippo order has no object_id");
  return order.object_id;
}

/** The expanded Product of a line item, or undefined when it was not expanded or was deleted. */
export function productOf(line: Stripe.LineItem): Stripe.Product | undefined {
  const product = line.price?.product;
  return product && typeof product === "object" && !("deleted" in product && product.deleted)
    ? (product as Stripe.Product)
    : undefined;
}
