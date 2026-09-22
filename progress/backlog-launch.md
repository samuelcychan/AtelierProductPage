# Backlog: Launch Stripe + Shippo commerce (Japan)

**Format:** WWA (Why – What – Acceptance)
**Scope:** only the work left after tracks A–D were merged into `feat/commerce-stripe-shippo`. Built and verified work is not repeated here.
**Total items:** 15 — 7 engineering or shared, 8 owner or adviser
**Estimated effort:** engineering is about one sprint (review, preview testing, launch wiring). The owner and adviser items (legal text, tax and food compliance, Stripe activation) depend on outside parties, typically days to weeks, and set the launch date.
**Source:** [PLAN-stripe-and-shippo.md](../PLAN-stripe-and-shippo.md), [progress/README.md](README.md)
**State as of:** 2026-09-21
**Progress:** items 1, 2, 3, 7 and 12 are done. Items 4–6, 8–11 and 13–15 are open, and the owner and adviser items still set the launch date.

## Current state (verified 2026-09-21)

Checked live against Vercel, Sanity and the deployed sites on the date above. The original 2026-09-16 baseline this backlog opened with is in git history.

- **Local:** `vercel dev` serves the functions from the root `.env`. The first end-to-end test payment (`KJ-260915-2664B8`) was made this way on 2026-09-15: paid in Stripe, order logged in Sanity, stock decremented.
- **Preview:** live at `https://atelier-product-page-git-feat-commerce-62a5ef-samuelcychan-team.vercel.app` with all seven variables set, so commerce is **on**. It reads and writes the `staging` Sanity dataset, not `production` (finding F2). Every PLAN §15.1 scenario has passed here — item 2.
- **Production:** `https://kimie-atelier.vercel.app` serves the merged branch with commerce **off**: `/api/catalog` returns `{"enabled":false}`. It holds `VITE_SANITY_PROJECT_ID`, `VITE_SANITY_DATASET` (=`production`), `VITE_SANITY_API_VERSION` and `CRON_SECRET`. The Stripe keys, `SANITY_WRITE_TOKEN` and `SITE_URL` are deliberately absent until item 13.
- **Owner data:** SKUs set; stock in the `production` dataset reads mustard 1 / tapenade 1 — the owner raised mustard from 0 to 1 by hand on 2026-09-20 after a preview purchase took the last jar, so neither figure is a counted shelf number; packed weights still read 100 g (unconfirmed); customs description and HS code empty; the hosted Studio is still not deployed — item 6.
- **Legal pages:** every business detail is still a placeholder — item 4.
- **Security:** findings F1–F4 are closed. F5 (rate limiting) waits for the commercial plan — item 14 — and F6 (Studio dependencies) is not a launch blocker. Both sit under item 3.

---

## Items

### 1. Preview deployment shows real prices and accepts test checkouts

**Why:** No purchase can be tested in a production-like environment until the preview switches commerce on. This unblocks items 2, 3 and 8.

**What:** Add `VITE_SANITY_PROJECT_ID`, `VITE_SANITY_DATASET` and `VITE_SANITY_API_VERSION` to the **Preview** environment (tick Preview on the existing Production variables), then redeploy the branch so the build and functions pick them up. Everything else on the preview is already configured.

**Acceptance Criteria:**
- `…/api/catalog?t=<any>` on the branch address returns `"enabled":true`, with mustard and tapenade both `forSale` and `available`
- `/` and `/story` on the branch address show ¥1,900 and ¥2,100, with Add to Cart enabled
- `/story` shows content from Sanity: `#jars` has `data-products-source="cms"`, and there are no CORS errors in the console
- `vercel env ls preview` lists all seven variables the server and build need

Priority: P0 | Effort: S | Owner: engineering (needs Vercel project access) | Dependencies: none

