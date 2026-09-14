# PLAN3 — Product Editing with a Hosted CMS (Sanity)

Implementation plan for **Option C** from the admin-architecture comparison: product content moves to Sanity, the owner edits it in a Sanity-hosted Studio, and the Vite storefront reads it from Sanity's CDN at runtime. No `api/` directory, no database, no custom authentication, no GitHub deploy per edit.

Companion documents: [PLAN.md](PLAN.md) (Option A, custom build — the source of the requirements this plan inherits) and the published comparison page *Three Ways to Edit the Jars*.

---

## 0. Summary

| | |
|---|---|
| **Goal** | Kimie edits product names, descriptions, tags, prices, sizes, visibility, order, and photos — in five languages — and the storefront reflects a published change within seconds, with no code change and no redeploy. |
| **Editing surface** | Sanity Studio, deployed to `https://<hostname>.sanity.studio`. Nothing is added to this app's routes. |
| **Content store** | Sanity Content Lake, public dataset `production`, Free plan. |
| **Storefront read** | `@sanity/client` → `apicdn.sanity.io`, one query that returns all active products in all five languages; language switching stays instant and client-side. |
| **Images** | Sanity asset CDN via `@sanity/image-url`; resized, cropped to the 4:5 frame around the owner's hotspot, and served as WebP/AVIF automatically. |
| **Resilience** | Last good response cached in `localStorage`; bundled fallback built from today's `i18n.ts` data and local images, so the page never renders an empty lineup. |
| **Scope of code change** | New `studio/` folder (separate package), new `src/features/products/` module, a refactor of `Lineup`/`JarPhotoFrame`/`JarInfo` in `App.tsx`, one line in `Recipes`. `/story`, `vercel.json`, and all non-product copy are untouched. |
| **Estimated effort** | 23–39 hours (itemised in §15). |
| **Recurring cost** | $0 on Sanity Free. Vercel plan unchanged. |

### Correction to the earlier review

The earlier review stated that product prices are USD strings in all five locales and proposed seeding `1600 / 1300 / 1400` minor units of USD. **That was wrong** — only `en` is USD. Each locale carries its own market price in its own currency (verified in §1.3). This plan therefore stores **one price per currency** rather than a single price, and maps each language to its market. See decision D1.

---

## 1. Verified starting state

Facts this plan depends on, checked against `main` @ `fdae220` on 2026-09-14.

### 1.1 Toolchain and repository

| Fact | Evidence |
|---|---|
| Node `v22.14.0`, npm `10.9.2` locally | `node -v`, `npm -v` — satisfies Sanity Studio v6's Node ≥ 22.12 requirement |
| Vite 6.3.5, React 18.3.1, Tailwind 4.1.12 | `package.json` |
| **No TypeScript toolchain**: no `typescript` package, no `tsconfig.json`, no `@types/react` | `package.json`, repo root; `.tsx` is compiled by esbuild with no type checking |
| No `vite-env.d.ts`; `src/media.d.ts` exists | `ls src` |
| No use of `import.meta.env` anywhere | `grep -rn "import.meta.env" src` → no results |
| Tailwind scans only `src/**` | `src/styles/tailwind.css`: `@import 'tailwindcss' source(none); @source '../**/*.{js,ts,jsx,tsx}';` — a root-level `studio/` folder will not leak classes into the storefront CSS |
| `.gitignore` already ignores `node_modules/` at any depth, `dist/`, `.env`, `.env.local`, `.env.*.local` | `.gitignore` |
| `vercel.json` is a single SPA catch-all rewrite | `{ "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }] }` — no change needed because no API routes are added |
| `/story` is dispatched by pathname in `src/main.tsx`, not by a router | `src/main.tsx:5` |
| `/story` does not read `lineup` data | `src/app/story/*` imports its own `copy.ts` and static images only |
| Git remote | `https://github.com/samuelcychan/AtelierProductPage.git` |

### 1.2 Product rendering in `src/app/App.tsx` (989 lines)

| Location | What it does | Why it matters |
|---|---|---|
| `:7–10` | Imports the four jar photos: `jar_mustard_studio.jpg`, `jar_tapenade.png`, `jar_mustard_wabisabi.jpg`, `jar_tapenade_wabisabi.jpg` | Move to the fallback module |
| `:17` | `type ThemeKey = "grove" \| "wabi"` (local, not exported) | The products module needs it; export it from there and import it here |
| `:465` | `type JarKey = "mustard" \| "tapenade"` | Hard-codes two products — remove |
| `:467–476` | `JAR_PHOTOS` map, 3 slots per jar per theme; TABLE and DETAIL slots have `src: null` | Replace with CMS photos; see D4 about the empty slots |
| `:478–533` | `JarPhotoFrame` renders `slotHint` ("Drop the mustard sauce jar photo") **to visitors** when a slot is empty | Behaviour change, D4 |
| `:535–557` | `JarInfo` reads `item.jp`, `item.name`, `item.desc`, `item.price`, `item.size` | Retype to the new view model |
| `:565–566` | `T.lineup.items[1]` = mustard, `T.lineup.items[2]` = tapenade | Fixed indexes — remove |
| `:568–569` | `slide % 2` selects the current jar | Hard-coded count |
| `:596–617` | **Both** the "Previous jar" and "Next jar" buttons call `setSlide((slide + 1) % 2)` | Latent bug: harmless with 2 products, wrong with 3 — fix in the refactor |
| `:620` | Dots rendered from the literal `[0, 1]` | Hard-coded count |
| `:630` | Counter text `0{(slide % 2) + 1} / 02` | Hard-coded count |
| `:580` | Heading uses `T.twoJar.h1` / `T.twoJar.h2` ("Two jars, one small atelier.") | Site copy that assumes two products |
| `:678` | Recipes: `c.tile \|\| (i === 1 ? T.lineup.items[2].jp : T.lineup.items[1].jp)` | Reaches into product data by index |
| `:955–981` | `App` owns `lang` and `theme` state and provides `UICtx`; `<Lineup />` is the first section after `<Hero />` | Where the products provider mounts |

### 1.3 Product data in `src/app/i18n.ts` (610 lines)

`export type Lang = "en" | "ja" | "fr" | "zh" | "zh-TW"` (`:1`). `CLAUDE.md` says four languages — it is out of date.

`lineup.items` per locale: index 0 preserved lemon (**not rendered by `Lineup`**), index 1 mustard, index 2 tapenade.

| Product | `en` | `ja` | `fr` | `zh` | `zh-TW` | Size |
|---|---|---|---|---|---|---|
| Preserved lemon | `$16` | `¥2,400` | `15 €` | `¥115` | `NT$500` | 350g |
| Whole-grain mustard sauce | `$13` | `¥1,900` | `12 €` | `¥91` | `NT$400` | 200g |
| Tapenade sauce | `$14` | `¥2,100` | `13 €` | `¥101` | `NT$440` | 200g |

Currencies by locale: `en` USD · `ja` JPY · `fr` EUR · `zh` CNY · `zh-TW` TWD.

Other fields per item: `jp` (eyebrow label), `name`, `tag`, `desc`, `slotHint`. `hero.price` (`"¥2,400"` in every locale) is **not referenced** by `App.tsx` and is out of scope.

### 1.4 Price formatting — verified so the CMS path renders today's exact strings

Run with Node 22 ICU on 2026-09-14:

| Language | Currency | `Intl` locale that matches | Output | Matches today |
|---|---|---|---|---|
| `en` | USD | `en-US` | `$16` | Yes |
| `ja` | JPY | **`en-US`** | `¥2,400` (U+00A5) | Yes — `ja-JP` produces full-width `￥` (U+FFE5), which does **not** match |
| `fr` | EUR | `fr-FR` | `15 €` with U+00A0 no-break space | Visually identical; the no-break space is an improvement (price never wraps) |
| `zh` | CNY | `zh-CN` | `¥115` | Yes |
| `zh-TW` | TWD | **`en-US`** | `NT$500` | Yes — `zh-TW` produces a bare `$500`, which does **not** match |

Fraction digits: `minimumFractionDigits: 0, maximumFractionDigits: 2` renders `13.5` as `$13.5`, which is wrong. The formatter must use **0 digits for whole amounts and exactly 2 otherwise** (`$13`, `$13.50`).

---

## 2. Target architecture

```text
Kimie ──(Google / GitHub / email login)──▶ Sanity Studio  https://<hostname>.sanity.studio
                                                │ publish
                                                ▼
                                   Sanity Content Lake — dataset "production" (public)
                                     │                                  │
                         apicdn.sanity.io (GROQ)               cdn.sanity.io (images)
                                     │                                  │
                                     ▼                                  ▼
           Vite/React storefront on Vercel ── src/features/products/ ── <img srcset>
                     │
                     ├─ 1. localStorage cache (last good response) — rendered immediately
                     ├─ 2. live fetch (timeout 2.5 s) — replaces cache on success
                     └─ 3. bundled fallback from i18n.ts + src/assets — if no cache and fetch fails
```

### Repository layout after this plan

```text
studio/                              NEW — standalone Sanity Studio package (own package.json + lockfile)
  package.json
  package-lock.json
  sanity.config.ts
  sanity.cli.ts
  tsconfig.json
  schemaTypes/
    index.ts
    languages.ts
    product.ts
    validation.ts
  scripts/
    seed.ts
src/
  features/
    products/                        NEW
      config.ts                      reads VITE_SANITY_* env
      client.ts                      @sanity/client instance
      query.ts                       GROQ query
      types.ts                       CMS + view-model types, ThemeKey
      format.ts                      formatPrice, formatSize
      localize.ts                    pick a language value with English fallback
      image.ts                       @sanity/image-url helpers
      fallback.ts                    view models built from i18n.ts + local images
      ProductsProvider.tsx           fetch, cache, fallback; useProducts()
  vite-env.d.ts                      NEW — ImportMetaEnv typing
  app/
    App.tsx                          EDITED — Lineup, JarPhotoFrame, JarInfo, Recipes, App root
tsconfig.json                        NEW — scoped type checking
.github/workflows/sanity-backup.yml  NEW
CLAUDE.md                            EDITED
```

Why `studio/` is a separate package rather than an npm workspace: Studio v6 brings its own React and a large dependency tree, and this repo's `pnpm-workspace.yaml` is a Figma Make leftover that `CLAUDE.md` says to leave alone. Two independent `package.json` files keep the storefront's React 18 install and Vercel build completely unaffected.

---

## 3. Decisions to confirm before starting

Each has a recommendation; the plan is written assuming the recommendation.

| ID | Decision | Recommendation | Consequence if changed |
|---|---|---|---|
| **D1** | Prices | **One price per market, as today**: USD (`en`), JPY (`ja`), EUR (`fr`), CNY (`zh`), TWD (`zh-TW`). Stored in major units (`13`, `1900`, `12.5`), not minor units — there is no checkout, and asking the owner to type `50000` for NT$500 invites errors. | A single global currency simplifies the schema to one field but changes what four of five audiences see today. |
| **D2** | Where the Studio lives | **Sanity-hosted** at `<hostname>.sanity.studio`. | Embedding at `/admin` adds a router (colliding with the `/story` pathname dispatch) and a large dependency to this bundle. |
| **D3** | Owner's role | **Administrator** — the Sanity Free plan offers only Administrator and Viewer. | Least-privilege "Editor" requires the Growth plan ($15/seat/month). Mitigated here by removing the Delete action in the Studio (§5.4). |
| **D4** | Empty photo slots | **Stop showing "Drop the … photo" placeholders to visitors.** Render only uploaded photos; hide the arrows, dots and counter when a product has one photo in the current theme. | Keeping placeholders means keeping `slotHint` copy in all five languages in the CMS. |
| **D5** | Preserved lemon | **Seed it with `isActive: false`.** It exists at `items[0]` but is not rendered today. | Seeding it active immediately shows a third jar, and the heading "Two jars" becomes wrong (handled in §8.5, but it is a visible change). |
| **D6** | Language completeness | **Block publishing** when `name`, `description`, or any price is missing; **warn** for `eyebrow`, `tag`, and photo alt text. The storefront falls back to English for any missing string. | Warn-only lets a product go live with a blank French name. |
| **D7** | Names | Sanity project `Kimie Jars`, Studio hostname `kimie-jars` (if taken, `kimie-jars-studio`). | Cosmetic. |

