import { isCommerceConfigured } from "../server/env.js";
import { json } from "../server/http.js";
import { stripe } from "../server/stripe.js";

const SESSION_ID = /^cs_(test|live)_[A-Za-z0-9]+$/;

/** Only what the thank-you page needs: never the address, phone or e-mail. */
export async function GET(request: Request): Promise<Response> {
  const id = new URL(request.url).searchParams.get("session_id") ?? "";
  if (!isCommerceConfigured || !SESSION_ID.test(id)) return json({ error: "not_found" }, 404);
  try {
    const session = await stripe().checkout.sessions.retrieve(id, { expand: ["line_items"] });
    return json({
      status: session.status, // "open" | "complete" | "expired"
      paymentStatus: session.payment_status, // "paid" | "unpaid" | "no_payment_required"
      orderNumber: session.metadata?.order_number ?? null,
      total: session.amount_total,
      currency: session.currency?.toUpperCase(),
      lines: (session.line_items?.data ?? []).map((l) => ({
        name: l.description ?? "",
        quantity: l.quantity,
        amount: l.amount_total,
      })),
    });
  } catch {
    return json({ error: "not_found" }, 404);
  }
}