**Status: Done — verified 2026-09-19** on deployment `n0x6j6d0a` (the branch address):
- `…/api/catalog?t=…` returns `"enabled":true`, both jars `forSale` and `available`, ¥1,900 and ¥2,100 ✅
- `/story` shows both prices with Add to Cart enabled; `/` shows the price and enabled buttons in its carousel; the cart button is present and no "paused" note appears ✅
- `/story` reports `data-products-source="cms"`; no console errors on either page ✅
- `vercel env ls preview` lists all seven variables (`VITE_SANITY_*` now target Production **and** Preview) ✅

---

### 2. Checkout, fulfilment and stock verified on the preview

**Why:** Local tests passed, but only a real deployment proves the webhook delivery, redirects, origin check and caching together. This is the go/no-go evidence before any live money moves.

**What:** Run the test list in PLAN §15.1 against the branch preview in Stripe test mode, and record the results in the board's integration log. Scenarios needing card entry (test cards 4242…, 4000 0000 0000 0002, 4000 0027 6000 3184) are done by the owner; the rest can be scripted or run by an agent.

**Acceptance Criteria:**
- A test purchase from `/` and one from `/story` each reach `/order/complete` as paid, create exactly one `fulfilment.<session id>` document, and lower stock by the quantity bought, **without** `stripe listen`
- A declined card and an abandoned checkout record nothing and leave stock unchanged
- Replaying a completed event (Stripe Dashboard → Resend) creates no second log entry and no second decrement
- `price_changed`, `insufficient_stock` and "stock 0 → Sold out" behave as specified on the preview
- Results table added to `progress/README.md` with date, scenario and outcome

Priority: P0 | Effort: M | Owner: engineering + owner (card entry) | Dependencies: item 1

**First purchase: passed.** One purchase on the preview succeeded end to end: order `KJ-260916-E0C41B`, tapenade ×1, ¥2,100, paid 2026-09-16 01:56 UTC. Its Stripe session's success and cancel URLs are the branch address (started from `/story`), it created exactly one `fulfilment.*` document, and `stock-tapenade` went 2 → 1 at the same moment — with no `stripe listen` running, so the Dashboard webhook delivered it.

**Declined card: passed (2026-09-19 15:10 UTC).** Payment intent `pi_3UHPxEE…` (¥1,900) ended `requires_payment_method` with `card_declined` / `generic_decline`; charge `ch_3UHPxEE…` `failed`, `paid: false`; session `cs_test_a171WramWH…` stayed `unpaid`. No `fulfilment.*` document was created (count still 2) and stock was unchanged (mustard 1, tapenade 1).

**Event replay: passed (2026-09-19 15:28 UTC).** `stripe events resend evt_1UFzp0…  --webhook-endpoint=we_1UG1SG…` re-delivered the first order's `checkout.session.completed` to the preview. Vercel logs show `POST /api/stripe-webhook` at 15:28 UTC; afterwards the `fulfilment.*` count was still 2 and both stock documents kept their earlier timestamps (2026-09-15 / 2026-09-16). So a repeated event creates no second order and takes no second jar.

**Abandoned / expired session: passed (2026-09-19 15:41 UTC).** The declined attempt's session `cs_test_a171WramWH…` reached `status: "expired"` with `payment_status: "unpaid"` at its `expires_at` (31 minutes after creation, as `/api/checkout` sets). Stripe emitted `checkout.session.expired`; the site ignores that type. Afterwards the `fulfilment.*` count was still 2 and stock was unchanged.

**Sold out, low stock, stale price and wrong origin: passed (2026-09-19 15:50–16:05 UTC), all without entering a card.** With `stock-mustard` set to 0: the catalog reported `available:false` while tapenade stayed `true`, `/story` showed a disabled "Sold out" button for mustard, and `POST /api/checkout` refused with `{"error":"insufficient_stock","slug":"mustard","available":0}`. With stock back at 1: asking for 2 returned `available:1`; sending a stale price of 1800 returned `{"error":"price_changed","slug":"mustard","unitAmount":1900}`; a request with `Origin: https://example.com` got HTTP 403. In the browser, a cart holding 2 mustard was reduced to 1 on Checkout with "We've adjusted your cart to the jars still available", subtotal ¥1,900, and no redirect to Stripe. Stock was restored to 1 afterwards.

