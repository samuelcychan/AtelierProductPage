# PLAN-stripe-and-shippo — Selling the Jars with Stripe Checkout and Shippo

Plan for adding real purchasing to the site: customers add jars to a cart on the existing pages, pay on **Stripe's hosted Checkout**, and orders are fulfilled with **Shippo** where it can serve a shop that ships from Ehime, with Japan Post as the proven fallback. Stripe becomes the system of record for **payments, customers and orders**. Sanity (PLAN3) stays the system of record for **words and photos**, and gains **prices and stock**. The Vite/React site keeps its design and hosting on Vercel, and gains a small set of Vercel Functions.

**An alternative to [PLAN-shopify.md](PLAN-shopify.md)** — both plans are kept so the owner can choose. Companion documents: [PLAN3.md](PLAN3.md) (Sanity content, `/story` live), [PLAN.md](PLAN.md) (original custom-admin option).

Facts below were verified on 2026-09-15 against the repository (branch `docs/shopify-plan` @ `dcc5472`; application code identical to `main` @ `239da23`) and the sources in §22. This is an engineering plan, not legal or tax advice: every item in §5 must be confirmed with the relevant authority or a qualified adviser before taking real orders.

---

## 0. Summary

| | |
|---|---|
| **Approach** | The browser keeps a cart and asks a Vercel Function to create a **Stripe Checkout Session** from server-side prices, then redirects to Stripe's hosted page. A signed **webhook** records the paid order, decrements stock, and (if Shippo passes its Phase 0 test) creates a **Shippo order** for label purchase. No card data touches this site. |
| **Stripe** | No monthly fee. **3.6%** per successful card payment in Japan, domestic or international; **+2%** when currency conversion is needed. Stripe Tax is not enabled at launch (D8). |
| **Shippo** | Used **after payment only** — orders, labels, tracking — never to price shipping at checkout. Starter plans are free at this volume; label and API fees in §19. |
| **Shipping promise** | Free shipping, as the copy already says ("Shipping included"). |
| **New code** | `api/` (4 functions + 1 cron), `server/` (shared server modules), `src/features/commerce/` (cart, drawer, order page), legal pages, Sanity `stock` type and product commerce fields, cart copy in all five languages. |
| **New infrastructure** | None beyond Vercel Functions on the existing project. Stock and the fulfilment log live in the existing Sanity dataset; orders and customer data live in Stripe (and Shippo). |
| **Blocking prerequisites** | Food-business compliance (§5.1), a **publicly reachable site with product information and a 特定商取引法 disclosure** (Stripe reviews it before activation), and the Shippo-from-Japan test (§6.4). |
| **Effort** | 63–99 engineering hours (§18), plus store administration and compliance work. With an AI agent: about 12–23 agent hours plus 11–18 hours of owner review and hands-on steps (§18.1). |

### Read this first: Shippo and parcels sent from Japan

The site promises shipping **from Ehime** — by EMS abroad, and implicitly by a domestic carrier within Japan. Shippo does not obviously support that:

- Shippo's carrier list has **no Japan Post, Yamato or Sagawa**; Nippon Express appears as **tracking only**.
- Shippo's own discounted carrier accounts are for **"U.S. outbound shipments"**. Outside the US, labels depend on **connecting your own** DHL Express, FedEx or UPS account "as long as those services exist within that country and your account is enabled". Japan is not named anywhere in Shippo's documentation.
- **EMS cannot go through Shippo at all.** Japan Post requires customs electronic data for every international goods shipment, prepared through its **国際郵便マイページサービス** (International Mail My Page); API access to that service is offered to large corporate customers through Hubez.

**Consequence for this plan:**

1. **Checkout never depends on Shippo.** Shipping is a fixed free rate (D4), so a Shippo outage or a failed Shippo test does not stop sales.
2. **Phase 0 includes a go/no-go test** (§6.4): a Shippo account with a Japan sender address and a connected carrier account must return rates and buy a test label, at a price that works for a ¥1,900 jar.
3. **Two fulfilment paths are specified.** **Path A** — Shippo order → label in the Shippo web app → tracking recorded automatically. **Path B** — Kimie ships with Japan Post (domestic services, or EMS via 国際郵便マイページ) and records tracking in the Stripe Dashboard. The code supports both; Path B needs no Shippo account.

If Path A fails its test, the honest recommendation is to launch on Path B and revisit Shippo only if a non-Japan fulfilment partner or a Japan-enabled carrier account appears. Everything else in this plan is unaffected.

### How this differs from PLAN-shopify

| Topic | PLAN-shopify | This plan |
|---|---|---|
| Checkout, payments, fraud screening | Shopify hosted checkout | Stripe hosted Checkout |
| Monthly platform fee | Shopify Basic ¥3,650–¥4,850 | None (Stripe); Shippo optional paid plan |
| Order management | Shopify admin | Stripe Dashboard (payments, customers) + Shippo web app (Path A) or Japan Post (Path B) |
| Prices | Shopify, per market | **Sanity** `prices` field (already exists, hidden) — read by a function, never trusted from the browser |
| Stock | Shopify inventory | **Sanity** `stock` documents, edited live in the Studio |
| Server code | None | Vercel Functions: checkout, catalog, order status, two webhooks, a reconciliation cron |
| Policy and legal pages | Shopify policy pages | **Static pages on the site** (§11.6) |
| Shipping labels | Not covered (manual) | Shippo (if §6.4 passes) or Japan Post |
| Engineering effort | 38–64 h | 63–99 h — more code is owned here |

---

## 1. Verified starting state

### 1.1 Purchase actions today — none of them buy anything

| Location | Label (en) | Target today | Effect |
|---|---|---|---|
| `src/app/App.tsx:308` nav | "Order Now" | `#buy` | Scrolls to `<section id="buy">` at `:371`, which is the **hero** |
| `App.tsx:446` hero | "Add to Cart" | `#` | Jumps to top |
| `App.tsx:547` `JarInfo` (each jar) | "Add to Cart" | `#buy` | Scrolls to the hero |
| `App.tsx:889` buy strip | "Order Now" | `#` | Jumps to top |
| `App.tsx:945` footer | "Privacy Policy", "Shipping Info", "Instagram" | `#` | No pages exist |
| `src/app/story/StoryPage.tsx:306` product card | "Choose this flavor" | `setFlavor(key)` | Highlights a jar only; `/story` has **no purchase action** |

### 1.2 Commitments the copy already makes

| Promise | Where | Consequence |
|---|---|---|
| "Shipping included" | `hero.priceNote`, `buyStrip.priceNote`, `twoJar.shipping` (all locales) | Free shipping in every destination sold to (D4) |
| Ships from Ehime via EMS to the US, EU, UK and Australia in 5–10 business days | FAQ answer, `i18n.ts:268` (FAQ hidden: `SHOW_FAQ = false`) | Food-import duties per destination (§5.2); EMS cannot use Shippo |
| One price per language: `$13` / `¥1,900` / `12 €` / `¥91` / `NT$400` (mustard) | `lineup.items[*].price` per locale; mirrored in Sanity hidden `prices` | At a Japan-only launch every language shows and charges yen (D3) |
| Address `〒000-0000 Japan` | `footer.address` | A real business address is legally required, and Stripe checks it (§5.1) |

### 1.3 Platform

| Fact | Evidence |
|---|---|
| React 18.3.1, Vite 6.3.5, TypeScript 7.0.2; `npm run typecheck` covers only `src/features/**/*`, `src/vite-env.d.ts`, `src/media.d.ts` | `package.json`, `tsconfig.json` |
| **No `api/` directory and no server code** | Repository listing |
| `vercel.json` rewrites **every** path to `/index.html`: `{ "source": "/(.*)", "destination": "/index.html" }` | `vercel.json` |
| No router library in use: `src/main.tsx` lazy-loads `StoryPage` when the path is `/story`, otherwise `App` | `src/main.tsx` |
| `/story` reads Sanity through `useStoryProducts`; **the main page does not read Sanity yet** (PLAN3 §8.5–8.7 deferred) | PLAN3 §19.1, `App.tsx` imports |
| Sanity `product` already stores `prices` (`usd`, `jpy`, `eur`, `cny`, `twd`; major units) and `isActive`, **hidden** in the Studio | `studio/schemaTypes/product.ts` |
| `src/features/products/localize.ts` and `query.ts` use only relative, type-only imports, so server code can import them | File headers |
| Vercel Functions in `/api` may export Web-standard `GET`/`POST(request: Request)` handlers; the raw body is available via `await request.text()` | Vercel Node.js runtime docs |
| Latest `stripe` package on npm: 22.6.2 | `npm view`, 2026-09-15 |
| Public site `https://kimie-atelier.vercel.app` reachable without login | PLAN-shopify §1.3 probe, 2026-09-15 |

---

## 2. Integration options

### 2.1 Payment UI

| | **A. Stripe-hosted Checkout** (recommended) | B. Embedded form (`ui_mode: "form"`) | C. Payment Links |
|---|---|---|---|
| How | Function creates a Session; browser redirects to `session.url` | Stripe.js form mounted inside the site | One fixed link per product |
| Cart with both jars | Yes | Yes | No (one product per link) |
| Card data on the site | None | In Stripe's iframe | None |
| Stripe.js in the bundle | **No** | Yes | No |
| Dynamic shipping rates by address | No | Yes (`runServerUpdate`) | No |
| Stock check and server-side prices | Yes | Yes | No |
| Build effort | Lowest of the cart options | + form page, loading states | Lowest, but no cart |

**Recommendation: A.** Free shipping (D4) removes the only reason to embed the form. Stripe's documentation confirms that the hosted and full embedded pages do not support dynamically customised shipping options; only the embedded form and Elements do.

### 2.2 Shipping labels

| | **Shippo orders after payment** (recommended, gated) | Shippo live rates at checkout | Japan Post manual (Path B) |
|---|---|---|---|
| Checkout depends on Shippo | No | Yes | No |
| Works from Japan | **Unconfirmed** (§6.4) | Unconfirmed | Yes |
| EMS | No | No | Yes |
| Needs embedded form | No | Yes | No |
| Owner effort per order | Buy label in Shippo app | Buy label | Create label on 国際郵便マイページ or at the counter; paste tracking into Stripe |

---

## 3. Target architecture

