# Payment provider backup plan — Taiwan-based seller

**A fallback for [PLAN-stripe-and-shippo.md](PLAN-stripe-and-shippo.md).** That plan registers Stripe with the account country set to **Japan**. This document covers the case where the seller is an **individual in Taiwan**, with no registered company and only a Taiwan bank account.

Facts below were checked on 2026-09-24 against the sources in §6. This is an engineering note, not legal or tax advice. Confirm every fee and eligibility rule with the provider before signing up.

## 1. Constraints

| # | Constraint | Why it matters |
|---|---|---|
| C1 | The seller is an individual in Taiwan, with no company registration | Many providers require business verification (KYB) with a company registration number |
| C2 | Payouts must go to a **Taiwan bank account** | Several providers reject Taiwanese bank accounts |
| C3 | Buyers are mainly in **Japan**, so the provider must work cross-border and charge in yen | Providers that only serve Taiwanese businesses selling in Taiwan (for example ECPay 綠界 and NewebPay 藍新金流) are out of scope |
| C4 | Low volume at launch: about 30 orders a month at ¥1,900 a jar | Fixed monthly or annual fees count for much more than the percentage fee |

## 2. Conclusion

**Primary provider: PayPal Taiwan.**

- **Verification:** a personal account needs only a Taiwan ID and passport. No company registration.
- **Payouts:** to a Taiwan bank through E.SUN Bank's 玉山全球通 service, to an E.SUN account or another local bank.
- **Japanese buyers:** charged in **JPY**, so they see a yen price and don't pay their card company's foreign-purchase fee. PayPal is widely used in Japan.
- **Cost:** 4.4% + ¥40 per sale. There is no monthly or annual fee.

Stripe stays the first choice **only if** a Japan-registered seller (Kimie or a Japanese company) owns the account. Stripe charges 3.6%, has no fixed fees, and the code in `api/` and `server/` is already built.

No second provider currently meets every constraint. Payoneer Checkout and Airwallex are on the watch list (§3).

## 3. Comparison

| Provider | Company registration needed? (C1) | Taiwan bank payouts? (C2) | Cross-border, JPY (C3) | Cost | Verdict |
|---|---|---|---|---|---|
| **PayPal Taiwan** | No | Yes, via 玉山全球通 | Yes | 4.4% + ¥40 on cross-border sales, plus currency conversion when converting to TWD (§3.1) | **Primary** |
| Stripe | Not available for Taiwan sellers | — | — | — | Reject (unless the seller is registered in Japan) |
| Shopify Payments | Not available in Taiwan | — | — | — | Reject |
| KOMOJU | Card payments need a Japan-registered seller | Not confirmed | — | — | Reject |
| Payoneer Checkout | Rolling out by country; Taiwan not confirmed | Unclear | Unclear | — | Watch |
| Airwallex | Taiwan-registered sellers not confirmed | Unclear | Unclear | — | Watch |

### 3.1 Cost on one ¥1,900 jar

| Step | Fee |
|---|---|
| PayPal fee on the sale (4.4% + ¥40) | ≈ ¥124 |
| Currency conversion to TWD | Up to 4% above the base rate when a payment or refund is converted (≈ ¥76). PayPal's fee page also lists 2.5% when a withdrawal's currency differs from the balance's (≈ ¥48). Confirm which applies to a JPY balance withdrawn to a Taiwan bank |
| **Total** | **≈ ¥170–200 (about 9–10%)** |

For comparison, Stripe for a Japan-registered seller costs ≈ ¥68 (3.6%).

## 4. Open items before sign-up

1. **Account type.** Confirm with PayPal whether a personal account can sell goods, or whether a business account is needed. If it is, confirm that an individual without company registration can open one.
2. **Paying by card without a PayPal account.** Confirm that buyers can pay by card at checkout without a PayPal account (the "Debit or Credit Card" button) for a Taiwan-registered seller selling to Japan.
3. **Conversion cost.** Confirm how a **JPY** balance is converted when withdrawn to a Taiwan bank through 玉山全球通, and which fee applies (4% vs 2.5%, see §3.1).
4. **Payout setup.** The account holder must be at least 18 with a Taiwan ID. Payouts to banks other than E.SUN need a separate application, and the first payout may require a call to customer service.
5. **Payment holds and disputes.** PayPal may hold funds from a new seller for a period, and buyers can open disputes. Keep tracking numbers for every order (Japan Post provides them) so seller protection applies.
6. **Where orders ship from, and the legal texts.** Taxes, returns and the seller information required under Japan's 特定商取引法 depend on whether jars ship from Taiwan or from Japan (the Japan Post runbook assumes Japan). Settle this before launch; it is separate from the payment decision.

## 5. Code impact if PayPal replaces Stripe

- **Checkout:** the PayPal JavaScript SDK renders the PayPal and card buttons on the cart page. A function creates the order with the Orders v2 API (`POST /v2/checkout/orders`), using prices read from Sanity, never from the browser. Server-side it gets an access token with `PAYPAL_CLIENT_ID` and `PAYPAL_CLIENT_SECRET` (server-only, never `VITE_`). JPY has no decimal places, so `1900` means ¥1,900.
- **Payment capture:** a second function captures the approved order (`POST /v2/checkout/orders/{id}/capture`) and then reduces stock. This replaces the Stripe Checkout session flow.
- **Webhook:** `PAYMENT.CAPTURE.COMPLETED`, `PAYMENT.CAPTURE.REFUNDED` and dispute events replace `/api/stripe-webhook`. Verify each event with `POST /v1/notifications/verify-webhook-signature` before trusting it.
- **Refunds:** done in the PayPal dashboard, or through the refund endpoint for captured payments.
- **Unchanged:** prices and stock stay in Sanity, and stock updates still happen server-side. Every relative import in `api/` and `server/` still ends in `.js`.
- **Testing:** use PayPal's Sandbox for test purchases, together with the Sanity `staging` dataset, the same way Stripe test mode is used today.
- **Effort:** about the same as the Stripe checkout and webhook work.

## 6. Sources

- PayPal Taiwan seller fees: <https://www.paypal.com/tw/business/paypal-business-fees>
- PayPal payouts to Taiwan banks via 玉山全球通: <https://www.esunbank.com/zh-tw/about/faq/content?q=paypal%2F015>
- PayPal Taiwan payout process: <https://www.paypal.com/tw/webapps/mpp/withdrawal-process>
- Stripe availability: <https://stripe.com/global>
- Shopify payments in Taiwan: <https://www.cartdna.com/shopify-payment-guide/asia-east/taiwan>
- KOMOJU vs Stripe (Japan registration required for cards): <https://en.komoju.com/cross-border-payment-solutions/komoju-vs-stripe/>
- Payoneer Checkout FAQ: <https://payoneer.custhelp.com/app/answers/detail/a_id/40689/~/payoneer-checkout---faq>
