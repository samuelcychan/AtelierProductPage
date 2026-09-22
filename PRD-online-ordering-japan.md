# PRD: Online Ordering in Japan

**Author:** samuelcychan
**Date:** 2026-09-16
**Status:** Draft
**Related:** [PLAN-stripe-and-shippo.md](PLAN-stripe-and-shippo.md) (engineering plan) · [progress/backlog-launch.md](progress/backlog-launch.md) (remaining work) · [progress/README.md](progress/README.md) (build log)

---

## 1. Summary

Today people can read about Kimie's jars, but they can't buy them: every "Add to Cart" and "Order Now" button only scrolls the page. This PRD covers letting visitors in Japan buy the mustard and tapenade sauces directly on the site, pay safely with Stripe, and receive their jars. The goal is 100 or more paid orders in a single month within 90 days of launch, without Kimie losing track of any order.

---

## 2. Contacts

| Name | Role | Comment |
|---|---|---|
| samuelcychan | Developer, integrator | Owns the site code, Vercel, and the launch checklist |
| Kimie | Owner and maker | Makes the jars, sets prices and stock in Sanity, packs and ships orders, owns the Stripe account |
| Tax accountant (税理士) | Adviser, to be named | Consumption tax, invoice registration, the planned April 2027 food-rate change |
| Legal / privacy adviser | Adviser, to be named | Legal notice (特定商取引法), privacy policy, sending personal data abroad |
| Public health centre (保健所) | Authority | Food business permit and labelling |
| Native reviewers | To be named | French, Simplified Chinese and Traditional Chinese copy |

---

## 3. Background

**What this is.** The site is a Vite + React landing page for three jars. It has two pages that sell the story: `/` and `/story`. It already shows prices and "buy" buttons, but none of them take an order.

**Why now.**
- **The code is built.** Stripe Checkout, the cart drawer, stock tracking, order logging, the order page and legal page templates were built and merged on 2026-09-15.
- **It works end to end.** A real test payment went through locally on 2026-09-16, and the preview deployment runs the new server functions on Vercel.
- **What's left** is mostly setup, review, and work outside the code: legal text, compliance, and Stripe approval.

**What we learned while building.**
- **Shippo may not help us.** It has no Japanese carriers, and its discounted rates are for parcels leaving the US. Japan Post needs its own system for international customs data. So fulfilment may start with Japan Post. **Decided 2026-09-21:** launch on Japan Post by hand, and drop Shippo (PLAN §2.3).
- **The copy contradicts itself.** Some copy promises international shipping, but the new legal pages say Japan only. This must be settled before launch.
- **Selling food online has rules.** A business permit, allergen labels and a legal notice page are required. Stripe also checks the website before it allows live payments.

**Alternatives considered.** A Shopify plan was written first ([PLAN-shopify.md](PLAN-shopify.md)). We chose Stripe because it has no monthly platform fee, keeps the site's own design, and keeps content in Sanity, where Kimie already edits it.

---

## 4. Objective

**Objective:** Let people in Japan buy Kimie's jars on the site as easily as they read about them, and make sure every paid order is recorded, packed and shipped.

**Why it matters.**
- **For customers:** they can act the moment they want a jar, instead of leaving to search for it elsewhere.
- **For the business:** the site becomes a sales channel, not just a brochure. Kimie keeps the brand experience and pays per sale (about 3.6% card fee) rather than a monthly platform fee.

**How it fits the strategy.** The site's job is to tell the story of a small Kanagawa atelier. Selling on the same page keeps that story and the purchase together.

### Key Results

