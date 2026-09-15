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
| 2026-09-15 | Track C's request applied: privacy page (ja, en) now lists sessionStorage `ym-checkout-lang`. Deferred: widening `tsconfig.json` `include` to `App.tsx`/`StoryPage.tsx` (7 pre-existing errors: missing `three` types, CSS side-effect imports) |

## Not yet assigned

| Work | Why not now |
|---|---|
| Phase 0 accounts, preview routing proof, Shippo go/no-go (§6.1–6.2, §6.4) | Owner actions: accounts, logins, keys |
| Phase 6 Shippo webhook (§12.1) | Blocked on the §6.4 result and the real `transaction_created` payload |
| Phase 7 security review (§13) | Unblocked: all four tracks are merged; not started |
| Phase 9 testing (§15) | After merge, with Stripe test keys and a preview deploy |
| Phase 10 launch (§16), documentation | After testing |

## Owner actions (start now — these gate launch more than the code)

- [ ] Create the Sanity project and seed it (PLAN3 §19.4 steps 1–4)
- [ ] Stripe account (Japan), business profile, test keys (§6.1)
- [ ] Shippo account; request a DHL Express Japan (or FedEx/UPS) business account (§6.4)
- [ ] Legal notice, privacy and returns text from advisers; tax accountant (§5.1)
- [ ] Vercel: `vercel link`, commercial-use plan decision (§6.2, D13)

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
