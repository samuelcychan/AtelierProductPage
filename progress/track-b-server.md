# Track B — Server and API

**Status:** Done
**Plan:** [PLAN-stripe-and-shippo.md](../PLAN-stripe-and-shippo.md) §6.3 (config only), §8, §9, §10 (incl. §10.4 and §10.5), §13 rules that apply to server code
**Board and contracts:** [README.md](README.md) — the HTTP API and Sanity contracts there are binding

## Owned files

- `api/**` (new), `server/**` (new)
- `tsconfig.server.json` (new)
- `vercel.json`
- `package.json`, `package-lock.json`
- `progress/track-b-server.md`

## Tasks

- [x] `npm ci` in the repo root
- [x] `vercel.json`: rewrite `/((?!api/).*)` → `/index.html`; add the daily cron for `/api/cron/reconcile` (§10.5)
- [x] Dependencies: `stripe`, dev `@types/node`; edit `package.json` directly for the two-pass `typecheck` script (§8.1)
- [x] `tsconfig.server.json` (§8.1)
- [x] `server/env.ts`, `server/http.ts` (with the `sameOrigin` that tolerates a `null` origin), `server/stripe.ts`, `server/sanity.ts` (§8.4–8.6)
- [x] `server/catalog.ts` and `api/catalog.ts` (§9.1–9.2)
- [x] `api/checkout.ts` (§9.3)
- [x] `api/order.ts` (§9.4)
- [x] `server/shippo.ts` — `createShippoOrder` only (§10.4)
- [x] `server/fulfil.ts` — transactional log + stock decrement, retry, Shippo step (§10.3)
- [x] `api/stripe-webhook.ts` (§10.2)
- [x] `api/cron/reconcile.ts` (§10.5)
- [x] Check how Vercel runs ESM TypeScript functions in a `"type": "module"` package; if relative imports need `.js` extensions at runtime, use them consistently in `api/` and `server/` and note it
- [x] Verify: `npm run typecheck` (both configs), `npm run build`
- [x] Credential-free smoke check if possible without new dependencies: with no env vars, `GET /api/catalog` handler returns `{ enabled: false }` and `POST /api/checkout` returns 503. Record how you ran it, or why you couldn't

### ESM import-extension decision

Every relative import in `api/` and `server/` (including the ones into `src/`) ends in `.js`, e.g. `import { env } from "../server/env.js"`.

- Vercel's Node runtime docs (functions/runtimes/node-js, advanced-node-configuration, fetched 2026-09-15) don't say either way. Reports of `ERR_MODULE_NOT_FOUND` for extensionless relative imports in `"type": "module"` projects on Vercel say the same thing: the functions run as native Node ES modules, and Node ESM does not resolve extensionless specifiers.
- `tsc` with `moduleResolution: "bundler"` resolves `./env.js` to `./env.ts`, so the typecheck passes without `allowImportingTsExtensions`. The emitted JS keeps the `.js` specifiers and drops the type-only imports, which I confirmed by compiling to a scratch outDir.
- `src/features/products/localize.ts` and `query.ts` are now loaded at runtime by the functions. Their own imports are type-only (erased), so they work unchanged. See Requests to integrator.
- Not yet proven on Vercel's own build. That needs a preview deploy (Blocked on owner).

## Out of scope for this track

- `api/shippo-webhook.ts` (§12.1) — blocked on the §6.4 result
- Any frontend file

## Blocked on owner

- Stripe test keys, `vercel link` / `vercel env add`, Stripe CLI login, webhook endpoint creation (§10.1)
- Preview deploy to prove `/api/*` routing beside the SPA rewrite (§6.3 exit criterion). `api/health.ts` was not added, because it only matters on a preview deploy and is deleted afterwards. `api/catalog` (returns `{ enabled: false }` without env vars) can serve as the probe instead.
- Preview deploy to prove the `.js`-extension ESM imports run under Vercel's build
- Sanity write token; a real dataset to test catalog and fulfilment
- Local end-to-end run under `vercel dev` with `stripe listen`
- Vercel plan for the daily cron and commercial use (D13)

## Verification log

