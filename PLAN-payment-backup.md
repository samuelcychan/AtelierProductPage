# Payment: a spare provider for testing in production

**A companion to [PLAN-stripe-and-shippo.md](PLAN-stripe-and-shippo.md), not a replacement for it.** Stripe remains the payment provider for the shop. This document covers a **second account, with PayPal**, opened for two reasons:

1. **Testing in production.** Stripe needs a Japan-registered seller and passes an account review before it will take live payments (PLAN §5.1). Until that clears, no real payment can be put through the production site — only test-mode payments on the preview. A PayPal account can take one real payment on the production site in the meantime, which is the only way to prove the live shop end to end.
2. **A spare.** If Stripe's review is refused or delayed, or an account is frozen mid-launch, the shop has somewhere to fall back to instead of taking no orders at all.

A third case sits behind both: if the seller ends up being **an individual in Taiwan** rather than a Japan-registered seller, Stripe is not available at all, and PayPal becomes the primary provider. §3 covers that case.

Facts below were checked on 2026-09-24 against the sources in §8. This is an engineering note, not legal or tax advice. Confirm every fee and eligibility rule with the provider before signing up.

---

## 1. Conclusion

| | |
|---|---|
| **Provider for the shop** | **Stripe**, unchanged. 3.6% per card payment in Japan, no fixed fee, and `api/` and `server/` are already built for it. |
| **Spare and test account** | **PayPal Taiwan.** A personal account needs only a Taiwan ID and passport — no company registration — and pays out to a Taiwan bank through E.SUN Bank's **玉山全球通**. |
| **Why PayPal and not another spare** | It is the only provider found that an individual in Taiwan can open, that pays out to a Taiwanese bank, and that charges Japanese buyers in **JPY** (§3). |
| **Cost** | 4.4% + ¥40 per sale, plus conversion, so roughly ¥170–200 on a ¥1,900 jar (about 9–10%) against ≈¥68 on Stripe. Acceptable for one or two test orders; expensive as a permanent arrangement. |
| **Decision (2026-09-25)** | **Path B**: PayPal is built into the site as a second checkout path (§6), so the production shop can be proved end to end — cart, server-side prices, stock, order log, order page — not just the payout. Path A (a payment link) survives as a 10-minute pre-check of the account before that work starts. |
| **Effort** | 14–22 engineering hours (§6.15), plus the account steps in §7. |

---

## 2. Constraints

| # | Constraint | Why it matters |
|---|---|---|
| C1 | The spare account holder is an **individual in Taiwan**, with no company registration | Many providers require business verification (KYB) with a company registration number |
| C2 | Payouts must reach a **Taiwan bank account** | Several providers reject Taiwanese bank accounts |
| C3 | Buyers are in **Japan**, so the provider must work cross-border and charge in yen | Providers that only serve Taiwanese businesses selling in Taiwan (ECPay 綠界, NewebPay 藍新金流) are out of scope |
| C4 | Low volume: one or two test orders now, about 30 orders a month if it ever became primary | Fixed monthly or annual fees count for much more than the percentage fee |

---

## 3. Comparison

| Provider | Company registration needed? (C1) | Taiwan bank payouts? (C2) | Cross-border, JPY (C3) | Cost | Verdict |
|---|---|---|---|---|---|
| **Stripe** | Japan-registered seller required | — | Yes | 3.6% | **The shop's provider**, once activated |
| **PayPal Taiwan** | No | Yes, via 玉山全球通 | Yes | 4.4% + ¥40 on cross-border sales, plus conversion to TWD (§4) | **Spare and test account** |
| Shopify Payments | Not available in Taiwan | — | — | — | Reject |
| KOMOJU | Card payments need a Japan-registered seller | Not confirmed | — | — | Reject |
| Payoneer Checkout | Rolling out by country; Taiwan not confirmed | Unclear | Unclear | — | Watch |
| Airwallex | Taiwan-registered sellers not confirmed | Unclear | Unclear | — | Watch |

**If the seller turns out to be a Taiwanese individual** rather than a Japan-registered seller, this table has only one usable row, and PayPal becomes the shop's provider. The work in §6 then stops being optional.

---

## 4. Cost on one ¥1,900 jar