**Purchase from `/`: passed (2026-09-19 16:03 UTC).** Session `cs_test_a1ZKdwxs…` (¥1,900, cancel URL `/?cart=open`, so it started on the main page) was paid and complete; it created order `KJ-260919-28B46F` (mustard ×1, `oversold: false`) and `stock-mustard` went 1 → 0 at the same second.

**Price changed: passed (2026-09-20).** With a cart holding tapenade at ¥2,100 open on the preview, the price was changed to ¥2,200 in Sanity. Checkout was refused, and the drawer updated the line and subtotal to ¥2,200 with "A price has changed. Please check your cart.", staying on `/story` with the cart intact. The price was restored to ¥2,100 and the catalog confirms it.

**Status: Done.** Every §15.1 scenario has evidence; the results table is in [README.md](README.md) under "Preview test results". Since then the preview has moved to its own `staging` dataset (finding F2), so re-running any of these scenarios exercises staging and no longer touches live stock. Note for launch: real numbers must be set in the `production` dataset, which reads mustard 1 / tapenade 1 as of 2026-09-21.

---

### 3. Security review of the commerce code

**Why:** The checkout, webhook and stock code handle money and personal data, and were written by four parallel agents. An independent review before launch is cheaper than an incident.

**What:** Review `api/`, `server/`, `src/features/commerce/` and `vercel.json` against PLAN §13: secret handling, webhook signature verification, origin and body limits on checkout, redirect targets, personal data in logs, the Sanity token scope, and the cron authorisation. Fix confirmed findings on the branch.

**Acceptance Criteria:**
- Every §13 rule is marked verified, or has a linked fix commit
- A fresh `dist/` contains no `sk_live_`, `sk_test_`, `rk_live_`, `whsec_`, `shippo_` or token values
- Findings, severity and resolution are recorded in `progress/README.md`
- No open finding of high severity at the end of the item

Priority: P0 | Effort: M | Owner: engineering (independent reviewer) | Dependencies: none

**Status: Done — reviewed 2026-09-20.** Full record in [README.md](README.md) under "Security review (PLAN §13, 2026-09-20)".
- Every §13 rule is marked verified against the live preview, Sanity and Vercel, or noted as not applicable (Shippo webhook) ✅
- A fresh `dist/` contains none of the key patterns, and none of the secret values in the root `.env`; only the public `VITE_SANITY_*` identifiers appear ✅
- Six findings recorded with severity and action: F1 and F2 medium, F3–F6 low ✅
- No open high-severity finding ✅
- F4 (missing security response headers) fixed on the branch in `vercel.json` and confirmed live on the preview ✅

**Carried out of this item:** F1 `CRON_SECRET` unset and F2 public preview writing to the live dataset belonged to item 12 and were **closed 2026-09-20**; F3 Sanity CORS credentials was **closed 2026-09-21** — `http://localhost:5173` re-added without credentials and the stale origin deleted. Still open: F5 rate limiting, which waits for the commercial plan, and F6 the Studio dependency upgrade, which is not a launch blocker. Steps and evidence in [security-fix-steps.md](security-fix-steps.md).

---

### 4. Legal and policy pages contain real business details

**Why:** Japanese law requires a 特定商取引法 disclosure for online sales, and Stripe reviews the public site before enabling live payments. Placeholder pages block both.

**What:** Replace every owner placeholder in `src/features/legal/content.ts`: 37 Japanese and 37 English, 8 each in French, Simplified Chinese and Traditional Chinese on the shipping page. Also resolve the 4 adviser-review items (privacy entrustment and cross-border provision). Text comes from the owner and advisers; engineering pastes it in and redeploys.

