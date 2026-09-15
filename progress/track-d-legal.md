# Track D — Legal and policy pages

**Status:** Done
**Plan:** [PLAN-stripe-and-shippo.md](../PLAN-stripe-and-shippo.md) §11.6, §5.1
**Board and contracts:** [README.md](README.md)

## Owned files

- `src/features/legal/**` (new): `LegalPage.tsx` (default export) and `content.ts`
- `src/main.tsx`: add **only** the `/legal/*` branch
- `progress/track-d-legal.md`

The plan names `src/app/legal/`. This track uses `src/features/legal/` so that `npm run typecheck` covers the files.

## Tasks

- [x] `npm ci` in the repo root
- [x] `content.ts`: typed content for `tokushoho` (Japanese, English below), `privacy` (ja, en), `shipping` (all five languages), `returns` (ja, en)
- [x] **Do not invent business facts.** Legal name, representative, address, phone, e-mail, processing times and policy terms are clearly marked owner placeholders (e.g. `【要記入：販売業者名】` / `[Owner to provide: legal business name]`). Structure and headings may be complete: the 特定商取引法 page lists the items §5.1 names
- [x] Facts that are settled may be stated: free shipping within Japan; ships from Kanagawa, Japan; payment by card, Apple Pay and Google Pay through Stripe; data processors Stripe, Shippo (if used), Vercel, Sanity; the `ym-cart-v1` storage key holds slugs and quantities only. Mark the cross-border data section as pending adviser review
- [x] `LegalPage.tsx`: reads `/legal/<slug>` from `window.location.pathname`, 404-style message for unknown slugs, language from the site's saved language preference (find how `App.tsx` stores it) with a language switcher limited to the languages that page has; Fresh Garden palette via the `--ym-*` variables, Fraunces headings, Mulish body; link back to `/`
- [x] `/legal/*` branch in `src/main.tsx`
- [x] Verify: `npm run typecheck`, `npm run build`; visual check in the Browser pane with the dev server on port **5175** (`npx vite --port 5175 --strictPort`), desktop and 375 px

## Blocked on owner

- Real legal notice, privacy policy and returns text from the owner and advisers (§5.1)
- Confirmation of processing and delivery times for the shipping page

## Verification log

| Date | Command | Result |
|---|---|---|
| 2026-09-15 | `npm ci` | OK, 0 vulnerabilities |
| 2026-09-15 | `npm run typecheck` | OK, no errors (covers `src/features/legal/**`; `src/main.tsx` is outside the tsconfig `include`) |
| 2026-09-15 | `npm run build` | OK in ~10 s; `LegalPage` is its own lazy chunk (28.7 kB, 10.7 kB gzip). The only warning is the existing >500 kB chunk-size warning for the main page |
| 2026-09-15 | Visual check, `npx vite --port 5175 --strictPort`, Browser pane (browser languages `zh-TW, en-US, ja`) | See the checklist below |

Visual check details:

- **Desktop, `/legal/tokushoho`:** Japanese is the `h1` and the English translation follows as an `h2` article (`lang="ja"`, then `lang="en"`). Headings are Fraunces and body text is Mulish. The draft notice is shown with 22 highlighted placeholders. The switcher offers only ja/en. Links to shipping and returns carry `?lang=` for their article's language.
- **Unknown slugs:** `/legal/nope` and a bare `/legal` show "Page not found" in the browser language (zh-TW here), with no draft notice, the five-language switcher and the policy list.
- **`?lang=` fallback:** `/legal/privacy?lang=fr` falls back to English, since French isn't available, with a ja/en switcher. `/legal/shipping?lang=fr` renders the French page with a French draft notice, and all five languages are in the switcher.
- **Main page:** `/` still renders the main page, so routing is unaffected.
- **375 px:** tokushoho, privacy (ja, scrolled through the services section), shipping (zh-TW) and returns (ja) all render. Field rows stack label over value, placeholders wrap, and there is no horizontal overflow on any of them (`scrollWidth <= innerWidth`).
- **Language switch:** on `/legal/returns?lang=ja` the switcher changes to English. The `h1`, `<html lang>` and title update, and the URL becomes `?lang=en`.