```text
Visitor (browser)
  │
  ├─ GET page ─────────────────────────────▶ Vercel (static Vite build)
  ├─ words, photos ────────────────────────▶ Sanity CDN                     (PLAN3, unchanged)
  ├─ GET /api/catalog ─────────────────────▶ Vercel Function ──▶ Sanity API (prices, stock)
  │     price + available, CDN-cached 60 s
  │
  ├─ POST /api/checkout {lines, lang} ─────▶ Vercel Function
  │     re-reads prices + stock, creates Checkout Session ──▶ Stripe API
  │◀──── { url } ─── redirect ─────────────▶ Stripe hosted Checkout (card, 3-D Secure, address)
  │
  └─ /order/complete?session_id=… ─────────▶ GET /api/order ──▶ Stripe API (status only)

Stripe ── checkout.session.completed ─────▶ POST /api/stripe-webhook
                                               │ 1. verify signature
                                               │ 2. Sanity transaction: create fulfilment.<session>
                                               │    + decrement stock
                                               │ 3. Path A: create Shippo order
                                               ▼
                                   Path A: Shippo web app → Kimie buys label
                                           └─ transaction_created ─▶ POST /api/shippo-webhook
                                                                       └─ tracking → Stripe metadata
                                   Path B: Stripe Dashboard → Japan Post → tracking → Stripe metadata

Vercel Cron (daily) ─▶ GET /api/cron/reconcile ─▶ fulfils any paid Session the webhook missed
```

### 3.1 Systems of record

| Data | Lives in | Edited by | Notes |
|---|---|---|---|
| Names, descriptions, photos | Sanity `product` | Kimie, Studio | Unchanged from PLAN3 |
| Prices (JPY at launch) | Sanity `product.prices` | Kimie, Studio (drafts + publish) | Now visible and validated (§7.1) |
| Stock | Sanity `stock` (liveEdit) | Kimie, Studio (saves immediately); webhook decrements | §7.2 |
| SKU, packed weight, customs description, HS code | Sanity `product` → Settings | Kimie / developer | Needed for Shippo orders and customs |
| Payment, customer name, e-mail, phone, address | **Stripe** | — | Never copied into Sanity |
| Fulfilment log (session id, stock applied, Shippo order id, oversold flag) | Sanity `fulfilment.<sessionId>` | Webhook only | Private: IDs containing a period are readable only with a token |
| Shipment, label, tracking | Shippo (Path A) or Japan Post (Path B); tracking copied to Stripe PaymentIntent metadata | Kimie / webhook | |

### 3.2 Secrets

Server-only environment variables (never `VITE_`): `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `SANITY_WRITE_TOKEN`, `SHIPPO_API_TOKEN`, `SHIPPO_WEBHOOK_TOKEN`, `CRON_SECRET`. The browser needs **no Stripe publishable key**, because it never loads Stripe.js.

---

## 4. Decisions to confirm before starting

The plan is written assuming each recommendation.

| ID | Decision | Recommendation | Why / consequence if changed |
|---|---|---|---|
| **D1** | Payment UI | **Stripe-hosted Checkout** (`ui_mode: "hosted_page"`). | No Stripe.js, no card fields, localised in `ja`, `en`, `fr`, `zh`, `zh-TW`. Choosing the embedded form adds a checkout page and client SDKs. |
| **D2** | Where to sell at launch | **Japan only**; add countries one at a time after §5.2. | Same reasoning as PLAN-shopify: animal-derived ingredients (anchovies, honey) and per-country food-import duties. |
| **D3** | Currency | **JPY only at launch, on every language.** International later: the buyer picks a destination country in the cart; the function charges that market's fixed Sanity price (`usd`, `eur`, `twd`) and restricts `shipping_address_collection.allowed_countries` to that market. **Adaptive Pricing off.** | A Checkout Session's currency is fixed when it is created, before the address is entered, so the country must be known first. Adaptive Pricing adds a 2–4% conversion fee paid by the customer and would show amounts that differ from the site. |
| **D4** | Shipping charge | **Free shipping**, one fixed shipping option of ¥0, cost absorbed in the price. | Matches "Shipping included" in five locales. Charging shipping means editing `priceNote`, `twoJar.shipping` and `buyStrip.priceNote` everywhere. |
| **D5** | Shippo's role | **Fulfilment only** (orders → labels → tracking), **gated by §6.4**. Path B (Japan Post) always available. | Keeps checkout independent of Shippo's unconfirmed Japan support. |
| **D6** | Where prices and stock live | **Sanity**: `product.prices` and a `stock` document per product. Orders and personal data stay in **Stripe**. | One editing tool for Kimie; no new database. Sanity never holds customer data. |
| **D7** | Stock reservation | **Check stock when creating the Session; decrement when payment is confirmed.** Sessions expire after **30 minutes** (the minimum). An oversold order is flagged for refund. | Reserving at Session creation needs expiry handling for every abandoned checkout. At this volume, two people buying the last jar within the same half hour is rare and handled by a refund. |
| **D8** | Tax | **Fixed tax-inclusive prices** (総額表示). **Stripe Tax off at launch.** Registration status and receipts decided with a tax accountant. | Stripe Tax costs 0.5% per transaction in registered locations and matters mainly for a JCT-registered business. Japan's cabinet approved cutting the food rate from 8% to **1% from April 2027** (legislation pending at the time of writing), which affects tax-inclusive price decisions — review with the accountant. |
| **D9** | Payment methods | **Cards plus Apple Pay / Google Pay** (dynamic payment methods) at launch. Konbini and PayPay later. | Konbini is asynchronous (needs the `async_payment_*` events) and Stripe lists **sole proprietors in business for less than 3 years** as prohibited for Konbini. |
| **D10** | Customer e-mails | **Stripe's payment receipt** e-mail for the order confirmation. Shipping notice: Path A — Shippo's tracking e-mails if the plan includes them; Path B — Kimie e-mails the tracking number. | Avoids adding an e-mail provider. Revisit if order volume makes manual e-mails a burden. |
| **D11** | When the commerce backend is unavailable | **Hide the price and disable Add to Cart** with a short message; all Sanity content stays visible. | Showing the old `i18n.ts` price could quote a price checkout does not charge. |
| **D12** | Preserved lemon | **Not for sale** (no stock document, `isActive` false). | Matches PLAN3. |
| **D13** | Hosting plan | **A Vercel plan that permits commercial use** (Pro), before taking real orders. | Vercel Hobby is for non-commercial projects; Vercel Cron's daily schedule also requires a paid plan. |

---

## 5. Compliance and business prerequisites

**Not legal advice.** These are the obligations this plan knows to check. Each needs confirmation from the named authority or a qualified adviser. **No real order should be accepted until §5.1 is complete, and no country outside Japan should be enabled until its row in §5.2 is complete.**

### 5.1 Japan (required before launch)

| Item | What to confirm | Who |
|---|---|---|
| Food business permit | Producing and selling jarred sauces requires the appropriate business permit under the Food Sanitation Act and HACCP-based hygiene management. | Public health centre (保健所) covering the kitchen in Ehime |
| Food labelling | Labels comply with the Food Labeling Act. **Allergens:** the mustard sauce lists soy sauce, which normally contains **wheat** and **soybean**; the tapenade contains **anchovies** (fish). Show allergens on product pages too. | Health centre / labelling adviser |
| Legal notice for online sales | A page titled **特定商取引法に基づく表記**: seller's legal name, **real address** and phone, prices, shipping costs, payment methods and timing, delivery timing, returns policy. **Stripe's account review checks for this page and for product information**; missing it is a common rejection reason. | Business owner; page built in §11.6 |
| Privacy policy | Required because Stripe (and Shippo on Path A) receive buyer names, addresses, phone numbers and e-mails. Also confirm what Japan's Act on the Protection of Personal Information requires when personal data is provided to businesses **in other countries** (Stripe, and Shippo is US-based). | Business owner, privacy adviser |
| Returns and refunds | Written policy for perishables (e.g. no returns once opened; refund or replacement for breakage in transit). | Business owner |
| Consumption tax | Tax-inclusive display; invoice-system (インボイス制度) registration status; the April 2027 food-rate change (D8); treatment of export sales. | Tax accountant (税理士) |
| Stripe account activation | Business profile, identity verification, payout bank account, and a **public** website whose business name, address and contact details match the application. | Business owner, in the Stripe Dashboard |

### 5.2 Each export destination (required before enabling that market)

| Destination | Known obligations to confirm | Source |
|---|---|---|
| **United States** | FDA **food facility registration** (a foreign facility names a US agent) and **prior notice filed before every shipment**, including by international mail. US allergen labelling (wheat, soy, fish). | [FDA prior notice](https://www.fda.gov/industry/prior-notice-imported-foods/filing-prior-notice-imported-foods), [facility registration](https://www.fda.gov/food/guidance-regulation-food-and-dietary-supplements/registration-food-facilities-and-other-submissions) |
| **European Union** | Foods containing products of animal origin (anchovies; honey) are tightly controlled, including small consumer consignments. Confirm either jar may be sent at all. | EU official controls / import adviser |
| **United Kingdom** | Same question under UK rules. | UK import guidance / adviser |
| **Australia** | Biosecurity import conditions for foods with fish or honey. | BICON / adviser |
| **Taiwan** | Import food regulations for small consumer shipments. | Taiwan FDA / adviser |
| **All** | EMS restrictions per country; **customs electronic data via 国際郵便マイページ** for Japan Post; for DHL Express / FedEx / UPS, their own food rules; who pays import duty and tax, and whether checkout must say so. | Japan Post, carrier |

If a destination proves impractical, remove it from the FAQ copy in all five locales rather than leave an unfulfillable promise.

---

## 6. Phase 0 — Accounts, routing proof and the Shippo test

**Outcome:** a Stripe account in test mode, a proven `api/` route beside the SPA rewrite, and a recorded decision on fulfilment Path A or Path B.

### 6.1 Stripe account

1. Sign up at <https://dashboard.stripe.com/register> with the account that will **own the business** (Kimie's or the company's). Country **Japan**; settlement currency JPY.
2. Stay in **test mode** (sandbox) for all development. Activation for live payments can wait until §5.1 and the legal pages (§11.6) are live, because Stripe reviews the public site.
3. **Team:** add the developer with the *Developer* role; Kimie keeps *Owner* (Settings → Team and security).
4. **Settings → Payment methods:** leave cards, Apple Pay and Google Pay on; leave Konbini and PayPay off (D9).
5. **Settings → Customer emails:** turn on e-mails for **successful payments** and **refunds** (D10). Check the receipt language with a test payment in `ja`.
6. **Settings → Communication preferences:** Kimie receives **successful payment** e-mails; install the Stripe mobile app for order notifications.
7. **Settings → Branding:** icon and colours from the Fresh Garden palette (`THEMES.grove`: `#23734D`, `#E3A52B`).
8. **Settings → Adaptive Pricing:** off (D3).
9. Copy the **test secret key** (`sk_test_…`) into the root `.env.local` (gitignored) — never commit it.

### 6.2 Vercel

1. Confirm the team is on a commercial-use plan (D13) before launch; development can continue meanwhile.
2. Install the Vercel CLI (`npm i -g vercel`), run `vercel link` in the repo root, then `vercel env pull .env.local` once variables exist. Local functions run under **`vercel dev`**; `npm run dev` serves only the Vite app.

### 6.3 Routing proof

The catch-all rewrite must not swallow `/api/*`. Change `vercel.json` to:

```json
{
  "rewrites": [
    { "source": "/((?!api/).*)", "destination": "/index.html" }
  ]
}
```

Add `api/health.ts`:

```ts
export function GET(): Response {
  return Response.json({ ok: true }, { headers: { "Cache-Control": "no-store" } });
}
```

**Exit criterion:** on a Vercel preview, `/api/health` returns `{"ok":true}`, and `/`, `/story` and a deep link such as `/order/complete` still load the SPA. Delete `api/health.ts` afterwards.

### 6.4 Shippo go/no-go test (Path A)

1. Create a Shippo account at <https://goshippo.com> with the business address in **Ehime, Japan**. Stay on the free Starter plan.
2. Ask the preferred carrier (DHL Express Japan is the likeliest) for a business account, then in Shippo connect it (**Settings → Carriers**, or `POST /carrier_accounts` with `carrier`, `account_id`, `parameters`, `active`).
3. With the **test token** (`shippo_test_…`), create a shipment from the Ehime address:
   - to a Japanese address (domestic) — expect **no rates** unless the carrier offers domestic service on that account;
   - to a US address (international) — with a customs declaration: `contents_type: "MERCHANDISE"`, `certify: true`, `certify_signer`, `incoterm`, `non_delivery_option: "RETURN"`, and one customs item per jar (`description`, `quantity`, `net_weight`, `mass_unit: "g"`, `value_amount`, `value_currency: "JPY"`, `origin_country: "JP"`, `tariff_number`).
4. Buy a **test label** and confirm a `label_url` and `tracking_number` come back.
5. Record the **live rate** for one and two packed jars to each intended zone, and compare with Japan Post's EMS and domestic rates.
6. Create one test **order** via `POST /orders` and confirm it appears in the Shippo web app with **Create label** available.
7. Ask Shippo support in writing whether Japan-origin shipping on connected accounts is supported, and whether tracking e-mails apply to API-created orders.

**Go (Path A)** only if steps 3–6 succeed **and** the label cost fits the free-shipping price. Otherwise **Path B**: skip §10.4, §12.1 and the Shippo webhook; everything else is identical.

**Exit criterion:** a short written decision (A or B) with the rates found, added to this document's §23 log.

---

## 7. Phase 1 — Commerce fields in Sanity

**Outcome:** prices, SKUs, weights, customs data and stock are editable in the Studio and readable by server code.

### 7.1 `studio/schemaTypes/product.ts` — commerce fields

- **Unhide `prices`** (D3): set `hidden: false` on the `prices` object and give `jpy` validation `rule.required().integer().min(1)`. Keep `usd`, `eur`, `twd`, `cny` **hidden** until an international market opens. Change the field description to: *"Tax-inclusive price charged at checkout. Major units: 1900 means ¥1,900."*
- **Unhide `isActive`** and retitle it **"For sale"**, description *"Shows the price and Add to Cart. Turn off to stop selling this product."* It no longer waits for the main page (PLAN3 §8.5), so it gets its rule back: `rule.required()`.
- Add a **Commerce** group with:

```ts
defineField({
  name: 'sku',
  title: 'SKU',
  description: 'Shown on orders and labels, e.g. KIMIE-MUS-200.',
  type: 'string',
  group: 'commerce',
  validation: (rule) => rule.required().regex(/^[A-Z0-9-]{3,32}$/),
}),
defineField({
  name: 'packedWeightGrams',
  title: 'Packed weight (g)',
  description: 'One jar with its packaging. Used for shipping labels.',
  type: 'number',
  group: 'commerce',
  validation: (rule) => rule.required().integer().positive(),
}),
defineField({
  name: 'customsDescription',
  title: 'Customs description (English)',
  description: 'Plain words for customs forms, e.g. "Mustard sauce in glass jar".',
  type: 'string',
  group: 'commerce',
  validation: (rule) => rule.max(50),
}),
defineField({
  name: 'hsCode',
  title: 'HS code',
  description: 'Tariff number for customs. Confirm with the carrier or customs broker.',
  type: 'string',
  group: 'commerce',
  validation: (rule) => rule.regex(/^\d{6,10}$/).warning(),
}),
```

### 7.2 `studio/schemaTypes/stock.ts` — live stock

```ts
import {defineField, defineType} from 'sanity'

// liveEdit: every change saves immediately, with no draft. The checkout webhook
// decrements `available` on the same document, so a draft would overwrite it.
export const stock = defineType({
  name: 'stock',
  title: 'Stock',
  type: 'document',
  liveEdit: true,
  fields: [
    defineField({
      name: 'product',
      title: 'Product',
      type: 'reference',
      to: [{type: 'product'}],
      readOnly: true,
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'available',
      title: 'Jars available to sell',
      description: 'Saves as you type. Orders lower this number automatically. Below zero means oversold: refund or make more.',
      type: 'number',
      validation: (rule) => rule.required().integer(),
    }),
  ],
  preview: {
    select: {title: 'product.internalTitle', available: 'available'},
    prepare: ({title, available}) => ({title: title ?? 'Stock', subtitle: `${available ?? 0} available`}),
  },
})
```

Register it in `schemaTypes/index.ts`. Create one document per product with fixed ids **`stock-mustard`** and **`stock-tapenade`** (a seed step in `studio/scripts/seed.ts`, or once by hand in Vision).

### 7.3 Deploy and fill in

1. `cd studio`, `npx tsc --noEmit`, `npx sanity deploy`.
2. For mustard and tapenade: set SKU (`KIMIE-MUS-200`, `KIMIE-TAP-200`), packed weight (measured), customs description, HS code, `prices.jpy` (1900, 2100), **For sale** on → **Publish**.
3. Set `available` on both stock documents.
4. **Tokens:** sanity.io/manage → API → Tokens → *Add API token* named `vercel-commerce` with **Editor** permission. Store it only in Vercel and `.env.local` as `SANITY_WRITE_TOKEN`.

**Exit criterion:** in Vision, `*[_type == "stock"]{_id, available, "sku": product->sku, "jpy": product->prices.jpy}` returns both products with their numbers.

---

## 8. Phase 2 — Server foundation

**Outcome:** typed, shared server modules and a separate typecheck for server code.

### 8.1 Dependencies and scripts

```bash
npm install stripe
npm install --save-dev @types/node
```

No Shippo SDK: the four Shippo calls use `fetch` against the documented REST endpoints, which keeps field names identical to Shippo's reference.

Add `tsconfig.server.json`:

```json
{
  "extends": "./tsconfig.json",
  "compilerOptions": { "lib": ["ES2022", "DOM"], "types": ["node"], "paths": {} },
  "include": ["api/**/*", "server/**/*", "src/features/products/localize.ts", "src/features/products/query.ts", "src/features/products/types.ts", "src/features/products/format.ts"]
}
```

Edit `package.json` directly (PLAN3 §19.1: `npm pkg set` fails on this machine):

```json
"typecheck": "tsc --noEmit -p tsconfig.json && tsc --noEmit -p tsconfig.server.json"
```

### 8.2 Environment

Root `.env.local` (gitignored by `.env.*`) and Vercel **Production** and **Preview** (with test keys on Preview):

```bash
# Server only. Never prefix these with VITE_.
STRIPE_SECRET_KEY=sk_test_…
STRIPE_WEBHOOK_SECRET=whsec_…
SANITY_WRITE_TOKEN=…
SHIPPO_API_TOKEN=shippo_test_…        # Path A only
SHIPPO_WEBHOOK_TOKEN=…                # Path A only; long random string
CRON_SECRET=…                          # long random string
SITE_URL=https://kimie-atelier.vercel.app
# Already present from PLAN3, readable by functions too:
VITE_SANITY_PROJECT_ID=…
VITE_SANITY_DATASET=production
```

### 8.3 Files

```text
api/
  catalog.ts            GET  prices + availability
  checkout.ts           POST create Checkout Session
  order.ts              GET  order status for /order/complete
  stripe-webhook.ts     POST payment events
  shippo-webhook.ts     POST label and tracking events (Path A)
  cron/reconcile.ts     GET  daily safety net
server/
  env.ts                reads and checks variables; commerce kill switch
  http.ts               json(), readJson() with size limit, sameOrigin()
  stripe.ts             lazily created Stripe client
  sanity.ts             lazily created write client (useCdn: false)
  catalog.ts            loads products + stock from Sanity
  fulfil.ts             idempotent fulfilment of one Checkout Session
  shippo.ts             createOrder(), fetch wrapper
```

### 8.4 `server/env.ts`

```ts
const read = (name: string) => process.env[name]?.trim() ?? "";

export const env = {
  stripeSecretKey: read("STRIPE_SECRET_KEY"),
  stripeWebhookSecret: read("STRIPE_WEBHOOK_SECRET"),
  sanityProjectId: read("VITE_SANITY_PROJECT_ID"),
  sanityDataset: read("VITE_SANITY_DATASET") || "production",
  sanityWriteToken: read("SANITY_WRITE_TOKEN"),
  shippoApiToken: read("SHIPPO_API_TOKEN"),
  shippoWebhookToken: read("SHIPPO_WEBHOOK_TOKEN"),
  cronSecret: read("CRON_SECRET"),
  siteUrl: read("SITE_URL").replace(/\/$/, ""),
};

// Kill switch: without these, /api/catalog reports commerce as off and the site
// shows no prices or buy buttons. Removing STRIPE_SECRET_KEY and redeploying stops sales.
export const isCommerceConfigured = Boolean(
  env.stripeSecretKey && env.sanityProjectId && env.sanityWriteToken && env.siteUrl,
);

// Path A switch: without a Shippo token, fulfilment records the order and skips Shippo.
export const isShippoConfigured = env.shippoApiToken.length > 0;
```

### 8.5 `server/http.ts`

```ts
export function json(body: unknown, status = 200, cache = "no-store"): Response {
  return Response.json(body, { status, headers: { "Cache-Control": cache } });
}

/** Parses a JSON body of at most `maxBytes`; returns undefined when missing, too large or malformed. */
export async function readJson(request: Request, maxBytes = 4_000): Promise<unknown> {
  const text = await request.text();
  if (!text || text.length > maxBytes) return undefined;
  try { return JSON.parse(text); } catch { return undefined; }
}

/** State-changing requests must come from this site. */
export function sameOrigin(request: Request, siteUrl: string): boolean {
  const origin = request.headers.get("origin");
  if (!origin) return false;
  if (origin === siteUrl) return true;
  try {
    return process.env.VERCEL_ENV === "preview" && new URL(origin).hostname.endsWith(".vercel.app");
  } catch {
    return false; // e.g. the literal "null" origin
  }
}
```

### 8.6 `server/stripe.ts` and `server/sanity.ts`

```ts
import Stripe from "stripe";
import { env } from "./env";

let client: Stripe | null = null;

// The API version is the one pinned by the installed stripe package; upgrade deliberately (§17).
export function stripe(): Stripe {
  client ??= new Stripe(env.stripeSecretKey);
  return client;
}
```

