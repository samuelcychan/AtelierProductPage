import type Stripe from "stripe";
import { env, isCommerceConfigured } from "../server/env.js";
import { fulfilCheckout } from "../server/fulfil.js";
import { stripe } from "../server/stripe.js";

export async function POST(request: Request): Promise<Response> {
  // Not configured: 503 so Stripe keeps retrying until the variables are set.
  if (!isCommerceConfigured || !env.stripeWebhookSecret) return new Response("Unavailable", { status: 503 });

  const payload = await request.text(); // raw body: required for signature verification
  let event: Stripe.Event;
  try {
    event = stripe().webhooks.constructEvent(payload, request.headers.get("stripe-signature") ?? "", env.stripeWebhookSecret);
  } catch {
    return new Response("Invalid signature", { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed":
      case "checkout.session.async_payment_succeeded":
        // Stripe waits for this before redirecting the buyer, so it stays short:
        // one Stripe read, one Sanity transaction, at most one Shippo call.
        await fulfilCheckout(event.data.object.id);
        break;
      case "checkout.session.async_payment_failed":
        console.warn("[webhook] async payment failed", event.data.object.id);
        break;
    }
  } catch (error) {
    // A non-2xx response makes Stripe retry, which fulfilCheckout tolerates.
    console.error("[webhook] fulfilment failed", event.id, error instanceof Error ? error.message : String(error));
    return new Response("Fulfilment failed", { status: 500 });
  }
  return new Response("ok");
}