**Acceptance Criteria:**
- `grep` finds no `todoJa(`, `todoEn(`, `todoFr(`, `todoZh(`, `todoTw(`, `reviewJa(` or `reviewEn(` calls in `content.ts`
- The "Draft" notice no longer appears on any legal page in any language
- The legal name, address, phone and e-mail on `/legal/tokushoho` match the Stripe account application
- The privacy page names every data processor actually used: Stripe, Vercel and Sanity. Not Shippo, which item 7 dropped. Japan Post receives addresses as the carrier.
- The shipping costs on `/legal/tokushoho` and `/legal/shipping` match item 15's decision

Priority: P0 | Effort: M (text) + S (engineering) | Owner: owner and advisers | Dependencies: item 15 (shipping-cost wording)

---

### 5. Shipping promises are consistent across the site

**Why:** The legal pages say "ships within Japan only", while the existing FAQ copy promises EMS to the US, EU, UK and Australia. Buyers and Stripe's reviewers see the contradiction, and international promises carry import obligations we haven't cleared (§5.2).

**What:** The owner decides the launch shipping scope: Japan only is recommended (D2). Update the FAQ shipping answer and any "Shipping included" copy in all five locales to match, and remove "Ehime" in favour of Kanagawa.

**Acceptance Criteria:**
- The FAQ, `/legal/shipping` and the cart's shipping note state the same destinations in all five languages
- No page mentions Ehime/愛媛; the shipping origin reads Kanagawa/神奈川
- If Japan only: Stripe Checkout's allowed countries stay `["JP"]` and no copy promises international delivery
- The decision is recorded in PLAN §23 decision log

Priority: P1 | Effort: S | Owner: owner decides; engineering updates copy | Dependencies: none

---

### 6. Catalog data is accurate and editable by Kimie without a developer

**Why:** Shipping labels use packed weight, and the site sells whatever stock says. The Studio is only reachable through a local dev server today, which Kimie can't run.

**What:** Measure and enter real packed weights (both currently read 100 g), set launch stock numbers, and add customs description and HS code only if exporting. Deploy the Studio (`npx sanity deploy`) so it's reachable at the hosted address, and invite Kimie.

**Acceptance Criteria:**
- Both products' packed weight is a measured value, confirmed by the owner
- The hosted Studio URL loads, and Kimie can open Products → Commerce and Stock
- Stock numbers equal the jars on hand on launch day, set in the **`production`** dataset (the preview’s `staging` copy is test data)
- A Vision query confirms both products are for sale with a SKU, a weight and a positive whole-yen price

Priority: P1 | Effort: S | Owner: owner (data), engineering (deploy) | Dependencies: none

---

### 7. Spike: decide the fulfilment path (Shippo or Japan Post)

**Why:** Shippo has no Japanese carriers and its own discounted accounts only cover US-outbound shipments (PLAN "Read this first"). Building the Shippo webhook before confirming it can label a jar from Kanagawa at a fair price risks wasted work.

**What:** Time-boxed investigation (PLAN §6.4). Create a Shippo test account with a Kanagawa sender address, connect a DHL Express Japan (or FedEx/UPS) account, attempt a test label and rate quotes for one and two jars, and compare with Japan Post. Outcome: Path A (Shippo) or Path B (Japan Post), with the rates found.

**Acceptance Criteria:**
- The result of a test label attempt from a Japan address is documented (label bought, or the error)
- Rates for one and two packed jars are recorded for the chosen carrier(s) and for Japan Post
- Decision A or B recorded in PLAN §23, with the reason
- If B: `SHIPPO_API_TOKEN` stays unset in all environments, and the Shippo webhook (Phase 6) is closed as won't-do

Priority: P1 | Effort: S (time-boxed spike, 1–2 days elapsed for carrier replies) | Owner: owner + engineering | Dependencies: none

**Status: Done 2026-09-21. Path B (Japan Post, manual); Shippo dropped.** Decided from a desk comparison of six options (PLAN §2.3) instead of the Shippo test. A Japan-only launch needs a domestic carrier, and Shippo has none, so no test label could change the answer. That makes the first acceptance criterion moot. Public rates were recorded instead (PLAN §19.3). They cover one parcel; the one- versus two-jar difference moves to item 15 once packed weights are measured (item 6). The decision and roadmap are in PLAN §23. `SHIPPO_API_TOKEN` stays unset in every environment; `server/shippo.ts` is inert, and the Shippo webhook is won't-do.