| Step | Fee |
|---|---|
| PayPal fee on the sale (4.4% + ¥40) | ≈ ¥124 |
| Currency conversion to TWD | Up to 4% above the base rate when a payment or refund is converted (≈ ¥76). PayPal's fee page also lists 2.5% when a withdrawal's currency differs from the balance's (≈ ¥48). Confirm which applies to a JPY balance withdrawn to a Taiwan bank |
| **Total** | **≈ ¥170–200 (about 9–10%)** |

Stripe, for a Japan-registered seller, costs ≈ ¥68 (3.6%). The gap is the price of being able to test in production before Stripe is live — for one or two orders, under ¥300 in total.

---

## 5. Step 0 — prove the account before writing code

Before any of §6, take **one real payment through a PayPal payment link** and refund it.

**What it proves:** that the account can take a yen payment from a Japanese buyer, that the money reaches the Taiwan bank account through 玉山全球通, how long the payout takes, and whether funds are held for a new seller. All of that is unknown today (§7), and all of it would sink Path B if it failed.

**What it does not prove:** anything about the site — no order passes through `api/`.

**Effort:** minutes, plus the payout waiting time. Do it first.

---

## 6. Path B — PayPal as a second checkout path (chosen)

**Additive, never a rewrite.** Stripe's path stays exactly as built. PayPal becomes a second way to pay, switched on by the presence of its environment variables, the way commerce as a whole is gated today by `isCommerceConfigured`.

### 6.1 What changes

| File | Change |
|---|---|
| `server/env.ts` | Four variables and an `isPaypalConfigured` flag |
| `server/paypal.ts` | **New.** Access token cache, a `paypalFetch` helper, create, capture, read and webhook verification |
| `server/fulfil.ts` | Refactor: the Sanity transaction moves into a provider-agnostic `applyFulfilment`, with `fulfilCheckout` (Stripe) and `fulfilPaypalOrder` (PayPal) on top |
| `api/paypal-create.ts` | **New.** Validates the cart exactly as `api/checkout.ts` does, then creates a PayPal order |
| `api/paypal-capture.ts` | **New.** Captures an approved order, then fulfils it |
| `api/paypal-webhook.ts` | **New.** Signature-verified safety net for a browser that closes before capture returns |
| `api/catalog.ts` | Reports `paypal: { clientId, env }` when configured, so the client id needs no rebuild |
| `api/order.ts` | Accepts `order_id=<PayPal order>` beside `session_id=<Stripe session>` |
| `api/cron/reconcile.ts` | Also sweeps PayPal captures from the last 24 hours |
| `src/features/commerce/` | SDK loader, PayPal buttons in the drawer, the approval round trip, order-page parameter |
| `src/app/i18n.ts`, `src/features/legal/content.ts` | One line of cart copy in five languages; PayPal named as a payment method and a data processor |

Unchanged: prices and stock stay in Sanity, the order number keeps the `KJ-…` format, the fulfilment log still holds no personal data, and every relative import in `api/` and `server/` still ends in `.js`.

### 6.2 Environment variables and switches

```ts
// server/env.ts — added to the existing object
paypalClientId: read("PAYPAL_CLIENT_ID"),
paypalSecret: read("PAYPAL_SECRET"),
paypalWebhookId: read("PAYPAL_WEBHOOK_ID"),
paypalEnv: read("PAYPAL_ENV") === "live" ? "live" : "sandbox",

export const isPaypalConfigured = Boolean(env.paypalClientId && env.paypalSecret);
export const paypalApi =
  env.paypalEnv === "live" ? "https://api-m.paypal.com" : "https://api-m.sandbox.paypal.com";
```

- `PAYPAL_SECRET` and `PAYPAL_WEBHOOK_ID` are **server-only**; never `VITE_`-prefixed. The **client id is public by design** (it ships in the SDK URL), but it still travels through `/api/catalog` rather than a `VITE_` variable, so switching accounts needs no rebuild.
- **Stop lever:** remove `PAYPAL_SECRET` and redeploy — `/api/catalog` stops advertising PayPal and the buttons disappear, exactly as removing `STRIPE_SECRET_KEY` stops sales.
- `isCommerceConfigured` is unchanged and still requires Stripe. PayPal alone does not turn commerce on — until the Taiwanese-seller case becomes real, in which case that flag is revisited deliberately.

### 6.3 `server/paypal.ts`

