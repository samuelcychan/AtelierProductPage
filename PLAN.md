# Product Admin Interface Plan

## 1. Goal

Add a small, password-protected admin area to the existing lemon-jar landing page so an authorized owner can edit product details, translations, images, visibility, and display order without changing source code or triggering a GitHub deployment.

The existing delivery workflow remains unchanged:

1. Source code is committed to GitHub.
2. Vercel builds the Vite application.
3. The public storefront reads current product data from an API at runtime.
4. The admin interface writes product changes to the database through authenticated API routes.

This plan deliberately does not migrate the site to Next.js. The current Vite/React app can use root-level Vercel Functions in `api/`, so a framework migration would add risk without being necessary for this feature.

## 2. Current-State Findings

- Frontend: Vite 6, React 18, TypeScript, Tailwind CSS 4, Radix UI components, Lucide icons, and Motion.
- Hosting: static Vite build on Vercel, pulled from GitHub.
- Routing: a catch-all rewrite currently sends routes to `index.html`.
- Product text: stored in `src/app/i18n.ts` for `en`, `ja`, `fr`, `zh`, and `zh-TW`.
- Product images: imported at build time from `src/assets` and selected by product/theme in `src/app/App.tsx`.
- Product rendering: the lineup currently assumes exactly two editable sauces (`mustard` and `tapenade`) and reads fixed array indexes from the translation file.
- Backend/database/authentication: none currently.

## 3. Recommended Architecture

```text
Public visitor
    |
    v
Vite/React storefront ------ GET /api/products?locale=en ------+
    |                                                         |
    |                                                         v
    |                                                Vercel Function
    |                                                         |
    |                                                         v
    |                                                  Neon Postgres
    |                                                         ^
    |                                                         |
Admin /admin --> login --> signed HttpOnly session cookie      |
    |                                                         |
    +-- CRUD /api/admin/products ------------------------------+
    |
    +-- authenticated upload token --> Vercel Blob --> image URL
```

### Responsibilities

- **Vite/React client**: public storefront, admin login, product editor, validation feedback, loading/error/fallback states.
- **Vercel Functions**: authentication, authorization, input validation, product reads/writes, upload authorization, audit metadata, and cache headers.
- **Neon Postgres**: canonical product records and localized content.
- **Vercel Blob (public store)**: runtime-editable product images. Public reads are appropriate because storefront images are not confidential; write access remains server-authorized.
- **Vercel environment variables**: password hash, session signing secret, database connection, and Blob token. No secret may use a `VITE_` prefix or enter the browser bundle.

## 4. Technology Stack

| Layer | Choice | Purpose |
|---|---|---|
| UI | Existing React 18 + TypeScript + Vite | Preserve the current frontend and build pipeline |
| Routing | `react-router` | Serve `/` and `/admin` within the SPA |
| Components | Existing Radix UI + Tailwind CSS | Login, dialogs, forms, tabs, tables, alerts, and toasts |
| Forms | Existing `react-hook-form` | Admin form state and field-level errors |
| Shared validation | `zod` | Validate the same product DTOs in the client and API |
| API | TypeScript Vercel Functions in root `api/` | Public reads and protected admin writes |
| Database | Neon Postgres provisioned through Vercel Marketplace | Durable product and translation storage |
| Database access | `drizzle-orm` + `@neondatabase/serverless` | Typed schema, migrations, and serverless-safe queries |
| Media | `@vercel/blob` | Product image uploads and public delivery |
| Password hashing | `bcryptjs` | Compare a pre-generated password hash without native binary deployment issues |
| Sessions | `jose` signed JWT in an HttpOnly cookie | Stateless, short-lived single-admin sessions |
| Rate limiting | Upstash Redis integration (recommended before production) | Limit repeated login attempts across serverless instances |
| Tests | Vitest + React Testing Library; Playwright for critical flows | Unit, component, API, and end-to-end coverage |

## 5. Authentication and Security Design

“Custom password” means one owner-managed password, not a hard-coded password and not a general user-account system.

### Login flow

