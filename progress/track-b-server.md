# Track B — Server and API

**Status:** Not started
**Plan:** [PLAN-stripe-and-shippo.md](../PLAN-stripe-and-shippo.md) §6.3 (config only), §8, §9, §10 (incl. §10.4 and §10.5), §13 rules that apply to server code
**Board and contracts:** [README.md](README.md) — the HTTP API and Sanity contracts there are binding

## Owned files

- `api/**` (new), `server/**` (new)
- `tsconfig.server.json` (new)
- `vercel.json`
- `package.json`, `package-lock.json`
- `progress/track-b-server.md`

## Tasks

- [ ] `npm ci` in the repo root
- [ ] `vercel.json`: rewrite `/((?!api/).*)` → `/index.html`; add the daily cron for `/api/cron/reconcile` (§10.5)
- [ ] Dependencies: `stripe`, dev `@types/node`; edit `package.json` directly for the two-pass `typecheck` script (§8.1)
- [ ] `tsconfig.server.json` (§8.1)
- [ ] `server/env.ts`, `server/http.ts` (with the `sameOrigin` that tolerates a `null` origin), `server/stripe.ts`, `server/sanity.ts` (§8.4–8.6)
- [ ] `server/catalog.ts` and `api/catalog.ts` (§9.1–9.2)
- [ ] `api/checkout.ts` (§9.3)
- [ ] `api/order.ts` (§9.4)
- [ ] `server/shippo.ts` — `createShippoOrder` only (§10.4)
- [ ] `server/fulfil.ts` — transactional log + stock decrement, retry, Shippo step (§10.3)
- [ ] `api/stripe-webhook.ts` (§10.2)
- [ ] `api/cron/reconcile.ts` (§10.5)
- [ ] Check how Vercel runs ESM TypeScript functions in a `"type": "module"` package; if relative imports need `.js` extensions at runtime, use them consistently in `api/` and `server/` and note it
- [ ] Verify: `npm run typecheck` (both configs), `npm run build`
- [ ] Credential-free smoke check if possible without new dependencies: with no env vars, `GET /api/catalog` handler returns `{ enabled: false }` and `POST /api/checkout` returns 503. Record how you ran it, or why you couldn't

## Out of scope for this track

- `api/shippo-webhook.ts` (§12.1) — blocked on the §6.4 result
- Any frontend file

## Blocked on owner

- Stripe test keys, `vercel link` / `vercel env add`, Stripe CLI login, webhook endpoint creation (§10.1)
- Preview deploy to prove `/api/*` routing beside the SPA rewrite (§6.3 exit criterion)
- Sanity write token; a real dataset to test catalog and fulfilment
- Local end-to-end run under `vercel dev` with `stripe listen`

## Verification log

| Date | Command | Result |
|---|---|---|

## Deviations from plan

_None yet._

## Requests to integrator

_None yet._

## Handoff notes

_Filled in when the track is done: env vars, anything the owner must configure, untested paths._
