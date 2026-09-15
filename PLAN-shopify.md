# PLAN-shopify — Selling the Jars with Shopify Checkout

Plan for adding real purchasing to the site: customers add jars to a cart on the existing pages and pay on Shopify's hosted checkout. Shopify becomes the system of record for **price, stock, shipping, tax, payment and orders**. Sanity (PLAN3) stays the system of record for **words and photos**. The Vite/React site keeps its design and hosting on Vercel.

Companion documents: [PLAN3.md](PLAN3.md) (Sanity content, `/story` live), [PLAN.md](PLAN.md) (original custom-admin option).

Facts below were verified on 2026-09-15 against the repository (`main` @ `239da23`) and the sources in §19. This is an engineering plan, not legal or tax advice: every item in §5 must be confirmed with the relevant authority or a qualified adviser before taking real orders.

---

## 0. Summary

| | |
|---|---|
| **Approach** | Headless Shopify: the site calls the **Storefront API** from the browser to show live prices and manage a cart, then redirects to the cart's `checkoutUrl` on Shopify's hosted checkout. No payment data ever touches this site. |
| **Shopify plan** | **Basic** — ¥4,850/month, or ¥3,650/month billed annually (Japan pricing). |
| **Payments** | **Shopify Payments** (Japan). Card rates on Basic: 3.55% domestic cards and JCB, 3.9% international cards and AMEX. Required for selling in multiple currencies. |
| **New code** | `src/features/commerce/` (Storefront API client, price query, cart state, cart drawer), buy buttons wired on `/` and `/story`, cart copy in all five languages. |
| **New infrastructure** | None. Shopify hosts checkout; the site stays static on Vercel. |
| **Blocking prerequisites** | Food-business and export compliance (§5), a Shopify Payments account, and a decision on which countries to ship to. |
| **Effort** | 38–64 engineering hours plus the store setup and compliance work in §5–§6 (§15). |

### What this changes from PLAN3

- **Prices move out of Sanity and `i18n.ts`.** PLAN3 stored per-market prices in hidden Sanity fields (`prices.usd`, `prices.jpy`, …) and the main page still renders price strings from `i18n.ts`. Both become fallbacks at most; Shopify's price for the buyer's country is authoritative, because it is the price the checkout will charge.
- **The currency follows the buyer's country, not the page language.** Today `fr` means euros. With Shopify, a French-speaking visitor in Canada pays in the Canadian market's currency. See decision D3.

---

## 1. Verified starting state

### 1.1 Purchase actions today — none of them buy anything

| Location | Label (en) | Target today | Effect |
|---|---|---|---|
| `src/app/App.tsx:308` nav | "Order Now" | `#buy` | Scrolls to `<section id="buy">` at `:371`, which is the **hero**, not a buy section |
| `App.tsx:446` hero | "Add to Cart" | `#` | Jumps to top |
| `App.tsx:547` `JarInfo` (each jar) | "Add to Cart" | `#buy` | Scrolls to the hero |
| `App.tsx:889` buy strip | "Order Now" | `#` | Jumps to top |
| `App.tsx:945` footer | "Privacy Policy", "Shipping Info", "Instagram" | `#` | No pages exist |
| `src/app/story/StoryPage.tsx` product card | "Choose this flavor" | `setFlavor(key)` | Highlights a jar only; `/story` has **no purchase action** |

### 1.2 Commitments the copy already makes

| Promise | Where | Consequence for this plan |
|---|---|---|
| "Shipping included" | `hero.priceNote`, `buyStrip.priceNote`, `twoJar.shipping` (all locales) | Checkout must show **free shipping** to every country sold to, or the copy must change (D4) |
| Ships from Ehime, Japan via EMS to the US, EU, UK and Australia in 5–10 business days | FAQ answer in `i18n.ts:268` (FAQ section currently hidden: `SHOW_FAQ = false`) | Those destinations carry food-import obligations (§5.2) |
| One price per language: `$13` / `¥1,900` / `12 €` / `¥91` / `NT$400` (mustard) | `lineup.items[*].price` per locale; mirrored in Sanity hidden `prices` | Becomes Shopify market pricing (D3) |
| Address `〒000-0000 Japan` | `footer.address` | Placeholder; a real business address is legally required for Japanese online sales (§5.1) |

### 1.3 Platform

| Fact | Evidence |
|---|---|
| React 18.3.1, Vite 6.3.5, TypeScript 7 (scoped `npm run typecheck`) | `package.json` |
| `@shopify/hydrogen-react` 2026.4.3 supports React `^18.3.1` and Vite `^6.2.1`; `@shopify/storefront-api-client` is 2.0.0 | `npm view`, 2026-09-15 |
| Storefront API latest stable version `2026-07`; `2026-10` releases 2026-10-01; each version supported ≥ 12 months | shopify.dev versioning |
| Public site `https://kimie-atelier.vercel.app` is reachable without login; team `*-samuelcychan-team.vercel.app` aliases are behind Vercel Authentication | HTTP probes, 2026-09-15 |
| The live bundle did not yet contain the Sanity project id (Vercel env vars missing or not redeployed) | Bundle inspection, 2026-09-15 |
| No Content-Security-Policy is set | `vercel.json`, `index.html` |
| Sanity: products `product-mustard`, `product-tapenade` (shown), `product-preserved-lemon` (hidden) | Sanity query, 2026-09-15 |

---

## 2. Integration options

| | **A. Buy Button** | **B. Headless cart + Shopify checkout** (recommended) | **C. Move the storefront into Shopify** |
|---|---|---|---|
| How | Shopify's Buy Button channel (`@shopify/buy-button-js` 3.0.6) injects iframe product components and its own cart | Site calls the Storefront API for prices and a cart, then redirects to `checkoutUrl` | Rebuild the pages as a Shopify Online Store theme (Liquid) |
| Design fit | Weak — Shopify's widget styling inside the Grove/Wabi-Sabi and `/story` designs | Full — buttons and drawer built with the existing `--ym-*` and `ks-*` styles | Full, but everything is rebuilt |
| Five languages and markets | Partial | Yes, via `@inContext(country, language)` | Yes |
| Keeps Vite, Vercel and Sanity | Yes | Yes | No |
| Build effort | Lowest (~10–16 h) | Moderate (38–64 h) | Highest (a redesign) |
| Checkout | Shopify-hosted | Shopify-hosted | Shopify-hosted |
| Risk | Two visual languages on one page; limited control of cart behaviour | Owning a small amount of cart UI code | Discards the current site |

**Recommendation: B.** It is the only option that keeps the site's design and Sanity content while giving per-market prices and a native-looking cart. Checkout, payments, tax, fraud screening and order e-mails remain Shopify's responsibility in all three options, so B adds UI work, not payment risk.

Not considered: taking payments directly with a card processor (for example Stripe Checkout). That would also require building order management, shipping rates, inventory and tax handling that Shopify provides.

---

## 3. Target architecture