1. The owner sets an initial password locally and generates a bcrypt hash with a repository script.
2. Only the hash is saved as `ADMIN_PASSWORD_HASH` in Vercel environment variables. The plaintext password is never committed or stored in the database.
3. `POST /api/auth/login` validates the request and compares the supplied password with the hash using a constant-behavior password comparison.
4. On success, the API returns a signed session in an `HttpOnly`, `Secure`, `SameSite=Strict`, path `/` cookie. Recommended expiry: 8 hours.
5. Every `/api/admin/*` route verifies the signature, expiry, and expected claims before doing any work.
6. `POST /api/auth/logout` expires the cookie. `GET /api/auth/session` lets the admin UI restore the signed-in state.

### Required controls

- Generate a high-entropy `SESSION_SECRET` separately for preview and production.
- Rate-limit login by normalized client IP and apply a short progressive cooldown. Use Upstash Redis in production; an in-memory limiter is not reliable across serverless instances.
- Return the same generic `401` response for wrong passwords and invalid sessions.
- Require JSON content types and reject oversized request bodies.
- Validate all fields with Zod on the server; client validation is only for usability.
- Check the `Origin` header on every state-changing request in addition to `SameSite=Strict` cookies.
- Permit only expected image MIME types (`image/jpeg`, `image/png`, `image/webp`, optionally `image/avif`) and enforce a size limit such as 5 MB.
- Authenticate before issuing a Vercel Blob client-upload token. Never expose `BLOB_READ_WRITE_TOKEN` to the client.
- Use parameterized queries through the ORM.
- Add `Cache-Control: no-store` to auth and admin responses.
- Do not print passwords, cookies, session tokens, database URLs, or Blob tokens in logs.
- Add security headers in `vercel.json`: `X-Content-Type-Options`, `Referrer-Policy`, frame protection/CSP `frame-ancestors`, and a tested Content Security Policy.

### Password rotation

Provide `scripts/hash-admin-password.mjs`, which prompts without echoing the password and prints only the bcrypt hash. Rotation is performed by updating `ADMIN_PASSWORD_HASH` in Vercel and redeploying. Rotating `SESSION_SECRET` invalidates all existing sessions and is the emergency sign-out mechanism.

## 6. Data Model

Use stable product IDs/slugs instead of translation-array indexes. Keep localized fields in a separate table so every locale can be validated and queried independently.

### `products`

| Column | Type | Notes |
|---|---|---|
| `id` | UUID, primary key | Generated once |
| `slug` | text, unique | Stable public/admin identifier, e.g. `mustard` |
| `sku` | text, nullable/unique | Optional future commerce identifier |
| `price_minor` | integer | Price in the smallest currency unit; never use floats |
| `currency` | char(3) | ISO currency code, e.g. `JPY` |
| `size_value` | numeric, nullable | Example: `200` |
| `size_unit` | text, nullable | Example: `g` |
| `is_active` | boolean | Controls storefront visibility |
| `sort_order` | integer | Explicit ordering |
| `created_at` | timestamptz | Audit metadata |
| `updated_at` | timestamptz | Updated on each mutation |

### `product_translations`

| Column | Type | Notes |
|---|---|---|
| `product_id` | UUID, foreign key | Cascade on product delete if delete is enabled later |
| `locale` | text | Restricted to `en`, `ja`, `fr`, `zh`, `zh-TW` |
| `name` | text | Required |
| `eyebrow` | text | Current `jp` field/general short label |
| `tag` | text | Badge text |
| `description` | text | Product description |
| `image_alt` | text | Accessible localized alt text |
| primary key | (`product_id`, `locale`) | One translation per locale |

### `product_images`

| Column | Type | Notes |
|---|---|---|
| `id` | UUID, primary key | Image record |
| `product_id` | UUID, foreign key | Owning product |
| `theme` | text | `grove`, `wabi`, or `all` |
| `role` | text | `studio`, `table`, `detail`, or future values |
| `blob_url` | text | Public Vercel Blob URL |
| `blob_pathname` | text | Needed for controlled cleanup/replacement |
| `width`, `height` | integer, nullable | Useful for aspect-ratio reservation |
| `sort_order` | integer | Gallery order |
| `created_at` | timestamptz | Audit metadata |

For the first release, implement archive/visibility through `is_active` and do not expose permanent product deletion. This avoids accidental loss and orphaned images.

## 7. API Surface

### Public

- `GET /api/products?locale=en`
  - Returns active products in `sort_order` with translated fields and image variants.
  - Falls back to English for a missing localized field and includes the actual resolved locale.
  - Sends `ETag` plus a short CDN cache policy such as `s-maxage=60, stale-while-revalidate=300`.

