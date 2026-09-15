# Track C — Storefront, cart and copy

**Status:** Not started
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

- [ ] `npm ci` in the repo root
- [ ] `cart.ts` (`ym-cart-v1`, storage wrapped in `try`), `api.ts` (typed to the contract), `money.ts` (§11.1)
- [ ] Development mock: when `import.meta.env.DEV` and the URL has `?commerce=mock`, `api.ts` returns a sample catalog (mustard ¥1,900, tapenade ¥2,100, both available) and a fake checkout URL; also a way to simulate `price_changed`, `insufficient_stock` and `unavailable`. Must be impossible in production builds
- [ ] `CommerceProvider.tsx` with every state in the §11.1 table, including `?cart=open`
- [ ] `CartDrawer.tsx`: `grove` skin (inline `--ym-*` styles) and `story` skin (`.ks-cart*` in `story.css`); accessibility and behaviour per §11.4
- [ ] `App.tsx` touchpoints per §11.2 (nav Order Now, cart button, hero, `JarInfo` price and button with slug passed at the carousel and split layouts, buy strip, footer links to the four `/legal/*` paths); buttons visually identical to the anchors they replace
- [ ] `StoryPage.tsx` touchpoints per §11.3
- [ ] `OrderCompletePage.tsx` and the `/order/complete` branch in `main.tsx` (§11.5)
- [ ] `i18n.ts`: `cart`, `order` and `legal` blocks in all five locales (§14). The legal labels are for footer links
- [ ] Verify: `npm run typecheck`, `npm run build`
- [ ] Visual check in the Browser pane with `?commerce=mock`: both main-page themes, `/story`, five languages, 375 px width, keyboard only, `prefers-reduced-motion`. Run the dev server on port **5174** (`npx vite --port 5174 --strictPort`) so other tracks don't collide

## Blocked on owner

- Native-speaker review of the French, Simplified Chinese and Traditional Chinese copy
- Real end-to-end checkout (needs Track B merged, Stripe test keys and a preview deploy)

## Verification log

| Date | Command | Result |
|---|---|---|

## Deviations from plan

_None yet._

## Requests to integrator

_None yet._

## Handoff notes

_Filled in when the track is done: how to use the mock, known gaps, screenshots taken._
