# Track D — Legal and policy pages

**Status:** In progress
**Plan:** [PLAN-stripe-and-shippo.md](../PLAN-stripe-and-shippo.md) §11.6, §5.1
**Board and contracts:** [README.md](README.md)

## Owned files

- `src/features/legal/**` (new) — `LegalPage.tsx` (default export) and `content.ts`
- `src/main.tsx` — add **only** the `/legal/*` branch
- `progress/track-d-legal.md`

The plan names `src/app/legal/`; this track uses `src/features/legal/` so the files are covered by `npm run typecheck`.

## Tasks

- [x] `npm ci` in the repo root
- [x] `content.ts`: typed content for `tokushoho` (Japanese, English below), `privacy` (ja, en), `shipping` (all five languages), `returns` (ja, en)
- [x] **Do not invent business facts.** Legal name, representative, address, phone, e-mail, processing times and policy terms are clearly marked owner placeholders (e.g. `【要記入：販売業者名】` / `[Owner to provide: legal business name]`). Structure and headings may be complete: the 特定商取引法 page lists the items §5.1 names
- [x] Facts that are settled may be stated: free shipping within Japan; ships from Kanagawa, Japan; payment by card, Apple Pay and Google Pay through Stripe; data processors Stripe, Shippo (if used), Vercel, Sanity; the `ym-cart-v1` storage key holds slugs and quantities only. Mark the cross-border data section as pending adviser review
- [x] `LegalPage.tsx`: reads `/legal/<slug>` from `window.location.pathname`, 404-style message for unknown slugs, language from the site's saved language preference (find how `App.tsx` stores it) with a language switcher limited to the languages that page has; Fresh Garden palette via the `--ym-*` variables, Fraunces headings, Mulish body; link back to `/`
- [x] `/legal/*` branch in `src/main.tsx`
- [ ] Verify: `npm run typecheck`, `npm run build`; visual check in the Browser pane with the dev server on port **5175** (`npx vite --port 5175 --strictPort`), desktop and 375 px

## Blocked on owner

- Real legal notice, privacy policy and returns text from the owner and advisers (§5.1)
- Confirmation of processing and delivery times for the shipping page

## Verification log

| Date | Command | Result |
|---|---|---|
| 2026-09-15 | `npm ci` | OK, 0 vulnerabilities |
| 2026-09-15 | `npm run typecheck` | OK, no errors (covers `src/features/legal/**`; `src/main.tsx` is outside the tsconfig `include`) |
| 2026-09-15 | `npm run build` | OK in ~10 s; `LegalPage` is its own lazy chunk (28.7 kB, 10.7 kB gzip). The only warning is the existing >500 kB chunk-size warning for the main page |

## Deviations from plan

- `src/features/legal/` instead of `src/app/legal/` (typecheck coverage).
- **No saved language preference exists.** `App.tsx` and `StoryPage.tsx` both start with `useState<Lang>("en")` and persist neither language nor theme, so there is no storage key to read. The page picks its language from `?lang=<code>` first, then `navigator.languages` (`zh-TW`/`zh-HK`/`zh-Hant` → `zh-TW`, other `zh` → `zh`), then English, then the page's first language. Switching language rewrites `?lang=` with `history.replaceState`, so reloads and shared links keep it. I did not add a new storage key, because the privacy page would then have to list it.
- **Theme:** the page always uses the Fresh Garden defaults from `src/styles/theme.css` `:root`, because the site does not persist the theme either. No theme switcher.
- **`/legal/tokushoho` is stacked:** Japanese first, then the English translation under an "English translation" heading, as §11.6 says. The language switcher (ja/en) there changes only the page chrome: back link, draft notice, policy list and page title.
- **Privacy page also lists `ym-story-products-v1`**: an existing `localStorage` cache of product content written by `src/features/products/useStoryProducts.ts` on `/story`. It holds no personal data, but it is a browser storage key the site sets.
- **The draft notice also covers adviser-review markers**: `【要確認（専門家）：…】` / `[Pending adviser review: …]`. Placeholders in French and Chinese use localized markers: `[À compléter par le vendeur : …]`, `【待店主填写：…】`, `【待店主填寫：…】`. `hasPlaceholders()` detects all of them, and every placeholder is highlighted in the page.
- Unknown slugs, including a bare `/legal`, show a "Page not found" message with the policy list. The HTTP status is still 200, because this is an SPA rewrite.

## Requests to integrator

_None yet._

## Handoff notes

_Filled in when the track is done: list of every placeholder the owner must fill._
