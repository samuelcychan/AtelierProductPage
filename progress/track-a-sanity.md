# Track A — Sanity commerce schema

**Status:** Done — schema merged 2026-09-15 (`99bfb89`), live on project `59rfnf2c` / dataset `production`
**Latest status check:** 2026-09-20 (live dataset query; see the verification log)
**Plan:** [PLAN-stripe-and-shippo.md](../PLAN-stripe-and-shippo.md) §7.1–7.2, §3.1
**Board and contracts:** [README.md](README.md) · **Launch backlog:** [backlog-launch.md](backlog-launch.md)

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

## Owner and integrator steps — status 2026-09-20

These were "Blocked on owner" when the track finished. Current state, checked against the live dataset:

- [x] Sanity project created and logged in — `59rfnf2c`, dataset `production`, ids in `studio/.env` and the root `.env`
- [x] `seed-commerce.ts write` run against the real dataset — SKUs `KIMIE-MUS-200` / `KIMIE-TAP-200` set; `stock-mustard` and `stock-tapenade` created
- [x] `vercel-commerce` Editor token created (§7.3) and proven end to end — the webhook writes `fulfilment.*` documents and decrements stock; the token is scoped, not administrator (security review, board)
- [x] Both products published and **For sale**, with `prices.jpy` 1900 / 2100 and packed weight 100 g each
- [x] §7.3 exit check: an anonymous query for `*[_id in path("fulfilment.**")]` returns nothing, while `product` and `stock` are readable — the order log needs the token, the catalog does not
- [ ] **Confirm 100 g is a measured packed weight**, not a placeholder — Path A labels and Shippo rates use it
- [ ] `customsDescription` and `hsCode`: still empty on both products. Only needed for export or Shippo (backlog item 7)
- [ ] **Set real stock before launch** — `stock-mustard` is **0** and `stock-tapenade` is **1** after the preview test purchases (backlog item 13)
- [ ] Hosted Studio: `npx sanity deploy` not run — `kimie-jars.sanity.studio` returns 404 (checked 2026-09-20). Optional while editing through local `sanity dev` (backlog item 6)
- [ ] CORS hygiene (security finding F3): re-add `http://localhost:5173` **without** credentials and delete the stale CLI-deployment origin

## Requests to integrator

Both applied by the integrator on 2026-09-15 in `studio/sanity.config.ts` (`6aee2b4`); confirmed still present 2026-09-20.

1. **Show Stock in the Studio.** Done — `S.documentTypeListItem('stock').title('Stock')` sits next to Products.
2. **Stop Kimie creating or deleting stock documents by hand.** Done — `newDocumentOptions` filters out the `stock` template, and the `document.actions` filter removes `delete` and `duplicate` for `stock`.

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
| 2026-09-16 | `npx sanity exec scripts/seed-commerce.ts write --with-user-token` (owner, real dataset) | Pass: SKUs set, both stock documents created. Needed `write` rather than `--write` — PowerShell's `npx` drops a bare `--` (now in `CLAUDE.md`) |
| 2026-09-16 | Live write path: Stripe webhook → `fulfilment.*` + stock decrement | Pass: order `KJ-260916-E0C41B` logged and `stock-tapenade` 2 → 1 with the `vercel-commerce` token |
| 2026-09-19 | Exactly-once behaviour under replay (`stripe events resend`) | Pass: no second `fulfilment.*` document and no second decrement — the `liveEdit` stock document with `ifRevisionId` holds |
| 2026-09-20 | Live query of `product` and `stock` on `production` | `product-mustard` (¥1,900, for sale, `KIMIE-MUS-200`, 100 g), `product-tapenade` (¥2,100, for sale, `KIMIE-TAP-200`, 100 g), `product-preserved-lemon` (not for sale, no SKU or weight — deviation 2 working as intended). `customsDescription` and `hsCode` null on all three. `stock-mustard` **0**, `stock-tapenade` **1** |
| 2026-09-20 | Anonymous `count(*[_id in path("fulfilment.**")])` | Returns 0 — the order log is not readable without a token, as §7.3 requires |
| 2026-09-20 | `GET https://kimie-jars.sanity.studio/` | 404 — the hosted Studio has not been deployed |

## Deviations from plan

