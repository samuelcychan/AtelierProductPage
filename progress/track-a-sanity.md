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
- [x] `product.ts`: unhide `prices`; `jpy` required, integer, ≥ 1, description per §7.1; `usd`, `eur`, `cny`, `twd` stay hidden with no validation
- [x] `product.ts`: unhide `isActive`, retitle "For sale", description per §7.1, `rule.required()`; keep `HIDDEN_UNTIL_MAIN_PAGE` for the remaining main-page fields
- [x] `product.ts`: add a **Commerce** group with `sku`, `packedWeightGrams`, `customsDescription`, `hsCode` (§7.1)
- [x] `stock.ts`: `liveEdit: true` type per §7.2; register in `index.ts`
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
| 2026-09-15 | `npm ci` (studio/) | Pass: 949 packages. npm audit reports 14 existing advisories (12 moderate, 2 high), not changed by this track |
| 2026-09-15 | `npx tsc --noEmit` (studio/, before changes) | Pass (baseline) |
| 2026-09-15 | `npx tsc --noEmit` (studio/, product.ts) | First run failed: TS2345, weak type on the custom validator context. Fixed by typing it as `ValidationContext`. Re-run passes |
| 2026-09-15 | `npx tsc --noEmit` (studio/, product.ts + stock.ts + index.ts) | Pass |

## Deviations from plan

1. **`prices` and `isActive` are in the Commerce group.** §7.1 only says to unhide them. The product type has groups with `copy` as the default, so a field with no group shows only under "All fields". Kimie would not find them.
2. **`sku` and `packedWeightGrams` are required only while "For sale" is on** (a `rule.custom` check), not always with `rule.required()` as §7.1 has it. The seeded `preserved-lemon` product is not for sale and has no SKU or weight. An unconditional rule would stop it being published. The format rules (SKU regex, integer, positive) still apply whenever a value is present. Track B must still refuse to sell a product with no SKU or weight.
3. **`prices` object also gets `rule.required()`**, so a missing `prices` object is flagged as well as a missing `jpy` inside it.
4. §3.1 places the commerce fields under "Settings". The task list says a Commerce group, so I followed the task list.

## Requests to integrator

1. **Show Stock in the Studio.** `studio/sanity.config.ts` (not owned by any track) has a custom structure that lists only `product`, so the new `stock` documents would not appear anywhere Kimie can see them. Add a list item next to Products, e.g. `S.documentTypeListItem('stock').title('Stock')`.
2. **Stop Kimie creating or deleting stock documents by hand** (same file). The server finds stock by the fixed ids `stock-mustard` and `stock-tapenade`, and `product` is read-only, so a stock document made in the Studio could never be valid. Suggested:
   - `document.newDocumentOptions: (prev) => prev.filter((t) => t.templateId !== 'stock')`
   - extend the existing `document.actions` filter so `delete` (and `duplicate`) are also removed when `context.schemaType === 'stock'`.

## Handoff notes

_Filled in when the track is done._