---

## 4. Working conventions

- Branch: `feat/sanity-products` from `main`. One commit per phase below; open a PR at the end of Phase 9.
- Use **npm** (per `CLAUDE.md`). In PowerShell, use `npm.cmd` / `npx.cmd` if the execution policy blocks `npm`.
- Run Studio commands from `studio/`; run storefront commands from the repo root.
- Never commit a Sanity token. The storefront needs none; seeding uses the logged-in CLI session (`--with-user-token`); CI backups use a GitHub Actions secret.
- Do not touch `src/app/components/ui/`, `vite.config.ts` plugins, `assetsInclude`, `pnpm-workspace.yaml`, or the peer-dependency arrangement in `package.json` (all per `CLAUDE.md`).

---

## 5. Phase 1 — Sanity project and Studio

**Outcome:** a deployed, empty Studio at `https://kimie-jars.sanity.studio` with the language plugin installed, the Delete action removed, and Kimie invited.

### 5.1 Branch

```bash
git switch main
git pull
git switch -c feat/sanity-products
```

### 5.2 Create the project and scaffold `studio/`

From the repo root, run the interactive initialiser and answer the prompts as below. Interactive answers are used deliberately instead of CLI flags, because flag names have changed across `create-sanity` releases.

```bash
npm create sanity@latest
```