```text
Visitor (browser)
  │
  ├─ GET page ────────────────────────▶ Vercel (static Vite build)
  │
  ├─ words, photos ───────────────────▶ Sanity CDN            (PLAN3, unchanged)
  │
  ├─ price for buyer's country ───────▶ Shopify Storefront API
  │     query … @inContext(country, language)
  │
  ├─ cartCreate / cartLinesAdd / … ───▶ Shopify Storefront API
  │     cart id kept in localStorage
  │
  └─ "Checkout" ──── redirect to cart.checkoutUrl ─▶ Shopify hosted checkout
                                                       │ payment, tax, shipping
                                                       ▼
                                             Order in Shopify admin → Kimie ships
```

- **Link between Sanity and Shopify:** each Sanity `product` stores the Shopify **variant id** (`gid://shopify/ProductVariant/…`) in a new field (§7). The page reads text and photos from Sanity and price and availability from Shopify for that id.
- **Tokens:** the browser uses only the Storefront API **public** access token (header `X-Shopify-Storefront-Access-Token`), which Shopify designs to be visible to buyers. The private token and any Admin API credentials never enter this repository or a `VITE_` variable.
- **No server code.** Nothing in this plan requires `api/` functions or a database. Order handling happens in the Shopify admin.

---

## 4. Decisions to confirm before starting

The plan is written assuming each recommendation.

