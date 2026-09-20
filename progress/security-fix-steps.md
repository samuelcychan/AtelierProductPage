# Security fix steps (findings F1, F2, F3)

The findings themselves, with severity and evidence, are in [README.md](README.md) under "Security review (PLAN §13, 2026-09-20)". This file is only the *how*.

**None of these depend on the Vercel Pro decision (D13), which is on hold.** All three work on the plans you are on today, verified against the vendors' own documentation on 2026-09-20:

- Vercel: "Cron Jobs are available on all plans"; Hobby's limits are once-a-day minimum interval and ±59 min precision
- Vercel: "Standard Protection is available on all plans", and "Protection Bypass for Automation is available on all plans"
- Sanity: the free plan includes **2 datasets (public only)**; this project uses 1

In Git Bash, prefix any `vercel` command whose argument starts with `/` with `MSYS_NO_PATHCONV=1`, or the leading slash is rewritten into a Windows path and the command fails with `'C:\Program' is not recognized`. PowerShell does not have this problem.

---

## F1 — Set `CRON_SECRET` (medium)

**Why.** `/api/cron/reconcile` is the daily safety net: it asks Stripe for Checkout Sessions completed in the last three days and re-runs fulfilment on each, so a webhook that never arrived still produces an order and a stock decrement. Fulfilment is exactly-once, so re-running on orders you already have does nothing. With no `CRON_SECRET` set, the endpoint refuses every caller — including Vercel's own scheduler — so the safety net has never run.

### Steps

1. **Generate a secret.**

   ```
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```

2. **Add it to Vercel**, on Preview and Production. The CLI prompts for the value:

   ```
   npx.cmd vercel env add CRON_SECRET preview
   npx.cmd vercel env add CRON_SECRET production
   ```

   Or in the dashboard: Project → Settings → Environment Variables, ticking both.

3. **Redeploy.** Environment changes only reach *new* deployments. Push any commit, or use Redeploy on the latest deployment.

4. **Optional, for local testing:** add `CRON_SECRET=<value>` to the root `.env` (not `.env.local` — see CLAUDE.md).

### Verify — on the **preview**, not production

`/api/cron/reconcile` tests `isCommerceConfigured` *before* the bearer:

```ts
if (!isCommerceConfigured || !authorized(request)) return 401
```

Production is deliberately commerce-dark (no `STRIPE_SECRET_KEY`, `SANITY_WRITE_TOKEN` or `SITE_URL`), so it answers **401 whatever bearer you send** — the secret is never read. That is correct: there is nothing to reconcile while the shop is off. Production will keep returning 401, and Vercel's daily call will keep failing, until commerce is switched on at item 13. Do not treat that as a broken fix.

The preview has all seven variables, so test there. Redeploy it first — Vercel applies environment variables at deploy time, so a deployment built before `CRON_SECRET` existed does not have it:

```
npx.cmd vercel redeploy https://atelier-product-page-git-feat-commerce-62a5ef-samuelcychan-team.vercel.app
```

Then:

```
curl -H "Authorization: Bearer <secret>" https://<preview-host>/api/cron/reconcile
```

Expect `{"checked":N,"failed":0}` instead of `401 Unauthorized`. Safe to run: every session it finds is already logged, so each one is a no-op.

**At go-live**, re-run the same check against production once its Stripe and Sanity variables are set; that is when the daily cron starts doing real work.

### Notes

- Vercel registers crons **only from production deployments**. `npx.cmd vercel crons ls` shows what is registered.
- To test without waiting for the schedule: `MSYS_NO_PATHCONV=1 npx.cmd vercel crons run /api/cron/reconcile`.
- To read the outcome, the plain log list does not show status codes. Use `npx.cmd vercel logs --environment production --limit 5 --json` and read `responseStatusCode`.
- The 401 is logged at level `info`, not `error`, so it will not appear in error-filtered views.
- On Hobby, `0 1 * * *` fires somewhere between 01:00 and 01:59 UTC (10:00–10:59 JST). Irrelevant for a daily safety net.

