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

3. **Point Preview at it.** `VITE_SANITY_DATASET` is currently one variable covering Production *and* Preview, so it cannot simply be edited: untick Preview on the existing variable, then add a new **Preview-only** `VITE_SANITY_DATASET` with the value `staging`.

   No new token is needed — Sanity tokens are scoped to the project, not a dataset, so `SANITY_WRITE_TOKEN` writes to both. No CORS change is needed either, for the same reason.

4. **Redeploy the branch.** `VITE_*` values are baked in at build time, so this will not take effect without a fresh build.

**Verify:** `/api/catalog` on the preview reflects staging's stock; make a test purchase; confirm the `stock-*` documents in `production` did not move.

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

- [ ] **F1** `CRON_SECRET` set on Preview and Production, redeployed, cron returns `{"checked":…}`
- [ ] **F2** preview no longer writes to the live dataset (Route A or B), re-tested end to end
- [ ] **F3** `localhost:5173` re-added without credentials, stale origin deleted, verified by response header

F1 and F2 are also acceptance criteria on backlog item 12; F3 is an owner action on the board.