```ts
import { env, paypalApi } from "./env.js";

let token: { value: string; expiresAt: number } | null = null;

async function accessToken(): Promise<string> {
  if (token && token.expiresAt > Date.now() + 60_000) return token.value; // warm function reuse
  const basic = Buffer.from(`${env.paypalClientId}:${env.paypalSecret}`).toString("base64");
  const res = await fetch(`${paypalApi}/v1/oauth2/token`, {
    method: "POST",
    headers: { Authorization: `Basic ${basic}`, "Content-Type": "application/x-www-form-urlencoded" },
    body: "grant_type=client_credentials",
  });
  if (!res.ok) throw new Error(`paypal token ${res.status}`);
  const body = (await res.json()) as { access_token: string; expires_in: number };
  token = { value: body.access_token, expiresAt: Date.now() + body.expires_in * 1000 };
  return token.value;
}

/** Never logs or returns PayPal's response body: it can echo the buyer's address. */
export async function paypalFetch<T>(path: string, init: RequestInit & { requestId?: string } = {}): Promise<T> {
  const res = await fetch(`${paypalApi}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${await accessToken()}`,
      "Content-Type": "application/json",
      ...(init.requestId ? { "PayPal-Request-Id": init.requestId } : {}),
      ...init.headers,
    },
  });
  if (!res.ok) throw new Error(`paypal ${path} ${res.status}`);
  return (await res.json()) as T;
}
```

`PayPal-Request-Id` makes create and capture idempotent, which matters because the buyer can double-click and the webhook can arrive while the capture call is still in flight.

### 6.4 Fulfilment: one core, two providers

`server/fulfil.ts` today retrieves a Stripe session and reads `slug`/`sku` from each line's `product_data.metadata`. Split it so the part that must stay exactly once — the Sanity transaction that creates `fulfilment.<key>` **and** decrements stock — is provider-agnostic:

```ts
export interface FulfilmentInput {
  key: string;          // Sanity document id suffix; "cs_test_…" or "pp_5O190127TN364715T"
  orderNumber: string;  // KJ-…
  lines: FulfilmentLine[];
}

export async function applyFulfilment(input: FulfilmentInput): Promise<void> { /* today's applyOnce body */ }

export async function fulfilCheckout(sessionId: string): Promise<void> { /* unchanged Stripe wrapper */ }

export async function fulfilPaypalOrder(orderId: string): Promise<void> {
  const order = await paypalFetch<PaypalOrder>(`/v2/checkout/orders/${orderId}`);
  if (order.status !== "COMPLETED") return; // not captured yet
  const key = `pp_${orderId}`;
  if (await sanity().getDocument(`fulfilment.${key}`)) return;
  await applyFulfilment({ key, orderNumber: order.purchase_units[0].custom_id ?? "", lines: linesOf(order) });
}
```

Why this shape:

- **The `fulfilment.<key>` document is the idempotency key for both providers.** Capture endpoint and webhook can both run, in either order or at the same time; the transaction that creates the document also decrements stock, and it fails as a whole if the document exists. That property is the reason double delivery has never double-decremented stock on the Stripe path, and it carries over unchanged.
- **PayPal order ids are safe as document ids** (17 alphanumeric characters), and the `pp_` prefix keeps the two providers' keys from ever colliding.
- **What was paid is read back from PayPal**, never from the browser — the same rule as reading line items from the Stripe session. Quantities come from the order's `items`. PayPal has no per-item metadata field of its own, so `items[].sku` carries `"<slug>|<sku>"` and is split server-side — the equivalent of the `product_data.metadata` the Stripe path relies on.
- `oversold` is flagged exactly as today when stock has gone since the order was created.

### 6.5 `api/paypal-create.ts`

Validation is the same as `api/checkout.ts`, and should be shared rather than copied: move `parse`, `isLine`, `orderNumber` and the catalog checks into `server/cart.ts`, and have both endpoints call them. Same guards: `sameOrigin`, JSON content type, body ≤ 4 KB, at most 2 lines × 10 jars, slugs from the catalog only, `not_for_sale` / `price_changed` / `insufficient_stock` as 409s with the same error codes the client already handles.