### Authentication

- `POST /api/auth/login` — validate password, rate-limit, set session cookie.
- `POST /api/auth/logout` — expire session cookie.
- `GET /api/auth/session` — return `{ authenticated: boolean }`; never expose claims or secrets unnecessarily.

### Protected admin

- `GET /api/admin/products` — return all active/inactive products and all translations.
- `POST /api/admin/products` — create a product.
- `PUT /api/admin/products/:id` — replace validated product fields/translations in a transaction.
- `PATCH /api/admin/products/:id/status` — activate/deactivate.
- `PUT /api/admin/products/order` — update all sort positions in one transaction.
- `POST /api/admin/uploads` — authenticate and issue a narrowly scoped Vercel Blob client-upload token.
- `POST /api/admin/products/:id/images` — attach completed Blob metadata to a product.
- `DELETE /api/admin/products/:id/images/:imageId` — detach an image; defer actual Blob deletion until it is no longer referenced.

Use a consistent error shape:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "The product could not be saved.",
    "fields": { "translations.en.name": "Required" }
  }
}
```

## 8. Admin User Experience

### `/admin/login`

- One password field, show/hide control, submit button, and generic invalid-login message.
- Disable repeat submission while pending.
- Redirect an existing valid session to `/admin/products`.

### `/admin/products`

- Product table/cards with image, name, price, active state, and order.
- Add product, edit, duplicate, preview, activate/deactivate, and reorder controls.
- Avoid permanent delete in the first release.

### `/admin/products/:id`

- “Core details” panel: slug, price, currency, size, active state.
- Locale tabs for English, Japanese, French, Simplified Chinese, and Traditional Chinese.
- Image manager grouped by theme and role, with upload progress, preview, reorder, replace, and remove.
- Unsaved-changes warning before navigation.
- Save button with clear success/error feedback.
- Storefront preview link opening the selected locale/theme.

Accessibility requirements: associated labels, keyboard-operable tabs/dialogs/reordering fallback, visible focus states, semantic errors, and alt-text fields.

## 9. Frontend Integration

1. Extract the current product-specific types and rendering assumptions from `App.tsx` into `src/features/products/`.
2. Add a `ProductProvider` or query hook that requests `/api/products?locale=<current locale>`.
3. Refactor `Lineup` to map over returned products rather than indexing `T.lineup.items[1]` and `[2]` or relying on the `JarKey` union.
4. Replace the static `JAR_PHOTOS` map with image arrays returned by the API.
5. Keep current embedded product data as a temporary typed fallback so the landing page still renders during an API/database outage. Log/monitor fallback use; do not silently mask prolonged backend failure.
6. Keep non-product site copy (navigation, process, recipes, footer, etc.) in `i18n.ts`. Only product-owned fields move to the database in this scope.
7. Show skeletons while loading, a quiet retry state on failure, and preserve the current two-theme presentation.
8. Format `price_minor` with `Intl.NumberFormat(locale, { style: "currency", currency })` instead of persisting formatted price strings per language.

## 10. Proposed Repository Layout

```text
api/
  auth/
    login.ts
    logout.ts
    session.ts
  products.ts
  admin/
    products/
      index.ts
      [id].ts
      order.ts
      [id]/status.ts
      [id]/images.ts
    uploads.ts
src/
  app/
    App.tsx
    router.tsx
  features/
    admin/
      AdminLayout.tsx
      LoginPage.tsx
      ProductListPage.tsx
      ProductEditorPage.tsx
      components/
    products/
      api.ts
      types.ts
      ProductProvider.tsx
  shared/
    product-schema.ts
server/
  auth.ts
  db.ts
  env.ts
  http.ts
  schema.ts
  product-repository.ts
drizzle/
  migrations/
scripts/
  hash-admin-password.mjs
  seed-products.ts
tests/
  e2e/
