# Commerce build — progress board

Implementation of [PLAN-stripe-and-shippo.md](../PLAN-stripe-and-shippo.md), split into parallel tracks, one subagent each. Every track keeps its own progress file; the integrator (main session) keeps this board and merges finished tracks.

- **Integration branch:** `feat/commerce-stripe-shippo` (from `main`). Each track works on its own worktree branch and is merged here after review. `main` is updated only after the integrated result is reviewed.
- **Started:** 2026-09-15.
- **Business location:** ships from **Kanagawa**, Japan (owner, 2026-09-15). Do not write "Ehime" in new copy. Changing the existing FAQ copy and the plan files is not in any track's scope.
- **Launch backlog:** [backlog-launch.md](backlog-launch.md) — 13 WWA items for the work left before going live (2026-09-16).

## Tracks

| Track | File | Plan sections | Agent estimate (§18.1) | Status |
|---|---|---|---:|---|
| A — Sanity commerce schema | [track-a-sanity.md](track-a-sanity.md) | §7.1–7.2 | 0.5–1 h | **Done**, merged 2026-09-15 (`99bfb89`); Studio requests applied by integrator |
| B — Server and API | [track-b-server.md](track-b-server.md) | §6.3 (config only), §8, §9, §10 | 3–6 h | **Done**, merged 2026-09-15 after integrator review; untested against real Stripe, Sanity or Shippo |
| C — Storefront, cart, copy | [track-c-storefront.md](track-c-storefront.md) | §11.1–11.5, §14 | 3.5–6 h | **Done**, merged 2026-09-15; verified against the dev mock only; fr/zh/zh-TW copy awaits native review |
| D — Legal pages | [track-d-legal.md](track-d-legal.md) | §11.6 | 0.5–1 h | **Done**, merged 2026-09-15; all owner and adviser values are placeholders |

## Integration log

