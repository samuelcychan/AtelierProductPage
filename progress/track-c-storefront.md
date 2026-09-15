# Track C — Storefront, cart and copy

**Status:** In progress
**Plan:** [PLAN-stripe-and-shippo.md](../PLAN-stripe-and-shippo.md) §11.1–11.5, §14, D11
**Board and contracts:** [README.md](README.md) — build against the HTTP API contract there; Track B implements it in parallel

## Owned files

- `src/features/commerce/**` (new)
- `src/app/App.tsx`
- `src/app/story/StoryPage.tsx`, `src/app/story/story.css`
- `src/app/i18n.ts`
- `src/main.tsx` — add **only** the `/order/complete` branch
- `progress/track-c-storefront.md`

## Tasks

- [x] `npm ci` in the repo root
- [x] `cart.ts` (`ym-cart-v1`, storage wrapped in `try`), `api.ts` (typed to the contract), `money.ts` (§11.1)
- [x] Development mock: when `import.meta.env.DEV` and the URL has `?commerce=mock`, `api.ts` returns a sample catalog (mustard ¥1,900, tapenade ¥2,100, both available) and a fake checkout URL; also a way to simulate `price_changed`, `insufficient_stock` and `unavailable`. Must be impossible in production builds
- [x] `CommerceProvider.tsx` with every state in the §11.1 table, including `?cart=open`
- [x] `CartDrawer.tsx`: `grove` skin (inline `--ym-*` styles) and `story` skin (`.ks-cart*` in `story.css`); accessibility and behaviour per §11.4
- [x] `App.tsx` touchpoints per §11.2 (nav Order Now, cart button, hero, `JarInfo` price and button with slug passed at the carousel and split layouts, buy strip, footer links to the four `/legal/*` paths); buttons visually identical to the anchors they replace
- [x] `StoryPage.tsx` touchpoints per §11.3
- [x] `OrderCompletePage.tsx` and the `/order/complete` branch in `main.tsx` (§11.5)
- [x] `i18n.ts`: `cart`, `order` and `legal` blocks in all five locales (§14). The legal labels are for footer links
- [x] Verify: `npm run typecheck`, `npm run build`
- [ ] Visual check in the Browser pane with `?commerce=mock`: both main-page themes, `/story`, five languages, 375 px width, keyboard only, `prefers-reduced-motion`. Run the dev server on port **5174** (`npx vite --port 5174 --strictPort`) so other tracks don't collide

## Blocked on owner

- Native-speaker review of the French, Simplified Chinese and Traditional Chinese copy
- Real end-to-end checkout (needs Track B merged, Stripe test keys and a preview deploy)

## Verification log

| Date | Command | Result |
|---|---|---|
| 2026-09-15 | `npm ci` | OK, 0 vulnerabilities |
| 2026-09-15 | `npm run typecheck` (after cart/api/money/mock) | Pass (after adding `src/features/commerce/env.d.ts`, see deviations) |
| 2026-09-15 | `npm run typecheck` (all Track C code) | Pass |
| 2026-09-15 | `tsc --noEmit` with a scratch config that also includes `App.tsx`, `StoryPage.tsx`, `main.tsx` | No errors in Track C code; 7 pre-existing errors remain (no `three` types in `FlavorScene.tsx`, CSS side-effect imports) |
| 2026-09-15 | `npm run build` | Pass (only the existing >500 kB `three` chunk warning); `OrderCompletePage` is its own lazy chunk |
| 2026-09-15 | `grep -rE "cs_mock\|commerce mock\|ym-commerce-mock\|mockSend" dist` | No matches: the dev mock is not in the production bundle. `https://checkout.stripe.com/` redirect check is present |

## Deviations from plan

- **Worktree base:** the worktree was created at `7889cca`; fast-forwarded to `114193d` before any work.
- **`src/features/commerce/env.d.ts`:** `src/vite-env.d.ts` declares `ImportMetaEnv` without Vite's built-in `DEV`, so `import.meta.env.DEV` did not typecheck. A global interface merge in a Track C-owned file adds `readonly DEV: boolean`.
- **Dev mock redirect:** in mock mode the fake checkout URL is `<origin>/order/complete?session_id=cs_mock_…`. `api.ts` accepts that only when the reply came from the mock; real replies must start with `https://checkout.stripe.com/`.
- **Extra context fields:** `CommerceValue.canCheckout` (ready, not busy, non-empty, every line priced and available). A cart line that is sold out or no longer for sale shows `cart.soldOut` and blocks Checkout until removed, so the drawer never sends a request that is certain to fail.
- **`add(slug)` guard:** does nothing unless `priceFor(slug)?.available` (the buttons are disabled in that case anyway).
- **Checkout error mapping:** `503`/`502 { error: "unavailable" }` → `cart.unavailable`; `not_for_sale` → `cart.error` and the product is marked not for sale locally; `400`/`403`/`415`/network → `cart.error`. The cart is always kept.
- **Catalog refresh:** opening the drawer re-fetches `/api/catalog` quietly if the last fetch is older than 60 s. Cart changes in another tab or page are followed via the `storage` event.
- **Extra copy keys:** `order.total`, `order.loading` and `order.item` (fallback when an order line name is empty, per Track B) in all five locales. The `/order/complete` fetch-failure state reuses `cart.error`.
- **Language on `/order/complete` and on cancel:** there is no saved language preference in the codebase (both pages start in English). `checkout()` saves the language to **sessionStorage `ym-checkout-lang`** just before redirecting. `/order/complete` uses it (else the browser language, else English), and `/` and `/story` restore it only when opened with `?cart=open`. Otherwise both pages still start in English.
- **Main-page footer:** the bottom row now shows the four legal links plus the existing Instagram label (`footer.links[2]`, still `href="#"`). `footer.links[0..1]` (Privacy/Shipping) are no longer rendered; the strings stay in `i18n.ts`.
- **`/story` footer:** also links the four legal pages (§11.6 "Link all four from both footers").
- **Legal link language (Track D clarification):** every legal link (`/` footer, `/story` footer, `/order/complete` footer) is `/legal/<page>?lang=<current page language>`.
- **`status: "off"`:** the nav/story cart buttons, hero Add to Cart, JarInfo buttons and story card buttons are hidden. Nav and buy-strip "Order Now" stay as links to `#lineup`.
- **`/api/order` (Track B clarification):** `status: null` is accepted and shown as not found; an empty line `name` falls back to `order.item`.

## Requests to integrator

- **Privacy page (Track D):** also mention sessionStorage `ym-checkout-lang` (language of the last checkout, this tab only), next to `ym-cart-v1`.
- **`tsconfig.json`:** `include` covers only `src/features/**`, so `npm run typecheck` does not check `App.tsx` or `StoryPage.tsx` directly. With a scratch config that adds them, Track C code is clean; 7 pre-existing errors remain (no `three` types, CSS side-effect imports). Consider widening `include` with `declare module "*.css"` and `@types/three`, or leave as is.
- **`src/main.tsx` merge:** Track C added only the `/order/complete` ternary branch between `/story` and `App`; Track D's `/legal/*` branch will touch the same expression.
- **`.claude/launch.json`** in the worktree has only the 5173 `dev` entry, and the preview tool read that config, so the visual check used a manually started `npx vite --port 5174 --strictPort`. The file was not changed.

## Handoff notes

_Filled in when the track is done: how to use the mock, known gaps, screenshots taken._