| ID | Decision | Recommendation | Why / consequence if changed |
|---|---|---|---|
| **D1** | Shopify plan | **Basic** (¥3,650/month billed annually, ¥4,850 monthly). | Grow cuts the domestic card rate from 3.55% to 3.4% for ¥8,650/month more (monthly billing), which only pays off above roughly ¥5.8 million of card sales a month. |
| **D2** | Where to sell at launch | **Japan only first**; add international markets one country at a time once §5.2 is cleared for that country. | The FAQ promises the US, EU, UK and Australia, but both jars contain animal-derived ingredients (anchovies, honey) and food exports carry registration and notice duties. Launching everywhere at once makes the least-verified destination the risk for the whole store. |
| **D3** | Prices per market | **Fixed local prices** that match today's copy — Japan ¥1,900 / ¥2,100; US $13 / $14; euro markets 12 € / 13 €; Taiwan NT$400 / NT$440 — set with Markets catalogs. Fallback if catalogs with fixed prices are not available on Basic: a **manual exchange rate** per currency with rounding. **Do not open a mainland-China market** (CNY) at launch. | Shopify prices by the **buyer's country**, so page language no longer decides currency. CNY presentment support for a Japan-based Shopify Payments account is unconfirmed, and food shipments to mainland China are heavily restricted. The `zh` (Simplified Chinese) page then shows the price of whichever market the visitor's country belongs to. |
| **D4** | Shipping cost | **Free shipping** rates in every market that is enabled, with EMS cost absorbed in the price — matching the "Shipping included" copy. | Charging shipping at checkout means editing `priceNote`, `twoJar.shipping` and `buyStrip.priceNote` in all five locales. Check Japan Post EMS rates for the packed weight of one and two jars per zone before fixing international prices. |
| **D5** | Cart experience | **Cart drawer** (line items, quantity, subtotal, Checkout button) opened by every "Add to Cart" and "Order Now". | A "Buy now" that jumps straight to checkout is simpler but cannot combine both jars in one box, which the copy advertises ("ordered together, they ship in one box"). |
| **D6** | Linking Sanity products to Shopify | **A `shopifyVariantId` field** on each Sanity product, filled once by hand. | With two products, [Sanity Connect](https://www.sanity.io/docs/apis-and-sdks/sanity-connect-for-shopify) adds a sync to maintain for little gain; it also syncs only the store's default-currency price, so per-market prices would still come from the Storefront API. Revisit when the catalogue grows. |
| **D7** | When Shopify cannot be reached | **Hide the price and disable Add to Cart** with a short message; keep all Sanity content visible. | Showing the old `i18n.ts` price could quote a price the checkout does not charge. |
| **D8** | Tax | **Tax-inclusive prices** for Japan, configured in Shopify taxes. International tax treatment decided with a tax adviser. | Japanese consumer prices are displayed tax-inclusive (総額表示). Export sales may be exempt from consumption tax, and some destinations collect import tax or VAT on arrival — both need professional confirmation (§5). |
| **D9** | Preserved lemon | **Not for sale** (stays hidden, no Shopify product yet). | Matches PLAN3. |
| **D10** | Checkout address | Shopify's default checkout domain at launch; a custom checkout domain later, if the business registers its own domain. | Cosmetic; a custom domain needs DNS set-up in Shopify. |

---

## 5. Compliance and business prerequisites

**Not legal advice.** These are the obligations this plan knows to check, based on what the site sells and promises. Each needs confirmation from the named authority or a qualified adviser. **No real order should be accepted until §5.1 is complete, and no country outside Japan should be enabled until its row in §5.2 is complete.**

### 5.1 Japan (required before launch)

| Item | What to confirm | Who |
|---|---|---|
| Food business permit | Producing and selling jarred sauces requires the appropriate business permit under the Food Sanitation Act and HACCP-based hygiene management. | The public health centre (保健所) covering the kitchen in Ehime |
| Food labelling | Jar labels comply with the Food Labeling Act. **Allergens:** the mustard sauce lists soy sauce, which normally contains **wheat** (a mandatory allergen) and **soybean**; the tapenade contains **anchovies** (fish). Show allergens on the product pages as well. | Health centre / food labelling adviser |
| Legal notice for online sales | A page titled 特定商取引法に基づく表記 (Act on Specified Commercial Transactions) with the seller's legal name, **real address** and phone, prices, shipping costs, payment and delivery timing, and the returns policy. The footer address is currently the placeholder `〒000-0000`. | Business owner; Shopify's legal-notice policy page can hold the text |
| Privacy policy | Required because Shopify collects buyer names, addresses and contact details. The footer "Privacy Policy" link currently goes to `#`. | Business owner |
| Returns and refunds | A written policy for perishable goods (for example: no returns once opened; refund or replacement for breakage in transit). | Business owner |
| Consumption tax | Tax-inclusive display for consumers; invoice-system (インボイス制度) registration status; treatment of export sales. | Tax accountant (税理士) |
| Shopify Payments account | Business and identity verification and a bank account for payouts, completed in the Shopify admin. | Business owner |

### 5.2 Each export destination (required before enabling that market)

| Destination | Known obligations to confirm | Source |
|---|---|---|
| **United States** | The **manufacturing facility must be registered** with the FDA, and **prior notice must be filed for every shipment before it is sent**, including shipments by international mail (with the mail service name and tracking number). The gift exemption applies only to non-commercial shippers, so it does not cover this shop. Packaging must meet US labelling rules, including declaring major allergens (wheat, soy, fish). | [FDA prior notice](https://www.fda.gov/industry/prior-notice-imported-foods/filing-prior-notice-imported-foods), [facility registration](https://www.fda.gov/food/guidance-regulation-food-and-dietary-supplements/registration-food-facilities-and-other-submissions) |
| **European Union** | Imports of foods containing products of animal origin (anchovies; honey) are tightly controlled, including for small consignments to consumers. Confirm whether either jar may be sent at all before opening an EU market. | EU official controls / an import adviser |
| **United Kingdom** | Same question as the EU under UK rules. | UK import guidance / adviser |
| **Australia** | Biosecurity import conditions for foods containing fish or honey. | Australian import conditions (BICON) / adviser |
| **Taiwan** | Import food regulations for small consumer shipments. | Taiwan FDA / adviser |
| **All** | Japan Post EMS prohibited and restricted items for food to that country; customs declaration content; who pays import duties and tax (and whether checkout should say so). | Japan Post |

If a destination is found to be impractical, remove it from the FAQ copy in all five locales rather than leaving an unfulfillable promise.

---

## 6. Phase 0 — Shopify store set-up (admin only, no code)

**Outcome:** a Shopify store with two sellable products in the Japan market, working test checkout, and a Storefront API public token.

Admin menu names below are as of 2026-09; Shopify occasionally renames settings.

### 6.1 Create the store

1. Start at <https://www.shopify.com/jp> with the account that will **own the business** (Kimie's, or the company's), not a developer's personal account.
2. **Settings → General:** store name, legal business name, real business address and phone (the same ones used in §5.1), **store currency JPY**, time zone Asia/Tokyo, unit system metric. Set the currency now; changing it after the first sale is restricted.
3. Choose the **Basic** plan (D1) when ready to take real payments. Everything below can be built during the trial.
4. **Settings → Users and permissions:** add the developer as a staff member or collaborator with only Products, Settings and Apps permissions. Kimie keeps owner access.

### 6.2 Payments

1. **Settings → Payments → Shopify Payments → Activate.** Complete business and identity verification and add the payout bank account.
2. Leave **test mode** on until §12. Card numbers for test mode are listed on the same settings page.
3. Do not add third-party gateways at launch: on Basic they add a 2% transaction fee.

### 6.3 Products

Create one product per jar. Each has a single variant.

| Field | Mustard | Tapenade |
|---|---|---|
| Title | Whole-grain mustard | Olive tapenade |
| Price (JPY, tax-inclusive) | 1,900 | 2,100 |
| SKU | `KIMIE-MUS-200` | `KIMIE-TAP-200` |
| Weight (packed) | measured, e.g. 380 g | measured |
| Track inventory | On, with current stock | On, with current stock |
| Continue selling when out of stock | Off | Off |
| Status | Active | Active |
| **Sales channels** | **Headless** (after §6.8) | **Headless** |

- **The Sales channels row matters:** the Storefront API returns only products published to the channel that issued the token.
- Keep Shopify titles short. Shopify's title appears in checkout and order e-mails, while the site shows Sanity's wording. For other checkout languages, translate titles with Shopify's Translate & Adapt app.
- Add allergen information to the Shopify description too, because it appears in the admin and in order records.

### 6.4 Markets (D2, D3)

1. **Settings → Markets:** Japan is the primary market (JPY). Leave other markets **inactive** until their §5.2 row is cleared.
2. When adding a market later, first check the **currency list offered for that market**. If TWD (or any other currency) is not offered, the market will be charged in a converted currency, and D3 must be revisited for it.
3. For each enabled international market, try to create a **catalog with fixed prices** in local currency ($13 / $14, 12 € / 13 €, NT$400 / NT$440). If fixed catalog prices are not available on the plan, set a **manual exchange rate** with rounding instead, and record the resulting prices in §12's test matrix.
4. **Settings → Languages:** publish English, French, Simplified Chinese and Traditional Chinese, so checkout matches the site's five languages.

### 6.5 Shipping (D4)

**Settings → Shipping and delivery → General shipping rates:**

- Zone **Japan**: rate "送料無料 / Free shipping", price ¥0.
- Each future international zone: rate "Free shipping (EMS)", price 0 in that market's currency, with a processing-time note.
- Set a realistic processing time (for example 2–4 business days) and a local pickup option only if one exists.

### 6.6 Taxes (D8)

**Settings → Taxes and duties:** turn on **all prices include tax** for Japan. Leave international duty and tax options for the tax adviser (§5.1).

### 6.7 Policies and legal pages

**Settings → Policies:** complete the refund, privacy, terms of service, shipping and **legal notice (特定商取引法に基づく表記)** policies. Checkout links to them automatically. The site's footer links (§9.5) will point to the same pages.

### 6.8 Checkout, notifications and the Headless channel

1. **Settings → Checkout:**
   - Customer contact method: e-mail.
   - Company name: optional.
   - Address line 2: optional.
   - Branding (logo, colours): use the Fresh Garden palette from `App.tsx` `THEMES.grove`, `#23734D` and `#E3A52B`.
2. **Settings → Notifications:** brand the order-confirmation e-mail and add Kimie's address under staff order notifications.
3. **Shopify App Store → install "Headless"** → **Create storefront** → **Storefront API**. Copy the **public access token**. Do not copy or store the private token; this plan never uses it.
4. Note the store's `<store>.myshopify.com` domain.
5. Publish both products to the new Headless storefront (§6.3).

### 6.9 Verify the token (developer)

Create `query.json` in a scratch folder (not in the repo):

```json
{ "query": "query @inContext(country: JP, language: JA) { shop { name } products(first: 10) { nodes { title variants(first: 5) { nodes { id sku availableForSale price { amount currencyCode } } } } } }" }
```

Then run:

```bash
curl.exe -s -X POST "https://<store>.myshopify.com/api/2026-07/graphql.json" -H "Content-Type: application/json" -H "X-Shopify-Storefront-Access-Token: <public token>" --data-binary "@query.json"
```

**Exit criterion:** the response lists both products with `availableForSale: true`, prices `1900.0` and `2100.0` in `JPY`, and a variant `id` for each, of the form `gid://shopify/ProductVariant/…`. Keep those two ids for §7.

---

## 7. Phase 1 — Link Sanity products to Shopify (D6)

**Outcome:** each Sanity product carries its Shopify variant id; the storefront knows which Shopify item to price and add to the cart.

### 7.1 Schema field

Add to `studio/schemaTypes/product.ts`, in the **Settings** group:

```ts
defineField({
  name: 'shopifyVariantId',
  title: 'Shopify variant ID',
  description:
    'Links this product to Shopify for price, stock and checkout. Form: gid://shopify/ProductVariant/1234567890. Leave empty to hide the buy button.',
  type: 'string',
  group: 'settings',
  validation: (rule) =>
    rule
      .regex(/^gid:\/\/shopify\/ProductVariant\/\d+$/, {name: 'Shopify variant ID'})
      .warning('Expected gid://shopify/ProductVariant/<number>'),
}),
```

A warning rather than an error, so a product can be published before its Shopify item exists.

### 7.2 Fill in the ids

1. Deploy the Studio: `cd studio`, then `npx sanity deploy`.
2. In the Studio, open each product → **Settings** → paste the variant `id` from §6.9 → **Publish**.

### 7.3 Retire Sanity prices

- PLAN3's hidden `prices` object (`usd`, `jpy`, `eur`, `cny`, `twd`) is **no longer read by anything** once the main page uses Shopify prices (§9.3). Leave the data in place, keep it hidden, and delete the field from the schema after launch.
- Visibility rule from now on: a buy button shows only when the Sanity product is shown **and** Shopify reports the variant `availableForSale` for the buyer's country.

### 7.4 Storefront query and types

In `src/features/products/query.ts`, add `shopifyVariantId` to `STORY_PRODUCTS_QUERY`'s projection. In `types.ts`:

- add `shopifyVariantId?: string` to `CmsProduct`;
- add `variantId?: string` to `StoryProduct`.

In `useStoryProducts.ts`, `toStoryProduct` passes `cms.shopifyVariantId` through. The bundled fallback has no variant id, so without Sanity there is no buy button, which is consistent with D7.

**Exit criterion:** in Vision, `*[_type == "product" && defined(shopifyVariantId)]{ "slug": slug.current, shopifyVariantId }` returns mustard and tapenade with their ids, and `/story`'s `useStoryProducts` result includes `variantId` for both.

---

## 8. Phase 2 — Commerce module

**Outcome:** a `src/features/commerce/` module that knows the buyer's country, fetches Shopify prices for the Sanity-linked variants, and manages one persistent cart. No UI yet beyond what §9 adds.

Code follows the storefront's conventions (double quotes, semicolons, relative or `@/` imports) and the pattern already used by `src/features/products/`: lazily created client, `localStorage` wrapped in `try`, graceful behaviour when unconfigured. The snippets are implementation sketches; the typecheck in §8.8 is the arbiter.

### 8.1 Dependency and environment

```bash
npm install @shopify/storefront-api-client
```

`@shopify/hydrogen-react` (React 18 compatible) was considered. It is not used, because its provider and component layer duplicates the small, explicit hook pattern this codebase already uses, and would add a second way of fetching data.

Add to the root `.env.local` (gitignored) and to Vercel's Production and Preview variables:

```bash
# Public by design: Shopify issues this token for use in browsers.
# Never put the private Storefront token or any Admin API credential in a VITE_ variable.
VITE_SHOPIFY_STORE_DOMAIN=<store>.myshopify.com
VITE_SHOPIFY_STOREFRONT_TOKEN=<public access token>
VITE_SHOPIFY_API_VERSION=2026-07
```

Extend `src/vite-env.d.ts` with the three optional `VITE_SHOPIFY_*` strings.

### 8.2 `src/features/commerce/config.ts`

```ts
const env = import.meta.env;

export const SHOPIFY = {
  storeDomain: env.VITE_SHOPIFY_STORE_DOMAIN?.trim() ?? "",
  publicToken: env.VITE_SHOPIFY_STOREFRONT_TOKEN?.trim() ?? "",
  apiVersion: env.VITE_SHOPIFY_API_VERSION?.trim() || "2026-07",
};

// Kill switch: without both values the site shows no prices and no buy buttons,
// and makes no request to Shopify.
export const isShopifyConfigured =
  /^[a-z0-9-]+\.myshopify\.com$/.test(SHOPIFY.storeDomain) && SHOPIFY.publicToken.length > 0;
```

### 8.3 `src/features/commerce/client.ts`

```ts
import { createStorefrontApiClient, type StorefrontApiClient } from "@shopify/storefront-api-client";
import { SHOPIFY } from "./config";

let client: StorefrontApiClient | null = null;

function getClient(): StorefrontApiClient {
  client ??= createStorefrontApiClient({
    storeDomain: `https://${SHOPIFY.storeDomain}`,
    apiVersion: SHOPIFY.apiVersion,
    publicAccessToken: SHOPIFY.publicToken,
    retries: 1, // one retry on 429 / 503
  });
  return client;
}

