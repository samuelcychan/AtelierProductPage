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
| **Effort** | Path A (a payment link, §5) needs no code. Path B (a second checkout path, §6) is about the same work as the Stripe checkout and webhook. |

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

## 5. Path A — a payment link, no code (recommended first)

The cheapest way to use the spare account. PayPal issues a payment link or invoice; one real payment is made against it and then refunded.

**What it proves:** that the PayPal account can take a real yen payment from a Japanese buyer, that the money reaches the Taiwan bank account through 玉山全球通, how long the payout takes, and whether funds are held for a new seller.

**What it does not prove:** anything about the production site. The cart, the server price check, the stock decrement, the order log and the order page are all untouched, because no order passes through `api/`.

**Effort:** minutes, plus the payout waiting time.

Do this first: it de-risks the account itself, which is the part with unknowns (§7), and it costs nothing to build.

---

## 6. Path B — PayPal as a second checkout path

Needed when the goal is to exercise the **production shop** end to end before Stripe is live, and required outright if PayPal becomes the primary provider.

It is **additive**. Stripe's path stays exactly as built; PayPal becomes a second way to pay, switched on by the presence of its environment variables, the same way commerce as a whole is gated today.

- **Checkout:** the PayPal JavaScript SDK renders the PayPal and card buttons in the cart drawer. A function creates the order with the Orders v2 API (`POST /v2/checkout/orders`), using prices read from Sanity, never from the browser. Server-side it gets an access token with `PAYPAL_CLIENT_ID` and `PAYPAL_CLIENT_SECRET` (server-only, never `VITE_`). JPY has no decimal places, so `1900` means ¥1,900.
- **Capture:** a second function captures the approved order (`POST /v2/checkout/orders/{id}/capture`) and then calls the **existing** fulfilment code, so the order log and stock decrement stay shared with Stripe's path.
- **Webhook:** `PAYMENT.CAPTURE.COMPLETED`, `PAYMENT.CAPTURE.REFUNDED` and dispute events, alongside `/api/stripe-webhook` rather than instead of it. Verify each event with `POST /v1/notifications/verify-webhook-signature` before trusting it.
- **Order numbers:** the same `KJ-…` format, so fulfilment and the runbook do not change.
- **Refunds:** in the PayPal dashboard, or through the refund endpoint for captured payments.
- **Unchanged:** prices and stock stay in Sanity; every relative import in `api/` and `server/` still ends in `.js`.
- **Testing:** PayPal's Sandbox with the Sanity `staging` dataset, the way Stripe test mode is used today.
- **Switching off:** remove the PayPal variables and redeploy, and the buttons disappear — the same stop lever the Stripe keys have.

**Effort:** comparable to the Stripe checkout and webhook work. Worth it only if Stripe's activation stalls, or if the Taiwanese-seller case becomes real.

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