```ts
import { createClient, type SanityClient } from "@sanity/client";
import { env } from "./env";

let client: SanityClient | null = null;

// Uncached API, published perspective, write token: prices and stock must be current.
export function sanity(): SanityClient {
  client ??= createClient({
    projectId: env.sanityProjectId,
    dataset: env.sanityDataset,
    apiVersion: "2026-09-14",
    token: env.sanityWriteToken,
    useCdn: false,
    perspective: "published",
  });
  return client;
}
```

**Exit criterion:** `npm run typecheck` passes both configurations.

---

## 9. Phase 3 — Catalog and checkout

**Outcome:** the site can show authoritative prices and create a Checkout Session that charges exactly those prices.

### 9.1 `server/catalog.ts`

```ts
import type { Lang } from "../src/app/i18n";
import { pick, type Localized } from "../src/features/products/localize";
import { STORY_SLUGS } from "../src/features/products/query";
import { sanity } from "./sanity";

const CATALOG_QUERY = /* groq */ `
*[_type == "product" && slug.current in $slugs] {
  "slug": slug.current, name, sizeValue, sizeUnit, sku, packedWeightGrams,
  customsDescription, hsCode, isActive, "jpy": prices.jpy,
  "stock": *[_type == "stock" && product._ref == ^._id][0]{ _id, _rev, available }
}`;

export interface CatalogItem {
  slug: string;
  name: Localized | undefined;
  sizeValue?: number;
  sizeUnit?: string;
  sku?: string;
  packedWeightGrams?: number;
  customsDescription?: string;
  hsCode?: string;
  isActive?: boolean;
  jpy?: number;
  stock?: { _id: string; _rev: string; available: number };
}

export async function loadCatalog(): Promise<Map<string, CatalogItem>> {
  const items = await sanity().fetch<CatalogItem[]>(CATALOG_QUERY, { slugs: STORY_SLUGS });
  return new Map(items.map((item) => [item.slug, item]));
}

/** For sale means: switched on, priced, SKU set, and a stock document exists. */
export function isForSale(item: CatalogItem | undefined): item is CatalogItem & { jpy: number; sku: string; stock: NonNullable<CatalogItem["stock"]> } {
  return !!item?.isActive && Number.isInteger(item.jpy) && (item.jpy ?? 0) > 0 && !!item.sku && !!item.stock;
}

export function checkoutName(item: CatalogItem, lang: Lang): string {
  const size = item.sizeValue && item.sizeUnit ? ` ${item.sizeValue}${item.sizeUnit}` : "";
  return `${pick(item.name, lang) || item.sku}${size}`;
}
```

### 9.2 `api/catalog.ts`

```ts
import { isForSale, loadCatalog } from "../server/catalog";
import { isCommerceConfigured } from "../server/env";
import { json } from "../server/http";

export async function GET(): Promise<Response> {
  if (!isCommerceConfigured) return json({ enabled: false }, 200, "public, s-maxage=300");
  try {
    const catalog = await loadCatalog();
    const products = [...catalog.values()].map((item) => ({
      slug: item.slug,
      forSale: isForSale(item),
      available: isForSale(item) && item.stock.available > 0,
      unitAmount: isForSale(item) ? item.jpy : null,
      currency: "JPY",
    }));
    // Short CDN cache: a price or stock change reaches the page within about a minute.
    // /api/checkout re-reads live values, so a stale page can never under-charge.
    return json({ enabled: true, products }, 200, "public, s-maxage=60, stale-while-revalidate=300");
  } catch (error) {
    console.error("[catalog] Sanity read failed", error);
    return json({ enabled: true, unavailable: true }, 503, "no-store");
  }
}
```

### 9.3 `api/checkout.ts`

Request body: `{ "lang": "ja", "returnPath": "/story", "lines": [{ "slug": "mustard", "quantity": 2, "unitAmount": 1900 }] }`. `unitAmount` is what the page showed; it is compared, never charged.

```ts
import type { Lang } from "../src/app/i18n";
import { checkoutName, isForSale, loadCatalog } from "../server/catalog";
import { env, isCommerceConfigured } from "../server/env";
import { json, readJson, sameOrigin } from "../server/http";
import { stripe } from "../server/stripe";

const LANGS: Lang[] = ["en", "ja", "fr", "zh", "zh-TW"];
const MAX_PER_LINE = 10;
const RETURN_PATHS = new Set(["/", "/story"]);

type Line = { slug: string; quantity: number; unitAmount: number };

function parse(body: unknown): { lang: Lang; returnPath: string; lines: Line[] } | null {
  if (!body || typeof body !== "object") return null;
  const { lang, returnPath, lines } = body as Record<string, unknown>;
  if (!LANGS.includes(lang as Lang) || !Array.isArray(lines) || lines.length < 1 || lines.length > 2) return null;
  const parsed = lines.map((l) => l as Line);
  const valid = parsed.every(
    (l) => typeof l.slug === "string" && Number.isInteger(l.quantity) && l.quantity >= 1 && l.quantity <= MAX_PER_LINE && Number.isInteger(l.unitAmount),
  );
  const unique = new Set(parsed.map((l) => l.slug)).size === parsed.length;
  return valid && unique
    ? { lang: lang as Lang, returnPath: RETURN_PATHS.has(String(returnPath)) ? String(returnPath) : "/", lines: parsed }
    : null;
}

function orderNumber(): string {
  const d = new Date();
  const ymd = `${d.getUTCFullYear() % 100}${String(d.getUTCMonth() + 1).padStart(2, "0")}${String(d.getUTCDate()).padStart(2, "0")}`;
  return `KJ-${ymd}-${crypto.randomUUID().slice(0, 6).toUpperCase()}`;
}

export async function POST(request: Request): Promise<Response> {
  if (!isCommerceConfigured) return json({ error: "unavailable" }, 503);
  if (!sameOrigin(request, env.siteUrl)) return json({ error: "forbidden" }, 403);
  if (!request.headers.get("content-type")?.includes("application/json")) return json({ error: "invalid_request" }, 415);

  const cart = parse(await readJson(request));
  if (!cart) return json({ error: "invalid_cart" }, 400);

  const catalog = await loadCatalog();
  const lineItems = [];
  for (const line of cart.lines) {
    const item = catalog.get(line.slug);
    if (!isForSale(item)) return json({ error: "not_for_sale", slug: line.slug }, 409);
    if (item.jpy !== line.unitAmount) return json({ error: "price_changed", slug: line.slug, unitAmount: item.jpy }, 409);
    if (item.stock.available < line.quantity) {
      return json({ error: "insufficient_stock", slug: line.slug, available: Math.max(0, item.stock.available) }, 409);
    }
    lineItems.push({
      quantity: line.quantity,
      price_data: {
        currency: "jpy", // zero-decimal currency: 1900 means ¥1,900
        unit_amount: item.jpy,
        product_data: { name: checkoutName(item, cart.lang), metadata: { slug: item.slug, sku: item.sku } },
      },
    });
  }

  const number = orderNumber();
  const session = await stripe().checkout.sessions.create({
    mode: "payment",
    ui_mode: "hosted_page",
    locale: cart.lang, // Stripe accepts en, ja, fr, zh and zh-TW
    line_items: lineItems,
    shipping_address_collection: { allowed_countries: ["JP"] }, // D2
    shipping_options: [
      {
        shipping_rate_data: {
          type: "fixed_amount",
          display_name: cart.lang === "ja" ? "送料無料" : "Free shipping",
          fixed_amount: { amount: 0, currency: "jpy" },
          delivery_estimate: { minimum: { unit: "business_day", value: 2 }, maximum: { unit: "business_day", value: 5 } },
        },
      },
    ],
    phone_number_collection: { enabled: true }, // carriers need a recipient phone number
    expires_at: Math.floor(Date.now() / 1000) + 30 * 60, // D7: the minimum Stripe allows
    success_url: `${env.siteUrl}/order/complete?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${env.siteUrl}${cart.returnPath}?cart=open`,
    metadata: { order_number: number, lang: cart.lang },
    payment_intent_data: { metadata: { order_number: number } },
  });

  if (!session.url?.startsWith("https://checkout.stripe.com/")) return json({ error: "unavailable" }, 502);
  return json({ url: session.url });
}
```

Notes:

- **Delivery estimate** is a placeholder until Kimie confirms real processing plus transit time.
- **International markets later** (D3): accept a `country` field, pick `usd`/`eur`/`twd` and the matching currency, set `allowed_countries` to that market's countries, and change the shipping rate currency to match.

### 9.4 `api/order.ts`

`GET /api/order?session_id=cs_…` returns only what the thank-you page needs — never the address or phone.

```ts
import { isCommerceConfigured } from "../server/env";
import { json } from "../server/http";
import { stripe } from "../server/stripe";

export async function GET(request: Request): Promise<Response> {
  const id = new URL(request.url).searchParams.get("session_id") ?? "";
  if (!isCommerceConfigured || !/^cs_(test|live)_[A-Za-z0-9]+$/.test(id)) return json({ error: "not_found" }, 404);
  try {
    const session = await stripe().checkout.sessions.retrieve(id, { expand: ["line_items"] });
    return json({
      status: session.status,                 // "open" | "complete" | "expired"
      paymentStatus: session.payment_status,  // "paid" | "unpaid" | "no_payment_required"
      orderNumber: session.metadata?.order_number ?? null,
      total: session.amount_total,
      currency: session.currency?.toUpperCase(),
      lines: (session.line_items?.data ?? []).map((l) => ({ name: l.description, quantity: l.quantity, amount: l.amount_total })),
    });
  } catch {
    return json({ error: "not_found" }, 404);
  }
}
```

**Exit criterion:** with `vercel dev`, a `POST /api/checkout` for one mustard returns a `checkout.stripe.com` URL; the hosted page shows `つぶつぶマスタードソース 200g`, ¥1,900, 送料無料, and a Japan-only address form.

---

## 10. Phase 4 — Payment webhook and fulfilment

**Outcome:** every paid Session is recorded exactly once, stock goes down by exactly the quantities bought, and Path A orders appear in Shippo.

### 10.1 Stripe webhook endpoint

1. Stripe Dashboard → Developers → Webhooks → **Add destination** → `https://<site>/api/stripe-webhook`.
2. Events: `checkout.session.completed`, `checkout.session.async_payment_succeeded`, `checkout.session.async_payment_failed`. (The async events matter only once Konbini is enabled; subscribing now costs nothing.)
3. Copy the signing secret into `STRIPE_WEBHOOK_SECRET` for that environment. Use a separate endpoint and secret for Preview (test mode) and Production (live mode).
4. Local: `stripe listen --forward-to localhost:3000/api/stripe-webhook` while `vercel dev` runs.

### 10.2 `api/stripe-webhook.ts`

