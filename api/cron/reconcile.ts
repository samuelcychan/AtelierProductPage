import { timingSafeEqual } from "node:crypto";
import { env, isCommerceConfigured } from "../../server/env.js";
import { fulfilCheckout } from "../../server/fulfil.js";
import { stripe } from "../../server/stripe.js";

const LOOKBACK_SECONDS = 3 * 24 * 3600;

/** Constant-time check of `Authorization: Bearer <CRON_SECRET>`; an unset secret never matches. */
function authorized(request: Request): boolean {
  if (!env.cronSecret) return false;
  const given = Buffer.from(request.headers.get("authorization") ?? "");
  const expected = Buffer.from(`Bearer ${env.cronSecret}`);
  return given.length === expected.length && timingSafeEqual(given, expected);
}

// Daily safety net (vercel.json crons): fulfils any paid Session the webhook missed,
// and retries Shippo orders that failed. Already-logged Sessions are no-ops.
export async function GET(request: Request): Promise<Response> {
  if (!isCommerceConfigured || !authorized(request)) {
    return new Response("Unauthorized", { status: 401, headers: { "Cache-Control": "no-store" } });
  }
  const since = Math.floor(Date.now() / 1000) - LOOKBACK_SECONDS;
  let checked = 0;
  let failed = 0;
  for await (const session of stripe().checkout.sessions.list({ status: "complete", created: { gte: since }, limit: 100 })) {
    try {
      await fulfilCheckout(session.id);
    } catch (error) {
      failed++;
      console.error("[reconcile] fulfilment failed", session.id, error instanceof Error ? error.message : String(error));
    }
    checked++;
  }
  return Response.json({ checked, failed }, { status: failed ? 500 : 200, headers: { "Cache-Control": "no-store" } });
}