---

## F2 — Stop previews writing to live data (medium)

**Why.** The branch preview is publicly reachable and its `SANITY_WRITE_TOKEN` and dataset point at `production`. Anyone who learns the URL can complete a test-card checkout and decrement real stock — which is how `stock-mustard` reached 0 during testing.

Two routes. **Route A is recommended**, because it also stops test purchases consuming real inventory; Route B only stops strangers.

### Route A — give Preview its own Sanity dataset

1. **Create it.** Public, because the browser reads product copy from Sanity with no token:

   ```
   cd studio && npx.cmd sanity dataset create staging --visibility public
   ```

   The free plan allows 2 public datasets and this project uses 1, so this fits.

2. **Copy the products across.** `sanity dataset copy` is neater but may need a paid plan; export/import always works:

   ```
   cd studio && npx.cmd sanity dataset export production ../staging.tar.gz
   cd studio && npx.cmd sanity dataset import ../staging.tar.gz staging
   ```

3. **Point Preview at it — by splitting the variable, not editing it.** `VITE_SANITY_DATASET` starts as one variable covering Production *and* Preview. It must become **two**:

   ```
   npx.cmd vercel env rm VITE_SANITY_DATASET
   echo production | npx.cmd vercel env add VITE_SANITY_DATASET production
   echo staging    | npx.cmd vercel env add VITE_SANITY_DATASET preview
   ```

   ⚠️ **The mistake to avoid** (made and caught on 2026-09-20): editing the shared variable's value to `staging` also moves **production** onto the staging dataset. Nothing breaks immediately, because `VITE_*` is baked in at build time and the live build keeps the old value — but the next production deploy silently switches the live site to staging data, and because staging is a copy it looks completely normal. Confirm with `vercel env ls` that **two** `VITE_SANITY_DATASET` rows exist, one per environment.

   No new token is needed — Sanity tokens are scoped to the project, not a dataset, so `SANITY_WRITE_TOKEN` writes to both. No CORS change is needed either, for the same reason.

4. **Redeploy the branch.** `VITE_*` values are baked in at build time, so this will not take effect without a fresh build.

**Verify.** The decisive check is which dataset each site actually queries. Open `/story` and read the Sanity request:

```js
performance.getEntriesByType('resource').map(r => r.name).filter(n => /apicdn\.sanity\.io/.test(n))
```

The preview must show `/data/query/staging`, production `/data/query/production`. Then make a test purchase on the preview and confirm the `stock-*` documents in the `production` dataset did not move.

### Seeing both datasets in the Studio

`studio/sanity.config.ts` defines **one workspace per dataset**, so the Studio names the dataset in the navbar and switching needs no restart:

| Workspace | URL | Dataset |
|---|---|---|
| PRODUCTION — real stock | `http://localhost:3333/production` | `production` |
| Staging — preview tests | `http://localhost:3333/staging` | `staging` |

`npm --prefix studio run dev` starts it; bare `http://localhost:3333` redirects to `/production`. Use "Choose another workspace" in the top-left to switch. This matters because the two datasets hold identical-looking content — without the label there is nothing on screen to tell you whether you are about to edit real stock.

Outside the Studio:

```
cd studio && npx.cmd sanity dataset list
cd studio && npx.cmd sanity documents query "*[_type=='stock']{_id,available}" --dataset staging
```

sanity.io/manage → project → Datasets shows both with their sizes.

**The CLI still defaults to `production`** via `SANITY_STUDIO_DATASET` in `studio/.env` and `sanity.cli.ts`, so pass `--dataset staging` explicitly when a script should touch staging — including `scripts/seed-commerce.ts`.

**Consequence to accept:** real stock lives in `production` and preview testing only touches `staging`. The two will drift, and a preview test no longer tells you anything about real inventory.