## Deviations from plan

- `src/features/legal/` instead of `src/app/legal/` (typecheck coverage).
- **No saved language preference exists.** `App.tsx` and `StoryPage.tsx` both start with `useState<Lang>("en")` and persist neither language nor theme, so there is no storage key to read. The page picks its language from `?lang=<code>` first, then `navigator.languages` (`zh-TW`/`zh-HK`/`zh-Hant` → `zh-TW`, other `zh` → `zh`), then English, then the page's first language. Switching language rewrites `?lang=` with `history.replaceState`, so reloads and shared links keep it. I did not add a new storage key, because the privacy page would then have to list it.
- **Theme:** the page always uses the Fresh Garden defaults from `src/styles/theme.css` `:root`, because the site does not persist the theme either. No theme switcher.
- **`/legal/tokushoho` is stacked:** Japanese first, then the English translation under an "English translation" heading, as §11.6 says. The language switcher (ja/en) there changes only the page chrome: back link, draft notice, policy list and page title.
- **Privacy page also lists `ym-story-products-v1`**: an existing `localStorage` cache of product content written by `src/features/products/useStoryProducts.ts` on `/story`. It holds no personal data, but it is a browser storage key the site sets.
- **The draft notice also covers adviser-review markers**: `【要確認（専門家）：…】` / `[Pending adviser review: …]`. Placeholders in French and Chinese use localized markers: `[À compléter par le vendeur : …]`, `【待店主填写：…】`, `【待店主填寫：…】`. `hasPlaceholders()` detects all of them, and every placeholder is highlighted in the page.
- Unknown slugs, including a bare `/legal`, show a "Page not found" message with the policy list. The HTTP status is still 200, because this is an SPA rewrite.

## Requests to integrator

1. **Track C footer links:** link to `/legal/<slug>?lang=${lang}` so the legal page opens in the visitor's current site language. The page ignores a `lang` it doesn't have and falls back as described above, so passing it on every link is safe. Titles for the links are in §14 `legal.*`. The page's own titles are in `LEGAL_CHROME[lang].titles` in `src/features/legal/content.ts`, if you want them to match.
2. **`src/main.tsx` merge:** Track D replaced the `: lazy(() => import("./app/App"))` line with a `/^\/legal(\/|$)/` branch that ends in that same line. Track C's `/order/complete` branch will touch the same ternary, so resolve by keeping both branches.
3. If a site-wide language preference is ever persisted, e.g. in `localStorage`, update `resolveLang()` in `LegalPage.tsx` to read it, and add the key to the privacy page's browser storage section.
4. `.claude/launch.json` is tracked in the repo (`dev`, port 5173), and the Browser pane's `preview_start` reads the main checkout's copy. I ran Vite on 5175 from Bash instead and did not modify or commit that file.

## Handoff notes

**What was built:** `/legal/tokushoho`, `/legal/privacy`, `/legal/shipping` and `/legal/returns`, rendered by `src/features/legal/LegalPage.tsx` from `src/features/legal/content.ts`. To fill in a placeholder, replace the whole marker string in `content.ts`, e.g. `todoJa("電話番号")` → `"045-…"`. Once no marker remains in the text a visitor sees, the draft notice disappears for that page and language on its own. Keep the ja and en versions consistent.

### Placeholders the owner must fill (every one in `content.ts`)

Each item exists in Japanese and English unless noted otherwise. The shipping page items also exist in French, Simplified Chinese and Traditional Chinese.