---

### 8. Kimie can fulfil an order end to end on the chosen path

**Why:** An order that is paid but never shipped is worse than no store. The first real orders must not be the first time anyone runs the fulfilment steps.

**What:** Write a one-page owner runbook for Japan Post (PLAN §12.2, chosen in item 7): where new orders appear, packing with the parcel type from item 15, the ゆうパック label (handwritten or printed), drop-off or collection, entering the tracking number into the Stripe payment metadata, and e-mailing the buyer. Kimie rehearses it on a preview test order.

**Acceptance Criteria:**
- Runbook exists in the repo and is linked from the board — **done 2026-09-23:** [runbook-fulfilment.md](runbook-fulfilment.md), with a Japanese page for Kimie at <https://claude.ai/artifact/CLJNM4dtEHWzCVzh1ikpZL> (private until the owner shares it). Step 4 (packing) stays open until item 15.
- Kimie completes a full rehearsal on a test order without developer help: finds the order, creates a label (or a mock label), adds `tracking_number` in Stripe
- Weekly checks (stock vs shelf, oversold query, tracking on every payment) are listed in the runbook

Priority: P1 | Effort: S | Owner: owner, supported by engineering | Dependencies: item 7 (path — done), item 15 (parcel type), item 2 (a preview test order)

---

### 9. Translations reviewed by native speakers

**Why:** Cart, order, legal-link and shipping copy in French, Simplified Chinese and Traditional Chinese was machine-drafted. Wrong wording at checkout erodes trust at the moment of purchase.

**What:** Native review of the `cart`, `order` and `legal` blocks in `src/app/i18n.ts` and the French and Chinese shipping page in `content.ts`, with corrections applied.

**Acceptance Criteria:**
- A reviewer for each of fr, zh and zh-TW has signed off, recorded with name or role and date
- All corrections are merged, and the drawer, order page and shipping page render the reviewed text in each language
- Typecheck and build still pass

Priority: P2 | Effort: S | Owner: owner (arranges reviewers), engineering applies | Dependencies: item 5 (the shipping wording must be final first)

---

### 10. Tax and food compliance signed off for Japan

**Why:** Selling food online requires the right business permit and correct allergen labelling. Prices are displayed tax-inclusive, and the food consumption-tax rate is planned to change in April 2027. No real order should be taken without this.

**What:** The owner confirms with the public health centre (保健所) and a tax accountant (税理士) the items in PLAN §5.1: food business permit, labels and allergens (wheat, soybean, anchovies), invoice-system registration status, and how tax-inclusive prices and receipts should be handled, including the planned food-rate change.

**Acceptance Criteria:**
- Permit status and labelling review are recorded (date, authority or adviser)
- The tax accountant's guidance on tax-inclusive prices and receipts is recorded, including what to do before April 2027
- Allergen information appears on the product pages if the adviser requires it
- The §5.1 rows are marked confirmed on the board

Priority: P0 | Effort: L (external) | Owner: owner + advisers | Dependencies: none

---

### 11. Stripe account activated for live payments in Japan

**Why:** Test mode can't take real money. Stripe reviews the business profile and the public website before activation, and rejection delays launch.

**What:** Complete the Stripe business profile (Japan, legal name matching the legal notice, payout bank account, identity verification) and submit for activation once the production site shows real product information and completed legal pages.

**Acceptance Criteria:**
- Stripe Dashboard shows live payments enabled and payouts enabled
- The account's business details match `/legal/tokushoho` on the production site
- Customer e-mails for successful payments and refunds are switched on, and a test receipt is checked in Japanese
- Adaptive Pricing is off, and only cards, Apple Pay and Google Pay are enabled (D3, D9)