/** Runs a Storefront API operation and throws on GraphQL or network errors. */
export async function storefront<T>(operation: string, variables: Record<string, unknown>): Promise<T> {
  const { data, errors } = await getClient().request<T>(operation, { variables });
  if (errors) throw new Error(errors.message ?? "Storefront API request failed");
  if (!data) throw new Error("Storefront API returned no data");
  return data;
}
```

### 8.4 `src/features/commerce/graphql.ts`

```ts
// Language codes verified against the 2026-07 LanguageCode enum.
export const LANGUAGE_CODE = { en: "EN", ja: "JA", fr: "FR", zh: "ZH_CN", "zh-TW": "ZH_TW" } as const;

// Only countries in active Shopify markets are returned, so a Japan-only launch
// (D2) automatically offers Japan only.
export const LOCALIZATION_QUERY = /* GraphQL */ `
  query Localization($language: LanguageCode) @inContext(language: $language) {
    localization {
      country { isoCode }
      availableCountries { isoCode name currency { isoCode } }
    }
  }`;

export const VARIANT_PRICES_QUERY = /* GraphQL */ `
  query VariantPrices($ids: [ID!]!, $country: CountryCode, $language: LanguageCode)
  @inContext(country: $country, language: $language) {
    nodes(ids: $ids) {
      ... on ProductVariant { id availableForSale price { amount currencyCode } }
    }
  }`;

const CART_FIELDS = /* GraphQL */ `
  fragment CartFields on Cart {
    id
    checkoutUrl
    totalQuantity
    cost { subtotalAmount { amount currencyCode } }
    lines(first: 20) {
      nodes {
        id
        quantity
        merchandise { ... on ProductVariant { id availableForSale product { title } } }
        cost { totalAmount { amount currencyCode } }
      }
    }
  }`;

const CART_RESULT = `cart { ...CartFields } userErrors { field message }`;

export const CART_QUERY = /* GraphQL */ `
  query Cart($id: ID!, $country: CountryCode, $language: LanguageCode)
  @inContext(country: $country, language: $language) { cart(id: $id) { ...CartFields } }
  ${CART_FIELDS}`;

export const CART_CREATE = /* GraphQL */ `
  mutation CartCreate($input: CartInput!, $country: CountryCode, $language: LanguageCode)
  @inContext(country: $country, language: $language) { cartCreate(input: $input) { ${CART_RESULT} } }
  ${CART_FIELDS}`;

export const CART_LINES_ADD = /* GraphQL */ `
  mutation CartLinesAdd($cartId: ID!, $lines: [CartLineInput!]!, $country: CountryCode, $language: LanguageCode)
  @inContext(country: $country, language: $language) { cartLinesAdd(cartId: $cartId, lines: $lines) { ${CART_RESULT} } }
  ${CART_FIELDS}`;