```ts
import type Stripe from "stripe";
import { env } from "../server/env";
import { fulfilCheckout } from "../server/fulfil";
import { stripe } from "../server/stripe";

export async function POST(request: Request): Promise<Response> {
  const payload = await request.text(); // raw body: required for signature verification
  let event: Stripe.Event;
  try {
    event = stripe().webhooks.constructEvent(payload, request.headers.get("stripe-signature") ?? "", env.stripeWebhookSecret);
  } catch {
    return new Response("Invalid signature", { status: 400 });
  }

  switch (event.type) {
    case "checkout.session.completed":
    case "checkout.session.async_payment_succeeded":
      // A non-2xx response makes Stripe retry, which fulfilCheckout tolerates.
      await fulfilCheckout(event.data.object.id);
      break;
    case "checkout.session.async_payment_failed":
      console.warn("[webhook] async payment failed", event.data.object.id);
      break;
  }
  return new Response("ok");
}
```

Stripe waits up to 10 seconds for this endpoint to answer `checkout.session.completed` before redirecting the buyer to `success_url`, so fulfilment must stay fast: one Stripe read, one Sanity transaction, one Shippo call.

### 10.3 `server/fulfil.ts` — idempotent by construction

Stripe documents that the fulfilment function can be called **several times, even concurrently**, for the same Session. The guard is a Sanity **transaction** that creates a private log document with the Session id as its `_id` **and** decrements stock. If the log document already exists, the whole transaction fails and nothing is applied twice.

```ts
import type Stripe from "stripe";
import { loadCatalog } from "./catalog";
import { isShippoConfigured } from "./env";
import { sanity } from "./sanity";
import { createShippoOrder } from "./shippo";
import { stripe } from "./stripe";

const logId = (sessionId: string) => `fulfilment.${sessionId}`; // contains "." → not publicly readable

export async function fulfilCheckout(sessionId: string): Promise<void> {
  const session = await stripe().checkout.sessions.retrieve(sessionId, { expand: ["line_items.data.price.product"] });
  if (session.payment_status === "unpaid") return; // async method still pending

  const existing = await sanity().getDocument(logId(sessionId));
  if (!existing) await applyOnce(session);

  const log = await sanity().getDocument<{ shippoOrderId?: string }>(logId(sessionId));
  if (isShippoConfigured && log && !log.shippoOrderId) {
    try {
      const orderId = await createShippoOrder(session);
      await sanity().patch(logId(sessionId)).setIfMissing({ shippoOrderId: orderId }).commit();
      await stripe().paymentIntents.update(String(session.payment_intent), { metadata: { shippo_order_id: orderId } });
    } catch (error) {
      // The payment is safe and stock is applied; the daily reconcile retries Shippo.
      console.error("[fulfil] Shippo order failed", sessionId, error);
    }
  }
}

async function applyOnce(session: Stripe.Checkout.Session, attempt = 1): Promise<void> {
  const catalog = await loadCatalog(); // fresh _rev values
  const lines = (session.line_items?.data ?? []).map((l) => {
    const product = l.price?.product as Stripe.Product;
    return { slug: product.metadata.slug, sku: product.metadata.sku, quantity: l.quantity ?? 0 };
  });

  const oversold = lines.some((line) => (catalog.get(line.slug)?.stock?.available ?? 0) < line.quantity);
  const tx = sanity().transaction().create({
    _id: logId(session.id),
    _type: "fulfilment",
    orderNumber: session.metadata?.order_number,
    paidAt: new Date().toISOString(),
    lines,
    oversold,
  });
  for (const line of lines) {
    const stock = catalog.get(line.slug)?.stock;
    if (stock) tx.patch(stock._id, (p) => p.ifRevisionId(stock._rev).dec({ available: line.quantity }));
  }

  try {
    await tx.commit();
  } catch (error) {
    if (await sanity().getDocument(logId(session.id))) return;        // another delivery won
    if (attempt < 4) return applyOnce(session, attempt + 1);          // stock edited meanwhile: retry
    throw error;                                                      // 500 → Stripe retries later
  }
  if (oversold) console.error("[fulfil] OVERSOLD — refund or restock", session.metadata?.order_number);
}
```

Notes:

- `ifRevisionId` makes the decrement fail if Kimie changed the stock number between read and write; the retry re-reads it.
- `line_items.data.price.product` expansion returns the `metadata` set in `product_data` at checkout (SKU and slug), so fulfilment does not trust anything but Stripe's record of what was paid.
- The log document holds **no personal data** — only order number, time, SKUs and quantities.

### 10.4 `server/shippo.ts` (Path A)

Checkout Sessions on current API versions store the address in **`collected_information.shipping_details`** (the top-level `shipping_details` field was removed in API version 2025-03-31).

