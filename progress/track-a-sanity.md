# Track A — Sanity commerce schema

**Status:** Done
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
- [x] `seed-commerce.ts`: dry-run by default like `seed.ts`; finds products by slug; `createIfNotExists` for `stock-mustard` and `stock-tapenade` (`available: 0`); `setIfMissing` for `sku` (`KIMIE-MUS-200`, `KIMIE-TAP-200`); never overwrites owner values; usage comment at the top
- [x] Verify: `npx tsc --noEmit` in `studio/`; try `npx sanity build` (record the result if it needs a project id)

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
| 2026-09-15 | `npx tsc --noEmit` (studio/, all files including `scripts/seed-commerce.ts`; the tsconfig `include` of `**/*.ts` covers `scripts/`) | Pass |
| 2026-09-15 | `npx sanity build --yes` (studio/, no `.env`, no project id) | Pass: studio built in 16 s. The missing-project-id check in `sanity.config.ts` only throws when the Studio loads in a browser, not at build time |
| 2026-09-15 | `SANITY_STUDIO_PROJECT_ID=placeholder0 npx sanity schema validate` (placeholder id, local check only, no network writes) | Pass: 0 errors, 0 warnings |
| — | `npx sanity exec scripts/seed-commerce.ts` | Not run: needs a Sanity project and login (Blocked on owner) |

## Deviations from plan

1. **`prices` and `isActive` are in the Commerce group.** §7.1 only says to unhide them. The product type has groups with `copy` as the default, so a field with no group shows only under "All fields". Kimie would not find them.
2. **`sku` and `packedWeightGrams` are required only while "For sale" is on** (a `rule.custom` check), not always with `rule.required()` as §7.1 has it. The seeded `preserved-lemon` product is not for sale and has no SKU or weight. An unconditional rule would stop it being published. The format rules (SKU regex, integer, positive) still apply whenever a value is present. Track B must still refuse to sell a product with no SKU or weight.
3. **`prices` object also gets `rule.required()`**, so a missing `prices` object is flagged as well as a missing `jpy` inside it.
4. §3.1 places the commerce fields under "Settings". The task list says a Commerce group, so I followed the task list.
5. **Stock is seeded by a new `scripts/seed-commerce.ts`, not by `seed.ts`** (§7.2 allows either). `seed.ts` uses `createOrReplace`, and `--force` discards the owner's edits. The new script only adds. It is a **dry run unless `-- --write` is passed**, the reverse of `seed.ts`'s `--dry-run` flag.
6. **`seed-commerce.ts` also sets `sku` on an existing draft** of the product, not only on the published document. Otherwise publishing that draft later would drop the SKU.
7. **`seed-commerce.ts` skips a product that has no published version.** A stock document's `product` reference needs a published product to point at. It reads with `perspective: 'raw'` so it sees drafts as well as published documents.
8. `stock.ts` matches §7.2, apart from a comment naming the fixed ids and the seed script.

## Requests to integrator

1. **Show Stock in the Studio.** `studio/sanity.config.ts` (not owned by any track) has a custom structure that lists only `product`, so the new `stock` documents would not appear anywhere Kimie can see them. Add a list item next to Products, e.g. `S.documentTypeListItem('stock').title('Stock')`.
2. **Stop Kimie creating or deleting stock documents by hand** (same file). The server finds stock by the fixed ids `stock-mustard` and `stock-tapenade`, and `product` is read-only, so a stock document made in the Studio could never be valid. Suggested:
   - `document.newDocumentOptions: (prev) => prev.filter((t) => t.templateId !== 'stock')`
   - extend the existing `document.actions` filter so `delete` (and `duplicate`) are also removed when `context.schemaType === 'stock'`.

## Handoff notes

**For the integrator**

- Contract fields are in place as the board describes: `product.sku`, `packedWeightGrams`, `customsDescription`, `hsCode`, `isActive` (titled "For sale"), `prices.jpy`. `stock` documents have `product` (reference) and `available` (integer, no minimum, so it can go negative).
- `sku` and `packedWeightGrams` can be empty on a published product that is not for sale (deviation 2). Track B should treat a for-sale product with no SKU or weight as not sellable, not crash on it.
- Merge only needs the two `sanity.config.ts` changes listed under Requests to integrator. Without the first one, Kimie cannot see Stock in the Studio.
- Schema-only change: no migration. Existing product documents already hold `prices` and `isActive` from `seed.ts`.

**For the owner (in order)**

1. Create the Sanity project and put `SANITY_STUDIO_PROJECT_ID` in `studio/.env`. Log in (`npx sanity login`), run `seed.ts` (PLAN3 §19.4), then `npx sanity deploy`.
2. `cd studio`, then `npx sanity exec scripts/seed-commerce.ts --with-user-token`. Read the dry-run plan, then re-run with `-- --write`.
3. In the Studio, on each product's **Commerce** tab: enter the measured packed weight, customs description and HS code. Check the SKU and JPY price (1900 / 2100), turn **For sale** on, then **Publish**.
4. Under Stock (once the integrator adds it), set **Jars available to sell** on both documents. These save immediately, with no Publish step.
5. Create the `vercel-commerce` Editor token (§7.3) and store it only in Vercel and `.env.local` as `SANITY_WRITE_TOKEN`.
6. Check with the §7.3 exit query in Vision.