export const CART_LINES_UPDATE = /* GraphQL */ `
  mutation CartLinesUpdate($cartId: ID!, $lines: [CartLineUpdateInput!]!, $country: CountryCode, $language: LanguageCode)
  @inContext(country: $country, language: $language) { cartLinesUpdate(cartId: $cartId, lines: $lines) { ${CART_RESULT} } }
  ${CART_FIELDS}`;

export const CART_LINES_REMOVE = /* GraphQL */ `
  mutation CartLinesRemove($cartId: ID!, $lineIds: [ID!]!, $country: CountryCode, $language: LanguageCode)
  @inContext(country: $country, language: $language) { cartLinesRemove(cartId: $cartId, lineIds: $lineIds) { ${CART_RESULT} } }
  ${CART_FIELDS}`;

// Changing the buyer's country re-prices the cart in that market's currency.
export const CART_BUYER_COUNTRY = /* GraphQL */ `
  mutation CartBuyerCountry($cartId: ID!, $countryCode: CountryCode!, $language: LanguageCode)
  @inContext(language: $language) {
    cartBuyerIdentityUpdate(cartId: $cartId, buyerIdentity: { countryCode: $countryCode }) { ${CART_RESULT} }
  }
  ${CART_FIELDS}`;
```

### 8.5 `src/features/commerce/money.ts`

Shopify returns `{ amount: "1900.0", currencyCode: "JPY" }`. Formatting reuses the rules proven in `src/features/products/format.ts`: whole amounts get no decimals, JPY and TWD format through `en-US` so they read `¥1,900` and `NT$400`.

```ts
import type { Lang } from "../../app/i18n";

const LOCALE_FOR_CURRENCY: Record<string, string> = {
  USD: "en-US", JPY: "en-US", TWD: "en-US", EUR: "fr-FR", CNY: "zh-CN",
};

