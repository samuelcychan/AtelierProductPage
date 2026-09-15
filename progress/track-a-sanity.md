# Track A — Sanity commerce schema

**Status:** In progress
**Plan:** [PLAN-stripe-and-shippo.md](../PLAN-stripe-and-shippo.md) §7.1–7.2, §3.1
**Board and contracts:** [README.md](README.md)

## Owned files

- `studio/schemaTypes/product.ts`
- `studio/schemaTypes/stock.ts` (new)
- `studio/schemaTypes/index.ts`
- `studio/scripts/seed-commerce.ts` (new)
- `progress/track-a-sanity.md`

## Tasks

- [x] `npm ci` in `studio/`
- [ ] `product.ts`: unhide `prices`; `jpy` required, integer, ≥ 1, description per §7.1; `usd`, `eur`, `cny`, `twd` stay hidden with no validation
- [ ] `product.ts`: unhide `isActive`, retitle "For sale", description per §7.1, `rule.required()`; keep `HIDDEN_UNTIL_MAIN_PAGE` for the remaining main-page fields
- [ ] `product.ts`: add a **Commerce** group with `sku`, `packedWeightGrams`, `customsDescription`, `hsCode` (§7.1)
- [ ] `stock.ts`: `liveEdit: true` type per §7.2; register in `index.ts`
- [ ] `seed-commerce.ts`: dry-run by default like `seed.ts`; finds products by slug; `createIfNotExists` for `stock-mustard` and `stock-tapenade` (`available: 0`); `setIfMissing` for `sku` (`KIMIE-MUS-200`, `KIMIE-TAP-200`); never overwrites owner values; usage comment at the top
- [ ] Verify: `npx tsc --noEmit` in `studio/`; try `npx sanity build` (record the result if it needs a project id)

## Blocked on owner

- Sanity project creation, login, `npx sanity deploy`
- Running `seed-commerce.ts` against the real dataset
- Entering packed weights, customs descriptions, HS codes and stock numbers
- Creating the `vercel-commerce` Editor API token (§7.3)

## Verification log

| Date | Command | Result |
|---|---|---|

## Deviations from plan

_None yet._

## Requests to integrator

_None yet._

## Handoff notes

_Filled in when the track is done._