| Date | Command | Result |
|---|---|---|
| 2026-09-15 | `git merge --ff-only 114193d` | The worktree started at `7889cca`, before the board commit. Fast-forwarded to `114193d` as the brief specifies |
| 2026-09-15 | `npm ci` | OK, 300 packages, 0 vulnerabilities |
| 2026-09-15 | `npm install stripe` / `npm install --save-dev @types/node` | `stripe@22.6.2` (pins API version `2026-08-26.dahlia`), `@types/node@26.5.1`; peer-dependency block untouched |
| 2026-09-15 | `npm run typecheck` (after `server/env.ts`, `http.ts`, `stripe.ts`, `sanity.ts`) | Both configs pass, exit 0 |
| 2026-09-15 | `npx tsc --noEmit -p tsconfig.server.json` (after catalog) | Pass, exit 0 |
| 2026-09-15 | `npm run typecheck` (all of `api/` and `server/`, after the `packedWeightGrams` change) | Both configs pass, exit 0 |
| 2026-09-15 | `npm run build` | OK (only the existing >500 kB `three` chunk warning) |
| 2026-09-15 | `grep -rlE "sk_live_\|sk_test_\|rk_live_\|whsec_\|shippo_live_\|shippo_test_\|STRIPE_SECRET_KEY\|SANITY_WRITE_TOKEN" dist/` | No matches |
| 2026-09-15 | `npx tsc -p tsconfig.server.json --noEmit false --outDir <scratchpad>/smoke/out --rootDir .` | Exit 0. Emitted ESM keeps `.js` specifiers |
| 2026-09-15 | Smoke: `<scratchpad>/smoke/out/package.json` = `{"type":"module"}`, a junction `out/node_modules` → worktree `node_modules`, then `node smoke.mjs` (Node 22.14.0, credential variables deleted from `process.env`, handlers imported from the emitted JS and called with Web `Request` objects) | All pass: `GET /api/catalog` 200 `public, s-maxage=300` `{"enabled":false}`; `POST /api/checkout` 503 `{"error":"unavailable"}`; `GET /api/order` 404 `{"error":"not_found"}`; `POST /api/stripe-webhook` 503; `GET /api/cron/reconcile` with `Bearer ` 401. The script is in the scratchpad and not committed. `--experimental-strip-types` was not usable because Node cannot map the `.js` specifiers to `.ts` sources |

## Deviations from plan

The installed Stripe 22.6.2 types agree with the plan's API shapes: `ui_mode: "hosted_page"`, `locale` including `zh-TW`, `collected_information.shipping_details`, synchronous `webhooks.constructEvent`, and `sessions.list` as an async iterable. No deviation was needed for them.