Priority: P0 | Effort: M (external review) | Owner: owner | Dependencies: item 4 (legal pages live), item 12 (production site shows them)

---

### 12. Commerce code on production, switched off

**Why:** Merging and deploying with commerce off lets the legal pages and product information go live for Stripe's review (item 11) without exposing checkout early. The hosting plan this runs on is a separate decision — item 14.

**What:** Merge `feat/commerce-stripe-shippo` into `main` via a pull request and let production deploy **without** Stripe variables. Without them, commerce reports as off, so the site shows no prices or buy buttons.

**Acceptance Criteria:**
- `https://kimie-atelier.vercel.app/api/catalog` returns `{"enabled":false}` after the merge
- `/`, `/story` and all four `/legal/*` pages load on production with no buy buttons and no console errors
- `vercel.json`'s rewrite serves built assets correctly on production (no HTML served for `.js`/`.css`)
- The five security response headers added for finding F4 are present on production (`curl -I`)
- **F1:** ✅ done 2026-09-20 — `CRON_SECRET` set on Preview and Production; the preview cron returns `{"checked":1,"failed":0}` with the bearer and 401 without it. Note that production answers 401 to the cron regardless until commerce is switched on, because `isCommerceConfigured` is checked before the bearer — verify the bearer on the preview now, and on production at item 13
- **F2:** ✅ done 2026-09-20 — Preview points at the new `staging` dataset; `VITE_SANITY_DATASET` is split per environment and the separation was proved with a stock value present only in staging

Priority: P0 | Effort: S | Owner: engineering (PR, deploy) | Dependencies: item 3 (security review) is recommended before merging

**Status: Done — merged and verified 2026-09-20.** PR [#5](https://github.com/samuelcychan/AtelierProductPage/pull/5) merged into `main` (`763443a`, 59 commits, 45 files, no conflicts, CI green) and deployed to `https://kimie-atelier.vercel.app`.

Verified on production:
- `/api/catalog` returns `{"enabled":false}`; `/api/checkout` 503, `/api/order` 404, `/api/cron/reconcile` 401 ✅
- `/` and `/story` render with no prices and no cart or buy controls; `/story` still reports `data-products-source="cms"`, so Sanity product copy is unaffected ✅
- All four `/legal/*` pages render, each showing the Draft notice and placeholders (item 4) ✅
- `/order/complete` without a session shows "order not found" ✅
- No console errors on any page ✅
- The SPA rewrite works: `/assets/*.js` serves as `application/javascript` and `/assets/*.css` as `text/css`, and every client route returns `index.html` ✅
- All five security headers from finding F4 are present on production ✅

**Steps for F1 and F2:** [security-fix-steps.md](security-fix-steps.md) — neither depended on the plan decision.

**Split out 2026-09-21:** this item also carried the commercial-use plan decision (D13), which held it open although the deploy work finished on 2026-09-20. The decision is now **item 14**, owned by the owner and gating item 13 alone.

**Carry into item 13:** the `production` dataset reads mustard 1 / tapenade 1 (checked 2026-09-21); real launch stock must be set there before go-live.

---

### 13. Go live: real orders accepted in Japan

**Why:** This is the outcome everything else serves: customers in Japan can buy jars and Kimie gets paid.

**What:** Add Production variables: live `STRIPE_SECRET_KEY`, the signing secret of a **live** webhook endpoint at `https://kimie-atelier.vercel.app/api/stripe-webhook`, `SANITY_WRITE_TOKEN`, `SITE_URL=https://kimie-atelier.vercel.app` and `CRON_SECRET` — the last of these has been set on Production since F1, so only the four Stripe and Sanity values are missing. Redeploy, set real stock, and run the PLAN §16.1 launch checklist, including one real-card order that is fulfilled and refunded.

**Acceptance Criteria:**
- The production catalog returns `"enabled":true`, and a real one-jar order completes, logs, decrements stock, and appears in Stripe live mode
- That order is fulfilled on the chosen path and refunded, and stock is corrected by hand
- The daily reconcile cron appears under Vercel → Cron Jobs and its first run succeeds
- Each stop lever is rehearsed once: stock → 0 hides purchase within a minute; "For sale" off; removing `STRIPE_SECRET_KEY` + redeploy turns commerce off
- No live secret appears in the repository, the bundle or function logs

Priority: P0 | Effort: M | Owner: engineering + owner | Dependencies: items 2, 3, 4, 10, 11, 12, 14 (and 7–8 for fulfilment)

---

### 14. Vercel plan permitting commercial use (D13)

**Why:** Vercel's Hobby plan restricts the account to non-commercial, personal use, so taking real money from the site needs a plan that permits commercial use. This is a billing decision, not engineering work, and it gates item 13 alone — everything up to and including the dark production deploy runs on the plan in use today. (Corrected 2026-09-20: the daily cron is **not** a reason to upgrade — cron jobs run on every plan and `0 1 * * *` is inside Hobby's once-a-day limit. Only the ±59 min timing precision differs, which a daily safety net does not care about.)