1. **`prices` and `isActive` are in the Commerce group.** §7.1 only says to unhide them. The product type has groups with `copy` as the default, so a field with no group shows only under "All fields". Kimie would not find them.
2. **`sku` and `packedWeightGrams` are required only while "For sale" is on** (a `rule.custom` check), not always with `rule.required()` as §7.1 has it. The seeded `preserved-lemon` product is not for sale and has no SKU or weight. An unconditional rule would stop it being published. The format rules (SKU regex, integer, positive) still apply whenever a value is present. Track B must still refuse to sell a product with no SKU or weight. *Confirmed live 2026-09-20: `preserved-lemon` is published with both fields empty and is never offered for sale.*
3. **`prices` object also gets `rule.required()`**, so a missing `prices` object is flagged as well as a missing `jpy` inside it.
4. §3.1 places the commerce fields under "Settings". The task list says a Commerce group, so I followed the task list.
5. **Stock is seeded by a new `scripts/seed-commerce.ts`, not by `seed.ts`** (§7.2 allows either). `seed.ts` uses `createOrReplace`, and `--force` discards the owner's edits. The new script only adds. It is a **dry run unless `write` is passed**, the reverse of `seed.ts`'s `--dry-run` flag.
6. **`seed-commerce.ts` also sets `sku` on an existing draft** of the product, not only on the published document. Otherwise publishing that draft later would drop the SKU.
7. **`seed-commerce.ts` skips a product that has no published version.** A stock document's `product` reference needs a published product to point at. It reads with `perspective: 'raw'` so it sees drafts as well as published documents.
8. `stock.ts` matches §7.2, apart from a comment naming the fixed ids and the seed script.
9. **Added after the track closed:** `seed-commerce.ts` accepts a bare `write` argument as well as `--write` (`a94ba07`), because PowerShell's `npx` wrapper swallows a bare `--`.

## Open items carried elsewhere

The schema work is finished. What is left touches data and operations, and is tracked outside this file:

- Real stock numbers, customs description and HS code → [backlog-launch.md](backlog-launch.md) items 6, 7 and 13, and the board's Owner actions
- Hosted Studio deploy → backlog item 6
- CORS credential cleanup and preview dataset isolation → the board's security review (F2, F3)
- `studio/schemaTypes` has no `fulfilment` type, so the order log can only be read with a token — to be resolved in the fulfilment runbook (backlog item 8)
- Ten Dependabot alerts, all in `studio/package-lock.json` through the `sanity` CLI; the fix is a major upgrade to `sanity@5.14.1`. Not a launch blocker (security finding F6)

## Handoff notes

**For the integrator** *(complete)*

- Contract fields are in place as the board describes: `product.sku`, `packedWeightGrams`, `customsDescription`, `hsCode`, `isActive` (titled "For sale"), `prices.jpy`. `stock` documents have `product` (reference) and `available` (integer, no minimum, so it can go negative).
- `sku` and `packedWeightGrams` can be empty on a published product that is not for sale (deviation 2). Track B treats a for-sale product with no SKU or weight as not sellable.
- Both `sanity.config.ts` changes were applied at merge.
- Schema-only change: no migration. Existing product documents already hold `prices` and `isActive` from `seed.ts`.

**For the owner** — steps 1, 2, 5 and 6 are done; the live checklist is under "Owner and integrator steps" above.

1. ~~Create the Sanity project, log in, run `seed.ts`.~~ Done. **`npx sanity deploy` is still outstanding.**
2. ~~`cd studio`, then `npx sanity exec scripts/seed-commerce.ts write --with-user-token`.~~ Done 2026-09-16 (dry run read first, then re-run with `write`).
3. In the Studio, on each product's **Commerce** tab: confirm the measured packed weight, and enter the customs description and HS code if Path A (Shippo / export) is chosen. SKU, JPY price and **For sale** are already set and published.
4. Under Stock, set **Jars available to sell** on both documents before launch — they are 0 and 1 today. These save immediately, with no Publish step.
5. ~~Create the `vercel-commerce` Editor token (§7.3).~~ Done; it is in Vercel and the root `.env` as `SANITY_WRITE_TOKEN`, and proven by the live orders.
6. ~~Check with the §7.3 exit query in Vision.~~ Verified 2026-09-20 from the API: `fulfilment.*` is private, `product` and `stock` are public.