| Prompt | Answer |
|---|---|
| Login provider | Google or GitHub — the account that should **own** the project (not Kimie's) |
| Select project | *Create new project* |
| Project name | `Kimie Jars` |
| Use the default dataset configuration? | **Yes** → dataset `production`, visibility **public** |
| Project output path | `studio` |
| Select project template | *Clean project with no predefined schema types* |
| Use TypeScript? | **Yes** |
| Package manager | **npm** |

Verify:

```bash
ls studio
cat studio/sanity.cli.ts
```

- `studio/package.json`, `studio/package-lock.json`, `studio/sanity.config.ts`, `studio/sanity.cli.ts`, `studio/schemaTypes/index.ts` exist.
- `sanity.cli.ts` contains `projectId: '<PROJECT_ID>'` and `dataset: 'production'`. **Record the project ID** — it is public (it ships in the storefront bundle) and is needed in §8.1 and §10.
- `studio/.gitignore` exists and ignores at least `/node_modules`, `/dist`, and `.sanity`. Add any that are missing.

Confirm the dataset is public: <https://www.sanity.io/manage> → *Kimie Jars* → *Datasets* → `production` shows **Public**. (The Free plan only allows public datasets; public is also required for the storefront to read without a token.)

### 5.3 Install the language plugin and gate on its version

```bash
cd studio
npm install sanity-plugin-internationalized-array
npm ls sanity-plugin-internationalized-array
```

**Gate:** the installed version must be **5.x or later**. From v5 the plugin stores each value as `{ _key, _type, language, value }`; earlier versions used `_key` as the language id. Every GROQ query and the seed script in this plan assume the `language` field. If `npm ls` shows 4.x, install `sanity-plugin-internationalized-array@latest` and re-check.

### 5.4 `studio/sanity.config.ts`

Replace the generated file. Keep the generated `projectId`.

```ts
import {defineConfig} from 'sanity'
import {structureTool} from 'sanity/structure'
import {visionTool} from '@sanity/vision'
import {internationalizedArray} from 'sanity-plugin-internationalized-array'
import {schemaTypes} from './schemaTypes'
import {LANGUAGES, LANGUAGE_IDS} from './schemaTypes/languages'

export default defineConfig({
  name: 'default',
  title: 'Kimie Jars',

  projectId: '<PROJECT_ID>',
  dataset: 'production',

  plugins: [
    structureTool({
      structure: (S) =>
        S.list()
          .title('Content')
          .items([
            S.listItem()
              .title('Products')
              .schemaType('product')
              .child(
                S.documentTypeList('product')
                  .title('Products')
                  .defaultOrdering([{field: 'sortOrder', direction: 'asc'}]),
              ),
          ]),
    }),
    internationalizedArray({
      languages: [...LANGUAGES],
      // Show all five language rows on every new product, so a missing
      // translation is visible rather than hidden behind an "add language" button.
      defaultLanguages: [...LANGUAGE_IDS],
      fieldTypes: ['string', 'text'],
    }),
    // GROQ playground for the developer; harmless for the owner.
    visionTool(),
  ],

  schema: {types: schemaTypes},

  document: {
    // No permanent deletion of products (inherits PLAN.md's rule). Hiding a
    // product is done with the "Show on site" switch instead.
    actions: (prev, context) =>
      context.schemaType === 'product'
        ? prev.filter(({action}) => action !== 'delete')
        : prev,
  },
})
```

If the Clean template did not install `@sanity/vision`, either `npm install @sanity/vision` or remove the `visionTool` import and plugin entry.

### 5.5 Run locally

```bash
cd studio
npm run dev
```

Open <http://localhost:3333>, sign in, and confirm an empty *Products* list renders. (It will error until §6 adds the schema — do §6 before judging this step.)

### 5.6 Deploy the hosted Studio

```bash
cd studio
npx sanity deploy
```

- Hostname: `kimie-jars` (fallback `kimie-jars-studio`).
- If the CLI prints an `appId` and asks you to add `deployment: { appId: '…' }` to `sanity.cli.ts`, do so and commit it — later deploys then skip the hostname prompt.
- The deploy registers `https://kimie-jars.sanity.studio` as a CORS origin **with credentials** automatically. Confirm under *manage → API → CORS origins*.

### 5.7 Invite the owner

*manage → Kimie Jars → Members → Invite members* → Kimie's email → role **Administrator** (D3). Recommend she signs in with a Google account that has 2-step verification enabled; the Studio has no separate password.

### 5.8 Commit

```bash
git add studio
git commit -m "chore(studio): scaffold Sanity Studio in studio/"
```

---

## 6. Phase 2 — Content schema

**Outcome:** Kimie can create a product with five-language copy, five market prices, a size, visibility, order, and themed photos; incomplete required content cannot be published.

### 6.1 `studio/schemaTypes/languages.ts`

The ids **must equal** `Lang` in `src/app/i18n.ts:1` — the storefront passes its current `lang` straight into the lookup.

```ts
export const LANGUAGES = [
  {id: 'en', title: 'English'},
  {id: 'ja', title: '日本語'},
  {id: 'fr', title: 'Français'},
  {id: 'zh', title: '简体中文'},
  {id: 'zh-TW', title: '繁體中文'},
] as const

export type LanguageId = (typeof LANGUAGES)[number]['id']

export const LANGUAGE_IDS: LanguageId[] = LANGUAGES.map((l) => l.id)
```

### 6.2 `studio/schemaTypes/validation.ts`

```ts
import {LANGUAGE_IDS} from './languages'

type LocalizedValue = {language?: string; value?: string}

export function missingLanguages(value: LocalizedValue[] | undefined): string[] {
  const filled = new Set(
    (value ?? []).filter((v) => typeof v.value === 'string' && v.value.trim() !== '').map((v) => v.language),
  )
  return LANGUAGE_IDS.filter((id) => !filled.has(id))
}

/** `true` when every language has a non-empty value, otherwise a message naming the gaps. */
export function allLanguages(value: LocalizedValue[] | undefined): true | string {
  const missing = missingLanguages(value)
  return missing.length === 0 || `Missing: ${missing.join(', ')}`
}
```

Use `rule.custom(allLanguages)` to block publishing, or `rule.custom(allLanguages).warning()` to only warn (D6).

### 6.3 `studio/schemaTypes/product.ts`

```ts
import {defineArrayMember, defineField, defineType} from 'sanity'
import {allLanguages} from './validation'

// Values must match ThemeKey in the storefront. Titles match the labels
// visitors see in the site's theme switcher (App.tsx THEMES[*].label).
const THEMES = [
  {title: 'Fresh Garden', value: 'grove'},
  {title: 'Wabi-Sabi', value: 'wabi'},
]

// Values are rendered verbatim in the photo counter ("STUDIO · 01/02").
const SHOTS = [
  {title: 'Studio', value: 'STUDIO'},
  {title: 'Table', value: 'TABLE'},
  {title: 'Detail', value: 'DETAIL'},
]

// One price per market (D1). Major units: 13 means $13, 1900 means ¥1,900.
const PRICES = [
  {name: 'usd', title: 'USD — English site', wholeOnly: false},
  {name: 'jpy', title: 'JPY — Japanese site', wholeOnly: true},
  {name: 'eur', title: 'EUR — French site', wholeOnly: false},
  {name: 'cny', title: 'CNY — Simplified Chinese site', wholeOnly: false},
  {name: 'twd', title: 'TWD — Traditional Chinese site', wholeOnly: true},
] as const

export const product = defineType({
  name: 'product',
  title: 'Product',
  type: 'document',

  groups: [
    {name: 'copy', title: 'Words', default: true},
    {name: 'commerce', title: 'Price & size'},
    {name: 'photos', title: 'Photos'},
    {name: 'settings', title: 'Visibility & order'},
  ],

  fields: [
    // ── Words ────────────────────────────────────────────────────────────
    defineField({
      name: 'name',
      title: 'Product name',
      type: 'internationalizedArrayString',
      group: 'copy',
      validation: (rule) => rule.custom(allLanguages),
    }),
    defineField({
      name: 'eyebrow',
      title: 'Small label above the name',
      description: 'The gold line above the product name.',
      type: 'internationalizedArrayString',
      group: 'copy',
      validation: (rule) => rule.custom(allLanguages).warning(),
    }),
    defineField({
      name: 'tag',
      title: 'Badge',
      description: 'Short badge on the corner of the photo, for example "New".',
      type: 'internationalizedArrayString',
      group: 'copy',
      validation: (rule) => rule.custom(allLanguages).warning(),
    }),
    defineField({
      name: 'description',
      title: 'Description',
      type: 'internationalizedArrayText',
      group: 'copy',
      validation: (rule) => rule.custom(allLanguages),
    }),

    // ── Price & size ─────────────────────────────────────────────────────
    defineField({
      name: 'prices',
      title: 'Prices',
      description: 'Each language version of the site shows its own currency.',
      type: 'object',
      group: 'commerce',
      options: {columns: 2},
      validation: (rule) => rule.required(),
      fields: PRICES.map(({name, title, wholeOnly}) =>
        defineField({
          name,
          title,
          type: 'number',
          validation: (rule) =>
            wholeOnly ? rule.required().min(0).integer() : rule.required().min(0).precision(2),
        }),
      ),
    }),
    defineField({
      name: 'sizeValue',
      title: 'Size',
      type: 'number',
      group: 'commerce',
      validation: (rule) => rule.required().positive(),
    }),
    defineField({
      name: 'sizeUnit',
      title: 'Unit',
      type: 'string',
      group: 'commerce',
      initialValue: 'g',
      options: {list: ['g', 'ml'], layout: 'radio', direction: 'horizontal'},
      validation: (rule) => rule.required(),
    }),

    // ── Photos ───────────────────────────────────────────────────────────
    defineField({
      name: 'photos',
      title: 'Photos',
      description: 'Shown in this order. Each photo belongs to one site theme. Set the focal point with the crop tool — the site crops to a 4:5 frame.',
      type: 'array',
      group: 'photos',
      of: [
        defineArrayMember({
          type: 'image',
          options: {hotspot: true},
          validation: (rule) => rule.required().assetRequired(),
          fields: [
            defineField({
              name: 'theme',
              title: 'Theme',
              type: 'string',
              options: {list: THEMES, layout: 'radio', direction: 'horizontal'},
              validation: (rule) => rule.required(),
            }),
            defineField({
              name: 'style',
              title: 'Shot',
              type: 'string',
              initialValue: 'STUDIO',
              options: {list: SHOTS, layout: 'radio', direction: 'horizontal'},
              validation: (rule) => rule.required(),
            }),
            defineField({
              name: 'alt',
              title: 'Description for screen readers',
              type: 'internationalizedArrayString',
              validation: (rule) => rule.custom(allLanguages).warning(),
            }),
          ],
          preview: {
            select: {media: 'asset', theme: 'theme', style: 'style'},
            prepare: ({media, theme, style}) => ({
              media,
              title: `${style ?? 'No shot type'} · ${THEMES.find((t) => t.value === theme)?.title ?? 'No theme'}`,
            }),
          },
        }),
      ],
      validation: (rule) =>
        rule
          .custom((photos: Array<{theme?: string}> | undefined) => {
            const missing = THEMES.filter((t) => !(photos ?? []).some((p) => p.theme === t.value))
            return missing.length === 0 || `No photo for ${missing.map((t) => t.title).join(' or ')} — that theme will show an empty frame.`
          })
          .warning(),
    }),

    // ── Visibility & order ───────────────────────────────────────────────
    defineField({
      name: 'isActive',
      title: 'Show on site',
      description: 'Turn off to hide this jar without deleting anything.',
      type: 'boolean',
      group: 'settings',
      initialValue: false,
    }),
    defineField({
      name: 'sortOrder',
      title: 'Position',
      description: 'Lower numbers appear first. Use gaps (10, 20, 30) so a jar can be slotted in between.',
      type: 'number',
      group: 'settings',
      initialValue: 100,
      validation: (rule) => rule.required().integer().min(0),
    }),
    defineField({
      name: 'internalTitle',
      title: 'Name in this list',
      description: 'Only shown here in the Studio.',
      type: 'string',
      group: 'settings',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'slug',
      title: 'ID',
      description: 'Do not change after launch — recipe cards on the site find products by this ID.',
      type: 'slug',
      group: 'settings',
      options: {source: 'internalTitle', maxLength: 48},
      validation: (rule) => rule.required(),
    }),
  ],

  orderings: [
    {title: 'Site order', name: 'sortOrderAsc', by: [{field: 'sortOrder', direction: 'asc'}]},
  ],

  preview: {
    select: {title: 'internalTitle', isActive: 'isActive', sortOrder: 'sortOrder', media: 'photos.0.asset'},
    prepare: ({title, isActive, sortOrder, media}) => ({
      title: title ?? 'Untitled product',
      subtitle: `${isActive ? 'On site' : 'Hidden'} · position ${sortOrder ?? '—'}`,
      media,
    }),
  },
})
```

### 6.4 `studio/schemaTypes/index.ts`

```ts
import {product} from './product'

export const schemaTypes = [product]
```

### 6.5 Verify

With `npm run dev` running in `studio/`:

1. *Products → Create* opens a form with four tabs: Words, Price & size, Photos, Visibility & order.
2. All five language rows appear under each text field without clicking "add".
3. Leave the French name empty → **Publish** is disabled with "Missing: fr".
4. Type `1900.5` into JPY → validation error (whole numbers only).
5. Upload any image to Photos without choosing a theme → error on the photo.
6. The document menu (⋯) has **no Delete** entry.
7. In *Vision*, run `*[_type == "product"][0]{name}` against the draft (enable drafts perspective) → each entry has a `language` field. This confirms the v5 shape the storefront depends on.
8. Discard the test draft.

Then redeploy and commit:

```bash
cd studio
npx sanity deploy
cd ..
git add studio
git commit -m "feat(studio): product schema with five-language copy and per-market prices"
```

---

## 7. Phase 3 — Seed the dataset from today's content

**Outcome:** the three products exist in `production` with every string from `i18n.ts`, the four jar photos uploaded, mustard and tapenade visible, preserved lemon hidden (D5) — and a guard proves the CMS path will render **byte-for-byte the same prices and sizes** the site shows today.

Approach: a TypeScript script run with `sanity exec --with-user-token`, which reuses the developer's logged-in CLI session. No API token is created. The NDJSON import route is not used: its `_sanityAsset` helper needs absolute `file:///` URIs, the docs give no guidance for Windows paths, and this repo's path contains spaces. Uploading through the client also de-duplicates automatically, because Sanity asset ids are derived from the file's content hash.

### 7.1 Create `src/features/products/format.ts` first

The seed's guard and the storefront share this file, so it is written now. It uses a **relative** import, because the `@` alias from `vite.config.ts` does not exist when `sanity exec` loads the file. Keep it free of React and asset imports for the same reason.

```ts
import type { Lang } from "../../app/i18n";

export type PriceField = "usd" | "jpy" | "eur" | "cny" | "twd";
export type Prices = Record<PriceField, number>;

// Intl locales chosen to reproduce the storefront's existing price strings
// exactly (verified with Node 22 ICU). ja-JP renders a full-width "￥" and
// zh-TW renders a bare "$", so JPY and TWD go through en-US ("¥2,400", "NT$500").
export const MARKETS: Record<Lang, { field: PriceField; currency: string; locale: string }> = {
  en:      { field: "usd", currency: "USD", locale: "en-US" },
  ja:      { field: "jpy", currency: "JPY", locale: "en-US" },
  fr:      { field: "eur", currency: "EUR", locale: "fr-FR" },
  zh:      { field: "cny", currency: "CNY", locale: "zh-CN" },
  "zh-TW": { field: "twd", currency: "TWD", locale: "en-US" },
};

export function formatPrice(prices: Partial<Prices> | undefined, lang: Lang): string {
  const { field, currency, locale } = MARKETS[lang];
  const amount = prices?.[field];
  if (typeof amount !== "number" || !Number.isFinite(amount)) return "";
  // Whole amounts show no decimals ("$13"); anything else shows exactly two ("$13.50", never "$13.5").
  const digits = Number.isInteger(amount) ? 0 : 2;
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(amount);
}

export function formatSize(value: number | undefined, unit: string | undefined): string {
  return typeof value === "number" && unit ? `${value}${unit}` : "";
}
```

### 7.2 `studio/scripts/seed.ts`

```ts
/**
 * One-time seed of products from src/app/i18n.ts and src/assets.
 *
 *   cd studio
 *   npx sanity exec scripts/seed.ts --with-user-token -- --dry-run
 *   npx sanity exec scripts/seed.ts --with-user-token
 *   npx sanity exec scripts/seed.ts --with-user-token -- --force   # overwrite existing products
 *
 * After launch the CMS is the source of truth. Re-running with --force
 * DISCARDS the owner's edits to these three products.
 */
import {createReadStream, existsSync} from 'node:fs'
import path from 'node:path'
import {getCliClient} from 'sanity/cli'
import {translations, type Lang} from '../../src/app/i18n'
import {formatPrice, formatSize, type Prices} from '../../src/features/products/format'

const LANGS: Lang[] = ['en', 'ja', 'fr', 'zh', 'zh-TW']
const args = new Set(process.argv.slice(2))
const DRY_RUN = args.has('--dry-run')
const FORCE = args.has('--force')

type SeedPhoto = {file: string; theme: 'grove' | 'wabi'; style: 'STUDIO' | 'TABLE' | 'DETAIL'}
type SeedProduct = {
  slug: string
  index: number // position in translations[lang].lineup.items
  internalTitle: string
  isActive: boolean
  sortOrder: number
  sizeValue: number
  sizeUnit: 'g'
  prices: Prices
  photos: SeedPhoto[]
}

// Prices and sizes transcribed from i18n.ts; the guard below fails the run
// if any of them would render differently from the current site.
const SEED: SeedProduct[] = [
  {
    slug: 'mustard', index: 1, internalTitle: 'Whole-Grain Mustard Sauce',
    isActive: true, sortOrder: 10, sizeValue: 200, sizeUnit: 'g',
    prices: {usd: 13, jpy: 1900, eur: 12, cny: 91, twd: 400},
    photos: [
      {file: 'jar_mustard_studio.jpg', theme: 'grove', style: 'STUDIO'},
      {file: 'jar_mustard_wabisabi.jpg', theme: 'wabi', style: 'STUDIO'},
    ],
  },
  {
    slug: 'tapenade', index: 2, internalTitle: 'Tapenade Sauce',
    isActive: true, sortOrder: 20, sizeValue: 200, sizeUnit: 'g',
    prices: {usd: 14, jpy: 2100, eur: 13, cny: 101, twd: 440},
    photos: [
      {file: 'jar_tapenade.png', theme: 'grove', style: 'STUDIO'},
      {file: 'jar_tapenade_wabisabi.jpg', theme: 'wabi', style: 'STUDIO'},
    ],
  },
  {
    slug: 'preserved-lemon', index: 0, internalTitle: 'Preserved Lemon',
    isActive: false, sortOrder: 30, sizeValue: 350, sizeUnit: 'g',
    prices: {usd: 16, jpy: 2400, eur: 15, cny: 115, twd: 500},
    photos: [], // no preserved-lemon photo exists in src/assets yet
  },
]

const key = (lang: Lang) => lang.replace('-', '_')

function localized(type: 'String' | 'Text', pick: (lang: Lang) => string) {
  return LANGS.map((lang) => ({
    _key: key(lang),
    _type: `internationalizedArray${type}Value`,
    language: lang,
    value: pick(lang),
  }))
}

// ── Guard: CMS formatting must equal today's strings ─────────────────────────
function assertFormattingMatches() {
  const problems: string[] = []
  for (const p of SEED) {
    for (const lang of LANGS) {
      const item = translations[lang].lineup.items[p.index]
      // Intl's French output uses a no-break space (U+00A0); the source uses a normal space.
      const price = formatPrice(p.prices, lang).replace(/\u00A0/g, ' ')
      const size = formatSize(p.sizeValue, p.sizeUnit)
      if (price !== item.price) problems.push(`${p.slug} ${lang} price: CMS "${price}" vs site "${item.price}"`)
      if (size !== item.size) problems.push(`${p.slug} ${lang} size: CMS "${size}" vs site "${item.size}"`)
    }
  }
  if (problems.length) {
    console.error('Formatting guard failed:\n  ' + problems.join('\n  '))
    process.exit(1)
  }
  console.log('Formatting guard passed: 15 prices and 15 sizes match the current site.')
}

async function main() {
  if (path.basename(process.cwd()) !== 'studio') {
    console.error('Run this from the studio/ folder.')
    process.exit(1)
  }
  assertFormattingMatches()

  const client = getCliClient({apiVersion: '2026-09-14'})
  const ids = SEED.map((p) => `product-${p.slug}`)
  const existing: string[] = await client.fetch('*[_id in $ids || _id in $draftIds]._id', {
    ids,
    draftIds: ids.map((id) => `drafts.${id}`),
  })
  if (existing.length && !FORCE) {
    console.error(`Refusing to overwrite existing documents: ${existing.join(', ')}\nRe-run with -- --force only if discarding the owner's edits is intended.`)
    process.exit(1)
  }

  const assetsDir = path.resolve(process.cwd(), '..', 'src', 'assets')
  const tx = client.transaction()

  for (const p of SEED) {
    const photos = []
    for (const photo of p.photos) {
      const file = path.join(assetsDir, photo.file)
      if (!existsSync(file)) throw new Error(`Missing asset: ${file}`)
      const assetId = DRY_RUN
        ? `image-dry-run-${photo.file}`
        : (await client.assets.upload('image', createReadStream(file), {filename: photo.file}))._id
      photos.push({
        _key: `${photo.theme}-${photo.style.toLowerCase()}`,
        _type: 'image',
        asset: {_type: 'reference', _ref: assetId},
        theme: photo.theme,
        style: photo.style,
        alt: localized('String', (lang) => translations[lang].lineup.items[p.index].name),
      })
    }

    const doc = {
      _id: `product-${p.slug}`,
      _type: 'product',
      internalTitle: p.internalTitle,
      slug: {_type: 'slug', current: p.slug},
      isActive: p.isActive,
      sortOrder: p.sortOrder,
      name: localized('String', (lang) => translations[lang].lineup.items[p.index].name),
      eyebrow: localized('String', (lang) => translations[lang].lineup.items[p.index].jp),
      tag: localized('String', (lang) => translations[lang].lineup.items[p.index].tag),
      description: localized('Text', (lang) => translations[lang].lineup.items[p.index].desc),
      prices: p.prices,
      sizeValue: p.sizeValue,
      sizeUnit: p.sizeUnit,
      photos,
    }

    if (DRY_RUN) console.log(JSON.stringify(doc, null, 2))
    tx.createOrReplace(doc)
    // Remove a stale draft so the Studio shows the seeded version.
    tx.delete(`drafts.${doc._id}`)
  }

  if (DRY_RUN) {
    console.log('Dry run: nothing written.')
    return
  }
  await tx.commit()
  console.log(`Seeded ${SEED.length} products.`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
```

Notes:

- **Ids are deterministic** (`product-mustard`, …) and the ids have no `drafts.` prefix, so `createOrReplace` publishes them directly.
- **`slotHint` is not seeded** (D4). `lineup.heading`, `lineup.cta`, `lineup.sectionLabel`, `lineup.footerNote`, and `twoJar` stay in `i18n.ts` — they are section copy, not product data.
- **Alt text is seeded as the product name** in each language, because the site has no alt text today (it renders `"<tag> — <style>"`). Kimie should replace it with a real description; the schema warns until she does.

### 7.3 Run

```bash
cd studio
npx sanity exec scripts/seed.ts --with-user-token -- --dry-run
```

Check the dry-run output: it prints `Formatting guard passed: 15 prices and 15 sizes match the current site.`, then three documents with five language entries per field. Then run it for real:

```bash
npx sanity exec scripts/seed.ts --with-user-token
```

### 7.4 Verify

1. Studio → *Products* lists, in order: Whole-Grain Mustard Sauce (*On site · position 10*), Tapenade Sauce (*On site · 20*), Preserved Lemon (*Hidden · 30*).
2. Open Tapenade → *Photos* shows two images, labelled *STUDIO · Fresh Garden* and *STUDIO · Wabi-Sabi*; the PNG shows correctly.
3. No validation errors on mustard or tapenade. Warnings are expected only for missing Wabi-Sabi/Fresh Garden photos on Preserved Lemon.
4. In *Vision* (published perspective):

   ```groq
   count(*[_type == "product" && isActive == true])
   ```

   returns `2`.
5. Running the seed again without `--force` exits with *Refusing to overwrite existing documents*.

### 7.5 Commit

```bash
git add studio/scripts/seed.ts src/features/products/format.ts
git commit -m "feat(products): seed Sanity from i18n.ts with a price-formatting guard"
```

---

## 8. Phase 4 — Storefront integration

**Outcome:** the lineup renders from Sanity in all five languages and both themes, with a cache and a bundled fallback; `/story` and every other section are unchanged.

Code in `src/` follows the storefront's existing style: double quotes, semicolons, inline `style` objects using `var(--ym-*)`, no hard-coded palette hexes (`CLAUDE.md`).

### 8.1 Dependencies and environment

```bash
npm install @sanity/client @sanity/image-url
```

Both go in `dependencies`. Do not touch the `peerDependencies` block.

Create `.env.local` in the repo root. `.gitignore` excludes every env file (`.env` and `.env.*`), so it never reaches Git:

```bash
# Public values — they are compiled into the browser bundle by design.
# The storefront uses no Sanity token.
VITE_SANITY_PROJECT_ID=
VITE_SANITY_DATASET=production
VITE_SANITY_API_VERSION=2026-09-14
```

Fill in the project ID from §5.2. The other two lines are optional: those values are the defaults in `config.ts`. Vite restarts its dev server when `.env.local` changes.

Create `src/vite-env.d.ts`. It declares `ImportMeta` directly instead of referencing `vite/client`, to avoid colliding with the existing `src/media.d.ts` asset declarations:

```ts
interface ImportMetaEnv {
  readonly VITE_SANITY_PROJECT_ID?: string;
  readonly VITE_SANITY_DATASET?: string;
  readonly VITE_SANITY_API_VERSION?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
```

### 8.2 Module files

#### `src/features/products/types.ts`

```ts
import type { Prices } from "./format";

export type ThemeKey = "grove" | "wabi";

export type Localized = Array<{ _key?: string; language?: string; value?: string }>;

/** One photo exactly as PRODUCTS_QUERY returns it. */
export interface CmsPhoto {
  _key: string;
  theme?: ThemeKey;
  style?: string;
  alt?: Localized;
  asset?: { _ref: string; _type?: string };
  crop?: { top: number; bottom: number; left: number; right: number };
  hotspot?: { x: number; y: number; height: number; width: number };
  width?: number;
  height?: number;
  lqip?: string;
}

/** One product exactly as PRODUCTS_QUERY returns it — all languages included. */
export interface CmsProduct {
  slug: string;
  sortOrder?: number;
  name?: Localized;
  eyebrow?: Localized;
  tag?: Localized;
  description?: Localized;
  prices?: Partial<Prices>;
  sizeValue?: number;
  sizeUnit?: string;
  photos?: CmsPhoto[];
}

/** What the Lineup renders: one language, formatted, ready to display. */
export interface PhotoView {
  key: string;
  src: string;
  srcSet?: string;
  alt: string;
  style: string;
  width?: number;
  height?: number;
  placeholder?: string; // low-quality blurred data URI
}

export interface ProductView {
  slug: string;
  eyebrow: string;
  name: string;
  tag: string;
  description: string;
  priceLabel: string;
  sizeLabel: string;
  photos: Record<ThemeKey, PhotoView[]>;
}

export type ProductsSource = "loading" | "cms" | "cache" | "fallback";
```

#### `src/features/products/config.ts`

```ts
const env = import.meta.env;

export const SANITY = {
  projectId: env.VITE_SANITY_PROJECT_ID?.trim() ?? "",
  dataset: env.VITE_SANITY_DATASET?.trim() || "production",
  apiVersion: env.VITE_SANITY_API_VERSION?.trim() || "2026-09-14",
};

// Kill switch: removing VITE_SANITY_PROJECT_ID in Vercel and redeploying
// makes the storefront render the bundled products without any code change.
export const isSanityConfigured = /^[a-z0-9-]+$/.test(SANITY.projectId);
```

#### `src/features/products/client.ts`

Created lazily: `createClient` throws on a missing project ID, and an unconfigured build must still render.

```ts
import { createClient, type SanityClient } from "@sanity/client";
import { SANITY } from "./config";

let client: SanityClient | null = null;

export function getClient(): SanityClient {
  client ??= createClient({
    projectId: SANITY.projectId,
    dataset: SANITY.dataset,
    apiVersion: SANITY.apiVersion,
    useCdn: true,             // apicdn.sanity.io
    perspective: "published", // never drafts; no token is sent
  });
  return client;
}
```

#### `src/features/products/query.ts`

One request returns every active product in **all** languages. The storefront picks the language client-side, so switching languages stays instant, as it is today, and needs no refetch.

```ts
export const PRODUCTS_QUERY = /* groq */ `
*[_type == "product" && isActive == true && defined(slug.current)] | order(sortOrder asc) {
  "slug": slug.current,
  sortOrder,
  name, eyebrow, tag, description,
  prices, sizeValue, sizeUnit,
  "photos": photos[defined(asset._ref)]{
    _key, theme, style, alt, asset, crop, hotspot,
    "width": asset->metadata.dimensions.width,
    "height": asset->metadata.dimensions.height,
    "lqip": asset->metadata.lqip
  }
}`;
```

#### `src/features/products/localize.ts`

English fallback happens here rather than in GROQ, which keeps the query language-agnostic.

```ts
import type { Lang } from "../../app/i18n";
import type { Localized } from "./types";

/** The value for `lang`; otherwise English; otherwise an empty string. */
export function pick(values: Localized | undefined, lang: Lang): string {
  const find = (language: string) =>
    values?.find((v) => v.language === language && v.value?.trim())?.value?.trim();
  return find(lang) ?? find("en") ?? "";
}
```

#### `src/features/products/image.ts`

`JarPhotoFrame` is `aspect-ratio: 4/5`, so every URL is cropped server-side to 4:5 around the owner's hotspot, and the format is negotiated automatically (WebP/AVIF). This closes the image-conversion gap PLAN.md's Phase 4 left without an owner.

```ts
import { createImageUrlBuilder } from "@sanity/image-url";
import { SANITY } from "./config";
import type { CmsPhoto } from "./types";

const WIDTHS = [480, 720, 960, 1280];
const HEIGHT_PER_WIDTH = 5 / 4; // 4:5 frame

let builder: ReturnType<typeof createImageUrlBuilder> | null = null;

function urlAt(photo: CmsPhoto, width: number): string {
  builder ??= createImageUrlBuilder({ projectId: SANITY.projectId, dataset: SANITY.dataset });
  return builder
    .image(photo)
    .width(width)
    .height(Math.round(width * HEIGHT_PER_WIDTH))
    .fit("crop")
    .auto("format")
    .quality(80)
    .url();
}

export function photoSources(photo: CmsPhoto): { src: string; srcSet: string; width: number; height: number } {
  return {
    src: urlAt(photo, 960),
    srcSet: WIDTHS.map((w) => `${urlAt(photo, w)} ${w}w`).join(", "),
    width: 960,
    height: Math.round(960 * HEIGHT_PER_WIDTH),
  };
}
```

### 8.3 `src/features/products/fallback.ts`

The fallback reproduces exactly what the site renders before this plan: the two sauces at `lineup.items[1]` and `[2]`, the four bundled photos, and the i18n price strings verbatim. If the CMS is unreachable, the page looks as it does today.

```ts
import jarMustardPhoto from "@/assets/jar_mustard_studio.jpg";
import jarTapenadePhoto from "@/assets/jar_tapenade.png";
import jarMustardWabiPhoto from "@/assets/jar_mustard_wabisabi.jpg";
import jarTapenadeWabiPhoto from "@/assets/jar_tapenade_wabisabi.jpg";
import { translations, type Lang } from "@/app/i18n";
import type { PhotoView, ProductView, ThemeKey } from "./types";

const ITEMS = [
  { slug: "mustard", index: 1, grove: jarMustardPhoto as string, wabi: jarMustardWabiPhoto as string },
  { slug: "tapenade", index: 2, grove: jarTapenadePhoto as string, wabi: jarTapenadeWabiPhoto as string },
] as const;

export function fallbackProducts(lang: Lang): ProductView[] {
  return ITEMS.map(({ slug, index, grove, wabi }) => {
    const item = translations[lang].lineup.items[index];
    const photo = (theme: ThemeKey, src: string): PhotoView[] => [
      { key: `${slug}-${theme}`, src, alt: item.name, style: "STUDIO" },
    ];
    return {
      slug,
      eyebrow: item.jp,
      name: item.name,
      tag: item.tag,
      description: item.desc,
      priceLabel: item.price,
      sizeLabel: item.size,
      photos: { grove: photo("grove", grove), wabi: photo("wabi", wabi) },
    };
  });
}
```

### 8.4 `src/features/products/ProductsProvider.tsx`

Loading policy, in order:

1. **Not configured** (no project ID) → bundled fallback, no network request.
2. **Cached response in `localStorage`** → render it immediately; fetch live data in the background.
3. **Live response within 2.5 s** → render it and refresh the cache.
4. **No cache and no response within 2.5 s, or an error** → bundled fallback.
5. **Live response after the 2.5 s timeout** → written to the cache for the next visit but **not swapped in**, so prices never change under a visitor who is already reading them.

```tsx
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { Lang } from "@/app/i18n";
import { getClient } from "./client";
import { isSanityConfigured } from "./config";
import { fallbackProducts } from "./fallback";
import { formatPrice, formatSize } from "./format";
import { photoSources } from "./image";
import { pick } from "./localize";
import { PRODUCTS_QUERY } from "./query";
import type { CmsProduct, ProductView, ProductsSource } from "./types";

const CACHE_KEY = "ym-products-v1"; // bump when PRODUCTS_QUERY's shape changes
const TIMEOUT_MS = 2500;

function isProductList(value: unknown): value is CmsProduct[] {
  return Array.isArray(value) && value.every((p) => p && typeof p === "object" && typeof (p as CmsProduct).slug === "string");
}

function readCache(): CmsProduct[] | null {
  try {
    const raw = window.localStorage.getItem(CACHE_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : null;
    return isProductList(parsed) ? parsed : null;
  } catch {
    return null; // storage blocked, private mode, or corrupt JSON
  }
}

function writeCache(data: CmsProduct[]) {
  try {
    window.localStorage.setItem(CACHE_KEY, JSON.stringify(data));
  } catch {
    // quota exceeded or storage blocked — the live data still renders
  }
}

function toView(p: CmsProduct, lang: Lang): ProductView {
  const photos: ProductView["photos"] = { grove: [], wabi: [] };
  for (const photo of p.photos ?? []) {
    if (photo.theme !== "grove" && photo.theme !== "wabi") continue;
    const { src, srcSet, width, height } = photoSources(photo);
    photos[photo.theme].push({
      key: photo._key,
      src,
      srcSet,
      width,
      height,
      alt: pick(photo.alt, lang) || pick(p.name, lang),
      style: photo.style ?? "STUDIO",
      placeholder: photo.lqip,
    });
  }
  return {
    slug: p.slug,
    eyebrow: pick(p.eyebrow, lang),
    name: pick(p.name, lang),
    tag: pick(p.tag, lang),
    description: pick(p.description, lang),
    priceLabel: formatPrice(p.prices, lang),
    sizeLabel: formatSize(p.sizeValue, p.sizeUnit),
    photos,
  };
}

type State = { data: CmsProduct[] | null; source: ProductsSource };

const ProductsCtx = createContext<{
  products: ProductView[] | null; // null only while loading with no cache
  source: ProductsSource;
  bySlug: (slug: string) => ProductView | undefined;
}>({ products: null, source: "loading", bySlug: () => undefined });

export function ProductsProvider({ lang, children }: { lang: Lang; children: ReactNode }) {
  const [state, setState] = useState<State>(() => {
    if (!isSanityConfigured) return { data: null, source: "fallback" };
    const cached = readCache();
    return cached ? { data: cached, source: "cache" } : { data: null, source: "loading" };
  });

  useEffect(() => {
    if (!isSanityConfigured) return;
    let active = true;
    let timedOut = false;
    const controller = new AbortController();

    const timer = window.setTimeout(() => {
      timedOut = true;
      if (active) setState((prev) => (prev.data ? prev : { data: null, source: "fallback" }));
    }, TIMEOUT_MS);

    getClient()
      .fetch<unknown>(PRODUCTS_QUERY, {}, { signal: controller.signal })
      .then((data) => {
        if (!isProductList(data)) throw new Error("Unexpected products response shape");
        writeCache(data);
        if (active && !timedOut) setState({ data, source: "cms" });
      })
      .catch((err: unknown) => {
        if (!active) return;
        console.warn("[products] live fetch failed; rendering cached or bundled products", err);
        setState((prev) => (prev.data ? prev : { data: null, source: "fallback" }));
      })
      .finally(() => window.clearTimeout(timer));

    return () => {
      active = false;
      window.clearTimeout(timer);
      controller.abort();
    };
  }, []);

  const value = useMemo(() => {
    const products =
      state.source === "fallback" ? fallbackProducts(lang)
      : state.data ? state.data.map((p) => toView(p, lang))
      : null;
    return {
      products,
      source: state.source,
      bySlug: (slug: string) => products?.find((p) => p.slug === slug),
    };
  }, [state, lang]);

  return <ProductsCtx.Provider value={value}>{children}</ProductsCtx.Provider>;
}

export const useProducts = () => useContext(ProductsCtx);
```

Behaviour worth knowing:

- An **empty array** from the CMS (Kimie hid every product) is valid data, not an error: the lineup section hides itself (§8.5) rather than falling back to bundled jars she deliberately hid.
- A returning visitor whose cache is older than a publish sees the older data for the fetch's duration (typically well under a second), and the section then updates — unless the update arrives after the timeout, per rule 5.

### 8.5 Refactor the lineup in `src/app/App.tsx`

Make these edits in order. Line numbers refer to `main` @ `fdae220` and shift as you edit, so match on the quoted code.

#### (a) Imports — lines 7–10

Delete the four jar-photo imports (they now live in `fallback.ts`):

```ts
import jarMustardPhoto from "@/assets/jar_mustard_studio.jpg";
import jarTapenadePhoto from "@/assets/jar_tapenade.png";
import jarMustardWabiPhoto from "@/assets/jar_mustard_wabisabi.jpg";
import jarTapenadeWabiPhoto from "@/assets/jar_tapenade_wabisabi.jpg";
```

After the `@/app/i18n` import (line 14), add:

```ts
import { ProductsProvider, useProducts } from "@/features/products/ProductsProvider";
import type { ProductView, ThemeKey } from "@/features/products/types";
```

#### (b) Theme key — line 17

Delete `type ThemeKey = "grove" | "wabi";`. `THEMES: Record<ThemeKey, …>` keeps compiling against the imported type.

#### (c) Replace `JarKey`, `JAR_PHOTOS`, `JarPhotoFrame`, and `JarInfo` — lines 464–557

Replace everything from `// ─── Lineup (the two sauces) ───` through the closing brace of `JarInfo` with:

```tsx
// ─── Lineup ───────────────────────────────────────────────────────────────────
function JarPhotoFrame({ product, theme, idx, onChange }: {
  product: ProductView; theme: ThemeKey; idx: number; onChange: (i: number) => void;
}) {
  const photos = product.photos[theme];
  const count = photos.length;
  const i = count ? idx % count : 0;
  const cur = photos[i];

  return (
    <div className="relative" style={{ aspectRatio: "4/5", background: "var(--ym-bg)", border: "1px solid var(--ym-rule-10)", padding: 12 }}>
      {cur ? (
        <img
          key={cur.key}
          src={cur.src}
          srcSet={cur.srcSet}
          sizes="(min-width: 768px) 50vw, 100vw"
          width={cur.width}
          height={cur.height}
          alt={cur.alt}
          loading="lazy"
          decoding="async"
          className="w-full h-full object-cover block"
          // Blurred preview from the CMS shows until the real image paints.
          style={cur.placeholder ? { backgroundImage: `url(${cur.placeholder})`, backgroundSize: "cover" } : undefined}
        />
      ) : (
        <div className="w-full h-full" style={{ background: "var(--ym-bg-alt)" }} aria-hidden="true" />
      )}
      {product.tag && (
        <div className="absolute -top-3 -left-3 px-3 py-1" style={{ background: "var(--ym-gold)", ...body, fontSize: "0.6rem", letterSpacing: "0.15em", color: "var(--ym-fg-dark)" }}>
          {product.tag}
        </div>
      )}
      {count > 1 && (
        <>
          <div className="absolute z-[3] top-5 right-5 px-[0.55rem] py-[0.2rem]" style={{ background: "rgba(255,255,255,0.88)", ...body, fontSize: "0.6rem", letterSpacing: "0.16em", color: "var(--ym-fg-dark)" }}>
            {cur.style} · {pad(i + 1)}/{pad(count)}
          </div>
          <button
            onClick={() => onChange((i - 1 + count) % count)}
            aria-label="Previous photo"
            className="absolute z-[3] left-5 top-1/2 -translate-y-1/2 flex items-center justify-center hover:bg-white transition-colors"
            style={{ width: 34, height: 34, background: "rgba(255,255,255,0.88)", color: "var(--ym-fg-dark)", borderRadius: "var(--ym-radius)" }}
          >
            <ChevronLeft size={16} />
          </button>
          <button
            onClick={() => onChange((i + 1) % count)}
            aria-label="Next photo"
            className="absolute z-[3] right-5 top-1/2 -translate-y-1/2 flex items-center justify-center hover:bg-white transition-colors"
            style={{ width: 34, height: 34, background: "rgba(255,255,255,0.88)", color: "var(--ym-fg-dark)", borderRadius: "var(--ym-radius)" }}
          >
            <ChevronRight size={16} />
          </button>
          <div className="absolute z-[3] left-0 right-0 flex items-center justify-center gap-1.5" style={{ bottom: "1.4rem" }}>
            {photos.map((p, pi) => (
              <button
                key={p.key}
                onClick={() => onChange(pi)}
                aria-label={`${product.name} photo ${pi + 1}`}
                className="transition-all duration-250"
                style={{ height: 3, width: pi === i ? "1.5rem" : "0.5rem", background: pi === i ? "var(--ym-gold)" : "rgba(0,0,0,0.22)" }}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function JarInfo({ item, cta, padTop = false }: { item: ProductView; cta: string; padTop?: boolean }) {
  return (
    <div className={`flex flex-col ${padTop ? "flex-1" : ""}`} style={padTop ? { paddingTop: "1.75rem" } : undefined}>
      {item.eyebrow && <div style={{ ...body, fontSize: "0.7rem", letterSpacing: "0.12em", color: "var(--ym-gold)" }}>{item.eyebrow}</div>}
      <h3 style={{ ...display, fontSize: "clamp(1.6rem, 2.6vw, 2.4rem)", fontWeight: 600, lineHeight: 1.1, color: "var(--ym-fg)", margin: "0.4rem 0 0" }}>{item.name}</h3>
      <p style={{ ...body, fontSize: "0.95rem", color: "var(--ym-muted)", lineHeight: 1.75, margin: "1.25rem 0 0", maxWidth: "30rem" }}>{item.description}</p>
      <div className="flex items-end justify-between gap-6" style={{ marginTop: "2rem", paddingTop: "1.5rem", borderTop: "1px solid var(--ym-rule)" }}>
        <div>
          <div style={{ ...display, fontSize: "1.9rem", fontWeight: 600, color: "var(--ym-fg)" }}>{item.priceLabel}</div>
          <div style={{ ...body, fontSize: "0.68rem", letterSpacing: "0.14em", color: "var(--ym-muted)" }}>{item.sizeLabel}</div>
        </div>
        <a
          href="#buy"
          className="flex items-center whitespace-nowrap font-semibold hover:scale-[1.04] active:scale-[0.96] transition-transform duration-200"
          style={{ ...body, gap: "0.6rem", fontSize: "0.82rem", padding: "0.85rem 1.6rem", borderRadius: "var(--ym-radius)", background: "var(--ym-gold)", color: "var(--ym-fg-dark)" }}
        >
          <ShoppingBag size={16} />
          {cta}
        </a>
      </div>
    </div>
  );
}
```

What changed versus today, deliberately:

| Change | Reason |
|---|---|
| Empty slots render a plain tinted frame; `slotHint` is gone | D4 — visitors no longer see "Drop the … photo" |
| Counter, arrows and dots render only when a product has 2+ photos in the current theme | D4 |
| `alt` comes from the CMS (localized) instead of `"<tag> — <style>"` | Real alt text |
| `srcSet`/`sizes`, intrinsic `width`/`height`, `loading="lazy"`, LQIP background | Responsive images; no layout shift |
| Dots keyed by photo key, labelled with the product name | Stable keys; readable labels instead of `"mustard photo 1"` |

#### (d) Replace `function Lineup()` — lines 559–656

```tsx
function Lineup() {
  const { T, th, theme } = useUI();
  const { products, source } = useProducts();
  const [layout, setLayout] = useState<"carousel" | "split">("carousel");
  const [slide, setSlide] = useState(0);
  const [photoIdx, setPhotoIdx] = useState<Record<string, number>>({});

  // Every product hidden in the CMS: hide the section rather than show bundled jars.
  if (products && products.length === 0) return null;

  const count = products?.length ?? 0;
  const current = products && count ? products[slide % count] : null;
  const isCarousel = layout === "carousel";
  // Section copy lives in i18n.ts. It has wording for two and three jars only;
  // any other count needs new copy in all five locales.
  const heading = count === 3 ? T.lineup.heading : [T.twoJar.h1, T.twoJar.h2];

  const idxFor = (slug: string) => photoIdx[slug] ?? 0;
  const setIdx = (slug: string) => (i: number) => setPhotoIdx((p) => ({ ...p, [slug]: i }));
  const go = (delta: number) => setSlide((s) => (((s + delta) % count) + count) % count);

  return (
    <section id="lineup" data-products-source={source} className="py-28" style={{ background: "var(--ym-bg-alt)" }}>
      <div className="max-w-7xl mx-auto px-6">
        <Reveal>
          <SectionLabel n="01" label={T.lineup.sectionLabel} />
          <div className="flex flex-wrap items-end justify-between gap-8 mb-16">
            <h2 style={{ ...display, fontSize: "clamp(2rem, 5vw, 3.8rem)", fontWeight: 600, lineHeight: 1.05, color: "var(--ym-fg)", margin: 0 }}>
              {heading[0]}<br /><em>{heading[1]}</em>
            </h2>
            {/* layout toggle: keep the two existing <button>s from main unchanged */}
          </div>
        </Reveal>

        {!products ? (
          // Loading with no cache (at most 2.5 s): reserve the layout so nothing jumps.
          <div className="grid items-center" aria-busy="true" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "4rem" }}>
            <div style={{ aspectRatio: "4/5", background: "var(--ym-bg)", border: "1px solid var(--ym-rule-10)" }} />
            <div style={{ minHeight: "18rem" }} />
          </div>
        ) : isCarousel && current ? (
          <div className="grid items-center" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "4rem" }}>
            <JarPhotoFrame key={current.slug} product={current} theme={theme} idx={idxFor(current.slug)} onChange={setIdx(current.slug)} />
            <div className="flex flex-col">
              <JarInfo item={current} cta={T.lineup.cta} />
              {count > 1 && (
                <div className="flex items-center" style={{ marginTop: "2.5rem", gap: "1.5rem" }}>
                  <button
                    onClick={() => go(-1)}
                    aria-label="Previous jar"
                    className="flex items-center justify-center transition-all duration-200 hover:bg-[var(--ym-bg)]"
                    style={{ width: 44, height: 44, border: "1px solid var(--ym-rule-15)", color: "var(--ym-fg)", borderRadius: "var(--ym-radius)" }}
                  >
                    <ChevronLeft size={18} />
                  </button>
                  <button
                    onClick={() => go(1)}
                    aria-label="Next jar"
                    className="flex items-center justify-center transition-all duration-200 hover:bg-[var(--ym-bg)]"
                    style={{ width: 44, height: 44, border: "1px solid var(--ym-rule-15)", color: "var(--ym-fg)", borderRadius: "var(--ym-radius)" }}
                  >
                    <ChevronRight size={18} />
                  </button>
                  <div className="flex items-center ml-2" style={{ gap: "0.6rem" }}>
                    {products.map((p, i) => (
                      <button
                        key={p.slug}
                        onClick={() => setSlide(i)}
                        aria-label={p.name}
                        className="transition-all duration-250"
                        style={{ height: 2, width: slide % count === i ? "2.25rem" : "1rem", background: slide % count === i ? "var(--ym-gold)" : "var(--ym-rule-15)" }}
                      />
                    ))}
                  </div>
                  <span className="ml-auto" style={{ ...body, fontSize: "0.7rem", letterSpacing: "0.18em", color: "var(--ym-muted)" }}>
                    {pad((slide % count) + 1)} / {pad(count)}
                  </span>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "3.5rem" }}>
            {products.map((p) => (
              <div key={p.slug} className="flex flex-col">
                <JarPhotoFrame product={p} theme={theme} idx={idxFor(p.slug)} onChange={setIdx(p.slug)} />
                <JarInfo item={p} cta={T.lineup.cta} padTop />
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
```

The layout-toggle placeholder comment stands for the two existing `Carousel` / `Side by side` buttons (`main` lines 582–597), copied unchanged — they already use `th` and `isCarousel`.

Fixes folded in:

- **Previous-jar bug**: "Previous" now calls `go(-1)`. On `main` both buttons advanced forward.
- **Hard-coded two**: `% 2`, `[0, 1]`, and `0{n} / 02` are now derived from `count`. `pad()` already exists at `App.tsx:97`.
- **Hooks order**: the early `return null` comes after every hook call.

### 8.6 Recipes — line 678

`Recipes` reads the tile label from product data by index. Look it up by slug instead, keeping the i18n value as a fallback:

```tsx
function Recipes() {
  const { T } = useUI();
  const { bySlug } = useProducts();
  const R = T.recipes;
  // …
            const sauceLabel =
              c.tile ||
              (i === 1
                ? bySlug("tapenade")?.eyebrow || T.lineup.items[2].jp
                : bySlug("mustard")?.eyebrow || T.lineup.items[1].jp);
```

Recipe cards themselves (titles, times, descriptions) remain site copy in `i18n.ts` — out of scope (§17).

### 8.7 Mount the provider — `App()`, lines 975–986

Wrap the page inside `UICtx.Provider` so the provider receives the current language:

```tsx
    <UICtx.Provider value={{ lang, setLang, T, theme, setTheme, th }}>
      <ProductsProvider lang={lang}>
        <div className="min-h-screen overflow-x-hidden" style={{ ...body, background: "var(--ym-bg)", color: "var(--ym-fg)", transition: "background-color 400ms ease" }}>
          <Nav />
          <Hero />
          <Lineup />
          <Recipes />
          <Process />
          <Ingredients />
          {SHOW_FAQ && <FAQ />}
          <BuyStrip />
          <Footer />
        </div>
      </ProductsProvider>
    </UICtx.Provider>
```

The fetch starts once when `App` mounts. Switching language re-derives the views from the same data with no new request.

### 8.8 Verify locally, then commit

With `.env.local` filled in and `npm run dev` running at <http://localhost:5173> (CORS for this origin is added in §10.2 — do that step first if requests fail with a CORS error):

| # | Check | Expected |
|---|---|---|
| 1 | DevTools → Network, filter `sanity` | Exactly **one** request to `https://<projectId>.apicdn.sanity.io/v2026-09-14/data/query/production?…` |
| 2 | Console: `document.querySelector("#lineup").dataset.productsSource` | `"cms"` |
| 3 | Reload | Briefly `"cache"`, then `"cms"` |
| 4 | Switch through all five languages | **No** new request; prices exactly match §1.3 (`$13`, `¥1,900`, `12 €`, `¥91`, `NT$400` for mustard) |
| 5 | Toggle theme | Wabi-Sabi photos replace the Fresh Garden photos |
| 6 | Carousel: Previous and Next | Previous goes backwards; counter reads `01 / 02` ↔ `02 / 02` |
| 7 | *Side by side* layout | Both jars render |
| 8 | Photo frame | No arrows, dots or counter (one photo per theme); no "Drop the … photo" text |
| 9 | Network tab → the photo request | `cdn.sanity.io/images/…?w=960&h=1200&fit=crop&auto=format&q=80`, response `content-type: image/webp` or `image/avif` |
| 10 | Block `*.sanity.io` in DevTools (Network request blocking), run `localStorage.removeItem("ym-products-v1")`, reload | After ≤ 2.5 s, `"fallback"`; the section looks exactly like `main`; the console shows one `[products] live fetch failed` warning |
| 11 | Unblock; stop the dev server; rename `.env.local`; restart | `"fallback"` and **no** Sanity request at all |
| 12 | Studio: set mustard USD to `13.5`, publish; reload the site (English) | `$13.50` within seconds. Set it back to `13`. |
| 13 | Studio: turn off *Show on site* for tapenade; reload | Carousel shows mustard only, with no jar navigation. Turn it back on. |
| 14 | Recipes section | Tile labels unchanged |
| 15 | <http://localhost:5173/story> | Unchanged; no Sanity request |
| 16 | `npm run build` | Succeeds |

```bash
git add package.json package-lock.json src/vite-env.d.ts src/features/products
git commit -m "feat(products): Sanity data layer with cache and bundled fallback"
git add src/app/App.tsx
git commit -m "refactor(lineup): render any number of products from the products provider"
```

---

## 9. Phase 5 — Scoped type checking

**Outcome:** `npm run typecheck` type-checks the new products module (and `i18n.ts`, which it imports) without first having to fix the ~990-line `App.tsx` or the unused shadcn kit, neither of which has ever been type-checked.

### 9.1 Install

```bash
npm install -D typescript @types/react@^18 @types/react-dom@^18
```

`@types/react` **must stay on 18** to match the installed React 18.3.1. Do not add `react`/`react-dom` to `dependencies` (`CLAUDE.md`).

### 9.2 `tsconfig.json` (repo root)

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "moduleResolution": "bundler",
    "jsx": "react-jsx",
    "strict": true,
    "noEmit": true,
    "isolatedModules": true,
    "skipLibCheck": true,
    "resolveJsonModule": true,
    "paths": { "@/*": ["./src/*"] }
  },
  "include": ["src/features/**/*", "src/vite-env.d.ts", "src/media.d.ts"]
}
```

- `include` is deliberately narrow. `tsc` also checks whatever those files import (`src/app/i18n.ts`), but never `App.tsx`, which imports the module rather than the reverse.
- `paths` mirrors the `@` alias in `vite.config.ts`. Vite keeps resolving through its own alias; this only informs `tsc`.
- `"jsx": "react-jsx"` matches `@vitejs/plugin-react`'s automatic runtime. Vite's esbuild reads `jsx` from `tsconfig.json`, so re-run `npm run build` after adding the file to confirm nothing changed.
- The Studio keeps its own `studio/tsconfig.json`; the root config does not reach into `studio/`.

### 9.3 Script

Add to `package.json` `scripts` (leave everything else in the file untouched):

```json
"typecheck": "tsc --noEmit -p tsconfig.json"
```

### 9.4 Run and resolve

```bash
npm run typecheck
npm run build
```

Expected first-run issues and fixes:

| Error | Fix |
|---|---|
| `Cannot find module '@/assets/jar_mustard_studio.jpg'` | Ensure `src/media.d.ts` declares image modules, e.g. `declare module "*.jpg" { const src: string; export default src; }` — repeat for `*.png` and `*.webp` if absent |
| `Property 'env' does not exist on type 'ImportMeta'` | `src/vite-env.d.ts` is missing from `include` or misnamed |
| Errors inside `src/app/i18n.ts` | Fix them — the file is small and pure data. Do **not** widen `include` to `App.tsx` in this plan. |

Extending type checking to `App.tsx` is a separate, later task.

### 9.5 Commit

```bash
git add package.json package-lock.json tsconfig.json src/media.d.ts
git commit -m "chore(types): scoped TypeScript checking for src/features"
```

---

## 10. Phase 6 — Vercel and CORS

**Outcome:** preview and production builds read from Sanity; only this site's origins may query it from a browser.

### 10.1 Vercel environment variables

Vite **inlines** `import.meta.env.VITE_*` at **build** time. Set the variables before the build that should use them; existing deployments keep whatever they were built with.

Vercel → project → *Settings → Environment Variables*. Add each for **Production**, **Preview**, and **Development**:

| Name | Value |
|---|---|
| `VITE_SANITY_PROJECT_ID` | project ID from §5.2 |
| `VITE_SANITY_DATASET` | `production` |
| `VITE_SANITY_API_VERSION` | `2026-09-14` |

None of these is secret. **No Sanity token is added to Vercel**, because the storefront never writes and never reads drafts.

### 10.2 CORS origins

Sanity rejects browser requests from origins not on the project's allowlist. Each origin is added **without credentials** — the storefront sends none, and an origin with credentials could make authenticated requests on a logged-in editor's behalf.

```bash
cd studio
npx sanity cors add http://localhost:5173
npx sanity cors add https://<production-domain>
npx sanity cors add "https://<vercel-project>-*-<vercel-team-slug>.vercel.app"
npx sanity cors list
```

Answer **No** at each *Allow credentials?* prompt.

- `<production-domain>`: Vercel → *Settings → Domains*. Add every domain that serves the site (the `*.vercel.app` production alias and any custom domain).
- Preview wildcard: open any Vercel preview deployment and read its hostname, which has the form `<vercel-project>-<hash>-<vercel-team-slug>.vercel.app`. Branch aliases (`<vercel-project>-git-<branch>-<vercel-team-slug>.vercel.app`) match the same pattern.
- **Never add `https://*.vercel.app`.** It would allow every Vercel-hosted site on the internet.
- `npx sanity cors list` should show exactly: the Studio host (credentials: yes, added by `sanity deploy`), `http://localhost:3333` (Studio dev), and the origins above (credentials: no).

### 10.3 `vercel.json`

No change. There are no API routes, so the SPA catch-all rewrite cannot shadow anything.

If a Content-Security-Policy is added in future, it must allow:

```text
connect-src https://<projectId>.apicdn.sanity.io
img-src     https://cdn.sanity.io data:
```

(`data:` covers the LQIP placeholders.)

### 10.4 Optional — skip storefront builds for Studio-only commits

Vercel → *Settings → Git → Ignored Build Step* → *Custom*:

```bash
git diff --quiet HEAD^ HEAD -- . ':(exclude)studio'
```

Vercel skips the build when the command exits `0`, which happens when nothing outside `studio/` changed.

### 10.5 Previews cannot corrupt production content

PLAN.md listed "preview deployments mutate production data" as a risk requiring separate databases. It does not apply here: the storefront has **no write path**. Previews read the same published `production` dataset as production, and the only writer is the Studio.

---

## 11. Phase 7 — Release verification

### 11.1 Open the pull request

```bash
git push -u origin feat/sanity-products
gh pr create --base main --title "Edit products in Sanity"
```

In the PR description, include: the summary table from §0; decisions D1–D7 marked as confirmed; the Studio URL; the Vercel preview URL; and the §11.2 matrix with its checkboxes filled in.

### 11.2 Preview matrix

Run on the Vercel preview URL. Repeat §8.8 checks 1–3, 9, 10, 15, then walk the language × theme matrix. Both layouts (carousel and side by side) in each cell.

| Language | Mustard — expected | Tapenade — expected | Fresh Garden | Wabi-Sabi |
|---|---|---|---|---|
| `en` | Whole-Grain Mustard Sauce · `$13` · 200g | Tapenade Sauce · `$14` · 200g | ☐ | ☐ |
| `ja` | つぶつぶマスタードソース · `¥1,900` · 200g | タブナードソース · `¥2,100` · 200g | ☐ | ☐ |
| `fr` | Sauce Moutarde à l'Ancienne · `12 €` · 200g | Sauce Tapenade · `13 €` · 200g | ☐ | ☐ |
| `zh` | 颗粒芥末酱 · `¥91` · 200g | 橄榄酱（塔布纳德） · `¥101` · 200g | ☐ | ☐ |
| `zh-TW` | 顆粒芥末醬 · `NT$400` · 200g | 橄欖醬（塔布納德） · `NT$440` · 200g | ☐ | ☐ |

Additional checks:

| Area | Check | Pass when |
|---|---|---|
| Mobile | 375 px wide | Lineup stacks; no horizontal scroll; photo fills the 4:5 frame |
| Layout shift | Lighthouse (mobile) on `/` | CLS < 0.1, both first visit and repeat visit |
| Keyboard | Tab through the carousel | Previous/Next jar, dots, and layout toggle are reachable and operable |
| Screen reader | Inspect the jar photo | `alt` is the localized CMS text, not `"New — STUDIO"` |
| Bundle hygiene | `npm run build`, then search `dist/` for `token`, `SANITY_AUTH`, `sk` followed by a long alphanumeric run | Nothing found. The project ID appearing in the bundle is expected. |
| Round trip | Edit a description in Studio, publish, reload the preview | New text visible within seconds; no redeploy |

### 11.3 Production release

1. Confirm §10.1 variables exist for **Production** *before* merging. If they are missing, production still builds and simply renders the bundled fallback — safe, but not live.
2. Confirm the production domain is in `npx sanity cors list`.
3. Merge the PR.
4. On the production domain, repeat §8.8 checks 1, 2, 4 and 9.
5. Hand over the Studio (§12).

---

## 12. Phase 8 — Owner handover and documentation

### 12.1 Owner guide — `docs/editing-products.md`

Write a one-page guide in the language Kimie prefers (Japanese recommended), with a screenshot per task. Cover exactly these tasks:

| Task | Steps in the Studio | Visible on site |
|---|---|---|
| Change a price | Product → *Price & size* → edit the currency → **Publish** | Seconds after publishing |
| Fix a translation | Product → *Words* → the language row → **Publish** | Seconds |
| Replace a photo | Product → *Photos* → click the photo → upload → drag the focal point in the crop tool → choose *Theme* and *Shot* → write the description → **Publish** | Seconds |
| Reorder jars | Each product → *Visibility & order* → *Position* (use 10, 20, 30) → **Publish** | Seconds |
| Hide or show a jar | *Visibility & order* → *Show on site* → **Publish** | Seconds |
| Add a new jar | *Products → Create* → fill every tab → keep *Show on site* **off** until ready → **Publish** → switch it on | Seconds |
| Undo a mistake | Product → ⋯ → *History* → pick a version → *Restore* → **Publish** | Seconds |

Rules to state plainly in the guide:

- Nothing is live until **Publish** is pressed. An unpublished change is a draft only Kimie can see.
- Never change a product's **ID** after launch; recipe cards find products by it.
- The heading above the jars ("Two jars…" / "Three jars…") changes automatically for two or three visible jars. **One jar, or four or more, needs a developer** to add wording in all five languages.
- There is no Delete button, by design. Hiding a jar is always reversible.
- History in the Studio is short on the Free plan; the weekly backup (§13) is the long-term safety net.

### 12.2 Walkthrough

A 30-minute session in which Kimie herself, on production: changes the mustard USD price and reverts it; replaces the Wabi-Sabi tapenade photo with the same file and resets its focal point; hides and re-shows tapenade. Confirm each on the live site with her.

### 12.3 `CLAUDE.md` updates

Correct and extend `CLAUDE.md` so future sessions do not edit the wrong source:

1. **Languages**: replace "four languages (`en`, `ja`, `fr`, `zh`)" with "five languages (`en`, `ja`, `fr`, `zh`, `zh-TW`)".
2. **Commands** — add:

   ```text
   npm run typecheck                 # tsc over src/features (scoped; App.tsx is not type-checked)
   cd studio && npm run dev          # Sanity Studio on http://localhost:3333
   cd studio && npx sanity deploy    # publish Studio changes to https://kimie-jars.sanity.studio
   ```

3. **Architecture** — add a bullet:

   > **Products come from Sanity**, not from `i18n.ts`. `src/features/products/` fetches them (`ProductsProvider`, `useProducts`); `App.tsx`'s `Lineup` and `Recipes` consume them. `translations[*].lineup.items` is now **only the bundled fallback** — editing product copy or prices there does not change the live site. All other copy (including `lineup.heading`, `lineup.cta`, `twoJar`) is still edited in `i18n.ts`. The schema lives in `studio/` (a separate npm package with its own lockfile — install it separately, never as a workspace). Prices are one per market (`MARKETS` in `format.ts`); JPY and TWD deliberately format through `en-US`. Environment: `.env.local` (site) and `studio/.env` (Studio), both gitignored; all values are public and the storefront uses no token.

### 12.4 Commit

```bash
git add docs/editing-products.md CLAUDE.md
git commit -m "docs: owner guide for editing products and CLAUDE.md for the Sanity source"
```

---

## 13. Phase 9 — Backups

**Outcome:** a weekly export of the dataset, including drafts and image assets, kept for 90 days; restore rehearsed once.

### 13.1 Token

*manage → Kimie Jars → API → Tokens → Add API token* → name `github-backup`, permission **Viewer**. Store it as a GitHub Actions secret: repository → *Settings → Secrets and variables → Actions* → `SANITY_AUTH_TOKEN`. It is never committed and never added to Vercel.

### 13.2 `.github/workflows/sanity-backup.yml`

```yaml
name: Sanity backup

on:
  schedule:
    - cron: "0 18 * * 0" # Sundays 18:00 UTC = Mondays 03:00 JST
  workflow_dispatch:

permissions:
  contents: read

jobs:
  export:
    runs-on: ubuntu-latest
    defaults:
      run:
        working-directory: studio
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22 # Studio v6 needs Node >= 22.12
          cache: npm
          cache-dependency-path: studio/package-lock.json
      - run: npm ci
      - name: Export production dataset
        run: npx sanity dataset export production "backup-$(date -u +%Y%m%d).tar.gz"
        env:
          SANITY_AUTH_TOKEN: ${{ secrets.SANITY_AUTH_TOKEN }}
      - uses: actions/upload-artifact@v4
        with:
          name: sanity-production-${{ github.run_id }}
          path: studio/backup-*.tar.gz
          retention-days: 90
```

Use the current major versions of the three `actions/*` steps when implementing. Trigger it once with *Run workflow* and confirm the artifact downloads.

**If the GitHub repository is public**, workflow artifacts can be downloaded by other GitHub users. The export includes **drafts**, which are not otherwise public. Either keep the repository private or accept that unpublished drafts are exposed.

### 13.3 Rehearse a restore

The Free plan allows two datasets, so a temporary second dataset is available:

```bash
cd studio
npx sanity dataset create restore-test --visibility public
npx sanity dataset import ./backup-YYYYMMDD.tar.gz restore-test
```

In *Vision*, switch the dataset to `restore-test` and confirm `count(*[_type == "product"])` returns `3` and the photos resolve. Then:

```bash
npx sanity dataset delete restore-test
```

A real restore into production uses `npx sanity dataset import <file> production --replace`.

### 13.4 Commit

```bash
git add .github/workflows/sanity-backup.yml
git commit -m "ci: weekly Sanity dataset export"
```

---

## 14. Rollback

| Situation | Action | Time to recover |
|---|---|---|
| A bad content edit | Studio → product → *History* → restore → Publish | Minutes |
| Sanity outage | None needed — cache, then bundled fallback, render automatically | — |
| A bug in the new storefront code | Vercel → *Deployments* → previous production deployment → *Instant Rollback* | ~1 minute |
| Stop using the CMS without a code change | Remove `VITE_SANITY_PROJECT_ID` from Vercel **Production** → *Redeploy*. The site renders bundled products (as of the seed). | ~2 minutes |
| Abandon the plan | `git revert` the two §8 commits; `studio/` may stay. Content remains in Sanity until the project is deleted. | ~30 minutes |
| Lost or corrupted dataset | Restore the latest backup (§13.3) with `--replace` | ~15 minutes |

---

## 15. Effort

One engineer familiar with React/TypeScript; hours include local verification per phase.

| Phase | Section | Hours |
|---|---|---:|
| 1 — Sanity project and Studio | §5 | 1–2 |
| 2 — Content schema and validation | §6 | 3–5 |
| 3 — Seed script and formatting guard | §7 | 2–4 |
| 4 — Data layer | §8.1–8.4 | 4–6 |
| 4 — Lineup and Recipes refactor | §8.5–8.7 | 4–6 |
| 4 — Local verification | §8.8 | 1–2 |
| 5 — Scoped type checking | §9 | 1–2 |
| 6 — Vercel and CORS | §10 | 1–2 |
| 7 — Release verification (20 matrix cells × 2 layouts) | §11 | 3–5 |
| 8 — Owner guide, walkthrough, `CLAUDE.md` | §12 | 2–3 |
| 9 — Backups and restore rehearsal | §13 | 1–2 |
| **Total** | | **23–39** |

---

## 16. Risks

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| **Bundled fallback drifts from live prices.** First-time visitors during a Sanity outage see prices as of the seed. | Low — needs an outage *and* no cache | Visitors see outdated prices | When prices change materially, update `lineup.items` in `i18n.ts` to match. A script that regenerates them from a Sanity export is a sensible follow-up. |
| Owner, as Administrator, deletes content or the dataset | Low | High | Delete action removed from products (§5.4); weekly backup; restore rehearsed (§13.3) |
| Plugin changes its stored data shape again, as v4 → v5 did | Low–medium | Localized fields fall back to English or render empty | Pin the plugin's major version in `studio/package.json`; read its changelog before upgrading; `pick()` and the seed are the only code that knows the shape |
| Sanity Free plan terms change | Medium over years | Medium | Export is always available; bandwidth usage is far below the 100 GB cap; set a usage alert in *manage* |
| A new domain is added without a CORS entry | Medium, at domain changes | Lineup silently shows cache/fallback on that domain | Add the CORS origin as part of any domain change; check `data-products-source` returns `cms` |
| Heading copy does not fit the jar count (1, or 4+) | Medium, when adding jars | Low | Documented for the owner (§12.1); developer adds copy in all five locales |
| Recipe tiles depend on the `mustard` and `tapenade` slugs | Low | Low | The slug field's description warns against changes; i18n fallback keeps a label rendering |
| Repeat visitors briefly see cached data after a publish | Certain | Low | Accepted; typically well under a second |
| A hotspot crop hides part of a jar | Low | Low | The Studio's crop tool previews the result; the owner adjusts the focal point |
| Studio major upgrades | Periodic | Low | Upgrade inside `studio/`, test at `localhost:3333`, `sanity deploy`; the storefront is unaffected |

---

## 17. Out of scope

- Editing section copy through the CMS: hero, slogans, lineup heading and CTA, recipes, process, ingredients, FAQ, buy strip, footer. These remain in `i18n.ts`.
- `/story` and its product imagery.
- Checkout, cart, inventory, or payment. *Add to Cart* still links to `#buy`.
- `hero.price` (unused by `App.tsx`).
- Type-checking `App.tsx` and the shadcn kit.
- Scheduled publishing, multiple roles, or per-editor permissions (Sanity Growth plan).
- Automatically syncing the bundled fallback from Sanity.
- Deleting products — excluded by design.

---

## 18. Sources

Verified 2026-09-13 and 2026-09-14.

- [Sanity pricing](https://www.sanity.io/pricing) — Free plan: 20 seats, Administrator and Viewer roles, 2 public datasets, 10,000 documents, 100 GB assets and bandwidth, 1M CDN requests, hard caps
- [Sanity Studio v6 release](https://www.sanity.io/blog/sanity-studio-v6) — Node.js ≥ 22.12
- [Sanity Studio installation](https://www.sanity.io/docs/studio/installation)
- [`sanity-plugin-internationalized-array`](https://github.com/sanity-io/plugins/tree/main/plugins/sanity-plugin-internationalized-array) — v5 `language` field, generated `…Value` types, GROQ examples
- [`@sanity/image-url`](https://github.com/sanity-io/image-url) — named export `createImageUrlBuilder`
- [Sanity CORS origins](https://www.sanity.io/docs/content-lake/cors) — credentials guidance; no platform-wide wildcards
- [Importing data into Sanity](https://www.sanity.io/docs/content-lake/importing-data) — `dataset import`, `--replace`, `_sanityAsset` file URIs
- [Sanity TypeGen](https://www.sanity.io/docs/apis-and-sdks/sanity-typegen) — not used in this plan; a candidate once `App.tsx` is type-checked
- [Contentful pricing](https://www.contentful.com/pricing/) — Free plan limited to 2 locales, which is why Contentful was not chosen

---

## 19. Implementation status — `/story` first (2026-09-14)

Branch `feat/sanity-products`, not yet committed. Work started with the `/story` page instead of the main-page lineup.

### 19.1 Decisions taken during implementation

Where these differ from earlier sections, these win.

| Topic | Decision | Supersedes |
|---|---|---|
| First page wired | `/story`. The main-page `Lineup` still reads `i18n.ts`. | §8.5–8.7 deferred |
| Product text | **One shared set** of name, tasting note and description for every page. Seeded from the `/story` copy, which is newer and agrees with the ingredient lists (honey in the mustard, anchovies in the tapenade). The main page adopts this wording when it is wired. | §7 seed source |
| Fields `/story` uses | `name`, `tastingNote`, `description`, `ingredients` (five languages each); `japaneseLabel` (one string); `sizeValue` + `sizeUnit` | §6.3 field list |
| Photos | `theme` gains a `story` value. `/story` uses the Story photo, else the Fresh Garden photo, else the bundled image. | §6.3 |
| Main-page fields | `eyebrow`, `tag`, `prices`, `isActive`, `sortOrder`, and photo `style` are stored and seeded but **hidden** in the Studio, with no validation (Sanity validates hidden fields, so an invisible error would block publishing). Restore §6.3's rules when unhiding. | D1, D5, D6 apply later |
| Images on `/story` | Width-bounded `srcset` (400–1600 px), no server-side crop: the story frames crop with CSS and change shape at every breakpoint. §8.2's 4:5 crop applies to the main page only. | §8.2 `image.ts` |
| Loading | Cached data renders at once; with no cache the bundled copy shows while loading (the page is never blank); a live response within 2.5 s replaces it. | §8.4 skeleton |
| `/story` structure | Still exactly two flavours (switch, 3D scene, meal pairing link). Hiding a product does not affect `/story`. | — |
| Studio package | Created by hand, not with `npm create sanity`. Sanity 6.13.2 requires React 19.3, isolated in `studio/` with its own lockfile. The project id is read from `studio/.env`. | §5.2 |
| Tooling | TypeScript 7.0.2 in both packages. On this machine `npm pkg set` fails with `'C:\Program' is not recognized`; edit `package.json` directly instead. | §9.3 |

### 19.2 Files

| Area | Files |
|---|---|
| Studio (new package) | `studio/package.json`, `package-lock.json`, `sanity.config.ts`, `sanity.cli.ts`, `tsconfig.json`, `.gitignore`, `schemaTypes/{index,languages,validation,product}.ts`, `scripts/seed.ts` |
| Products module (new) | `src/features/products/{config,client,query,types,localize,format,image,fallback,useStoryProducts}.ts` |
| Story page | `src/app/story/StoryPage.tsx` (reads `useStoryProducts`), `FlavorScene.tsx` (optional `photo` prop) |
| Root config | `package.json` (+ `@sanity/client`, `@sanity/image-url`, `typescript`, `@types/react`, `@types/react-dom`, `typecheck` script; peer-dependency block unchanged), `package-lock.json`, `tsconfig.json`, `src/vite-env.d.ts`, `src/media.d.ts` (+ `*.jpg`, `*.png`, `*.webp`) |

### 19.3 Verified

| Check | Result |
|---|---|
| `npm run typecheck` (root, `src/features`) | Pass |
| `npx tsc --noEmit` in `studio/` (schema, config, seed and its imports from `src/`) | Pass |
| `npm run build` | Pass |
| Seed formatting guard | Pass — 15 prices and sizes match the site. The dry run then stops at "Unable to resolve project ID", as expected without a project. |
| `/story` with no project configured, English and Japanese | Source `fallback`; names, tasting notes, descriptions, sizes, Japanese labels, ingredients, alt text and images identical to before; no requests to Sanity; no console errors |
| `/story` with a fake project id and a planted cache | Source `cache`; CMS values render; empty or missing fields fall back field by field; Story photo preferred over Fresh Garden; Sanity CDN `src`/`srcset` well-formed; the failed live request logs one warning and keeps the cache |
| `/story` with a fake project id and no cache | Source `fallback` with bundled copy; nothing cached from the failed request |

**Not yet verified** (needs a real project): the Studio UI, a real seed write, a live CDN response, CORS.

Behaviour to know: when the CMS lacks one language, the page shows that field's **CMS English** value, not the old bundled translation. Publishing validation prevents this for name, tasting note and description; ingredients and photo alt text only warn.

### 19.4 Remaining steps (need a Sanity login)

1. Create the project at <https://www.sanity.io/manage> → *Create new project* → `Kimie Jars`, with a **public** `production` dataset. Copy the project id.
2. Create `studio/.env` with `SANITY_STUDIO_PROJECT_ID=<id>`, and root `.env.local` with `VITE_SANITY_PROJECT_ID=<id>`. Both files are gitignored. The dataset (`production`) and API version (`2026-09-14`) default when omitted.
3. `cd studio && npx sanity login`, then `npm run dev` and check the Studio at <http://localhost:3333>.
4. `npx sanity exec scripts/seed.ts --with-user-token -- --dry-run`, review, then run it without `--dry-run`.
5. `npx sanity cors add http://localhost:5173` (answer **No** to credentials); open `/story` and confirm `document.querySelector("#jars").dataset.productsSource` is `"cms"`.
6. `npx sanity deploy` (hostname `kimie-jars`), then §10 (Vercel variables, production and preview CORS origins) and §12.2 (invite Kimie).

After that, the main page follows §8.5–8.7: unhide the main-page fields and restore their validation. Note that the main page's product names and descriptions will then change to the shared `/story` wording.