**What:** Check the team's billing page for the current tier, choose the plan (Pro, from $20/month per member, is the expected answer — PLAN §23 D13), settle who owns billing, and record the decision.

**Acceptance Criteria:**
- The Vercel team is on a plan permitting commercial use, confirmed on the billing page — the CLI does not expose the tier, so this cannot be checked from a terminal
- The chosen tier and the billing owner are recorded in the PLAN §23 decision log
- Finding F5 (rate limiting on `/api/checkout` and `/api/order`) is scheduled, since a Vercel WAF rule needs the commercial plan

Priority: P0 | Effort: S (a decision, plus billing) | Owner: owner | Dependencies: none

**Status: Deferred 2026-09-21** — set aside by the owner for now. Nothing else waits on it: preview testing, the security work and the dark production deploy all run on the current plan. It must be settled before item 13, which cannot take real money without it.

---

### 15. Domestic parcel type and a profitable one-jar order

**Why:** Free shipping (D4) on a single ¥1,900 jar leaves little margin. ゆうパック 60 size from Kanagawa costs ¥880–¥1,450, plus a card fee of about ¥68 and packaging (PLAN §19.3, PRD assumption A4). The shipping wording on the legal pages (item 4) and in the site copy (item 5) depends on this answer.

**What:** With the measured packed weight and size from item 6, choose the domestic parcel. Compare ゆうパック 60 size with at least one cheaper protected option: a Japan Post or Yamato contract quote, or a flat-rate service such as レターパックプラス if a packed jar survives a drop test. Then decide how a one-jar order is priced:
- keep free shipping and raise the price;
- charge shipping on one jar, free from two jars (¥4,000);
- or charge shipping on every order.

**Acceptance Criteria:**
- The chosen parcel type, its rate for one and two jars to the nearest and farthest zones, and the packaging cost are recorded in PLAN §19.3
- A drop test of a packed jar in the chosen parcel is passed
- The margin per one-jar and two-jar order is written down, and the pricing rule is recorded in PLAN §23
- If shipping is no longer free on every order: D4 is updated, the Checkout shipping option is changed, and the `priceNote`, `twoJar.shipping` and `buyStrip.priceNote` copy is updated in all five locales. Item 5 covers the copy.

Priority: P1 | Effort: S | Owner: owner decides; engineering changes checkout and copy if needed | Dependencies: item 6 (packed weight)

---

## Story map

| Must-have (P0) | Should-have (P1) | Nice-to-have (P2) |
|---|---|---|
| 1 Preview shows real prices | 5 Shipping promises consistent | 9 Native-reviewed translations |
| 2 Checkout verified on preview | 6 Catalog data accurate, Studio hosted | |
| 3 Security review | ~~7 Spike: Shippo or Japan Post~~ (done: Japan Post) | |
| 4 Legal pages complete | 8 Fulfilment rehearsal | |
| | 15 Parcel type and one-jar margin | |
| 10 Tax and food compliance | | |
| 11 Stripe live activation | | |
| 12 Deploy dark on production | | |
| 14 Commercial Vercel plan (D13) | | |
| 13 Go live | | |