**`/legal/tokushoho`: 11 items (ja + en)**
1. 最終更新日 / last updated date
2. 販売業者の正式名称（法人名または個人事業主の氏名） / legal business name
3. 運営統括責任者の氏名 / person responsible for operations
4. 所在地（番地・建物名まで） / full business address
5. 電話番号 / phone number
6. 電話受付時間 / phone hours
7. お問い合わせ用メールアドレス / contact e-mail
8. 送料以外にお客様にご負担いただく費用の有無と金額 / other charges the buyer pays
9. 代金をお支払いいただく時期 / when payment is charged
10. ご注文から発送・お届けまでの目安 / time from order to dispatch and delivery
11. 返品・交換の条件（お客様都合の場合／破損・不良品の場合） / return and exchange conditions

**`/legal/privacy`: 10 owner items + 2 adviser-review items (ja + en)**
1. 制定日・最終改定日 / effective and last updated date
2. 事業者の正式名称 / legal business name
3. 代表者の氏名 / representative
4. 所在地 / business address
5. 個人情報に関するお問い合わせ用メールアドレス / privacy enquiry e-mail. Appears twice: under 事業者情報 and under お問い合わせ窓口.
6. 上記以外に取得する個人情報（お問い合わせメールの内容など） / other personal information collected
7. その他の利用目的（該当する場合） / other purposes of use
8. 個人データの安全管理のために講じている措置 / security measures
9. 保有個人データの開示・訂正・削除・利用停止等のご請求の手続きと手数料の有無 / procedure and fees for disclosure, correction, deletion and suspension requests
10. **Adviser review:** whether data shared with Stripe, Shippo, Vercel and Sanity counts as 委託 (entrustment) or 第三者提供 (provision to a third party) under the APPI
11. **Adviser review (cross-border section):** 外国にある第三者への提供. The recipient countries, those countries' data-protection systems and the measures the recipients take.

**`/legal/shipping`: 8 items (ja, en, fr, zh, zh-TW)**
1. 最終更新日 / last updated date
2. お支払い完了から発送までの日数 / time from payment to dispatch
3. 発送を行わない日（定休日・祝日・長期休業など） / days with no dispatch
4. 配送業者・配送方法 / carrier and method
5. 発送からお届けまでの目安 / expected delivery time
6. お届け日時の指定の可否 / whether a delivery date or time slot can be chosen
7. 発送のお知らせと追跡番号をお送りする方法と時期 / how and when the shipping notice and tracking number are sent
8. お届けできなかった場合・荷物が返送された場合の対応 / what happens if a parcel is undeliverable or returned

**`/legal/returns`: 8 items (ja + en)**
1. 最終更新日 / last updated date
2. お客様都合による返品・交換の可否と条件（開封前・開封後） / change-of-mind returns, before and after opening
3. 対応内容（返金・交換など）と条件 / remedy for damaged, defective or wrong items, and its conditions
4. 商品到着後のご連絡期限 / deadline for contacting the shop after delivery
5. 連絡先メールアドレスと、ご連絡時にお知らせいただく内容 / contact e-mail and what to include in the message
6. 返品送料の負担 / who pays return shipping
7. 返金の時期 / when refunds are issued
8. お支払い後のキャンセルの可否と期限 / whether and until when an order can be cancelled

### Stated as fact: owner please confirm

These sentences are not placeholders, but they rest on the plan or on how the code works rather than on an owner statement:

- **"配送地域：日本国内" / "We currently ship within Japan only":** from D2, Japan-only launch. The existing FAQ copy mentions international shipping.
- **"Price as shown on product pages and in the cart (tax included)":** from D8 and the §14 cart copy.
- **Stripe e-mails the payment receipt:** D10.
- **Stripe checkout collects name, e-mail, address and phone:** §5.1. Phone collection depends on Track B's Checkout Session settings.
- **Card details never reach the shop's servers:** hosted Checkout, D1.
- **Refunds go to the original payment method through Stripe.**
- **Sanity stores no personal data; shipping records hold only order number, time, products and quantities:** §13.
- **"Some of the services listed are operated by companies outside Japan."**

The French, Simplified Chinese and Traditional Chinese text on the shipping page, and the English translations, need a native-speaker review (§14).

Nothing on these pages is legal advice. Every page shows the draft notice until the owner and advisers have replaced all markers.