```

The exact dynamic API filenames should be confirmed with a minimal Vercel preview deployment before building all endpoints. If nested Vite function routing proves awkward, use a small catch-all admin function and dispatch by method/path internally.

## 11. Vercel and Environment Configuration

Production and preview should use separate databases/passwords where practical.

Required server-only variables:

```text
DATABASE_URL=
ADMIN_PASSWORD_HASH=
SESSION_SECRET=
BLOB_READ_WRITE_TOKEN=
UPSTASH_REDIS_REST_URL=       # recommended for production login rate limiting
UPSTASH_REDIS_REST_TOKEN=     # recommended for production login rate limiting
```

Configuration work:

- Provision Neon Postgres through Vercel Marketplace and choose a region close to the Functions region.
- Create a **public** Vercel Blob store for public product photos.
- Scope secrets to the correct Vercel project/environments and pull development values with the Vercel CLI rather than committing `.env` files.
- Update `vercel.json` so SPA fallback continues for browser routes while `/api/*` resolves to Functions. Add security headers and explicit function settings if needed.
- Confirm preview deployments cannot mutate production data unless deliberately configured to do so.
- Add `.env*.local` and generated migration artifacts as appropriate to `.gitignore`; commit schema migrations, never secrets.

## 12. Migration Strategy

1. Define the database schema and create an idempotent seed/migration script.
2. Transform the two currently rendered sauce records and their five translations from `i18n.ts` into database rows.
3. Upload the existing four theme-specific product images to Vercel Blob and record their metadata.
4. Keep the source data untouched while the API-backed UI is verified.
5. Switch `Lineup` to API data with source fallback.
6. Verify every locale and both themes in a Vercel preview deployment.
7. After a stable production period, remove only the duplicate product fields/images that are no longer needed; retain a versioned seed fixture for disaster recovery and local tests.

The current preserved-lemon translation record is not rendered by `Lineup`. During migration, either seed it as inactive or leave it in source until product scope is confirmed.

## 13. Expense Estimate

Pricing below is an estimate in USD as of **2026-09-11**, excluding tax, currency conversion, payment-processing charges, and any existing subscriptions. Provider prices and plan limits can change, so recheck the linked official pricing pages before provisioning.

The current Vercel and GitHub account plans are not visible in this repository. Therefore, “change” is shown against a working baseline of a static site using GitHub Free and Vercel Hobby at $0/month. If the project already uses Vercel Pro, subtract the $20/month Pro upgrade from the incremental totals.

### Planning assumptions

The low-traffic estimate uses:

- 10,000 storefront visits per month.
- At most 10 active products and 30 optimized product images.
- Average uploaded image size of 400 KB, or about 12 MB stored in Blob.
- Approximately 8 GB/month of product-image delivery for a prototype and 15 GB/month for the commercial estimate.
- Fewer than 10,000 product API Function invocations after CDN caching.
- Fewer than 500 admin logins, saves, and uploads per month.
- Fewer than 20,000 Redis commands per month for login rate limiting.
- Less than 100 MB of Postgres data, including indexes and translations.
- One Vercel team member/paid seat and normal GitHub build activity.

These assumptions are intentionally above the needs of the current two-product catalog. Traffic-heavy image delivery is the first item likely to materially change the estimate.

### Recurring service-cost change

| Service/component | Current estimate | After change: prototype | After change: recommended commercial | Estimated monthly change | Cost driver and notes |
|---|---:|---:|---:|---:|---|
| GitHub repository | $0 | $0 | $0 | **$0** | GitHub Free includes unlimited public/private repositories and 2,000 Actions minutes/month for private repositories; public-repository standard Actions are free. This plan adds only modest CI. |
| Vercel plan and static hosting | $0 assumed | $0 Hobby | $20 Pro | **$0 prototype / +$20 commercial** | Vercel Hobby is for personal/non-commercial use. Pro is $20/month and includes $20 of usage credit. If Pro is already paid, this feature adds no base-plan charge. |
| Vercel Functions | $0 | $0 within Hobby limits | Approximately $0 incremental within Pro credit | **Approximately $0** | The estimated invocation/CPU use is far below the published 1M monthly invocation and compute allowances shown for the entry tier. At this scale, the API should not be the source of meaningful overage. |
| Neon Postgres | None | $0 Free | $0 Free initially, or about $1–$15 Launch | **$0 initially; budget +$15 for paid DB** | Free currently includes 0.5 GB storage and 100 CU-hours/project/month, which is ample for this catalog. Launch is usage-based at $0.106/CU-hour and $0.35/GB-month; Neon lists $15/month as a typical intermittent 1 GB workload. Scale-to-zero may make this small app cheaper, but $15 is the safer budget. |
| Vercel Blob storage | None | $0 while delivery stays within the 10 GB Hobby allowance | About $0–$1 gross, normally absorbed by Pro credit | **Approximately $0** | About 12 MB storage is far below the 1 GB Hobby allowance. Hobby blocks excess instead of billing it. On Pro, 15 GB/month of Blob delivery is about $0.75 at the published starting transfer rate, plus applicable Edge/Fast Origin requests, and should fit inside the plan's usage credit. Optimize images and set a spend alert. |
| Upstash Redis rate limiter | None | $0 Free | $0 Free or less than $0.20 PAYG | **Approximately $0** | Free includes 500K commands/month and 256 MB. Estimated usage is below 20K commands. PAYG is $0.20 per 100K commands; a fixed plan is optional at $10/month. |
| Authentication provider | None | $0 | $0 | **$0** | The custom-password design uses server-side bcrypt verification and signed cookies, so Auth0/Clerk/etc. is not required. Operational ownership of password rotation remains with the site owner. |
| Open-source packages | Existing | $0 | $0 | **$0** | Drizzle, Zod, jose, bcryptjs, testing libraries, and Vercel SDK packages have no per-month license fee for this use. |
| Vercel Observability/logs | Existing included access | $0 baseline | $0 baseline | **$0** | Basic Observability is available on all Vercel plans. Observability Plus or an external log drain is optional and not included in the estimate. |
| Domain and TLS | Existing | No change | No change | **$0 incremental** | The feature does not require another domain; `/admin` uses the existing site and Vercel continues to provide HTTPS. |
| Database backups/restore history | None | Included limited Neon history | Included with chosen Neon plan | **$0 initially** | Free has limited restore history; Launch includes a longer restore window with history storage billed separately. Budget this only after real change volume is known. |

### Expected monthly totals

| Operating posture | Estimated total incremental cost | When to use |
|---|---:|---|
| Non-commercial prototype | **$0/month** | Development or private proof of concept within all free limits. Not appropriate for a commercial storefront under Vercel Hobby terms. |
| Lean commercial launch | **About $20/month** | Vercel Pro, Neon Free, Upstash Free, and Blob/Functions within Vercel credits and allowances. This is the recommended starting point if the current account is Hobby. |
| Commercial with paid database | **About $35/month** | Vercel Pro plus a prudent $15/month Neon Launch budget; other usage remains included/free. |
| Commercial with fixed Redis also | **About $45/month** | The previous posture plus Upstash Fixed at $10/month. This is unnecessary for the forecast traffic but offers predictable Redis billing. |

If the project already pays for Vercel Pro, the feature-specific increase is expected to be **$0/month with Neon Free** or **about $15/month with Neon Launch**. If actual image delivery reaches 100 GB/month on Pro, Blob transfer would be roughly $5 at the published starting rate before applicable Edge/Fast Origin request charges; the project-level Pro usage credit may absorb some or all of it depending on other usage.

### Cost sensitivity and guardrails

| Usage change | Likely expense effect | Guardrail |
|---|---|---|
| Storefront traffic increases | Blob transfer and Edge requests rise first; API cost rises much more slowly because public product JSON is cached | Convert uploads to WebP/AVIF, cap dimensions/file size, use long-lived immutable image URLs, and monitor Vercel usage |
| Frequent uncached product requests | More Function invocations and Neon compute wake time | Preserve CDN caching/ETags and invalidate only when products change |
| Many failed login attempts | More Redis commands and Functions | Apply IP/password-key throttling and an inexpensive request cutoff before bcrypt work |
| Product/image count grows | Blob storage and database storage rise slowly | Enforce upload limits and run the orphan cleanup process |
| Separate preview resources | Usually $0 at this scale; can duplicate paid minimums if separate paid plans are selected | Use a Neon preview branch and Blob prefix/store with explicit lifecycle cleanup |
| More team members | Vercel and GitHub paid-seat charges may rise | Keep admin product editors separate from infrastructure team seats; verify provider seat rules before inviting users |

Set provider budget notifications before launch. A sensible initial alert is $25/month for Vercel usage including the Pro subscription, $15/month for Neon, and $1/month for Upstash PAYG. Alerts are preferable to hard caps for the storefront because a hard cap can make images or the admin API unavailable.

### One-time implementation effort

This is an engineering-effort estimate, not a vendor quote. It assumes an engineer familiar with React/TypeScript and Vercel, the current two-product scope, no checkout integration, and one review cycle.

| Component | Estimated effort |
|---|---:|
| Vercel/Neon/Blob setup and routing proof | 4–6 hours |
| Database schema, migrations, seed, and repository layer | 8–12 hours |
| Public products API and storefront refactor | 8–12 hours |
| Password authentication, cookies, CSRF checks, and rate limiting | 8–12 hours |
| Admin list/editor and multilingual forms | 14–22 hours |
| Image upload, gallery management, and cleanup | 8–12 hours |
| Automated tests, accessibility checks, deployment, and documentation | 10–16 hours |
| **Total** | **60–92 hours** |

Example labor budgets:

| Example engineering rate | Estimated one-time cost |
|---|---:|
| $50/hour | **$3,000–$4,600** |
| $100/hour | **$6,000–$9,200** |
| $150/hour | **$9,000–$13,800** |

Add roughly 15–25% contingency if product fields, editorial workflow, permissions, or translations are still changing. A multi-user account system, draft/publish workflow, full audit history, or commerce integration would be a separate scope rather than part of this estimate.

### Pricing references

- [Vercel plans and pricing](https://vercel.com/pricing)
- [Vercel Hobby usage restriction](https://vercel.com/legal/terms)
- [Vercel Functions pricing](https://vercel.com/docs/functions/usage-and-pricing)
- [Vercel Blob usage and pricing](https://vercel.com/docs/vercel-blob/usage-and-pricing)
- [Neon pricing](https://neon.com/pricing)
- [Upstash Redis pricing](https://upstash.com/pricing/redis)
- [GitHub pricing](https://github.com/pricing)

## 14. Implementation Phases

### Phase 0 — Decisions and setup

- Confirm which products are editable and whether every locale is required before publish.
- Decide whether one currency applies globally or prices vary by market. The initial schema assumes one currency per product.
- Provision preview resources and document local setup.
- Create a preview deployment proving a Vite page and root-level API function coexist with the SPA rewrite.

**Exit criterion:** a preview route can read/write a disposable database record, and secrets are not present in the client bundle.

### Phase 1 — Data and public read path

- Add database packages, schema, migrations, shared Zod contracts, and seed script.
- Implement `GET /api/products` with locale fallback and caching.
- Refactor the lineup to render a dynamic product collection and Blob URLs.
- Preserve typed source fallback and loading/error behavior.

**Exit criterion:** public pages render seeded products correctly in five locales and two themes on local and preview builds.

### Phase 2 — Authentication foundation

- Add password-hash utility, login/logout/session endpoints, signed cookie verification, origin checks, and login throttling.
- Add `/admin/login` and protected client-side routing.
- Test cookie flags and unauthorized API behavior on HTTPS preview deployment.

**Exit criterion:** anonymous requests cannot read admin data or mutate anything; valid login survives refresh and logout invalidates the browser session.

### Phase 3 — Product editor

- Add product list, create/edit forms, locale tabs, server validation, active state, and ordering.
- Perform writes transactionally and return updated records.
- Add dirty-form protection, optimistic UI only where rollback is reliable, and clear error messages.

**Exit criterion:** the owner can edit all current product fields, and changes appear on the storefront without a Git commit or redeploy.

### Phase 4 — Image management

- Add authenticated Blob token endpoint and direct client uploads.
- Validate file type/size, save Blob metadata, support themed galleries, and detach replaced images safely.
- Add a cleanup job/script for unreferenced Blobs with a grace period.

**Exit criterion:** image add/replace/reorder/remove works and unauthorized users cannot obtain upload capability.

### Phase 5 — Hardening and release

- Complete unit, integration, E2E, accessibility, mobile, and failure-state testing.
- Add structured error logging and an uptime/synthetic check for the public products endpoint.
- Back up/export product JSON and verify restore instructions.
- Deploy production database migrations before the compatible frontend/API deployment.
- Perform post-deploy smoke tests and rotate temporary setup credentials.

**Exit criterion:** the acceptance checklist passes in production and rollback/restore steps have been exercised.

## 15. Test Plan

### Unit and API tests

- Product DTO accepts valid locale/currency/image data and rejects invalid or oversized input.
- Password hash comparison, expired/tampered tokens, cookie creation, logout, and origin checks.
- Public endpoint returns only active products in order and applies locale fallback.
- Admin endpoints return `401/403` without a valid session.
- Price storage/formatting does not introduce floating-point errors.
- Product updates and ordering are transactional.

### End-to-end tests

- Owner logs in, edits an English and Japanese name, saves, refreshes, and sees persisted values.
- Owner changes a price and verifies locale-appropriate storefront formatting.
- Owner uploads and replaces both Grove and Wabi-Sabi images.
- Owner reorders and deactivates a product; public output updates accordingly.
- Wrong-password attempts are throttled and do not reveal whether a password exists.
- Session expiry returns the user to login without losing a clear warning about unsaved changes.
- Direct navigation to `/admin` and `/admin/products/:id` works on Vercel (SPA fallback test).
- Public page still displays its fallback if the product API is intentionally unavailable.

### Build and quality gates

- `npm run build`
- Type checking and lint scripts added to `package.json`
- Automated tests in CI for pull requests
- Verify no secrets are present in `dist/`, source maps, logs, or network responses
- Lighthouse/accessibility check on public and admin pages

## 16. Operational Plan

- Database migrations are versioned and run explicitly; application startup must not mutate schema.
- Before risky product changes, export a JSON snapshot from an authenticated admin endpoint or maintenance script.
- Retain `updated_at` and structured server logs for basic auditability. If multiple admins are later required, replace single-password auth with an identity provider and add `updated_by`.
- Alert on repeated server errors, failed migrations, and sustained use of storefront fallback data.
- Never delete a Blob immediately when replacing an image. Mark/detach it, then clean unreferenced objects after a grace period.
- Rollback code through Vercel deployment rollback. Roll back data with a forward corrective migration or a verified database restore—not by reverting schema files alone.

## 17. Acceptance Criteria

- `/admin` is not linked publicly and all admin API operations require a valid server-verified session.
- The plaintext admin password and signing secret are absent from Git, browser JavaScript, source maps, and API responses.
- The owner can create/edit, activate/deactivate, reorder, translate, and manage images for products.
- Product changes persist independently of GitHub builds and appear on the storefront within the documented cache window.
- The public page renders products dynamically in all five current locales and both current themes.
- Direct loads and refreshes of public/admin routes work on Vercel.
- Failed API/database requests produce a usable storefront fallback and visible admin errors.
- Login throttling, CSRF/origin protection, file validation, and secure cookie settings are verified in preview and production.
- A fresh environment can be recreated from committed migrations plus documented seed/restore procedures.

## 18. Out of Scope for the First Release

- Customer accounts or checkout/order processing.
- Multiple admin users, roles, password-reset email, or social login.
- Editing non-product page content such as recipes, footer, process, and hero copy.
- Automatic translation.
- Inventory synchronization or payment-provider integration.
- Permanent product deletion from the UI.

## 19. Key Risks and Mitigations

| Risk | Mitigation |
|---|---|
| Password embedded in Vite client | Authenticate only in Vercel Functions; keep hash/secret in server-only environment variables |
| Current UI assumes exactly two products | Refactor to stable IDs and dynamic arrays before enabling create/reorder |
| Catch-all SPA rewrite interferes with API routes | Prove routing in Phase 0 and explicitly preserve `/api/*` Function handling |
| Serverless login brute force | Distributed Upstash rate limit, generic errors, strong owner password |
| Image token exposed or anonymous uploads enabled | Issue short-lived upload tokens only after session verification and restrict MIME/size/path |
| Preview edits production content | Separate preview database/Blob configuration or make preview read-only |
| Database outage breaks the landing page | Short CDN cache plus the current typed source fallback and monitoring |
| Price strings diverge by locale | Store integer minor units and ISO currency; format at render time |
| Image replacement causes broken pages | Save new image first, atomically update references, delayed cleanup |
| Schema deploy breaks older frontend | Use backward-compatible additive migrations, deploy in expand/migrate/contract order |

## 20. References

- [Vite on Vercel](https://vercel.com/docs/frameworks/frontend/vite)
- [Vercel Functions](https://vercel.com/docs/functions)
- [Storage on Vercel Marketplace](https://vercel.com/docs/marketplace-storage)
- [Vercel Blob](https://vercel.com/docs/vercel-blob)
- [Vercel Blob client uploads](https://vercel.com/docs/vercel-blob/client-upload)