**Suggested order:** 1 → 2 and 3 in parallel · 4, 5, 6, 10 start now in parallel (owner work gates launch) · 15 as soon as 6 gives a packed weight, then finish the shipping wording in 4 and 5 · 12 once 3 is done · 14 any time, but before 13 · 11 once 4 and 12 are live · 8 after 15 · 9 after 5 · 13 last.

## Fulfilment roadmap after launch (PLAN §2.3)

These are not launch items. Each starts only when its trigger happens.

| Order | Option | Trigger | First step |
|---|---|---|---|
| 1 | Japan Post, manual | Launch | Items 8 and 15 |
| 2 | Ship&co label API (Japan Post, Yamato and Sagawa at home, EMS and couriers abroad) | Any month reaches about 20–30 orders, or the first overseas market opens | 30-day free trial; replace `server/shippo.ts` with a Ship&co module and write tracking to Stripe metadata |
| 3 | Cross-border line forwarder (跨境專線) | Taiwan or Hong Kong has cleared PLAN §5.2 | 2–3 quotes compared with EMS, UGX and Ship&co; formal customs clearance and food in glass accepted in writing |
| 4 | OpenLogi (3PL) | Kimie wants to stop packing orders | Decide how stock ownership moves from Sanity to the warehouse |
| — | Shippo | Dropped 2026-09-21 | — |

## Technical notes

- **Environment variables are per environment and apply only to new deployments.** `VITE_*` values are baked in at build time, so a redeploy is required after changing them. The server reads `VITE_SANITY_PROJECT_ID` at runtime too.
- **Preview and production read different Sanity datasets** since finding F2: `VITE_SANITY_DATASET` is `staging` on Preview and `production` on Production. A preview test purchase moves staging stock only, so a preview stock figure says nothing about real inventory. The Studio serves both, one workspace per dataset; the CLI still defaults to `production`, so pass `--dataset staging` deliberately.
- **The catalog is CDN-cached** (`s-maxage=60`, or `300` when commerce is off). After configuration changes, check with a cache-busting query (`?t=…`).
- **`SITE_URL` must equal the exact origin buyers use**, with no path and no trailing slash, or checkout returns 403. Preview uses the branch alias; production uses `https://kimie-atelier.vercel.app`.
- **Webhooks need a stable, publicly reachable address.** If Deployment Protection is enabled later, Stripe webhooks need Vercel's protection bypass for automation.
- **Local development:** `vercel dev` functions read the root `.env`, not `.env.local`. In PowerShell, don't pass comma lists or a bare `--` through `npx`/`stripe` (see `CLAUDE.md`).
- **The Stripe API version is pinned** by `stripe@22.6.2` (`2026-08-26.dahlia`); upgrade deliberately and re-run item 2's tests.

## Open questions

1. **Shipping scope at launch:** Japan only (recommended), or honour the FAQ's international promise? (item 5)
2. ~~**Fulfilment path:** will Shippo work from Kanagawa at an acceptable rate, or do we launch on Japan Post? (item 7)~~ **Answered 2026-09-21:** Japan Post, manual; Shippo dropped.
3. **Packed weights:** are 100 g per jar measured values, or placeholders? (item 6)
4. **Vercel plan:** which commercial plan tier, and who owns billing? (item 14)
5. **Delivery estimate:** checkout shows 2–5 business days as a placeholder. What should it say? (items 5, 13)
6. **Customer shipping notice:** manual e-mail from Kimie at launch (D10), or is a transactional e-mail provider wanted?
7. **Custom domain:** launch on `kimie-atelier.vercel.app`, or a custom domain first? This affects `SITE_URL`, CORS, the webhook URL and Stripe's review.
8. **One-jar pricing:** keep free shipping on a single jar, or set a threshold of two jars (¥4,000)? (item 15)