| # | Key result | Current | Target | How we measure |
|---|---|---|---|---|
| KR1 | Paid online orders in one calendar month | 0 (buying isn't possible) | **100 or more**, in a month within 90 days of launch | Stripe Dashboard, live mode, successful payments |
| KR2 | Paid orders that are logged and have stock updated | 1 of 1 (test order, after replaying the event) | **100%** within 24 hours of payment | Compare Stripe payments with `fulfilment` records in Sanity |
| KR3 | Orders shipped within 3 business days of payment | No data | **95% or more** | Tracking number added in Stripe, compared with the payment date |
| KR4 | Paid orders not yet shipped after 5 business days | No data | **0** | Weekly check: payments without a tracking number |
| KR5 | Oversold orders (sold with no jar in stock) | No data | **0 per month** | Sanity `fulfilment` records marked `oversold` |
| KR6 | Checkout completion (Stripe Checkout sessions that end paid) | No baseline | **Baseline in the first 30 days**, then a target set from it | Stripe Checkout sessions: completed ÷ created |

### Goals

1. Visitors can add both jars to one cart and pay in yen, in their language, on `/` and `/story`.
2. Every successful payment creates exactly one order record and lowers stock by the right amount.
3. Kimie can change prices and stock, and fulfil orders, without a developer.
4. The site meets Japanese online-sales and food rules before the first real order.

### Non-goals

1. **Shipping outside Japan.** Each country has its own food-import rules. International sales would need a separate PRD.
2. **Customer accounts or order history.** Guest checkout on Stripe is enough for launch.
3. **Subscriptions, discount codes, gift wrapping, reviews.** Not needed to prove demand.
4. **Selling the preserved lemon.** It stays hidden.
5. **Automatic shipping labels or automatic shipping e-mails.** Manual at launch; revisit if volume makes it painful (see Open Questions).
6. **Konbini, PayPay, bank transfer.** Cards, Apple Pay and Google Pay only at launch.
7. **An admin order screen on the site.** The Stripe Dashboard, Sanity Studio and the carrier's tools cover it.

---

## 5. Market Segment(s)

We define segments by the job people are trying to do, not by age or gender.

| Segment | The job | What they do today | Why this matters to us |
|---|---|---|---|
| **Everyday cooks who want more flavour** | "Make simple home meals taste special without extra cooking." | Buy supermarket sauces, or skip it | Most likely to become repeat buyers of both jars |
| **Gift buyers** | "Send something thoughtful, handmade and edible to someone in Japan." | Department-store gifts or online marketplaces | Tend to buy two jars together; care about packaging and arrival time |
| **Plant-based and story-driven shoppers** | "Buy food whose maker and ingredients I trust." | Small shops, markets, Instagram accounts | Arrive through `/story`; value knowing who made it |

**Constraints on who we can serve.**
- **Delivery addresses in Japan only.**
- **Small batches.** Stock is limited, and when it runs out the site must stop selling that jar.
- **Fragile glass jars.** Packaging and shipping cost come out of each order, because shipping is free.
- **Allergens:** the mustard contains wheat and soybean (soy sauce), and the tapenade contains fish (anchovies). Buyers must be able to see this.

**Reaching 100 orders a month** assumes enough visitors, and enough jars to sell. Neither is measured yet (see Assumptions).

---

## 6. Value Proposition(s)

**Customer jobs:** try an unusual, handmade sauce; send a food gift; buy from a maker they trust.

**What customers gain.**
- **Quick buying:** from the page they're reading, in about a minute, in Japanese, English, French or Chinese.
- **One box:** both jars in one order.
- **Clear prices:** free shipping within Japan and tax-inclusive prices, so the price they see is the price they pay.
- **Trusted payment:** card, Apple Pay or Google Pay on Stripe's secure page. The site never sees card numbers.
- **Confirmation:** an order number on screen and a receipt by e-mail.

**Pains they avoid.**
- Hunting for where to buy after reading the story.
- Surprise shipping costs at the end.
- Being sold a jar that is actually out of stock. The site shows "Sold out" and checkout refuses.
- Wondering whether the order went through.

**Compared with the alternatives.**

| | Buy on this site | Marketplace or a general store platform | Supermarket sauce |
|---|---|---|---|
| Maker's story next to the product | Yes | Limited | No |
| Handmade, small batch | Yes | Yes | No |
| Monthly platform fee for the maker | None (per-sale card fee) | Often | — |
| Free shipping, tax included | Yes | Varies | — |
| Buy both flavours in one box | Yes | Yes | — |

**Where we are weaker:** no konbini or PayPay payment, no international shipping, and a small brand without marketplace search traffic. Visitors must come to the site first.

---

## 7. Solution

### 7.1 UX and user flows

**Buyer flow**

```text
/ or /story
  → sees price (from the live catalog) and "Add to Cart"
  → cart drawer opens: quantities, subtotal, "Free shipping within Japan. Prices include tax."
  → "Checkout"
  → Stripe's hosted payment page (in the page's language, yen, Japan-only address, phone)
      ├─ pays → /order/complete: thank-you, order number (KJ-…), items, total
      │          + Stripe receipt e-mail
      └─ cancels → back to the same page with the cart open
```

**When something changes during checkout**
- **Price changed** since the page loaded: the cart updates the price and asks the buyer to check it.
- **Not enough stock:** the cart lowers the quantity to what's left and explains why.
- **Ordering unavailable** (setup or outage): prices are hidden, buttons are disabled, and a short "Ordering is paused" note appears.

**Owner flow (Kimie)**

```text
Sanity Studio → Products → Commerce: price, "For sale", SKU, packed weight
Sanity Studio → Stock: jars available (saves as you type)
New order e-mail from Stripe
  → Stripe Dashboard: name, address, phone, items, order number
  → pack → create label (Japan Post, or Shippo if chosen)
  → paste tracking number into the payment → e-mail the buyer
```

**Designs.** The cart drawer, buttons and order page reuse the site's two themes (Fresh Garden and Wabi-Sabi) and the `/story` style. Original design: [Figma](https://www.figma.com/design/czHyq9lxg6e94VAF2zb7Fm/Landing-page-for-lemon-jar). An illustrated walkthrough of the plan is at https://claude.ai/artifact/HUZcPU9S8PM6wUQJFWTALY.

### 7.2 Key features

"Built" means merged and verified locally or against the development mock. "Remaining" means work left before launch.

**P0: Must have for launch**

| # | User story | Acceptance criteria | Status |
|---|---|---|---|
| P0-1 | As a visitor, I want to add jars to a cart on `/` or `/story`, so that I can buy both flavours together. | Add to Cart works on both pages; one shared cart; quantities 1–10 per jar; the cart survives a page reload | Built |
| P0-2 | As a visitor, I want to see the real price and whether a jar is sold out, so that I'm never charged something different. | Prices come only from the live catalog; "Sold out" when stock is 0; checkout re-checks price and stock and explains any change | Built |
| P0-3 | As a buyer, I want to pay securely in my language and in yen, so that I trust the purchase. | Stripe's hosted page in ja/en/fr/zh/zh-TW; Japan-only address; free shipping line; card, Apple Pay, Google Pay | Built; **live keys remaining** |
| P0-4 | As a buyer, I want confirmation after paying, so that I know the order went through. | `/order/complete` shows paid, order number, items, total; the cart clears; Stripe sends a receipt e-mail | Built; **receipt e-mail setting remaining** |
| P0-5 | As the owner, I want every paid order recorded once, with stock lowered, so that I never lose or double-count an order. | One log per payment even if Stripe sends the event twice; stock lowered in the same step; a daily job catches missed events | Built; verified locally; **preview and production verification remaining** |
| P0-6 | As the owner, I want to change prices, stock and "For sale" myself, so that I don't need a developer. | Studio Commerce tab and Stock list; stock changes show on the site within about a minute; stock can't be created or deleted by accident | Built; **hosted Studio deploy remaining** |
| P0-7 | As a buyer and as the business, I want complete legal and policy pages, so that the shop follows Japanese law and passes Stripe's review. | Legal notice, privacy, shipping and returns pages with real details; no placeholders; linked from both pages | Pages built; **real text remaining** |
| P0-8 | As the owner, I want food, tax and payment approvals in place, so that I can legally take real orders. | Food permit and allergen labels confirmed; tax accountant guidance recorded; Stripe live payments and payouts enabled | **Remaining** (owner and advisers) |
| P0-9 | As the owner, I want to stop selling instantly if something goes wrong, so that problems don't turn into bad orders. | Stock → 0 stops sales within a minute; "For sale" off stops one jar; removing the Stripe key turns ordering off; Vercel rollback available | Built; **rehearsal on production remaining** |

**P1: Should have for launch**

| # | User story | Acceptance criteria | Status |
|---|---|---|---|
| P1-1 | As the owner, I want a simple, practised way to ship each order, so that orders go out within 3 business days. | Fulfilment path chosen (Japan Post or Shippo); a one-page runbook; Kimie ships a test order without help | Path chosen: **Japan Post** (2026-09-21). **Remaining:** parcel type (backlog item 15) + runbook (item 8) |
| P1-2 | As a buyer, I want the shipping promises to match what really happens, so that I'm not misled. | FAQ, shipping page and cart note all say the same destinations in five languages; origin reads Kanagawa | **Remaining** |
| P1-3 | As a visitor reading in French or Chinese, I want natural wording at checkout, so that I trust the shop. | Native reviewers sign off the cart, order, legal-link and shipping copy | **Remaining** |
| P1-4 | As the owner, I want accurate packed weights and launch stock, so that labels are right and I don't oversell. | Weights measured (currently 100 g each, unconfirmed); stock equals jars on hand at launch | **Remaining** |
| P1-5 | As a buyer, I want the site to keep working if the payment system is briefly down, so that I can still read about the jars. | When the catalog fails, the content still loads, prices are hidden, and a paused note is shown | Built |

**P2: Nice to have / later**

| # | User story | Acceptance criteria | Status |
|---|---|---|---|
| P2-1 | As a buyer, I want an automatic e-mail with my tracking number, so that I don't have to wait for a manual message. | E-mail sent when a tracking number is added | Future (see Open Questions) |
| P2-2 | As the owner, I want labels created from the order automatically, so that shipping takes less time at 100 orders a month. | Order data flows to the carrier; label printed with one click | Future; depends on P1-1 outcome |
| P2-3 | As a buyer, I want to pay at a convenience store or with PayPay, so that I can buy without a card. | Konbini and PayPay offered at checkout; delayed payments handled | Future; the business must meet Konbini eligibility rules |
| P2-4 | As a buyer outside Japan, I want to order the jars, so that I can enjoy them abroad. | Separate PRD: per-country import rules, currencies, carriers | Future |

### 7.3 Technology

- **Site:** Vite + React on Vercel. Server functions in `api/` handle the catalog, checkout, order status, the Stripe webhook and a daily reconcile job.
- **Payments:** Stripe hosted Checkout, so card data never touches the site. Prices are always read from Sanity on the server, never trusted from the browser.
- **Content, prices and stock:** Sanity. Orders and customer details stay in Stripe, and Sanity only stores order numbers, items and quantities.
- **Exactly-once orders:** creating the order record and lowering stock happen in one Sanity transaction, so a repeated event changes nothing.
- **Safety switch:** without the Stripe key, the site shows no prices or buy buttons.

Details: [PLAN-stripe-and-shippo.md](PLAN-stripe-and-shippo.md) §3, §8–§11, §13.

### 7.4 Assumptions

These are beliefs we haven't proven yet. Each needs checking.

| # | Assumption | Why it matters | How to check |
|---|---|---|---|
| A1 | **Enough visitors come to the site to reach 100 orders a month.** | No traffic data exists yet, so KR1 may be out of reach without marketing | Add visitor measurement before launch; compare visits with orders in the first 30 days |
| A2 | **Kimie can make and ship about 150–200 jars a month.** (100 orders × 1.5–2 jars is our guess) | Selling more than can be made means sold-out pages or oversold orders | Kimie confirms batch size and packing time per order |
| A3 | Buyers in Japan are happy paying by card, Apple Pay or Google Pay. | No konbini or PayPay at launch | Watch abandoned checkouts and questions from buyers |
| A4 | Free shipping still leaves a profit on a ¥1,900 jar. | Shipping, packaging and the 3.6% card fee come out of each order | Get Japan Post quotes for one and two jars; work out the margin per order. **At risk:** ゆうパック 60 size costs ¥880–¥1,450 from Kanagawa, so one jar at ¥1,900 is thin (backlog item 15) |
| A5 | Japan Post is workable if Shippo can't ship from Kanagawa. | Fulfilment path and effort per order | **Settled 2026-09-21:** Japan Post chosen; Shippo dropped (backlog item 7) |
| A6 | Stripe approves the account once the legal pages are complete. | No live payments without approval | Submit after the legal pages go live on production |
| A7 | Manual shipping e-mails are acceptable at launch volume. | At 100 orders a month, that's about 5 e-mails every working day | Track the time Kimie spends; revisit at 30 orders a month |

---

## 8. Release

### 8.1 Phases

| Phase | What's in it | Rough length | Exit gate |
|---|---|---|---|
| **0. Build** (done) | Cart, checkout, order logging, stock, legal page templates, Studio fields; local end-to-end test | Complete (2026-09-15/16) | Local test order paid, logged and stock lowered |
| **1a. Verify** | Preview shows real prices; full test list on the preview; security review | About 1 sprint of engineering | All preview tests pass; no open high-severity finding |
| **1b. Ready the business** (in parallel) | Legal text, food and tax sign-off, shipping scope decision, fulfilment path, measured weights, translations reviewed | Depends on advisers and authorities (typically days to weeks) | Every P0-7 and P0-8 item confirmed |
| **1c. Go dark on production** | Merge to production with ordering switched off; commercial Vercel plan; legal pages live | A few days | Production loads with no buy buttons; legal pages public |
| **1d. Launch in Japan** | Stripe live approval; live keys and webhook; real stock; one real order shipped and refunded; stop switches rehearsed | A few days after Stripe approval | First real order fulfilled; daily job runs |
| **2. Grow** | Watch the key results; decide on automatic tracking e-mails, label automation, more payment methods | First 90 days after launch | KR1–KR5 reviewed monthly |
| **Later** | International sales (separate PRD) | — | — |

The launch date depends on Phase 1b (outside parties), not on the code.

### 8.2 First version vs later versions

- **First version (launch):** all P0 items and all P1 items, Japan only, manual fulfilment.
- **Later:** P2 items, chosen by what the first 90 days show. Examples: e-mail workload (A7), payment-method requests (A3), shipping time (KR3).

### 8.3 Open questions

| Question | Owner | Needed by |
|---|---|---|
| Is launch Japan only? If yes, the FAQ's international promise must be removed in all five languages. | Kimie | Before the legal text is finalised |
| ~~Can Shippo label a jar from Kanagawa at a fair price, or do we launch on Japan Post?~~ **Answered 2026-09-21:** Japan Post; Shippo dropped | samuelcychan | — |
| Does a one-jar order keep free shipping, or is shipping free only from two jars (¥4,000)? (backlog item 15) | Kimie | Before the legal shipping text is finalised |
| How many jars can be made and shipped per month (A2)? Is 100 orders a month realistic for launch? | Kimie | Before launch; it may change KR1's timing |
| How will we count visitors, so we can judge conversion and KR1? (No analytics on the site today.) | samuelcychan | Before launch |
| Are the packed weights (100 g each) real measurements? | Kimie | Before the first label is printed |
| Launch on `kimie-atelier.vercel.app` or a custom domain? This changes `SITE_URL`, the webhook, CORS and what Stripe reviews. | samuelcychan + Kimie | Before Stripe review |
| Which Vercel plan allows commercial use, and who pays for it? | samuelcychan | Before Phase 1c |
| At what order volume do we add automatic tracking e-mails (P2-1)? | Kimie + samuelcychan | Review at 30 orders a month |
| What delivery time should checkout promise? It shows "2–5 business days" as a placeholder. | Kimie | Before launch |