1. **Import specifiers**: `.js` extensions on all relative imports in `api/` and `server/` (see the decision above). The plan's sketches are extensionless.
2. **`isForSale`** (integrator request, from Track A's schema): also requires a positive integer `packedWeightGrams`, because the Studio requires `sku` and weight only while "For sale" is on. It also requires an integer `stock.available`. `CatalogItem` fields are typed `| null`, since GROQ returns `null` for missing fields. A `SellableItem` type is exported, and `checkoutName` takes it.
3. **`readJson`**: rejects on a declared `Content-Length` above the limit, and measures the body in UTF-8 bytes rather than string length.
4. **`sameOrigin`**: refuses the literal `"null"` origin explicitly without throwing. On Preview it accepts only an `https:` origin whose host equals `VERCEL_URL` or `VERCEL_BRANCH_URL`, not any `*.vercel.app` host, which would let other people's Vercel sites through.
5. **`api/checkout.ts`**:
   - Each line must be an object with a slug matching `^[a-z0-9-]{1,64}$`; anything else gets 400 `invalid_cart`. The plan would throw on a `null` line.
   - Sanity or Stripe failures are caught and return 502 `{ error: "unavailable" }` (listed in the contract). The plan let them throw, which gives a 500.
   - `expires_at` is now + **31** min, not 30. Stripe's minimum is 30 minutes after creation, so exactly 30 can be rejected after request latency.
   - The Content-Type check is case-insensitive, and line items are typed as `Stripe.Checkout.SessionCreateParams.LineItem[]`.
6. **`api/order.ts`**: `lines[].name` is `l.description ?? ""`, because Stripe types it `string | null`. `status` is passed through as-is and can be `null` per the types (see Requests).
7. **`server/shippo.ts`**:
   - 5 s `AbortSignal.timeout`.
   - The thrown error omits Shippo's response body, which can echo the address (§13: no personal data in logs).
   - It throws when the Session has no shipping details or Shippo returns no `object_id`.
   - Address fields are null-safe.
   - A `productOf(lineItem)` helper checks that the product was expanded and not deleted.
8. **`server/fulfil.ts`**:
   - Returns early unless `status === "complete"` and payment is not `unpaid`.
   - Log `lines[]` items carry `_key` (Sanity object arrays).
   - Stock is not patched for quantity 0.
   - `payment_intent` is handled as either an id or an object.
   - Logs print the order number and the error message only, never error objects.
9. **`api/stripe-webhook.ts`**: returns 503 when commerce or `STRIPE_WEBHOOK_SECRET` is not configured, so Stripe keeps retrying. The plan would answer 400 "Invalid signature". Fulfilment errors are caught, logged by message, and answered with 500 so Stripe retries.
10. **`api/cron/reconcile.ts`**:
    - The plan compared against `` `Bearer ${env.cronSecret}` ``, which accepts a bare `Authorization: Bearer ` header when `CRON_SECRET` is unset. Now an empty secret never matches, and the comparison uses `crypto.timingSafeEqual`.
    - Each Session is fulfilled inside its own try/catch, so one failure doesn't stop the run.
    - The response is `{ checked, failed }`, with status 500 if any failed, and `no-store`.

## Requests to integrator

1. **Contract, `GET /api/order`**: Stripe 22.6.2 types `session.status` as `"open" | "complete" | "expired" | null`. The handler passes it through, so Track C should tolerate `null`, or the contract should say `| null`. `lines[].name` is `""` when Stripe has no description.
2. **Contract, `POST /api/checkout`**: a slug not matching `^[a-z0-9-]{1,64}$` gets 400 `invalid_cart`, not 409 `not_for_sale`. It's probably worth a line on the board.
3. **`src/features/products/localize.ts` and `query.ts` now run inside Vercel Functions.** Future edits to them must keep imports type-only, or use `.js` extensions on value imports, and must not use `import.meta.env` or browser APIs. Otherwise the functions break at runtime while `tsc` still passes. A comment in those files, or a note in `CLAUDE.md`, would help. Those files are not owned by Track B.
4. `fulfilment.*` documents have `orderNumber`, `paidAt`, `lines[] { _key, slug, sku, quantity }`, `oversold`, and optionally `shippoOrderId`. That is useful for the §12 docs and any Studio view.

## Handoff notes

**Environment variables** (server only; set in Vercel Production and Preview, and in `.env.local` for `vercel dev`):

| Variable | Needed for | Notes |
|---|---|---|
| `STRIPE_SECRET_KEY` | Commerce kill switch, all Stripe calls | `sk_test_…` on Preview |
| `STRIPE_WEBHOOK_SECRET` | `/api/stripe-webhook` | Separate endpoint and secret per environment |
| `SANITY_WRITE_TOKEN` | Kill switch, catalog read, fulfilment write | Editor token |
| `VITE_SANITY_PROJECT_ID`, `VITE_SANITY_DATASET` | Kill switch, Sanity client | Already used by the frontend |
| `SITE_URL` | Kill switch, `sameOrigin`, success/cancel URLs | Exact origin, scheme + host, no trailing slash; a trailing slash is stripped. Must equal the browser's `Origin` in Production |
| `CRON_SECRET` | `/api/cron/reconcile` | Long random string; Vercel Cron sends it as the bearer token. Unset means the cron always gets 401 |
| `SHIPPO_API_TOKEN` | Path A only | Unset means fulfilment skips Shippo |
| `SHIPPO_WEBHOOK_TOKEN` | Not read by any code yet | For the out-of-scope `api/shippo-webhook.ts` |

The code also reads Vercel's system variables `VERCEL_ENV`, `VERCEL_URL` and `VERCEL_BRANCH_URL`, which are set automatically.

**Owner configuration**: Stripe webhook destination `https://<site>/api/stripe-webhook` with `checkout.session.completed`, `checkout.session.async_payment_succeeded` and `checkout.session.async_payment_failed`. A Vercel plan that runs the daily cron (`0 1 * * *` UTC = 10:00 JST). Stock documents `stock-mustard` and `stock-tapenade`, and products with For sale on, `prices.jpy`, `sku` and `packedWeightGrams`; otherwise the catalog reports `forSale: false`.

**Untested paths**:
- Everything that reaches Stripe, Sanity or Shippo. Only the unconfigured branches were exercised locally.
- The `.js`-extension imports under Vercel's own build.
- `sameOrigin` on a real preview.
- The Sanity transaction conflict and retry.
- Shippo payload acceptance.

**Known limits**:
- Two concurrent deliveries for the same Session can both pass the `!shippoOrderId` check and create two Shippo orders. This is rare; the duplicate shows the same order number in Shippo.
- The reconcile walks up to 3 days of complete Sessions sequentially, which is fine at this volume but could hit the function time limit at high volume.
- The Checkout shipping label is "送料無料" for `ja` and "Free shipping" in every other locale, as in the plan.
- The delivery estimate of 2–5 business days is a placeholder.