| Date | Event |
|---|---|
| 2026-09-15 | Tracks A–D started from `114193d` |
| 2026-09-15 | B, C, D interrupted by a usage limit mid-task; resumed from their worktrees with uncommitted work intact |
| 2026-09-15 | Track A merged. Integrator applied its requests in `studio/sanity.config.ts`: Stock list item; stock documents can't be created, deleted or duplicated in the Studio |
| 2026-09-15 | Contract note to Track B: `sku` and `packedWeightGrams` may be empty on a published product that isn't for sale; `isForSale` must require both |
| 2026-09-15 | Track B finished: typecheck, build and a credential-free smoke check pass. Integrator review of checkout, fulfilment, webhook and reconcile found no blocking issues; contract clarifications recorded above and relayed to Track C; `CLAUDE.md` notes the `.js` import rule and the runtime use of `localize.ts`/`query.ts` |
| 2026-09-15 | Review notes to verify on a preview deploy: (1) `SITE_URL` must equal the exact origin buyers use — a `www.` variant or the production `*.vercel.app` alias gets 403 from `/api/checkout`; (2) `.js` relative imports load under Vercel's Node runtime; (3) `getDocument("fulfilment.<id>")` works with the `published` perspective on a real dataset; (4) `@types/node` is 26 while Vercel runs Node 22 — harmless for the APIs used; (5) two simultaneous webhook deliveries can still create two Shippo orders with the same order number (known, rare) |
| 2026-09-15 | Track D finished and merged. The site saves no language preference, so legal pages read `?lang=`, then the browser's languages, then English; footer-link format relayed to Track C. Owner must fill every placeholder (listed in Track D's handoff notes) and confirm "ships within Japan only" against the current FAQ copy, which mentions international shipping |
| 2026-09-15 | `.claude/launch.json` is tracked; tracks must not commit changes to it and should run dev servers from the shell |
| 2026-09-15 | Integration build: `npm ci` in the main checkout failed with EPERM because a dev server started outside this build held `node_modules/@esbuild/win32-x64/esbuild.exe`, leaving `node_modules` half-deleted. Repaired with `npm install` (lockfile unchanged); typecheck and build then passed with A, B and D merged. Lesson: stop dev servers in the main checkout before `npm ci`, or use `npm install` |
| 2026-09-15 | Track C finished and merged. Integrator review: dev mock gated by `import.meta.env.DEV` and absent from `dist/`; checkout redirect accepts only `https://checkout.stripe.com/` (or the mock's own order page in dev). `src/main.tsx` conflict resolved by keeping both branches: `/story` → `/order/complete` → `/legal/*` → main page |
| 2026-09-15 | **Integrated result verified** on `feat/commerce-stripe-shippo` with all four tracks merged: `npm run typecheck` (both configs) and `npm run build` pass; fresh `dist/` has no mock code and no secret prefixes; dev server with `?commerce=mock`: main page Add to Cart opens the drawer (Checkout, Subtotal), `/order/complete` paid state shows `KJ-MOCK-0001`, `/legal/privacy` lists `ym-checkout-lang`, footer links carry `?lang=`, no console errors. Not verified: anything against real Stripe, Sanity or Shippo |
| 2026-09-15 | Track C's request applied: privacy page (ja, en) now lists sessionStorage `ym-checkout-lang`. Deferred: widening `tsconfig.json` `include` to `App.tsx`/`StoryPage.tsx` (7 pre-existing errors: missing `three` types, CSS side-effect imports) |
| 2026-09-15 | `/story` checked against PLAN-stripe-and-shippo §11.3 and D11 with the dev mock: header cart button; catalog prices (¥1,900 / ¥2,100) under each size; gold Add to Cart per card with "Choose this flavor" unchanged; story-skin drawer; `?cart=open` opens the drawer (focus on Close, scroll locked, parameter removed); `unavailable` hides prices, disables both buttons and shows the paused note; `off` removes the cart button and Add to Cart; Checkout from `/story` reaches `/order/complete` paid (`KJ-MOCK-0001`), clears `ym-cart-v1` and keeps the language. `/api/checkout` accepts `/story` as the return path. No gaps found. Note: Sanity CORS must list every origin that serves `/story` (test port 5176 was not listed, so `/story` fell back to bundled copy) |
| 2026-09-16 | `vercel dev` failed with Vite "Failed to parse source for import analysis" on `index.html`: the catch-all SPA rewrite sent `/src/*.tsx`, `/@vite/client` and `node_modules` requests to `index.html`. `vercel.json` rewrite now skips `/api/`, `/@…`, `node_modules/`, `src/` and any path with a file extension (`3284170`); verified on the running `vercel dev` (modules served as `text/javascript`, `/`, `/story`, `/order/complete`, `/legal/privacy` still `text/html`) and against 17 sample paths. Production unaffected (built files are served before rewrites) — still to confirm on a preview deploy |
| 2026-09-16 | `/api/catalog` returned `{"enabled":false}` under `vercel dev` although `.env.local` held every required key: the Vercel CLI dev server loads function variables from the root `.env` (falling back to the project Development variables), not `.env.local`. Owner to put the server keys in a root `.env` (gitignored) and restart `vercel dev`. Documented in `CLAUDE.md` |
| 2026-09-16 | First real test payment (`KJ-260915-2664B8`, 01:07 CST) was paid in Stripe but not fulfilled: in PowerShell the unquoted `stripe listen --events a,b,c` reached the CLI as one space-joined name, which it rejected ("isn't a valid event"), so it forwarded nothing. Checked: unsigned POST to `/api/stripe-webhook` returns 400 (configured), no `fulfilment.*` documents, stock unchanged at 2/2. The 01:10 `websocket: close sent` error was an unrelated idle disconnect. Recovery: restart `stripe listen` without `--events`, then `stripe events resend <evt id>` (resends to the CLI's local listener). PowerShell pitfall added to `CLAUDE.md` |
| 2026-09-16 | CLI preview deployment `atelier-product-page-gz8ltd60n-samuelcychan-team.vercel.app` (03:05 CST) checked: builds all five functions; `/api/catalog` returns `{"enabled":false}` (no Preview env vars yet), so **the `.js` relative imports load under Vercel's Node runtime** (review note 2 confirmed); `/` and `/story` serve the SPA, `/src/main.tsx` is 404 as expected in a build; the unique preview URL opened without a Vercel login. CLI deployments have no Git branch alias, so a stable preview `SITE_URL` needs a Git-pushed branch URL (read it after the first build — the untruncated label would be 70 characters, over Vercel's 63 limit) or a `vercel alias` |
| 2026-09-19 | Backlog item 1 (preview shows real prices) **verified done** on deployment `n0x6j6d0a`: `/api/catalog` returns `enabled:true` with both jars for sale at ¥1,900 / ¥2,100; `/` and `/story` show prices with Add to Cart enabled; `/story` reports `data-products-source="cms"`; no console errors; `vercel env ls preview` lists all seven variables (`VITE_SANITY_*` now Production + Preview) |
| 2026-09-19 | Backlog item 2 **partly done**: order `KJ-260916-E0C41B` (tapenade ×1, ¥2,100, paid 2026-09-16 01:56 UTC) was created on the branch preview — its Stripe session success/cancel URLs are the branch address, started from `/story` — fulfilled with one `fulfilment.*` document and `stock-tapenade` 2 → 1, with no `stripe listen` running. Remaining: purchase from `/`, declined card, expired session, event replay, `price_changed`, `insufficient_stock`, sold-out, and the results table |
| 2026-09-19 | Declined-card scenario **passed** on the preview (15:10 UTC): payment intent `pi_3UHPxEE…` ¥1,900 → `requires_payment_method` with `card_declined`/`generic_decline`; charge `failed`, `paid:false`; session `cs_test_a171WramWH…` `unpaid`; **no** `fulfilment.*` document created (count stayed 2) and stock unchanged (mustard 1, tapenade 1). That session stays `open` until ~31 minutes after creation, so it also serves as the expired-session check |
| 2026-09-19 | Event-replay (idempotency) test **passed** on the preview: `stripe events resend evt_1UFzp0… --webhook-endpoint=we_1UG1SG…` re-delivered the first order's `checkout.session.completed`; Vercel logs show `POST /api/stripe-webhook` at 15:28 UTC, after which the `fulfilment.*` count stayed 2 and both stock documents kept their earlier `_updatedAt` (2026-09-15 / 2026-09-16). No second order, no second decrement |
| 2026-09-19 | Expired-session test **passed**: session `cs_test_a171WramWH…` (the declined attempt) reached `status: "expired"`, `payment_status: "unpaid"` at 15:41 UTC — 31 minutes after creation, matching `expires_at` from `/api/checkout`. Stripe emitted `checkout.session.expired`, which the webhook ignores; `fulfilment.*` count stayed 2 and stock was unchanged |
| 2026-09-19 | Guard tests on the preview **passed**, none needing a card: stock 0 → catalog `available:false`, `/story` shows a disabled "Sold out" for mustard while tapenade stays buyable, and checkout refuses `insufficient_stock … available:0`; stock 1, asking 2 → `available:1`; stale price 1800 → `price_changed … unitAmount:1900`; `Origin: https://example.com` → HTTP 403. Browser: a 2-jar cart was reduced to 1 on Checkout with the "adjusted your cart" message, subtotal ¥1,900, no Stripe redirect. `stock-mustard` restored to 1 |

## Preview test results (PLAN §15.1, branch preview, 2026-09-19/20)

All run against `https://atelier-product-page-git-feat-commerce-62a5ef-…vercel.app` in Stripe test mode. Card entry was done by the owner; everything else was checked from the API, the browser, Vercel logs and Sanity.

| # | Scenario | Evidence | Result |
|---|---|---|---|
| 1 | Purchase from `/story` | Session `cs_test_a1GliJ…`, ¥2,100 paid; order `KJ-260916-E0C41B`; `stock-tapenade` 2 → 1 | Pass |
| 2 | Purchase from `/` | Session `cs_test_a1ZKdwxs…`, ¥1,900 paid, cancel URL `/?cart=open`; order `KJ-260919-28B46F`; `stock-mustard` 1 → 0 | Pass |
| 3 | Declined card | PaymentIntent `requires_payment_method` (`card_declined`), charge `failed`; no record, stock unchanged | Pass |
| 4 | Expired session | `status: expired`, `payment_status: unpaid` 31 min after creation; `checkout.session.expired` ignored; no record | Pass |
| 5 | Duplicate event replay | `stripe events resend` → Vercel log `POST /api/stripe-webhook`; record count and stock unchanged | Pass |
| 6 | Sold out (stock 0) | Catalog `available:false`; `/story` shows disabled "Sold out"; checkout refused `insufficient_stock … available:0` | Pass |
| 7 | Not enough stock (want 2, have 1) | API `insufficient_stock … available:1`; drawer cut the cart to 1 with the "adjusted your cart" message, no Stripe redirect | Pass |
| 8 | Price changed mid-cart | Price 2100 → 2200 while a cart was open; checkout refused; drawer showed ¥2,200 and "A price has changed."; price restored | Pass |
| 9 | Request from another origin | `Origin: https://example.com` → HTTP 403 | Pass |
| 10 | Functions on Vercel | All five functions build and run; `.js` import extensions load | Pass |

**Not covered here:** live-mode payments, the daily reconcile cron (production only), Shippo (path undecided), and anything needing real legal or compliance sign-off.

## Security review (PLAN §13, 2026-09-20)

Independent pass over `api/`, `server/`, `src/features/commerce/`, `vercel.json`, the Sanity project and the Vercel project. Every rule was confirmed against the running preview, the live Sanity API and the Vercel configuration, not against the code alone.

**Result: no high-severity finding.** Six findings: two medium, four low. One is fixed in this commit; the rest are configuration actions listed below.

### §13 rules, as checked

| Rule | How it was checked | Result |
|---|---|---|
| Secrets | Fresh `npm run build`, then searched `dist/` for `sk_live_`, `sk_test_`, `rk_live_`, `whsec_`, `shippo_*` and for the literal value of every variable in the root `.env`. Only `VITE_SANITY_PROJECT_ID`, `VITE_SANITY_DATASET` and `VITE_SANITY_API_VERSION` appear, which are public identifiers. `git grep` and `git log -S` for key patterns match documentation only; `.env*` is gitignored | Pass |
| Payment data | No card field in the repo; the only external origin the buyer is sent to is `https://checkout.stripe.com/` | Pass |
| Prices | `api/checkout.ts:69` compares the browser's `unitAmount` with Sanity's and refuses on mismatch; line items are built from `item.jpy`, never from the request | Pass |
| Checkout endpoint | Live probes against the preview: no `Origin` → 403; foreign origin → 403; lookalike host `…vercel.app.evil.example` → 403; `text/plain` → 415; 9 KB body → 400; 3 lines → 400; quantity 11 → 400; unknown `lang` → 400; unknown slug → 409 | Pass |
| Stripe webhook | Unsigned POST → 400 "Invalid signature". The signature is checked on the raw body before anything else, and the handler re-reads the Session from Stripe rather than trusting the event body | Pass |
| Shippo webhook | Not implemented; `SHIPPO_WEBHOOK_TOKEN` is read in `server/env.ts` and unused. Correct — Shippo is gated behind item 7 | N/A |
| Cron | `Authorization: Bearer` compared with `timingSafeEqual`, and an unset secret never matches. Live: 401 with no header and with a wrong bearer | Pass, but see F1 |
| Redirects | Server rejects a Session URL not starting with `https://checkout.stripe.com/` (`api/checkout.ts:115`); the client re-checks before `location.assign` (`api.ts:130`). `returnPath` is limited to `/` and `/story` and anything else silently becomes `/` — confirmed live with `returnPath: https://evil.example` | Pass |
| Personal data | The three `fulfilment.*` documents hold only `orderNumber`, `paidAt`, `oversold` and lines of `slug`/`sku`/`quantity` — no name, address, phone or e-mail. An anonymous query for `*[_id in path("fulfilment.**")]` returns `[]`, so the log needs a token, while `stock` and `product` are public (public dataset, by design). Error paths log messages only, and `server/shippo.ts` deliberately drops Shippo's response body because it can echo the address | Pass |
| Browser storage | `ym-cart-v1` holds slug and quantity only, `ym-checkout-lang` a language code; both are named in the privacy pages | Pass |
| Cookie consent | The site sets no cookies. Note: Google Fonts is fetched from `fonts.googleapis.com` on every page, so the buyer's IP reaches Google — name it in the privacy policy (item 4) | Pass with note |
| Sanity token | Confirmed scoped, not administrator: the management API refuses it with "missing required grant sanity.project.cors/read". It can still write or delete any document in the dataset, which the design requires; rotate on exposure | Pass |
| Rollback of secrets | Procedure unchanged; not exercised | Not tested |

### Findings

| ID | Severity | Finding | Action |
|---|---|---|---|
| F1 | Medium | `CRON_SECRET` is set in no Vercel environment, so `/api/cron/reconcile` answers 401 to Vercel's own daily call. The endpoint fails closed, which is right, but the safety net that catches a missed webhook — the exact failure of 2026-09-16 — never runs | Add `CRON_SECRET` to Preview and Production, redeploy, then confirm the cron returns `{"checked":…}` with the bearer. Owner (Vercel) |
| F2 | Medium | The branch preview is publicly reachable (no Vercel deployment protection) and its `SANITY_WRITE_TOKEN` and dataset point at **production**. Anyone who learns the URL can complete a test-card checkout and decrement real stock — which is how `stock-mustard` reached 0 | Before go-live: turn on deployment protection for previews, or point Preview at a separate dataset. Owner (Vercel / Sanity) |
| F3 | Low | Two Sanity CORS origins return `Access-Control-Allow-Credentials: true`: `http://localhost:3333` and `http://localhost:5173`. A page served from those ports on a machine signed in to Sanity could read private documents, including `fulfilment.*`, and write as that user. 3333 is the Studio's own requirement; 5173 is not — the site's dev server reads the public CDN with no token. `https://atelier-product-page-38z417igl-…` is also a stale origin from the old CLI deployment | Re-add `http://localhost:5173` without credentials; delete the stale origin. Deployed origins are already credential-free. Owner (Sanity dashboard) |
| F4 | Low | No security response headers: the deployment returned only Vercel's HSTS, so the page could be framed by any origin and the thank-you URL's `session_id` relied on browser referrer defaults | **Fixed on the branch**: `vercel.json` now sends `X-Content-Type-Options`, `X-Frame-Options: DENY`, `Content-Security-Policy: frame-ancestors 'none'`, `Referrer-Policy: strict-origin-when-cross-origin` and a `Permissions-Policy`. Verify on the next preview deploy |
| F5 | Low | No rate limiting on `/api/checkout` or `/api/order`. The origin check is CSRF protection, not authentication — a non-browser client sets the header freely. Unlimited Session creation reserves no stock and takes no money, so the cost is Stripe quota, dashboard noise and possible abuse flags | Add a Vercel WAF rate-limit rule when the project moves to the commercial plan (item 12) |
| F6 | Low | Ten open Dependabot alerts, **all** in `studio/package-lock.json` (adm-zip, js-yaml, smol-toml, uuid, reached through the `sanity` CLI). `npm audit` on the root lockfile — the deployed site and its functions — reports 0 vulnerabilities. The alerts are denial-of-service and prototype-pollution issues in tooling that only processes the owner's own files | Schedule the Studio upgrade; the fix needs `sanity@5.14.1`, a major version. Not a launch blocker |

**Observation, not a defect:** `studio/schemaTypes` has no `fulfilment` type, so the order log cannot be read in the Studio — only with a token. Worth resolving in the fulfilment runbook (item 8).

## Not yet assigned

| Work | Why not now |
|---|---|
| Phase 0 accounts, preview routing proof, Shippo go/no-go (§6.1–6.2, §6.4) | Owner actions: accounts, logins, keys |
| Phase 6 Shippo webhook (§12.1) | Blocked on the §6.4 result and the real `transaction_created` payload |
| Phase 9 testing (§15) | After merge, with Stripe test keys and a preview deploy |
| Phase 10 launch (§16), documentation | After testing |

## Owner actions (start now — these gate launch more than the code)

- [x] Create the Sanity project and seed it (PLAN3 §19.4 steps 1–4) — already done: project `59rfnf2c`, dataset `production`, in `.env.local` and `studio/.env`. Checked 2026-09-15: `product-mustard` (¥1,900, for sale), `product-tapenade` (¥2,100, for sale), `product-preserved-lemon` (¥2,400, not for sale)
Status checked 2026-09-16 against the live systems (Sanity queries, Stripe CLI, Vercel CLI, repo files).

**Sanity commerce setup (same project `59rfnf2c`)**
- [x] `seed-commerce.ts write` applied: SKUs `KIMIE-MUS-200` / `KIMIE-TAP-200` set; `stock-mustard` and `stock-tapenade` created
- [x] Packed weights entered: 100 g each. **Confirm these are measured packed weights**, not placeholders — labels use them
- [x] Stock entered: mustard 1 (was 2; one jar used by test order `KJ-260915-2664B8`), tapenade 2. Reset to real numbers before launch
- [x] Write token works end to end: the test order's webhook created `fulfilment.cs_test_…` and decremented stock (after replaying the missed event)
- [x] CORS origins: `http://localhost:3333`, `http://localhost:5173`, `http://localhost:3000`, `https://kimie-atelier.vercel.app`
- [ ] Customs description and HS code: empty on both products. Only needed for export or Shippo (Path A)
- [ ] Hosted Studio: `kimie-jars.sanity.studio` still returns 404 (`npx sanity deploy`). Optional while editing through local `sanity dev`
- [ ] CORS for preview deployments: no preview origin listed; add the preview URL(s) before testing on a preview deploy

**Stripe (§6.1)**
- [x] Account exists and test mode works: test payment `KJ-260915-2664B8` succeeded in JPY; `sk_test_` key and the `stripe listen` webhook secret are in the local `.env`
- [ ] Country = Japan, business profile, activation for live payments: **not verifiable from here** (the CLI's key can't read the account); check the Dashboard. Stripe reviews the public site, so the legal pages must be complete first (§5.1)
- [ ] Webhook endpoints and keys for Preview (test) and Production (live) (§10.1): none created yet

**Shippo (§6.4)**
- [ ] Shippo account and a DHL Express Japan (or FedEx/UPS) business account request: nothing set up (no Shippo token anywhere); the go/no-go test hasn't run

**Legal and tax (§5.1)**
- [ ] Legal notice, privacy and returns text: none filled in. `src/features/legal/content.ts` still has 37 Japanese + 37 English owner placeholders, 8 each in French, Simplified and Traditional Chinese (shipping page), and 4 adviser-review items
- [ ] Tax accountant (consumption tax, invoice registration, April 2027 food-rate change): no record of this yet
- [ ] Decide shipping scope: legal pages say Japan only, the current FAQ copy still promises international shipping

**Vercel (§6.2, D13)**
- [x] `vercel link`: linked to project `atelier-product-page` (team `samuelcychan-team`), which serves `https://kimie-atelier.vercel.app`; `.vercel` and `.env*` are gitignored
- [ ] Commercial-use plan decision (D13): plan tier isn't visible from the CLI; check the team's billing page
- [ ] Project environment variables: Preview now has all seven; Production still has only `VITE_SANITY_PROJECT_ID`, `VITE_SANITY_DATASET`, `VITE_SANITY_API_VERSION` (checked 2026-09-20)
- [ ] **Security F1:** `CRON_SECRET` is set in no environment, so the daily reconcile answers 401 to Vercel's own call. Add it to Preview and Production
- [ ] **Security F2:** previews are public and write to the live Sanity dataset. Before go-live, turn on deployment protection for previews or give Preview its own dataset

**Sanity (security F3)**
- [ ] Re-add the CORS origin `http://localhost:5173` **without** "Allow credentials" (it needs none — the site's dev server reads the public CDN with no token), and delete the stale origin `https://atelier-product-page-38z417igl-samuelcychan-team.vercel.app`. `http://localhost:3333` keeps credentials: the Studio needs them

## Shared contracts

Tracks build against these. A change needs the integrator's agreement, recorded here.

### HTTP API (Track B implements, Track C consumes)

`GET /api/catalog`

```ts
// 200, Cache-Control: public, s-maxage=300
{ enabled: false }
// 200, Cache-Control: public, s-maxage=60, stale-while-revalidate=300
{ enabled: true, products: Array<{ slug: string; forSale: boolean; available: boolean; unitAmount: number | null; currency: "JPY" }> }
// 503, no-store
{ enabled: true, unavailable: true }
```

`POST /api/checkout` — `Content-Type: application/json`

```ts
// request
{ lang: "en" | "ja" | "fr" | "zh" | "zh-TW"; returnPath: "/" | "/story"; lines: Array<{ slug: string; quantity: number; unitAmount: number }> }
// 200
{ url: string } // always starts with https://checkout.stripe.com/
// errors
503 { error: "unavailable" }
403 { error: "forbidden" }
415 { error: "invalid_request" }
400 { error: "invalid_cart" }
409 { error: "not_for_sale"; slug: string }
409 { error: "price_changed"; slug: string; unitAmount: number }
409 { error: "insufficient_stock"; slug: string; available: number }
502 { error: "unavailable" }
```

`GET /api/order?session_id=cs_…`

```ts
// 200
{ status: "open" | "complete" | "expired" | null; paymentStatus: "paid" | "unpaid" | "no_payment_required"; orderNumber: string | null; total: number | null; currency: string | undefined; lines: Array<{ name: string /* "" when Stripe has no description */; quantity: number | null; amount: number }> }
// 404
{ error: "not_found" }
```

Clarifications from Track B (2026-09-15): `POST /api/checkout` returns 400 `invalid_cart` for a malformed line or a slug not matching `^[a-z0-9-]{1,64}$`, and 502 `unavailable` when Sanity or Stripe fails. `/api/stripe-webhook` returns 503 when not configured (Stripe keeps retrying) and 500 when fulfilment fails.

Stripe redirects: `success_url` = `/order/complete?session_id={CHECKOUT_SESSION_ID}`; `cancel_url` = `<returnPath>?cart=open`.

### Sanity (Track A defines, Track B reads and writes)

- `product` fields: `slug.current`, `name` (internationalized array), `sizeValue`, `sizeUnit`, `sku`, `packedWeightGrams`, `customsDescription`, `hsCode`, `isActive` ("For sale"), `prices.jpy`.
- `stock` documents: fixed ids `stock-mustard`, `stock-tapenade`; fields `product` (reference), `available` (integer, may go negative).
- `fulfilment.<checkoutSessionId>` documents: written only by the server; no schema type in the Studio. Fields: `orderNumber`, `paidAt`, `lines[]` (`slug`, `sku`, `quantity`), `oversold`, optional `shippoOrderId`.
- `sku` and `packedWeightGrams` may be empty on a published product that isn't for sale; the server's `isForSale` requires both.

### Routes and storage

| Item | Owner |
|---|---|
| `/order/complete` → `src/features/commerce/OrderCompletePage.tsx` (default export) | Track C |
| `/legal/tokushoho`, `/legal/privacy`, `/legal/shipping`, `/legal/returns` → `src/features/legal/LegalPage.tsx` (default export, reads `window.location.pathname`) | Track D |
| `src/main.tsx` | Tracks C and D each add **one** path branch only, so the integration merge is trivial |
| `localStorage` `ym-cart-v1` = `Array<{ slug: string; quantity: number }>` | Track C |

### File ownership

| Paths | Track |
|---|---|
| `studio/schemaTypes/**`, `studio/scripts/seed-commerce.ts` | A |
| `api/**`, `server/**`, `tsconfig.server.json`, `vercel.json`, `package.json`, `package-lock.json` | B |
| `src/features/commerce/**`, `src/app/App.tsx`, `src/app/story/**`, `src/app/i18n.ts` | C |
| `src/features/legal/**` | D |
| `src/main.tsx` | C and D (one branch each) |
| `progress/README.md` | Integrator |
| `progress/track-*.md` | The matching track |

## Rules for every track

1. Edit only the files your track owns. If you need a change elsewhere, write it under **Requests to integrator** in your progress file.
2. Update your progress file when you start, after each task, and when you finish: status, checkboxes, verification log, deviations.
3. Commit on your worktree branch with conventional messages (`feat(commerce): …`), ending with `Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>`. Do not push. Do not merge.
4. Never create accounts, log in, type passwords, API keys or card numbers, or commit `.env*` files. Anything needing credentials goes under **Blocked on owner**.
5. Use **npm** (`npm.cmd` in PowerShell), never pnpm. Run `npm ci` in your worktree before building.
6. Follow `CLAUDE.md`: `--ym-*` CSS variables and inline style objects in `App.tsx`, no hardcoded palette hexes in components, copy in all five locales, don't delete `src/app/components/ui/`.
7. The plan's code is a sketch; the typecheck and build are the arbiter. Record every deviation from the plan with its reason.