```ts
const number = orderNumber();
const items = cart.lines.map((line) => ({
  name: checkoutName(catalog.get(line.slug)!, cart.lang).slice(0, 127),
  sku: `${line.slug}|${item.sku}`.slice(0, 127),
  quantity: String(line.quantity),
  unit_amount: { currency_code: "JPY", value: String(item.jpy) }, // zero-decimal: no ".00"
}));

const order = await paypalFetch<{ id: string }>("/v2/checkout/orders", {
  method: "POST",
  requestId: number, // idempotent per cart submission
  body: JSON.stringify({
    intent: "CAPTURE",
    purchase_units: [{
      custom_id: number,
      description: "YuzuMono",
      amount: {
        currency_code: "JPY",
        value: String(total),
        breakdown: { item_total: { currency_code: "JPY", value: String(total) } },
      },
      items,
    }],
    payment_source: {
      paypal: {
        experience_context: {
          shipping_preference: "GET_FROM_FILE", // PayPal collects the address, as Stripe does
          user_action: "PAY_NOW",
          return_url: `${env.siteUrl}/order/complete`,
          cancel_url: `${env.siteUrl}${cart.returnPath}?cart=open`,
        },
      },
    },
  }),
});
return json({ orderId: order.id });
```

**JPY is zero-decimal.** PayPal rejects `"1900.00"`; every amount is a plain integer string, and `item_total` must equal the sum of `unit_amount × quantity` to the yen or the create call fails. Shipping stays free (D4), so there is no shipping line to reconcile.

**Only the order id goes back to the browser.** No amount, no buyer data.

### 6.6 `api/paypal-capture.ts`

```ts
export async function POST(request: Request): Promise<Response> {
  if (!isCommerceConfigured || !isPaypalConfigured) return json({ error: "unavailable" }, 503);
  if (!sameOrigin(request, env.siteUrl)) return json({ error: "forbidden" }, 403);
  const body = await readJson(request);
  const orderId = /^[A-Z0-9]{10,32}$/.test(String((body as any)?.orderId)) ? String((body as any).orderId) : "";
  if (!orderId) return json({ error: "invalid_request" }, 400);

  const captured = await paypalFetch<PaypalOrder>(`/v2/checkout/orders/${orderId}/capture`, {
    method: "POST",
    requestId: `capture-${orderId}`, // a retry returns the same capture, never a second charge
    body: "{}",
  });
  if (captured.status !== "COMPLETED") return json({ error: "not_completed" }, 409);

  await fulfilPaypalOrder(orderId); // idempotent; the webhook may also run
  return json({ orderNumber: captured.purchase_units[0].custom_id ?? null, orderId });
}
```

Stock is checked at create time and decremented here, mirroring D7 on the Stripe path. The window between the two is the same minutes-long risk, handled the same way: the `oversold` flag and a refund.

If fulfilment throws after a successful capture, the money is taken and the log is missing. That is what the webhook (§6.7) and the reconcile cron (§6.11) exist for — the response still returns success, because the buyer's payment genuinely completed.

### 6.7 `api/paypal-webhook.ts`

PayPal signs webhooks with headers rather than a body signature, and verification is a server-to-server call:

```ts
const headers = request.headers;
const event = await request.json();
const check = await paypalFetch<{ verification_status: string }>("/v1/notifications/verify-webhook-signature", {
  method: "POST",
  body: JSON.stringify({
    transmission_id: headers.get("paypal-transmission-id"),
    transmission_time: headers.get("paypal-transmission-time"),
    cert_url: headers.get("paypal-cert-url"),
    auth_algo: headers.get("paypal-auth-algo"),
    transmission_sig: headers.get("paypal-transmission-sig"),
    webhook_id: env.paypalWebhookId,
    webhook_event: event,
  }),
});
if (check.verification_status !== "SUCCESS") return new Response("Invalid signature", { status: 400 });
```

Events handled:

| Event | Action |
|---|---|
| `PAYMENT.CAPTURE.COMPLETED` | `fulfilPaypalOrder(orderId)` — the safety net when the browser closed before §6.6 returned |
| `PAYMENT.CAPTURE.REFUNDED`, `PAYMENT.CAPTURE.REVERSED` | Log with the order number. Stock is **not** added back automatically; the weekly check and the Studio are the correction path, as with a Stripe refund |
| `CUSTOMER.DISPUTE.CREATED` | Log loudly. Disputes are why every order needs its tracking number recorded (runbook step 6) |

A non-2xx response makes PayPal retry, which `fulfilPaypalOrder` tolerates. Unlike Stripe, `cert_url` must be checked to be a `*.paypal.com` host before it is used — PayPal's own library does this; doing it by hand means doing it deliberately.

