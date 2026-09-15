# Track D — Legal and policy pages

**Status:** Not started
**Plan:** [PLAN-stripe-and-shippo.md](../PLAN-stripe-and-shippo.md) §11.6, §5.1
**Board and contracts:** [README.md](README.md)

## Owned files

- `src/features/legal/**` (new) — `LegalPage.tsx` (default export) and `content.ts`
- `src/main.tsx` — add **only** the `/legal/*` branch
- `progress/track-d-legal.md`

The plan names `src/app/legal/`; this track uses `src/features/legal/` so the files are covered by `npm run typecheck`.

## Tasks

- [ ] `npm ci` in the repo root
- [ ] `content.ts`: typed content for `tokushoho` (Japanese, English below), `privacy` (ja, en), `shipping` (all five languages), `returns` (ja, en)
- [ ] **Do not invent business facts.** Legal name, representative, address, phone, e-mail, processing times and policy terms are clearly marked owner placeholders (e.g. `【要記入：販売業者名】` / `[Owner to provide: legal business name]`). Structure and headings may be complete: the 特定商取引法 page lists the items §5.1 names
- [ ] Facts that are settled may be stated: free shipping within Japan; ships from Kanagawa, Japan; payment by card, Apple Pay and Google Pay through Stripe; data processors Stripe, Shippo (if used), Vercel, Sanity; the `ym-cart-v1` storage key holds slugs and quantities only. Mark the cross-border data section as pending adviser review
- [ ] `LegalPage.tsx`: reads `/legal/<slug>` from `window.location.pathname`, 404-style message for unknown slugs, language from the site's saved language preference (find how `App.tsx` stores it) with a language switcher limited to the languages that page has; Fresh Garden palette via the `--ym-*` variables, Fraunces headings, Mulish body; link back to `/`
- [ ] `/legal/*` branch in `src/main.tsx`
- [ ] Verify: `npm run typecheck`, `npm run build`; visual check in the Browser pane with the dev server on port **5175** (`npx vite --port 5175 --strictPort`), desktop and 375 px

## Blocked on owner

- Real legal notice, privacy policy and returns text from the owner and advisers (§5.1)
- Confirmation of processing and delivery times for the shipping page

## Verification log

| Date | Command | Result |
|---|---|---|

## Deviations from plan

- `src/features/legal/` instead of `src/app/legal/` (typecheck coverage).

## Requests to integrator

_None yet._

## Handoff notes

_Filled in when the track is done: list of every placeholder the owner must fill._