### Route B — turn on Vercel deployment protection

1. Project → Settings → Deployment Protection → **Vercel Authentication** (Standard Protection), applied to Preview deployments. Available on all plans.

2. **This blocks Stripe's webhook too**, so generate a **Protection Bypass for Automation** secret (Settings → Deployment Protection) and append it to the webhook URL registered in Stripe, which the Vercel docs name as a supported case:

   ```
   https://<preview-host>/api/stripe-webhook?x-vercel-protection-bypass=<secret>
   ```

3. Re-test a preview purchase end to end, because the webhook path has changed.

**Trade-off:** free and quick, but the preview still writes to live stock, and your Stripe webhook URL now carries a secret that must be rotated with the bypass token.

---

## F3 — Remove credentials from a dev CORS origin (low)

**Why.** `http://localhost:3333` and `http://localhost:5173` both return `Access-Control-Allow-Credentials: true`. A page served from those ports on a machine signed in to Sanity could read private documents, including the `fulfilment.*` order log, and write as that user. The Studio needs it on 3333; the site's dev server on 5173 does not, because it reads the public CDN with no token. The deployed origins are already credential-free.

### Steps

Run from the `studio` folder, logged in (`npx sanity login`):

```
cd studio && npx.cmd sanity cors delete http://localhost:5173
cd studio && npx.cmd sanity cors add http://localhost:5173 --no-credentials
cd studio && npx.cmd sanity cors delete https://atelier-product-page-38z417igl-samuelcychan-team.vercel.app
```

The second command removes the stale origin left over from the old CLI deployment. **Leave `http://localhost:3333` alone.**

Dashboard route: sanity.io/manage → project `59rfnf2c` → API → CORS Origins. The credentials setting is not editable in place; delete and re-add.

### Verify

`npx sanity cors list` shows the origins but not the credentials flag, so check the API directly — the response must no longer carry `Access-Control-Allow-Credentials`:

```
curl -sI -H "Origin: http://localhost:5173" "https://59rfnf2c.api.sanity.io/v2026-09-14/data/query/production?query=*%5B_type==%22stock%22%5D%7B_id%7D"
```

---

## Checklist

- [x] **F1** — done 2026-09-20. `CRON_SECRET` set on Preview and Production. On the preview, `GET /api/cron/reconcile` with the bearer returned **`{"checked":1,"failed":0}` (HTTP 200)**, and the same call without it returned 401. The one session it examined was already fulfilled, so nothing changed — idempotency confirmed on a live deployment. Production still answers 401 by design until commerce is switched on at item 13.
- [x] **F2** — done 2026-09-20, Route A. `staging` created and seeded from `production`; `VITE_SANITY_DATASET` split into two variables (`production` → `production`, `preview` → `staging`). Proof: `stock-mustard` was set to **5 in staging only**, after which the preview's `/api/catalog` reported mustard `available:true` and `/api/checkout` reported `available:5`, while the `production` dataset stayed at 0. The preview's server functions therefore read and write staging, and a preview test purchase can no longer touch live inventory.
- [x] **F3** — done, verified 2026-09-21. `http://localhost:5173` deleted and re-added with `--no-credentials`, and the stale `atelier-product-page-38z417igl-…` origin removed from the CORS list. Proof: a query to the Sanity API with `Origin: http://localhost:5173` returns `Access-Control-Allow-Origin` but **no `Access-Control-Allow-Credentials`**, while `http://localhost:3333` still returns `Access-Control-Allow-Credentials: true`, which the Studio needs. `http://localhost:3000` and `https://kimie-atelier.vercel.app` are credential-free too.

**Left in place deliberately:** staging `stock-mustard` is 5, so the preview has stock to test with. The `production` dataset reads mustard 1 / tapenade 1 (checked 2026-09-21) — real launch numbers must be set there before go-live.

F1 and F2 are also acceptance criteria on backlog item 12; F3 is an owner action on the board.
