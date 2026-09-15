# Commerce build — progress board

Implementation of [PLAN-stripe-and-shippo.md](../PLAN-stripe-and-shippo.md), split into parallel tracks, one subagent each. Every track keeps its own progress file; the integrator (main session) keeps this board and merges finished tracks.

- **Integration branch:** `feat/commerce-stripe-shippo` (from `main`). Each track works on its own worktree branch and is merged here after review. `main` is updated only after the integrated result is reviewed.
- **Started:** 2026-09-15.
- **Business location:** ships from **Kanagawa**, Japan (owner, 2026-09-15). Do not write "Ehime" in new copy. Changing the existing FAQ copy and the plan files is not in any track's scope.

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

## Not yet assigned

| Work | Why not now |
|---|---|
| Phase 0 accounts, preview routing proof, Shippo go/no-go (§6.1–6.2, §6.4) | Owner actions: accounts, logins, keys |
| Phase 6 Shippo webhook (§12.1) | Blocked on the §6.4 result and the real `transaction_created` payload |
| Phase 7 security review (§13) | Unblocked: all four tracks are merged; not started |
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
- [ ] Project environment variables: only `VITE_SANITY_PROJECT_ID`, `VITE_SANITY_DATASET`, `VITE_SANITY_API_VERSION` (Production). Nothing for Preview, and no `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `SANITY_WRITE_TOKEN`, `SITE_URL` or `CRON_SECRET` in any environment

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