export function formatMoney(money: { amount: string | number; currencyCode: string } | undefined, lang: Lang): string {
  const amount = Number(money?.amount);
  if (!money || !Number.isFinite(amount)) return "";
  const digits = Number.isInteger(amount) ? 0 : 2;
  return new Intl.NumberFormat(LOCALE_FOR_CURRENCY[money.currencyCode] ?? lang, {
    style: "currency",
    currency: money.currencyCode,
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(amount);
}
```

### 8.6 `src/features/commerce/country.ts`

```ts
import type { Lang } from "../../app/i18n";

const COUNTRY_KEY = "ym-country";
const LANGUAGE_DEFAULT: Partial<Record<Lang, string>> = { ja: "JP", en: "US", fr: "FR", "zh-TW": "TW" };

/**
 * Picks the buyer's country from the countries Shopify sells to, in order:
 * the visitor's saved choice, the region in their browser language (fr-CA → CA),
 * the page language's usual country, Shopify's own detected country, then the first available.
 */
export function resolveCountry(available: string[], lang: Lang, detected?: string): string | undefined {
  const allowed = new Set(available);
  const saved = readSaved();
  const browserRegions = (navigator.languages ?? []).map((l) => l.split("-")[1]?.toUpperCase()).filter(Boolean);
  return [saved, ...browserRegions, LANGUAGE_DEFAULT[lang], detected, available[0]].find(
    (c): c is string => !!c && allowed.has(c),
  );
}

export function saveCountry(code: string) {
  try { window.localStorage.setItem(COUNTRY_KEY, code); } catch { /* storage blocked */ }
}

function readSaved(): string | undefined {
  try { return window.localStorage.getItem(COUNTRY_KEY) ?? undefined; } catch { return undefined; }
}
```

### 8.7 `src/features/commerce/CommerceProvider.tsx`

One provider per page (`App` and `StoryPage`), receiving the page language and the variant ids of the products that page shows.

Behaviour:

| Situation | Result |
|---|---|
| Not configured (§8.2) | `status: "off"` — no requests, no prices, no buy buttons |
| Loading prices | `status: "loading"` — buy buttons show but are disabled; no price shown yet |
| Prices loaded | `status: "ready"` — `priceFor(variantId)` returns the formatted local price |
| Any Shopify request fails | `status: "unavailable"` — prices hidden, buttons disabled with the D7 message; Sanity content unaffected |
| Saved cart id no longer valid (expired or completed) | id discarded; the next add creates a new cart |
| A cart mutation returns `userErrors` (for example out of stock) | cart unchanged; `error` holds Shopify's message for the drawer to show |
| Country changed in the drawer | saved, prices re-fetched, cart re-priced with `cartBuyerIdentityUpdate` |

Shape of the context value:

```ts
type CommerceValue = {
  status: "off" | "loading" | "ready" | "unavailable";
  country?: string;
  countries: Array<{ isoCode: string; name: string; currency: string }>;
  setCountry(code: string): void;
  priceFor(variantId?: string): { label: string; available: boolean } | undefined;
  cart: Cart | null;              // CartFields, with amounts left as Shopify strings
  busy: boolean;                  // a cart mutation is in flight; disable repeat clicks
  error?: string;                 // last userErrors message, localised by Shopify
  drawerOpen: boolean;
  openDrawer(): void;
  closeDrawer(): void;
  addToCart(variantId: string, quantity?: number): Promise<void>;  // opens the drawer on success
  setQuantity(lineId: string, quantity: number): Promise<void>;    // 0 removes the line
  checkout(): void;               // window.location.assign(cart.checkoutUrl)
};
```

Implementation notes:

- **Cart id** lives in `localStorage` under `ym-cart-id`, wrapped in `try`/`catch` like `ym-story-products-v1`. Both pages share it, so a cart started on `/story` is still there on `/`.
- **Requests on mount**, in order:
  1. `LOCALIZATION_QUERY` → `resolveCountry`.
  2. In parallel: `VARIANT_PRICES_QUERY` for the page's variant ids, and `CART_QUERY` if a cart id is saved.
- **Language change** re-runs only the queries whose output is language-dependent (the cart, for product titles). Prices depend on country, not language.
- **Double-click safety:** `addToCart` and `setQuantity` return early while `busy` is true.
- **Checkout** is a full-page navigation to `checkoutUrl`. The URL is short-lived and belongs to the cart, so never cache it beyond the cart object.
- **Names in the drawer** come from Sanity where the variant id matches a product on the page, so the drawer speaks the site's language. Otherwise Shopify's `product.title` is used.

### 8.8 Verify

1. `npm run typecheck` passes with `src/features/commerce/**` included (it is already inside `src/features/**/*`).
2. With `.env.local` pointing at the store: in DevTools, a `POST https://<store>.myshopify.com/api/2026-07/graphql.json` succeeds with no CORS error, which confirms browser access with the public token.
3. With the Shopify variables removed: no request to `myshopify.com`, and no buy buttons.

---

## 9. Phase 3 — Buy buttons and cart drawer

**Outcome:** every purchase action on `/` and `/story` works; one cart is shared by both pages.

### 9.1 Prerequisite: variant ids on the main page

The main page does not read Sanity yet (PLAN3 §8.5 is still pending), so it has no `variantId`s. Choose one:

- **Preferred:** complete PLAN3 §8.5–8.7 first, so `Lineup` renders Sanity products that carry `variantId`.
- **Interim:** call `useStoryProducts(lang)` inside `App()` and use only `products.mustard.variantId` and `products.tapenade.variantId`. It hits the same cached query, so there's no extra request after the first visit to either page.

### 9.2 Mount the provider

- `src/app/App.tsx` `App()`: wrap the page in `<CommerceProvider lang={lang} variantIds={[…]}>`, inside `UICtx.Provider`.
- `src/app/story/StoryPage.tsx`: wrap the returned tree in `<CommerceProvider lang={lang} variantIds={[products.mustard.variantId, products.tapenade.variantId]}>`.
- Render one `<CartDrawer />` per page, as the last child of the provider (§9.5).

### 9.3 Main page (`src/app/App.tsx`)

| Location (main @ `239da23`) | Today | Change |
|---|---|---|
| `:308` nav "Order Now" | `href="#buy"` (scrolls to the hero) | `href="#lineup"`; if `cart.totalQuantity > 0`, `preventDefault()` and `openDrawer()` instead |
| Nav, beside "Order Now" | — | New cart button: `ShoppingBag` icon with a count badge when `totalQuantity > 0`; `aria-label={T.cart.open}`; opens the drawer |
| `:446` hero "Add to Cart" | `href="#"` | Becomes a `<button>` that calls `addToCart(mustardVariantId)`, since the hero photograph shows the mustard jar. Disabled unless `priceFor(id)?.available` |
| `:543` `JarInfo` price (`item.price`) | i18n string | `priceFor(variantId)?.label`. While loading or unavailable, render nothing in that slot (D7); keep `item.size` |
| `:547` `JarInfo` "Add to Cart" | `href="#buy"` | `<button>` that calls `addToCart(variantId)`. Label: `T.cart.adding` while `busy`, `T.cart.soldOut` when not `available`; disabled in both cases and when `status !== "ready"` |
| `:889` buy strip "Order Now" | `href="#"` | Same behaviour as the nav "Order Now" |
| `:371` `<section id="buy">` | Hero section id | No longer targeted; leave the id or remove it |
| `:945` footer "Privacy Policy", "Shipping Info" | `href="#"` | Link to Shopify's policy URLs (§9.6). Add a third link for the legal notice (§5.1) |

Keep every button visually identical to the anchor it replaces: same classes and inline styles, plus `type="button"`, and `disabled` styling via `opacity: 0.5; cursor: not-allowed`.

### 9.4 `/story` (`src/app/story/StoryPage.tsx`, `story.css`)

| Location | Change |
|---|---|
| Header tools (`.ks-header-tools`, beside the language selector) | Cart button with count badge, styled like `.ks-menu-button`; opens the drawer |
| Product card (`.ks-product-title`, which shows name and size) | Add the Shopify price under the size when `priceFor(product.variantId)` is available |
| Product card, below "Choose this flavor" | New full-width "Add to Cart" button (reuse `translations[lang].lineup.cta`), class `ks-button ks-button-gold`, calling `addToCart(product.variantId)`. "Choose this flavor" keeps its current behaviour |
| Closing section CTA (`href={#jar-${flavor}}`) | Unchanged |

### 9.5 `src/features/commerce/CartDrawer.tsx`

One component, two skins: `skin="grove"` on the main page, using `--ym-*` variables through inline styles like the rest of `App.tsx`; `skin="story"` on `/story`, using new `.ks-cart*` rules in `story.css`.

Content, top to bottom:

1. Title (`cart.title`) and a close button (`cart.close`).
2. **Country selector** — only when Shopify offers more than one country (none at a Japan-only launch). Changing it calls `setCountry`.
3. Lines: product name (Sanity name when known), quantity stepper (− / number / +, with `cart.decrease` and `cart.increase` labels), line total (`formatMoney`), and a remove button.
4. Empty state (`cart.empty`) with a link to the jars (`#lineup` or `#jars`).
5. `error` from the provider, if any, in an `aria-live="polite"` region.
6. Subtotal (`cart.subtotal`) and the shipping and tax note (`cart.shippingNote`, per D4 and D8).
7. **Checkout** button (`cart.checkout`), disabled while `busy`, when the cart is empty, or when `status !== "ready"`.

Accessibility and behaviour:

- `role="dialog"`, `aria-modal="true"`, `aria-labelledby` pointing at the title.
- Focus moves to the close button on open and returns to the button that opened the drawer on close.
- Escape and a click on the backdrop close the drawer.
- Body scroll is locked while open.
- The drawer slides from the right. With `prefers-reduced-motion: reduce` it appears without animation.

### 9.6 Policy links

Read the policy URLs from the Storefront API rather than hard-coding paths:

```graphql
query Policies @inContext(language: JA) {
  shop {
    privacyPolicy { title url }
    refundPolicy { title url }
    shippingPolicy { title url }
    termsOfService { title url }
  }
}
```

Fetch it once in the provider and expose `policies` in the context. Footer links fall back to hidden when a policy is missing.

The Japanese legal notice (特定商取引法に基づく表記) must be reachable from every page. If it is not returned by this query, publish it as a page in Shopify or as a static page on the site, and link it from both footers.

---

## 10. Phase 4 — Security and privacy

| Topic | Rule |
|---|---|
| Tokens | Only the Storefront API **public** token reaches the browser. Before every release, search `dist/` for the Shopify Admin and app token prefixes `shpat_`, `shpca_`, `shppa_` and `shpss_`; none may appear. |
| Payment data | None handled. Card entry, 3-D Secure and fraud screening happen on Shopify's checkout, which keeps the site out of payment-card compliance scope. |
| Redirect | Before `window.location.assign`, confirm `checkoutUrl` parses as `https:` (defence in depth against a malformed response). |
| Browser storage | `ym-cart-id` and `ym-country` hold no personal data. Mention both in the privacy policy together with Shopify's checkout cookies. |
| Cookie consent | Not needed for a Japan-only launch. Required before enabling EU or UK markets (§5.2). |
| Content-Security-Policy (if added later) | `connect-src https://<store>.myshopify.com https://59rfnf2c.apicdn.sanity.io`; `img-src 'self' https://cdn.sanity.io data:`. Checkout is a top-level navigation, so it needs no CSP entry. |
| Rate limits | Public-token Storefront API limits apply per buyer IP; the provider makes 2–3 requests per page view and one per cart action. |
| Kill switch | Remove `VITE_SHOPIFY_STOREFRONT_TOKEN` in Vercel and redeploy: prices and buy buttons disappear and nothing else changes. To stop sales without a deploy, set the Shopify products to Draft or remove them from the Headless channel. |

---

## 11. Phase 5 — Copy in five languages

Add one block to the `Translations` interface in `src/app/i18n.ts` and fill it for `en`, `ja`, `fr`, `zh`, `zh-TW`. `StoryPage` already imports `translations`, so both pages read `t.cart` / `T.cart` and nothing is duplicated in `story/copy.ts`.

```ts
cart: {
  title: string; open: string; close: string; empty: string;
  subtotal: string; checkout: string; remove: string;
  increase: string; decrease: string; quantity: string;
  country: string; shippingNote: string;
  unavailable: string; soldOut: string; adding: string; error: string;
};
```

| Key | en | ja |
|---|---|---|
| `title` | Your cart | カート |
| `open` | Open cart | カートを開く |
| `close` | Close cart | カートを閉じる |
| `empty` | Your cart is empty. | カートは空です。 |
| `subtotal` | Subtotal | 小計 |
| `checkout` | Checkout | ご購入手続きへ |
| `remove` | Remove | 削除 |
| `increase` | Add one | 1つ増やす |
| `decrease` | Remove one | 1つ減らす |
| `quantity` | Quantity | 数量 |
| `country` | Shipping to | お届け先 |
| `shippingNote` | Shipping included. Tax included for Japan. | 送料込み・税込み |
| `unavailable` | Ordering is paused right now. Please try again later. | 現在ご注文を受け付けておりません。しばらくしてからお試しください。 |
| `soldOut` | Sold out | 売り切れ |
| `adding` | Adding… | 追加中… |
| `error` | Something went wrong. Please try again. | 問題が発生しました。もう一度お試しください。 |

- French, Simplified Chinese and Traditional Chinese are written in the same pass and checked by a native speaker before launch.
- Shopify's own `userErrors` messages (for example, not enough stock) are shown as returned, since they are already localised by `@inContext(language)`.
- If D2 or D4 changes, also edit the existing FAQ shipping answer, `hero.priceNote`, `buyStrip.priceNote` and `twoJar.shipping` in all five locales.

---

## 12. Phase 6 — Testing (Shopify Payments test mode)

Run on a Vercel preview deployment with the Shopify variables set and **test mode on** (§6.2). Test card numbers are listed in the Shopify Payments settings.

### 12.1 Cart and checkout flows

| # | Scenario | Pass when |
|---|---|---|
| 1 | `/`, English: add mustard from `JarInfo` | Drawer opens with 1 × Whole-grain mustard, `¥1,900`, subtotal `¥1,900` |
| 2 | Add tapenade; press + on mustard | 2 × mustard, 1 × tapenade; subtotal `¥5,900` |
| 3 | Press − to 0 on tapenade | Line removed |
| 4 | Reload `/`, then open `/story` | The same cart appears on both pages, with a matching count badge |
| 5 | `/story`: "Add to Cart" on a product card | Line added; "Choose this flavor" still only highlights |
| 6 | Double-click "Add to Cart" quickly | Quantity increases by exactly 1 |
| 7 | Checkout → pay with a successful test card | Order appears in Shopify admin; confirmation e-mail arrives; shipping ¥0; tax shown as included |
| 8 | Checkout with a declined test card | Checkout shows the decline; no order is created |
| 9 | After checkout, return to the site | The completed cart is not reused; the next add starts a new cart |
| 10 | Replace `ym-cart-id` in `localStorage` with a garbage id, then reload | No error shown; the next add creates a new cart |
| 11 | Set tapenade inventory to 0 in Shopify | Button reads "Sold out" and is disabled; adding via an old tab shows Shopify's error in the drawer |
| 12 | Block `*.myshopify.com` in DevTools | Prices hidden, buttons disabled, `cart.unavailable` shown; all Sanity content still renders |
| 13 | Remove the Shopify variables and rebuild | No buy buttons and no request to `myshopify.com` |
| 14 | Run 1–7 in `ja`, `fr`, `zh`, `zh-TW` | Drawer copy localised; checkout language follows the page; prices still JPY (Japan-only market) |
| 15 | Both main-page themes (Fresh Garden, Wabi-Sabi) | Drawer and buttons legible in each |
| 16 | 375 px wide screen | Drawer fills the width; checkout button reachable without horizontal scrolling |
| 17 | Keyboard only | Tab reaches cart button, lines, stepper and Checkout; Escape closes the drawer and focus returns to the opener |
| 18 | `prefers-reduced-motion: reduce` | Drawer appears without sliding |
| 19 | Footer policy links on both pages | Open the correct Shopify policy pages; legal notice reachable |
| 20 | Build hygiene | `npm run typecheck` and `npm run build` pass; `dist/` contains no Admin token prefixes (§10) |

### 12.2 Per international market (repeat when enabling each)

| Check | Pass when |
|---|---|
| Country selector offers the new country | Selecting it re-prices lines in the market currency (e.g. `$13`) |
| Fixed prices or rounding (D3) | Prices equal the agreed table exactly |
| Checkout | Currency, shipping rate and tax or duty messaging correct for that country |
| Compliance | That country's row in §5.2 is signed off |

---

## 13. Phase 7 — Launch (Japan)

### 13.1 Checklist

1. Every row of §5.1 is confirmed, with the permit, legal-notice text and policies in place.
2. Shopify: Basic plan active; Shopify Payments verified; **test mode off**; only the Japan market active.
3. Vercel:
   - the `VITE_SHOPIFY_*` (and PLAN3 `VITE_SANITY_*`) variables are set for Production, and the site is redeployed;
   - the team is on a plan that permits commercial use, since Vercel's Hobby plan is for non-commercial projects.
4. The public address (`kimie-atelier.vercel.app` or the custom domain) is reachable without a Vercel login.
5. §12.1 passes on the production deployment. Scenario 7 uses a **real card for one jar**; refund that order from the admin afterwards.
6. Kimie has walked through fulfilment once: open the order → mark as fulfilled → add the EMS or domestic tracking number → the customer is notified automatically.

### 13.2 Rollback

| Situation | Action |
|---|---|
| Stop selling immediately, no deploy | Set both Shopify products to **Draft** (buttons show "Sold out"/disabled within a page load) |
| Remove commerce from the site | Remove `VITE_SHOPIFY_STOREFRONT_TOKEN` in Vercel → Redeploy |
| Bad code release | Vercel → Deployments → previous production deployment → Instant Rollback |

---

## 14. Operations after launch

| Task | Where | Notes |
|---|---|---|
| Fulfil orders | Shopify admin or Shopify mobile app | Add tracking; Shopify e-mails the customer |
| Change price | Shopify (product price; market catalogs for international) | Site updates on next page load; **no longer edited in Sanity or `i18n.ts`** |
| Restock or mark sold out | Shopify inventory | Site reflects `availableForSale` |
| Change names, notes, photos | Sanity Studio (PLAN3) | Unchanged workflow |
| Refunds | Shopify order → Refund | Card fees are generally not returned on refunds |
| US shipments (if enabled) | FDA Prior Notice system, **before each shipment** | Per §5.2; budget time per order |
| API version | `VITE_SHOPIFY_API_VERSION` | Versions are supported ≥ 12 months; `2026-07` is accessible until 2027-07-16. Move to the newest stable version each spring, run §12.1, redeploy |
| Order records | Shopify admin → Orders → Export | Monthly CSV export for bookkeeping |

---

## 15. Effort

Engineering only. Store administration by the owner and the compliance work in §5 are not included and can take longer than the code.

| Phase | Section | Hours |
|---|---|---:|
| 0 — Store set-up: developer part (products, Headless channel, token check) | §6 | 3–5 |
| 1 — Sanity link | §7 | 1–2 |
| 2 — Commerce module | §8 | 10–16 |
| 3 — Buy buttons and cart drawer, two skins | §9 | 12–20 |
| 4 — Security checks | §10 | 1–2 |
| 5 — Copy in five languages (excluding native review) | §11 | 2–4 |
| 6 — Testing | §12 | 6–10 |
| 7 — Launch | §13 | 2–3 |
| Documentation (`CLAUDE.md`, owner guide for fulfilment) | — | 1–2 |
| **Total** | | **38–64** |

If PLAN3 §8.5 (main page reads Sanity) is done first instead of using the §9.1 interim, add its 9–14 hours from PLAN3 §15.

---

## 16. Costs

Japan pricing verified 2026-09-15; recheck before subscribing.

### 16.1 Recurring

| Item | Cost |
|---|---|
| Shopify Basic | ¥4,850/month billed monthly, or ¥3,650/month billed annually |
| Sanity | $0 (Free plan, PLAN3) |
| Vercel | A plan permitting commercial use (Pro, from $20/month per member at the time PLAN.md was written) |
| Shopify apps (Headless channel, Translate & Adapt) | Free at the time of writing — confirm on install |

### 16.2 Per order (Shopify Payments, Basic)

| Order | Domestic card or JCB (3.55%) | International card or AMEX (3.9%) |
|---|---:|---:|
| 1 × mustard, ¥1,900 | ¥67 | ¥74 |
| 1 × tapenade, ¥2,100 | ¥75 | ¥82 |
| Both jars, ¥4,000 | ¥142 | ¥156 |

Plus, when selling in other currencies, Shopify's **currency conversion fee** (Shopify lists 1.5% for US stores and 2% for many other regions; confirm the figure for a Japan-based store). With free shipping (D4), the **shipping cost per parcel** comes out of each order's margin; get Japan Post quotes for domestic and EMS parcels before fixing prices.

### 16.3 One-time or per-market (if exporting)

| Item | Note |
|---|---|
| FDA food facility registration | No FDA fee, but a foreign facility must name a US agent, usually a paid service |
| Labelling for export | Translated labels, and US-format allergen and nutrition labelling where required |
| Professional advice | Tax accountant and import advisers for §5 |

---

## 17. Risks

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Compliance work delays launch | High | High | Japan-only launch (D2); open other countries one at a time |
| Site price and checkout price differ | Medium without D7 | High (customer trust) | Show only Shopify prices; hide prices when unavailable; remove the `i18n.ts` price strings after launch |
| A market currency (TWD, CNY) not offered | Medium | Medium | Check in §6.4 before building; fall back per D3 |
| Per-shipment US prior notice is operationally heavy | High if US enabled | Medium | Decide on US only after timing one real prior-notice filing |
| Food shipments refused at the destination | Medium | High (loss plus refund) | §5.2 sign-off per country; remove promises from copy where not cleared |
| Sanity product has no Shopify id, or the Shopify product is removed | Medium | Low | Buy button hidden automatically; Studio warns on a malformed id |
| Storefront API version reaches end of support | Certain, yearly | Medium | Yearly version bump in §14 |
| Shopify or network outage | Low | Medium | "Unavailable" state; content still renders; no false prices |
| Third-party gateway fees added by accident | Low | Low | Shopify Payments only on Basic |
| Hobby-plan hosting used commercially | Medium | Medium | Move to a Vercel plan permitting commercial use before launch (§13.1) |

---

## 18. Out of scope

- Customer accounts and order history on the site (Shopify's checkout handles guest checkout).
- Subscriptions, bundles as separate products, gift wrapping, product reviews.
- Discount codes built into the site. Codes created in the Shopify admin still work at checkout without code changes.
- Wholesale (B2B), point of sale, marketing pixels and analytics.
- Abandoned-cart e-mails beyond what Shopify provides by default.
- Selling the preserved lemon (D9).
- Redesigning the main page (PLAN3 §8.5 is a separate plan).

---

## 19. Sources

Verified 2026-09-15.

- [Shopify pricing — Japan](https://www.shopify.com/jp/pricing) — plan prices in JPY; Shopify Payments card rates; third-party transaction fees
- [Shopify pricing](https://www.shopify.com/pricing) — plan line-up (Basic, Grow, Advanced, Plus)
- [Storefront API reference](https://shopify.dev/docs/api/storefront) — public and private token headers, endpoint format
- [Build a cart with the Storefront API](https://shopify.dev/docs/storefronts/headless/building-with-the-storefront-api/cart/manage) — cart mutations, `checkoutUrl`, `@inContext`
- [Getting started with the Storefront API](https://shopify.dev/docs/storefronts/headless/building-with-the-storefront-api/getting-started) — Headless channel and access tokens
- [API versioning](https://shopify.dev/docs/api/usage/versioning) — `2026-07` latest stable; quarterly releases; ≥ 12-month support
- [LanguageCode enum (2026-07)](https://shopify.dev/docs/api/storefront/latest/enums/LanguageCode) — `EN`, `JA`, `FR`, `ZH_CN`, `ZH_TW`
- [`@shopify/storefront-api-client`](https://www.npmjs.com/package/@shopify/storefront-api-client) — `createStorefrontApiClient`, `request`; private tokens server-only
- [`@shopify/hydrogen-react`](https://www.npmjs.com/package/@shopify/hydrogen-react) — 2026.4.3, React `^18.3.1` peer
- [Setting up currencies for markets](https://help.shopify.com/en/manual/markets/customizations/local-currencies) — Shopify Payments or Adyen required; manual rates; rounding; conversion fees
- [Set product prices by country](https://help.shopify.com/en/manual/markets/pricing/product-prices-by-country) and [catalogs for markets](https://help.shopify.com/en/manual/markets/customizations/catalogs) — catalog currency; manual prices override adjustments
- [Sanity Connect for Shopify — reference](https://www.sanity.io/docs/apis-and-sdks/sanity-connect-for-shopify-reference) — one-way sync; default-currency prices only
- [FDA: Filing prior notice of imported foods](https://www.fda.gov/industry/prior-notice-imported-foods/filing-prior-notice-imported-foods) and [food facility registration](https://www.fda.gov/food/guidance-regulation-food-and-dietary-supplements/registration-food-facilities-and-other-submissions) — prior notice for international mail; registration for manufacturers
