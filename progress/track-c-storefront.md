# Track C — Storefront, cart and copy

**Status:** Done
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
- [x] Visual check in the Browser pane with `?commerce=mock`: both main-page themes, `/story`, five languages, 375 px width, keyboard only, `prefers-reduced-motion`. Run the dev server on port **5174** (`npx vite --port 5174 --strictPort`) so other tracks don't collide

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
| 2026-09-15 | Browser, `/?commerce=mock` (dev server 5174) | JarInfo shows `¥1,900` from the mock catalog; Add to Cart enabled; footer has the four `/legal/*?lang=en` links plus Instagram |
| 2026-09-15 | Browser, drawer keyboard | Hero Add to Cart opens drawer: line, `¥1,900`, subtotal, shipping note, Checkout; focus on Close; body scroll locked; Tab stays inside; Escape closes; focus back on the hero button; scroll lock released; nav badge `Open cart (1)` |
| 2026-09-15 | Browser, `?mock=price_changed` | Checkout → drawer shows `¥2,000` and `cart.priceChanged`; second Checkout → `/order/complete?session_id=cs_mock_paid`, paid view, `KJ-MOCK-0001`, total `¥2,000`, receipt line, cart cleared (`ym-cart-v1` removed) |
| 2026-09-15 | Browser, `/order/complete` states | `cs_mock_pending` → pending copy with order details, no receipt line; `cs_mock_null` / `cs_mock_expired` / no `session_id` → not found with Back link; `cs_mock_noname` → lines labelled `Item`; tab title follows the state |
| 2026-09-15 | Browser, `?mock=insufficient_stock` (cart mustard 3 + tapenade 1) | Checkout → mustard lowered to 1, `cart.stockLimited`, subtotal `¥4,000`, badge `(2)` |
| 2026-09-15 | Browser, `?mock=unavailable` | No `¥` anywhere in the lineup; hero and JarInfo buttons disabled (opacity 0.5, `not-allowed`); `cart.unavailable` under JarInfo |
| 2026-09-15 | Browser, `?mock=off` | No nav cart button, no Add to Cart buttons, no price; both "Order Now" links point to `#lineup` |
| 2026-09-15 | Browser, `?mock=soldout`, side-by-side layout | Mustard "Add to Cart" enabled, tapenade "Sold out" disabled |
| 2026-09-15 | Browser, `/story?commerce=mock` | Header cart button `Open cart`; card prices `¥1,900` / `¥2,100` under the size; both "Add to Cart" enabled; "Choose this flavor" unchanged (adding tapenade leaves mustard selected); footer links `/legal/*?lang=en`. Card Add to Cart opens the story-skin drawer (paper background, 420 px wide at 1280 px), focus on Close, badge `(1)` |
| 2026-09-15 | Browser, `/story` language switch | zh-TW: drawer `購物車 … 小計 ¥2,100 日本境內免運費，價格含稅。 前往結帳`, card `加入購物車`, legal links `?lang=zh-TW` with Traditional labels. zh: `购物车 … 小计 … 去结算` |
| 2026-09-15 | Browser, `/story` at 375×812 | Drawer panel 375 px = viewport width, no horizontal overflow; screenshot taken (zh drawer, legible, 44 px targets) |
| 2026-09-15 | Browser, `/` at 375×812, Wabi-Sabi theme, ja then fr | Grove-skin drawer 375 px = viewport, no horizontal overflow; panel background = `--ym-bg` (#EFEAE1), Checkout = `--ym-gold` (#A8763E), radius 2 px (Wabi-Sabi), focus on `カートを閉じる`. ja: `カート … 小計 ¥2,100 送料無料（日本国内）・税込 ご購入手続きへ`. fr: `Votre panier … Sous-total … Livraison gratuite au Japon. Prix TTC. Passer commande`, JarInfo `Ajouter au panier`, footer `/legal/*?lang=fr` with French labels. Screenshot taken |
| 2026-09-15 | `prefers-reduced-motion` | **Code review only.** The Browser pane cannot emulate reduced motion. Grove skin: `useReducedMotion()` (matchMedia with change listener) sets `transition: none` on root, backdrop and panel. Story skin: `@media (prefers-reduced-motion: reduce)` sets `transition: none !important` on `.ks-cart`, backdrop and panel. Hero/JarInfo buttons keep their existing Tailwind hover scale, as before |
| 2026-09-15 | Final `npm run typecheck` + `npm run build` + `dist/` mock search (after all fixes) | Typecheck pass; build pass; no mock strings in `dist/`; no "Ehime" in `src/features/commerce` |
| 2026-09-15 | Browser, console | "useCommerce must be used inside CommerceProvider" errors appeared only on hot-module-reloaded modules (`?t=` stamps) after editing `CommerceProvider.tsx`; a fresh page load logs no errors |

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

### Using the dev mock

Development server only (`npm run dev`, or `npx vite --port 5174 --strictPort`). `mock.ts` is imported only inside `if (import.meta.env.DEV)` in `api.ts`, so it is not in production builds (checked by searching `dist/`).

| URL | Effect |
|---|---|
| `?commerce=mock` | Mock catalog: mustard ¥1,900, tapenade ¥2,100, both available; `preserved-lemon` not for sale. Checkout → `/order/complete?session_id=cs_mock_paid` |
| `?commerce=mock&mock=pending` | Checkout → `cs_mock_pending` (complete, unpaid) |
| `?commerce=mock&mock=slow` | Catalog answers after 3 s (loading state: no price, disabled buttons) |
| `?commerce=mock&mock=off` | `{ enabled: false }` |
| `?commerce=mock&mock=unavailable` | Catalog 503 (D11 state) |
| `?commerce=mock&mock=soldout` | Tapenade `available: false` |
| `?commerce=mock&mock=price_changed` | First checkout → 409 `price_changed` (mustard ¥2,000); the next checkout succeeds |
| `?commerce=mock&mock=insufficient_stock` | Checkout finds mustard stock 1, tapenade 0 |
| `?commerce=mock&mock=not_for_sale` / `checkout_unavailable` / `network` | Checkout errors |
| `?commerce=live` | Leave mock mode |

The scenario is kept in sessionStorage (`ym-commerce-mock`), so it survives navigating between `/`, `/story` and `/order/complete` in the same tab. Order page ids: `cs_mock_paid`, `cs_mock_pending`, `cs_mock_open`, `cs_mock_expired`, `cs_mock_null` (status null), `cs_mock_noname` (empty line names); anything else → 404. The dev mock logs each request as `[commerce mock] …` in the console. Without `?commerce=mock`, the dev server has no `/api/*`, so the pages show the "unavailable" state.

### Files

- New: `src/features/commerce/{cart.ts, api.ts, money.ts, mock.ts, env.d.ts, CommerceProvider.tsx, CartDrawer.tsx, OrderCompletePage.tsx}`
- Changed: `src/app/App.tsx`, `src/app/story/StoryPage.tsx`, `src/app/story/story.css`, `src/app/i18n.ts`, `src/main.tsx` (one branch)

### Visually verified (dev server on 5174, `?commerce=mock`)

`/` in Fresh Garden (1280 px) and Wabi-Sabi (375 px); `/story` at 1280 px and 375 px; drawer copy in en, ja, fr, zh, zh-TW; keyboard-only drawer (focus to Close, Tab trap, Escape, focus return, scroll lock); `price_changed`, `insufficient_stock`, `unavailable`, `off`, `soldout`; every `/order/complete` state. Screenshots were taken of the hero, the open drawer (Fresh Garden), the story drawer at 375 px (zh) and the Wabi-Sabi drawer at 375 px (ja). Details are in the verification log. Most checks read the DOM, because the pane often timed out on screenshots while hidden.

### Known gaps

- `prefers-reduced-motion` checked by code review only (the pane cannot emulate it).
- "Buttons visually identical to the anchors they replace": same classes and inline styles, with `enabled:` hover variants; not compared pixel by pixel against the previous build.
- fr, zh and zh-TW copy (cart, order, legal labels) needs native review.
- No real end-to-end checkout: needs Track B merged, Stripe test keys and a preview deploy.
- "Buy strip" and nav "Order Now" open the drawer only when the cart has items; otherwise they scroll to `#lineup` (per §11.2).
- Main-page prices show in yen for every language (Japan-only launch, D3); the optional "Currently shipping within Japan only" note from §14 was not added beyond `cart.shippingNote`.