```ts
import type Stripe from "stripe";
import { env } from "./env";

const SHIPPO = "https://api.goshippo.com";

async function shippo<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${SHIPPO}${path}`, {
    method: "POST",
    headers: { Authorization: `ShippoToken ${env.shippoApiToken}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`Shippo ${path} ${res.status}: ${await res.text()}`);
  return res.json() as Promise<T>;
}

export async function createShippoOrder(session: Stripe.Checkout.Session): Promise<string> {
  const ship = session.collected_information?.shipping_details;
  const lines = session.line_items?.data ?? [];
  const order = await shippo<{ object_id: string }>("/orders/", {
    order_number: session.metadata?.order_number,
    order_status: "PAID",
    placed_at: new Date(session.created * 1000).toISOString(),
    to_address: {
      name: ship?.name,
      street1: ship?.address.line1,
      street2: ship?.address.line2 ?? "",
      city: ship?.address.city,
      state: ship?.address.state,
      zip: ship?.address.postal_code,
      country: ship?.address.country,
      phone: session.customer_details?.phone ?? "",
      email: session.customer_details?.email ?? "",
    },
    line_items: lines.map((l) => ({
      title: l.description,
      sku: (l.price?.product as Stripe.Product | undefined)?.metadata.sku,
      quantity: l.quantity,
      total_price: String(l.amount_total),
      currency: "JPY",
    })),
    total_price: String(session.amount_total),
    currency: "JPY",
  });
  return order.object_id;
}
```

Weight and customs data are added in the Shippo web app when Kimie buys the label (packed weight and HS code are in the Studio, §7.1). Automating the label purchase is out of scope (§21).

### 10.5 Daily reconciliation — `api/cron/reconcile.ts`

A missed or permanently failed webhook must not lose an order.

```ts
import { env, isCommerceConfigured } from "../../server/env";
import { fulfilCheckout } from "../../server/fulfil";
import { stripe } from "../../server/stripe";

export async function GET(request: Request): Promise<Response> {
  if (!isCommerceConfigured || request.headers.get("authorization") !== `Bearer ${env.cronSecret}`) {
    return new Response("Unauthorized", { status: 401 });
  }
  const since = Math.floor(Date.now() / 1000) - 3 * 24 * 3600;
  let checked = 0;
  for await (const session of stripe().checkout.sessions.list({ status: "complete", created: { gte: since }, limit: 100 })) {
    await fulfilCheckout(session.id); // no-op for sessions already logged
    checked++;
  }
  return Response.json({ checked });
}
```

Add to `vercel.json`: `"crons": [{ "path": "/api/cron/reconcile", "schedule": "0 1 * * *" }]` (10:00 JST). Vercel sends `CRON_SECRET` as the bearer token when the variable is set.

**Exit criterion:** a test payment creates exactly one `fulfilment.cs_test_…` document, lowers stock by the quantities bought, and — on Path A — one Shippo order; resending the event from the Dashboard changes nothing.

---

## 11. Phase 5 — Storefront: buttons, cart drawer, order page, legal pages

**Outcome:** every purchase action on `/` and `/story` works, one cart is shared by both pages, and buyers land on a clear confirmation page.

### 11.1 `src/features/commerce/`

| File | Responsibility |
|---|---|
| `cart.ts` | Cart lines `{ slug, quantity }` in `localStorage` key `ym-cart-v1`, wrapped in `try`/`catch` like `ym-story-products-v1`; shared by both pages |
| `api.ts` | `fetchCatalog()`, `startCheckout(lines, lang, returnPath)`, `fetchOrder(sessionId)` |
| `money.ts` | `formatYen(amount)` via `Intl.NumberFormat("en-US", { style: "currency", currency: "JPY" })` → `¥1,900` (the existing `format.ts` rule for JPY) |
| `CommerceProvider.tsx` | Status, prices, cart, drawer state and actions for one page |
| `CartDrawer.tsx` | One component, two skins: `grove` (inline `--ym-*` styles) and `story` (`.ks-cart*` in `story.css`) |
| `OrderCompletePage.tsx` | `/order/complete` |

Provider states:

| Situation | Result |
|---|---|
| `/api/catalog` says `enabled: false` | `status: "off"` — no prices, no buy buttons |
| Loading | `status: "loading"` — buttons shown disabled, no price |
| Loaded | `status: "ready"` — `priceFor(slug)` returns `{ label: "¥1,900", available }` |
| Catalog request fails or returns 503 | `status: "unavailable"` — prices hidden, buttons disabled with `cart.unavailable` (D11) |
| `POST /api/checkout` → `price_changed` | Update that line's price, re-open the drawer, show `cart.priceChanged` |
| → `insufficient_stock` | Reduce the line to `available` (or remove it), show `cart.stockLimited` |
| → `not_for_sale` / network error | Show `cart.error`; keep the cart |
| Page opened with `?cart=open` (cancel from Stripe) | Open the drawer and strip the parameter with `history.replaceState` |

Context value:

```ts
type CommerceValue = {
  status: "off" | "loading" | "ready" | "unavailable";
  priceFor(slug: string): { label: string; unitAmount: number; available: boolean } | undefined;
  lines: Array<{ slug: string; quantity: number }>;
  count: number;
  subtotalLabel: string;
  busy: boolean;                         // checkout request in flight
  message?: string;                      // localised cart.* message
  drawerOpen: boolean;
  openDrawer(): void;
  closeDrawer(): void;
  add(slug: string): void;               // opens the drawer
  setQuantity(slug: string, quantity: number): void; // 0 removes; max 10
  checkout(): Promise<void>;             // POST, then window.location.assign(url)
};
```

- **Before redirecting**, confirm the returned URL starts with `https://checkout.stripe.com/`.
- **Double-click safety:** `checkout()` returns early while `busy`.
- Cart operations are local, so adding to the cart never waits on the network.

### 11.2 Main page (`src/app/App.tsx`)

| Location (@ `239da23`) | Today | Change |
|---|---|---|
| `:308` nav "Order Now" | `href="#buy"` | `href="#lineup"`; when `count > 0`, `preventDefault()` and `openDrawer()` |
| Nav, beside "Order Now" | — | Cart button: `ShoppingBag` icon (lucide-react) with a count badge; `aria-label={T.cart.open}` |
| `:446` hero "Add to Cart" | `href="#"` | `<button type="button">` calling `add("mustard")` (the hero photograph shows the mustard jar); disabled unless `priceFor("mustard")?.available` |
| `:543` `JarInfo` price (`item.price`) | i18n string | `priceFor(slug)?.label`; empty while loading or unavailable. Keep `item.size` |
| `:547` `JarInfo` "Add to Cart" | `href="#buy"` | `<button>` calling `add(slug)`; label `T.cart.soldOut` when not available |
| `:889` buy strip "Order Now" | `href="#"` | Same as the nav "Order Now" |
| `:945` footer links | `href="#"` | Legal notice, privacy, shipping and returns pages (§11.6) |

`JarInfo` receives the translation item, not a slug: pass `slug` alongside it from the carousel and split layouts (`:605`, `:644`, `:648`). The main page does not need Sanity for this — prices come from `/api/catalog` — so **PLAN3 §8.5 is not a prerequisite**. Keep every button visually identical to the anchor it replaces (same classes and inline styles, `opacity: 0.5; cursor: not-allowed` when disabled).

### 11.3 `/story` (`src/app/story/StoryPage.tsx`, `story.css`)

| Location | Change |
|---|---|
| Header tools (`.ks-header-tools`, `:124`) | Cart button with count badge, styled like `.ks-menu-button` |
| Product card title (`.ks-product-title`, `:300`) | Price under the size when `priceFor(key)` is available |
| Product card, below "Choose this flavor" (`:306`) | Full-width "Add to Cart" (`translations[lang].lineup.cta`), class `ks-button ks-button-gold`, calling `add(key)`. "Choose this flavor" keeps its behaviour |
| Closing CTA (`:419`, `href={#jar-${flavor}}`) | Unchanged |

### 11.4 Cart drawer

Content top to bottom: title and close button; lines (name, size, − / quantity / +, line total, remove); empty state with a link to the jars; message region (`aria-live="polite"`); subtotal; `cart.shippingNote`; **Checkout** button (disabled while `busy`, when empty, or when `status !== "ready"`).

Accessibility and behaviour: `role="dialog"`, `aria-modal="true"`, `aria-labelledby` the title; focus moves to Close on open and returns to the opener on close; Escape and backdrop click close; body scroll locked; slides from the right, no animation under `prefers-reduced-motion: reduce`; full width below 480 px.

### 11.5 `/order/complete`

1. In `src/main.tsx`, add a branch: path `/order/complete` → `lazy(() => import("./features/commerce/OrderCompletePage"))`.
2. The page reads `session_id`, calls `GET /api/order`, and shows:
   - **paid** → `order.thanks`, order number, lines, total, "A receipt has been sent to your e-mail", and clears the cart;
   - **complete but unpaid** (async methods later) → `order.pending`;
   - **open / expired / not found** → `order.notFound` with a link back.
3. Styled with the Fresh Garden palette and the same Fraunces/Mulish fonts; language from the saved language preference.

### 11.6 Legal and policy pages

Stripe's review and Japanese law both need these reachable from every page:

| Path | Content | Languages |
|---|---|---|
| `/legal/tokushoho` | 特定商取引法に基づく表記 (§5.1 fields) | Japanese; English translation below |
| `/legal/privacy` | Privacy policy, including Stripe, Shippo, Vercel and Sanity, cross-border provision (§5.1), and the `ym-cart-v1` storage key | Japanese and English |
| `/legal/shipping` | Free shipping, processing and delivery times, destinations (Japan) | Five languages |
| `/legal/returns` | Returns and refunds for food | Japanese and English |

Implementation: one `LegalPage.tsx` rendering structured content from a new `src/app/legal/content.ts` (text supplied by the owner and advisers), routed from `main.tsx` like `/story`. Link all four from both footers.

---

## 12. Phase 6 — Shipping operations

### 12.1 Path A — Shippo

1. Paid order arrives → Shippo web app → **Orders** shows it with status *Paid*.
2. Kimie opens it, enters the packed weight and parcel size (from the Studio), completes the customs declaration for international orders, chooses the connected carrier's service and **buys the label**. Shippo marks the order *Shipped*.
3. `transaction_created` webhook → `api/shippo-webhook.ts` copies `tracking_number` and the carrier to the Stripe PaymentIntent metadata (`tracking_number`, `carrier`), so the Stripe Dashboard shows the whole order.
4. Customer shipping notice per D10.

Webhook set-up: Shippo API Portal → Webhooks → URL `https://<site>/api/shippo-webhook?token=<SHIPPO_WEBHOOK_TOKEN>` (under 200 characters), event `transaction_created`. Shippo's HMAC signatures need its solutions team to issue a secret (about 10 business days), so start with the **URL token** method and move to HMAC later.

```ts
import { timingSafeEqual } from "node:crypto";
import { env } from "../server/env";
import { sanity } from "../server/sanity";
import { stripe } from "../server/stripe";

const same = (a: string, b: string) => a.length === b.length && timingSafeEqual(Buffer.from(a), Buffer.from(b));

export async function POST(request: Request): Promise<Response> {
  const token = new URL(request.url).searchParams.get("token") ?? "";
  if (!env.shippoWebhookToken || !same(token, env.shippoWebhookToken)) return new Response("Unauthorized", { status: 401 });

  const event = (await request.json().catch(() => null)) as
    | { event?: string; data?: { order?: string; tracking_number?: string; status?: string } }
    | null;
  if (event?.event !== "transaction_created" || event.data?.status !== "SUCCESS" || !event.data.order) return new Response("ignored");

  const log = await sanity().fetch<{ _id: string } | null>(
    `*[_type == "fulfilment" && shippoOrderId == $order][0]{ _id }`, { order: event.data.order },
  );
  if (!log) return new Response("unknown order");
  const sessionId = log._id.replace(/^fulfilment\./, "");
  const session = await stripe().checkout.sessions.retrieve(sessionId);
  await stripe().paymentIntents.update(String(session.payment_intent), {
    metadata: { tracking_number: event.data.tracking_number ?? "" },
  });
  return new Response("ok"); // Shippo expects a 2xx within three seconds
}
```

Confirm the exact `transaction_created` payload in Shippo's webhook test tool during §6.4 and adjust field names before release.

### 12.2 Path B — Japan Post

1. Stripe Dashboard (or app) → **Payments** → the payment → name, address, phone and items (order number in metadata).
2. Domestic: a Japan Post parcel service chosen for glass jars (quotes in §19). International (when a market opens): create the label and customs data on **国際郵便マイページサービス**, then hand over at the post office.
3. Paste the tracking number into the payment's **metadata** (`tracking_number`) in the Dashboard.
4. E-mail the buyer the tracking number (D10).

### 12.3 Owner's weekly checks

- Stock numbers in the Studio versus shelves.
- Vision query for oversold orders: `*[_type == "fulfilment" && oversold]{orderNumber, paidAt}` (Vision is signed in, so private documents are visible).
- Stripe Dashboard → Payments filtered to the last week, all with tracking numbers.

---

## 13. Phase 7 — Security and privacy

| Topic | Rule |
|---|---|
| Secrets | Only server code reads `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `SANITY_WRITE_TOKEN`, `SHIPPO_*`, `CRON_SECRET`. Before each release, search `dist/` for `sk_live_`, `sk_test_`, `rk_live_`, `whsec_`, `shippo_live_`, `shippo_test_` and the Sanity token's value; none may appear. |
| Payment data | None handled. Card entry, 3-D Secure and fraud screening happen on Stripe's page. |
| Prices | Never taken from the browser. `unitAmount` from the page is compared only (§9.3). |
| Checkout endpoint | JSON only, body ≤ 4 KB, `Origin` must match `SITE_URL` (or a preview host on Preview), at most 2 lines × 10 jars, slugs from the catalog only. |
| Stripe webhook | Signature verified on the raw body; unsigned or tampered requests get 400. |
| Shippo webhook | Secret URL token compared in constant time; move to HMAC when issued. |
| Cron | `Authorization: Bearer ${CRON_SECRET}` required. |
| Redirects | Client and server both check the Checkout URL starts with `https://checkout.stripe.com/`. |
| Personal data | Stays in Stripe and Shippo. Sanity fulfilment logs hold order number, time, SKUs and quantities only, under private `fulfilment.*` ids. Function logs never print addresses, e-mails, phone numbers or tokens. |
| Browser storage | `ym-cart-v1` holds slugs and quantities only; listed in the privacy policy. |
| Cookie consent | Not needed for a Japan-only launch; required before EU or UK markets. |
| Sanity token | Editor token scoped to this project, stored only in Vercel and `.env.local`; rotate if exposed. |
| Rollback of secrets | Rotating `STRIPE_WEBHOOK_SECRET` requires updating the Dashboard endpoint in the same step. |

---

## 14. Phase 8 — Copy in five languages

Add to the `Translations` interface in `src/app/i18n.ts` and fill for `en`, `ja`, `fr`, `zh`, `zh-TW`:

```ts
cart: {
  title: string; open: string; close: string; empty: string; browse: string;
  subtotal: string; checkout: string; remove: string;
  increase: string; decrease: string; quantity: string;
  shippingNote: string; unavailable: string; soldOut: string; redirecting: string;
  priceChanged: string; stockLimited: string; error: string;
};
order: { thanks: string; number: string; receipt: string; pending: string; notFound: string; back: string };
legal: { tokushoho: string; privacy: string; shipping: string; returns: string };
```

| Key | en | ja |
|---|---|---|
| `cart.title` | Your cart | カート |
| `cart.checkout` | Checkout | ご購入手続きへ |
| `cart.shippingNote` | Free shipping within Japan. Prices include tax. | 送料無料（日本国内）・税込 |
| `cart.unavailable` | Ordering is paused right now. Please try again later. | 現在ご注文を受け付けておりません。しばらくしてからお試しください。 |
| `cart.soldOut` | Sold out | 売り切れ |
| `cart.redirecting` | Opening secure checkout… | 決済ページへ移動しています… |
| `cart.priceChanged` | A price has changed. Please check your cart. | 価格が変更されました。カートをご確認ください。 |
| `cart.stockLimited` | We've adjusted your cart to the jars still available. | 在庫に合わせて数量を調整しました。 |
| `order.thanks` | Thank you for your order. | ご注文ありがとうございます。 |
| `order.receipt` | A receipt has been sent to your e-mail. | 領収書をメールでお送りしました。 |
| `legal.tokushoho` | Legal notice | 特定商取引法に基づく表記 |

- French, Simplified Chinese and Traditional Chinese are written in the same pass and reviewed by a native speaker.
- **At a Japan-only launch the main page's `lineup.items[*].price` strings are no longer rendered** (prices come from `/api/catalog`), so `en`, `fr`, `zh` and `zh-TW` visitors see yen. Consider a one-line note in those locales: "Currently shipping within Japan only."
- If D2 or D4 changes, also edit the FAQ shipping answer, `hero.priceNote`, `buyStrip.priceNote` and `twoJar.shipping` in all five locales.

---

## 15. Phase 9 — Testing

Run on a Vercel **Preview** deployment with Stripe **test mode**, the Preview webhook endpoint, and (Path A) the Shippo **test** token.

### 15.1 Cart, checkout and fulfilment

| # | Scenario | Pass when |
|---|---|---|
| 1 | `/`, English: Add to Cart on mustard | Drawer: 1 × mustard, `¥1,900` (from `/api/catalog`) |
| 2 | Add tapenade; + on mustard | Subtotal `¥5,900` |
| 3 | − to 0 on tapenade | Line removed |
| 4 | Reload `/`, open `/story` | Same cart and badge on both pages |
| 5 | `/story` product card Add to Cart | Line added; "Choose this flavor" still only highlights |
| 6 | Checkout in each language | Stripe page in `en`, `ja`, `fr`, `zh`, `zh-TW`; ¥ amounts; 送料無料/Free shipping; Japan-only address |
| 7 | Pay with `4242 4242 4242 4242` | Redirect to `/order/complete` showing *paid* and `KJ-…`; cart cleared; Stripe receipt e-mail; one `fulfilment.cs_test_…` document; stock down by 2 and 1; Path A: Shippo order *Paid* |
| 8 | Declined card `4000 0000 0000 0002` | Stripe shows the decline; no fulfilment document; stock unchanged |
| 9 | 3-D Secure card `4000 0027 6000 3184` | Payment succeeds after authentication; same as 7 |
| 10 | Resend the `checkout.session.completed` event from the Dashboard | No second document, stock unchanged, no second Shippo order |
| 11 | Script calls `fulfilCheckout(id)` twice in parallel for a new paid Session | Exactly one document and one decrement |
| 12 | Stock set to 1; cart of 2 | `insufficient_stock`; drawer lowers to 1 with `cart.stockLimited` |
| 13 | Change `prices.jpy` and publish after the page loaded | `price_changed`; drawer shows the new price; second attempt succeeds |
| 14 | Open checkout, wait 30 minutes | Session expired; returning via back button offers a new checkout; nothing recorded |
| 15 | Cancel on Stripe's page | Back on the originating page with the drawer open |
| 16 | POST to `/api/stripe-webhook` with a bad signature | 400; nothing recorded |
| 17 | Path A: wrong `SHIPPO_API_TOKEN`, then pay | Payment and stock recorded; no `shippoOrderId`; after fixing the token, calling `/api/cron/reconcile` creates the Shippo order |
| 18 | Path A: buy a test label in Shippo | `tracking_number` appears in the PaymentIntent metadata |
| 19 | Shippo webhook without the token | 401 |
| 20 | Stock set to 0 in the Studio | Within about a minute both pages show "Sold out" |
| 21 | Remove `STRIPE_SECRET_KEY` and redeploy | `/api/catalog` → `enabled: false`; no prices or buttons; content unaffected |
| 22 | Block `/api/catalog` in DevTools | Prices hidden, buttons disabled, `cart.unavailable`; Sanity content renders |
| 23 | Both main-page themes; 375 px screen; keyboard only; `prefers-reduced-motion` | Drawer legible, full width, operable, focus returns, no slide |
| 24 | Footer links on both pages | Four legal pages open |
| 25 | Build hygiene | `npm run typecheck` (both configs) and `npm run build` pass; `dist/` secret search clean (§13) |

### 15.2 Per international market (repeat when enabling each)

| Check | Pass when |
|---|---|
| Country choice in the cart | Prices switch to the market's fixed Sanity prices and currency |
| Checkout | Currency, allowed countries and free shipping correct; receipt language |
| Fulfilment | Path A customs declaration accepted and label bought, or Path B EMS label via 国際郵便マイページ |
| Compliance | That country's §5.2 row signed off |

---

## 16. Phase 10 — Launch (Japan)

### 16.1 Checklist

1. Every row of §5.1 confirmed; legal pages live with real text and address.
2. Stripe: account **activated** (site review passed), payout bank account verified, **live** keys and a **live** webhook endpoint set in Vercel Production.
3. Vercel: commercial-use plan (D13); Production variables set; redeployed; cron visible under Settings → Cron Jobs.
4. Sanity: prices, SKUs, weights and stock correct; **For sale** on for mustard and tapenade only.
5. Path A: Shippo **live** token, connected carrier account live, webhook registered with the live URL token. Path B: Kimie has a 国際郵便マイページ account (for later international orders) and packaging ready.
6. §15.1 passes on the production deployment in test mode first; then **one real card payment for one jar**, fulfilled end to end, then refunded from the Dashboard (restock by hand).
7. Kimie has walked through one order on the chosen path, including adding tracking.

### 16.2 Rollback

| Situation | Action |
|---|---|
| Stop selling immediately, no deploy | Studio → Stock → set `available` to **0** on both (saves instantly; site shows Sold out within about a minute; checkout refuses immediately) |
| Stop selling one product | Studio → product → **For sale** off → Publish |
| Remove commerce from the site | Delete `STRIPE_SECRET_KEY` in Vercel Production → Redeploy |
| Bad code release | Vercel → Deployments → previous production deployment → **Instant Rollback** |
| Webhook failing | Fix and redeploy; Stripe retries failed deliveries, and the daily reconcile catches the rest |

---

## 17. Operations after launch

| Task | Where | Notes |
|---|---|---|
| New order notification | Stripe e-mail / mobile app | |
| Fulfil | Shippo web app (A) or Japan Post (B) | Tracking lands in Stripe metadata automatically (A) or by hand (B) |
| Change price | Studio → product → Prices → **Publish** | Site within about a minute; checkout immediately |
| Restock | Studio → Stock | Saves as you type |
| Refund | Stripe Dashboard → payment → **Refund** | Then add the jars back in Stock if they return to the shelf. Check whether Stripe returns its fee on refunds for this account |
| Oversold order | Vision query in §12.3 | Refund or make more; contact the buyer |
| Bookkeeping | Stripe → Reports / Payments → **Export** monthly | Plus Shippo label invoices (A) or Japan Post receipts (B) |
| Stripe library upgrades | `stripe` package major versions pin new API versions | Read the changelog, run §15.1 in test mode, redeploy |
| Tax changes | Food rate change planned for April 2027 (D8) | Review tax-inclusive prices with the accountant beforehand |

---

## 18. Effort

Engineering only. Store administration, compliance, legal text and carrier negotiations are not included.

| Phase | Section | Hours |
|---|---|---:|
| 0 — Accounts, routing proof, Shippo go/no-go test | §6 | 4–6 |
| 1 — Sanity commerce fields and stock | §7 | 3–5 |
| 2 — Server foundation | §8 | 4–6 |
| 3 — Catalog, checkout and order endpoints | §9 | 6–10 |
| 4 — Webhook, idempotent fulfilment, reconcile cron | §10 | 8–12 |
| 5a — Buttons, cart drawer (two skins), order page | §11.1–11.5 | 14–22 |
| 5b — Legal pages (structure; text from the owner) | §11.6 | 3–5 |
| 6 — Shippo order and webhook integration (Path A) | §10.4, §12.1 | 5–8 |
| 7 — Security checks | §13 | 2–3 |
| 8 — Copy in five languages (excluding native review) | §14 | 2–4 |
| 9 — Testing | §15 | 8–12 |
| 10 — Launch | §16 | 2–3 |
| Documentation (`CLAUDE.md`, owner guide for fulfilment) | — | 2–3 |
| **Total** | | **63–99** |

On Path B, subtract Phase 6 (5–8 hours).

### 18.1 Implementing with an AI agent

Rough estimate, made 2026-09-15, for one coding agent working phase by phase with the owner reviewing each phase. Agent time includes writing code, typechecking, building and checking a preview. It excludes outside waits, which decide the launch date more than the code does.

**Summary:** about **12–23 agent hours** of active work, plus **11–18 hours of the owner's time** — 6–10 hours hands-on (accounts, logins, keys, Studio data, payments, walkthrough) and 5–8 hours reviewing, most of it on the webhook, stock and checkout code, where a bug costs money.

#### By phase

| Phase | Engineer (§18) | Agent, active | Needs the owner or someone outside |
|---|---:|---:|---|
| Prerequisite: finish PLAN3's Sanity project (§19.4) | — | 0.5 h | Create the Sanity project, log in, approve the seed |
| 0 — Accounts, routing proof, Shippo test | 4–6 h | 0.5–1 h | Create Stripe, Shippo and Vercel accounts; add keys; request a carrier account (outside wait) |
| 1 — Sanity commerce fields and stock | 3–5 h | 0.5–1 h | Deploy the Studio; enter SKUs, weights, stock |
| 2 — Server foundation | 4–6 h | 0.5–1 h | — |
| 3 — Catalog, checkout, order status | 6–10 h | 1–2 h | Log in to the Stripe CLI |
| 4 — Webhook, fulfilment, reconcile cron | 8–12 h | 1.5–3 h | — |
| 5a — Buttons, cart drawer (two skins), order page | 14–22 h | 3–5 h | Judge the look and feel |
| 5b — Legal pages | 3–5 h | 0.5–1 h | Legal text from the owner and advisers (outside wait) |
| 6 — Shippo integration (Path A only) | 5–8 h | 1–2 h | Runs only if §6.4 passes |
| 7 — Security checks | 2–3 h | ~0.5 h | — |
| 8 — Copy in five languages | 2–4 h | 0.5–1 h | Native review of French and both Chinese versions |
| 9 — Testing (§15.1) | 8–12 h | 2–4 h | Test-card payments (see below) |
| 10 — Launch | 2–3 h | 0.5–1 h | Live keys, one real-card order and refund, Kimie's walkthrough |
| Documentation | 2–3 h | ~0.5 h | — |
| **Total** | **63–99 h** | **≈ 12–23 h** | |

On Path B, subtract about 1–2 agent hours.

#### What the agent must not do

An agent should not create accounts, type passwords or API keys, or enter card numbers — including Stripe's test cards on the hosted Checkout page. The owner therefore:

- adds secrets with `vercel env add` and logs in to the Stripe CLI, Sanity and Shippo;
- makes the test-card payments in §15.1 scenarios 7–9 (about 15 minutes); the agent covers the other payment scenarios with Stripe CLI test events;
- makes the real-card launch payment in §16.1.

#### Run order

Start the outside waits on day 0 (owner, about 2–3 hours): Stripe account and business profile; Shippo account and a DHL Express Japan (or FedEx or UPS) business account request; legal notice, privacy and returns text from advisers; tax accountant; Sanity project and seed; Vercel plan decision.

| Session | Agent does | Agent time | Owner does after | Owner time |
|---|---|---:|---|---:|
| 1 | Phases 1–2 and the routing proof (§6.3) | 1–2 h | Review; deploy the Studio; enter SKUs, weights, stock | ~1 h |
| 2 | Phases 3–4 | 1.5–3 h | Add test keys; Stripe CLI login; **review webhook and stock code closely**; one test-card payment | 2–3 h |
| 3 | Phases 5a and 8 | 3–5 h | Visual check in both themes and on a phone; send translations for native review | ~1 h |
| 4 | Phases 5b and 7, documentation | 1–2 h | Paste in legal text when it arrives | ~0.5 h |
| 5 | Phase 6 — only if §6.4 passes | 1–2 h | Buy a Shippo test label | ~0.5 h |
| 6 | Phase 9 on a preview, fix loop | 2–4 h | Test-card scenarios 7–9; device checks | 1–2 h |
| 7 | Phase 10, after Stripe activation | 0.5–1 h | Real-card order and refund; Kimie's walkthrough | 1–2 h |

#### Calendar

| Stage | Working days |
|---|---:|
| Build with one agent, owner reviewing each session | 3–5 |
| Two agents in parallel (sessions 2 and 3) | 2–3, with more review at once |
| Testing, fixes, preview deploy | 1–2 |
| Launch | When the outside waits finish |

- **Code ready:** about one week of part-time supervision.
- **Launch date:** the latest of code ready, Stripe account activation (§5.1), legal text and Japan compliance, and — on Path A — the carrier account.
- **Shortest path:** run the Shippo test (§6.4) in the first week. If it fails, session 5 disappears and launch proceeds on Path B without waiting for a carrier account.

---

## 19. Costs

Prices verified 2026-09-15 on the providers' public pages; recheck before signing up.

### 19.1 Recurring

| Item | Cost |
|---|---|
| Stripe | No setup or monthly fee |
| Stripe Tax | Not enabled at launch (D8). If enabled with Checkout: 0.5% per transaction in registered locations |
| Shippo (Path A) | App **Starter**: free, up to 30 labels a month, 5¢ per label on connected carrier accounts. **Pro**: from $17/month or $205/year (branded tracking e-mails, no fee on connected-carrier labels). API Starter: 30 labels a month free then 7¢ each; tracking 2¢, rating 1¢, non-US address validation 8¢ per call |
| Sanity | $0 (Free plan, PLAN3) |
| Vercel | A plan permitting commercial use (Pro, from $20/month per member) |

### 19.2 Per order (Stripe, Japan)

| Order | Card fee at 3.6% |
|---|---:|
| 1 × mustard, ¥1,900 | ≈ ¥68 |
| 1 × tapenade, ¥2,100 | ≈ ¥76 |
| Both jars, ¥4,000 | ≈ ¥144 |

Add **2%** when a payment needs currency conversion (relevant once non-JPY prices exist). Konbini, if enabled later: 3.6% with a ¥120 minimum. PayPay: 3.98%.

**Compared with PLAN-shopify** at 30 orders a month of ¥4,000: Stripe ≈ ¥4,320 in fees; Shopify Basic ≈ ¥3,650 + ¥4,260 = ¥7,910. The saving is paid for with 25–35 more engineering hours up front and owning the order, stock and webhook code.

### 19.3 Shipping (absorbed by free shipping)

Not quoted by this plan. Before fixing prices, get: Japan Post domestic parcel rates for one and two packed jars; EMS by zone (for later markets); and on Path A the connected carrier's contract rates from Japan (§6.4 step 5). Shipping per parcel comes straight out of each order's margin.

### 19.4 One-time or per market (if exporting)

| Item | Note |
|---|---|
| FDA food facility registration | No FDA fee, but a foreign facility names a US agent, usually a paid service |
| Export labelling | Translated labels; US-format allergen and nutrition labelling where required |
| Professional advice | Tax accountant, privacy adviser, import advisers (§5) |

---

## 20. Risks

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Shippo cannot buy labels for parcels from Japan, or only at uneconomic carrier rates | High | Medium | Checkout independent of Shippo; §6.4 go/no-go; Path B |
| Compliance work delays launch | High | High | Japan-only launch (D2); legal pages early, because Stripe activation depends on them |
| Stripe account review rejects the site | Medium | High | Product information, prices, real address and 特定商取引法 page live before applying (§5.1, §11.6) |
| Bug in owned order or stock code (double decrement, missed order) | Medium | High | Transactional log-plus-decrement, replay tests (§15.1 #10–11), daily reconcile cron |
| Oversell of the last jars | Low | Medium | Stock check at checkout, 30-minute sessions, oversold flag, refund |
| Price shown differs from price charged | Low | High | Server prices only; `price_changed` check; no `i18n.ts` prices rendered |
| Webhook secret or Sanity write token leaked | Low | High | Server-only variables, `dist/` search, rotation steps (§13) |
| Food consumption-tax change (8% → 1% planned April 2027) mishandled in prices or receipts | Medium | Medium | Accountant review before April 2027 (D8, §17) |
| Konbini requested but business not eligible | Medium | Low | Cards and wallets at launch (D9) |
| Food shipments refused at a destination | Medium | High | §5.2 sign-off per country; remove uncleared promises from copy |
| US prior notice per shipment is operationally heavy | High if US enabled | Medium | Time one real filing before opening the US |
| Stripe library or API version change breaks fields (e.g. `collected_information`) | Certain over time | Medium | Pin the package; upgrade deliberately with §15.1 |
| Hobby-plan hosting used commercially | Medium | Medium | Commercial Vercel plan before launch (D13) |
| Vercel or Sanity outage | Low | Medium | Unavailable state; content still renders; Stripe retries webhooks; reconcile catches up |

---

## 21. Out of scope

- Customer accounts and order history on the site (Stripe Checkout is guest checkout).
- An admin order screen on the site — the Stripe Dashboard, Shippo web app and Studio cover the workflow.
- Automatic label purchase and automated shipping-notice e-mails (a transactional e-mail provider would be a separate decision).
- Live carrier rates at checkout (would require the embedded form, §2.1).
- Discount codes (Stripe promotion codes could be added later with `allow_promotion_codes`), subscriptions, gift wrapping, reviews.
- International markets at launch (designed for in D3 and §15.2, enabled only after §5.2).
- Konbini, PayPay and qualified invoices (適格請求書) at launch.
- Selling the preserved lemon (D12).
- Moving the main page's copy to Sanity (PLAN3 §8.5 remains a separate plan).

---

## 22. Sources

Verified 2026-09-15.

- [Stripe pricing — Japan](https://stripe.com/jp/pricing) — 3.6% cards, +2% conversion, Konbini 3.6% (¥120 minimum), PayPay 3.98%, Stripe Tax 0.5% with Checkout, no monthly fee
- [Create a Checkout Session](https://docs.stripe.com/api/checkout/sessions/create) — `ui_mode` values (`hosted_page`, `embedded_page`, `form`, `elements`), up to 5 `shipping_options`, `expires_at` 30 minutes to 24 hours, `locale` values including `ja`, `fr`, `zh`, `zh-TW`
- [Charge for shipping](https://docs.stripe.com/payments/during-payment/charge-shipping) — fixed-amount shipping rates for the whole order
- [Dynamically customize shipping options](https://docs.stripe.com/payments/checkout/custom-shipping-options) — not supported on hosted or full embedded pages; embedded form uses `runServerUpdate`
- [Fulfill orders](https://docs.stripe.com/checkout/fulfillment) — webhooks required; `checkout.session.completed` and `async_payment_*` events; fulfilment may run multiple times concurrently; Checkout waits up to 10 seconds for the webhook
- [Checkout Session shipping_details removal (2025-03-31)](https://docs.stripe.com/changelog/basil/2025-03-31/checkout-session-remove-shipping-details) — use `collected_information.shipping_details`
- [Adaptive Pricing](https://docs.stripe.com/payments/currencies/localize-prices/adaptive-pricing) — customer pays 2–4%; price currency must be a settlement currency
- [Stripe Tax — supported countries](https://docs.stripe.com/tax/supported-countries) and [Japan](https://docs.stripe.com/tax/supported-countries/asia-pacific/collect-tax) — Japan supported as business location; exports zero-rated
- [Konbini](https://docs.stripe.com/payments/konbini) — JPY only, ¥120–¥300,000, onboarding requirements, sole proprietors under 3 years prohibited
- [Stripe: getting started in Japan](https://support.stripe.com/questions/getting-started-in-japan) — account activation and website review, Specified Commercial Transactions Act disclosure
- [Shippo carriers](https://goshippo.com/carriers) — carrier list; no Japan Post, Yamato or Sagawa; Nippon Express tracking only
- [Shippo carrier accounts](https://docs.goshippo.com/docs/Carriers/CarrierAccounts) — Shippo accounts for U.S. outbound shipments; connecting your own accounts
- [Shippo: shipping within countries other than the United States](https://support.goshippo.com/hc/en-us/articles/205142315-Shipping-within-Countries-other-than-the-United-States) — DHL Express, FedEx and UPS where the service exists and the account is enabled
- [Shippo pricing](https://goshippo.com/pricing) and [API pricing](https://goshippo.com/pricing/api) — Starter, Pro, API Starter fees
- [Shippo Orders](https://docs.goshippo.com/orders/orders.md), [webhooks](https://docs.goshippo.com/tracking/webhooks.md), [webhook security](https://docs.goshippo.com/tracking/webhook-security.md), [international shipping](https://docs.goshippo.com/international-shipping/international-shipping.md)
- [Japan Post 国際郵便マイページサービス](https://www.post.japanpost.jp/intmypage/whatsmypage.html) and [通関電子データ送信義務化](https://www.post.japanpost.jp/int/ead/index.html) — customs electronic data required for goods to all destinations
- [Vercel Functions — Node.js runtime](https://vercel.com/docs/functions/runtimes/node-js) — `/api` Web handlers, `request.text()`
- [Sanity IDs and paths](https://www.sanity.io/docs/content-lake/ids) — documents with a period in the id require authentication to read
- [Sanity document type (`liveEdit`)](https://www.sanity.io/docs/studio/document-type) — edits publish immediately, no drafts
- [USDA FAS: Japan to reduce consumption tax on grocery food to one percent](https://www.fas.usda.gov/data/gain/2026/08/japan-japan-reduce-consumption-tax-grocery-food-one-percent) — cabinet approval, April 2027 start, legislation pending
- [FDA prior notice](https://www.fda.gov/industry/prior-notice-imported-foods/filing-prior-notice-imported-foods) and [food facility registration](https://www.fda.gov/food/guidance-regulation-food-and-dietary-supplements/registration-food-facilities-and-other-submissions)

---

## 23. Decision log

| Date | Decision | By |
|---|---|---|
| 2026-09-15 | Stripe Checkout + Shippo plan written as an alternative to PLAN-shopify; both kept | Owner |
| — | Choice between PLAN-shopify and this plan | — |
| — | §6.4 Shippo result: Path A or Path B, with rates found | — |