### 6.8 `/api/catalog` and `/api/order`

```ts
// api/catalog.ts, in the enabled response
paypal: isPaypalConfigured ? { clientId: env.paypalClientId, env: env.paypalEnv } : null,
```

`api/order.ts` gains a PayPal branch. `session_id` keeps its `cs_(test|live)_…` pattern; `order_id` takes `^[A-Z0-9]{10,32}$` and reads the PayPal order, returning the **same shape** the order page already parses — `status`, `paymentStatus`, `orderNumber`, `total`, `currency`, `lines` — with `COMPLETED` mapped to `complete` / `paid`. The rule that this endpoint never returns an address, phone number or e-mail is unchanged.

### 6.9 Front end

- `CommerceProvider` reads `paypal` from the catalog response and, when present, loads the SDK once:
  `https://www.paypal.com/sdk/js?client-id=<id>&currency=JPY&intent=capture&components=buttons`.
  Failure to load is not an error state — the buttons simply never appear, and Stripe's Checkout button is untouched.
- `CartDrawer` renders the PayPal buttons under the existing Checkout button, behind a small "or" divider, with `createOrder` → `POST /api/paypal-create` (returning `orderId`) and `onApprove` → `POST /api/paypal-capture`. On success it clears `ym-cart-v1` and navigates to `/order/complete?order_id=…`; `onCancel` leaves the cart intact; `onError` shows the drawer's existing error message.
- The 409 responses reuse the handling `startCheckout` already has, so "we've adjusted your cart" behaves identically on both paths.
- The **development mock** (`src/features/commerce/mock.ts`) gains matching stubs, so `?commerce=mock` still works without network access.

**Card payments without a PayPal account** (the "Debit or Credit Card" button, and the `card-fields` component) depend on Advanced Card Payments eligibility, which is **country-specific and unconfirmed for a Taiwanese seller** (§7 item 2). Build the buttons first; treat card fields as a follow-up once eligibility is known.

### 6.10 Copy, legal and privacy

- One new cart string in `ja`, `en`, `fr`, `zh`, `zh-TW` (the `Translations` interface enforces all five).
- `/legal/tokushoho` lists payment methods, so it must name PayPal before a real buyer can reach the button.
- `/legal/privacy` must name **PayPal (US/Taiwan)** as a processor receiving the buyer's name, address, e-mail and phone number, alongside Stripe — including the cross-border provision wording the adviser is already reviewing (backlog item 4).

### 6.11 Reconcile cron

`api/cron/reconcile.ts` gains a second sweep: list PayPal captures completed in the last 24 hours (`POST /v1/reporting/transactions` or the orders it knows from logs), and for each one without a `fulfilment.pp_*` document, call `fulfilPaypalOrder`. Same `Authorization: Bearer ${CRON_SECRET}` guard, same once-a-day schedule, no new infrastructure.

### 6.12 Security rules (extending PLAN §13)

| Topic | Rule |
|---|---|
| Secrets | `PAYPAL_SECRET` and `PAYPAL_WEBHOOK_ID` are server-only. Add `paypal_live_`, `access_token$` and the secret's literal value to the pre-release `dist/` search |
| Client id | Public by design, served through `/api/catalog`. It is not a credential and grants nothing on its own |
| Prices | Never taken from the browser. The create endpoint re-reads Sanity and recomputes the total; the browser sends only slug, quantity and the price it displayed, which is compared and rejected on mismatch |
| Capture | `sameOrigin` + JSON + ≤ 4 KB, and the order id must match the pattern. Capturing someone else's order id is harmless — it is not tied to this cart — but the pattern check keeps arbitrary paths out of the URL |
| Webhook | Verified through PayPal's verify endpoint with `PAYPAL_WEBHOOK_ID`; unverified events get 400. `cert_url` host-checked against `*.paypal.com` |
| Logging | Never log PayPal response bodies: they carry the buyer's address. Log the order number and the HTTP status only — the rule `server/shippo.ts` already follows |
| Rate limiting | The two new endpoints join `/api/checkout` and `/api/order` in finding F5, which waits on the commercial plan (backlog item 14) |

### 6.13 Testing (mirrors PLAN §15.1)

Sandbox credentials with the Sanity `staging` dataset, on the branch preview:

1. Buy one jar from `/` and one from `/story` with a sandbox buyer account → `/order/complete` shows paid with the `KJ-…` number, exactly one `fulfilment.pp_*` document, stock down by the quantity.
2. Cancel at the PayPal window → nothing logged, stock unchanged, cart intact.
3. Close the browser between approval and capture → the webhook alone fulfils the order.
4. Replay `PAYMENT.CAPTURE.COMPLETED` from the PayPal dashboard → no second document, no second decrement.
5. Capture the same order id twice → one capture, one fulfilment.
6. Stock 0 → the create endpoint refuses with `insufficient_stock` and the drawer adjusts the cart.
7. Stale price → `price_changed` with the server's amount.
8. `Origin: https://example.com` → 403 on both new endpoints.
9. Refund in the dashboard → the refund event is logged and stock is **not** silently restored.
10. Remove `PAYPAL_SECRET`, redeploy → the buttons vanish and Stripe's path still works.

Then, on **production with live credentials**, one real order: buy, fulfil by hand from the runbook, refund. That is the whole point of Path B.

### 6.14 Rollout, and not showing this to real buyers too early

The production site is public while Stripe is still under review, so a live PayPal button could take an order the legal pages do not yet describe. Gate it:

1. Preview + sandbox first, with the full §6.13 list.
2. Production + live credentials, but the buttons hidden behind an opt-in the tester types — `?pay=paypal`, stored for the session — so the public sees the site exactly as before.
3. Once the legal pages name PayPal (§6.10) and the owner decides to offer it to buyers, drop the gate.
4. When Stripe goes live, decide whether PayPal stays on as a second method (it costs nothing to keep) or is switched off with its variables.

### 6.15 Effort

| Work | Hours |
|---|---|
| `server/paypal.ts`, env, shared cart validation extracted from `api/checkout.ts` | 3–4 |
| `fulfil.ts` refactor into `applyFulfilment` + both wrappers, with replay tests | 2–3 |
| Create, capture and webhook endpoints | 4–6 |
| Catalog, order endpoint, reconcile sweep | 2–3 |
| Front end: SDK loader, buttons, order page parameter, mock | 3–5 |
| Copy in five languages, legal and privacy wording | 1 |
| **Total** | **14–22 h** (plus the §6.13 test run and the account steps in §7) |

---

## 7. Open items before sign-up

1. **Account type.** Confirm with PayPal whether a personal account may sell goods, or whether a business account is needed — and, if so, whether an individual without company registration can open one.
2. **Paying by card without a PayPal account.** Confirm buyers can pay by card at checkout without a PayPal account (the "Debit or Credit Card" button) for a Taiwan-registered seller selling to Japan.
3. **Conversion cost.** Confirm how a **JPY** balance is converted when withdrawn to a Taiwan bank through 玉山全球通, and which fee applies (4% or 2.5%, §4).
4. **Payout setup.** The account holder must be at least 18 with a Taiwan ID. Payouts to banks other than E.SUN need a separate application, and the first payout may require a call to customer service.
5. **Payment holds and disputes.** PayPal may hold a new seller's funds for a period, and buyers can open disputes. Keep tracking numbers for every order (Japan Post provides them) so seller protection applies.
6. **Legal texts.** The 特定商取引法 page names the seller and the payment methods offered. If PayPal is ever offered to real buyers, that page and the privacy page must name it, and PayPal joins the list of data processors.
7. **Where jars ship from.** Taxes, returns and the required seller information differ if jars ship from Taiwan rather than Japan (the fulfilment runbook assumes Japan). Separate from the payment decision, but it must be settled before launch.

---

## 8. Sources

- PayPal Taiwan seller fees: <https://www.paypal.com/tw/business/paypal-business-fees>
- PayPal payouts to Taiwan banks via 玉山全球通: <https://www.esunbank.com/zh-tw/about/faq/content?q=paypal%2F015>
- PayPal Taiwan payout process: <https://www.paypal.com/tw/webapps/mpp/withdrawal-process>
- Stripe availability: <https://stripe.com/global>
- Shopify payments in Taiwan: <https://www.cartdna.com/shopify-payment-guide/asia-east/taiwan>
- KOMOJU vs Stripe (Japan registration required for cards): <https://en.komoju.com/cross-border-payment-solutions/komoju-vs-stripe/>
- Payoneer Checkout FAQ: <https://payoneer.custhelp.com/app/answers/detail/a_id/40689/~/payoneer-checkout---faq>
