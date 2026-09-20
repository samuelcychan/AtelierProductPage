# Vendor Hosting Backup Plan

Backup hosting proposals for the Kimie lemon-jar storefront if Vercel Hobby cannot be used for commercial sales.

This document supplements `PLAN-stripe-and-shippo.md`. It changes only the hosting recommendation in decision D13; the Stripe Checkout, Sanity, Shippo/Japan Post, stock, fulfilment, and compliance decisions remain unchanged.

Information and prices were checked on **2026-09-20**. Provider terms and limits should be checked again before migration or launch.

## 1. Recommendation

Use **Cloudflare Workers with Static Assets on the Workers Free plan** for launch, subject to passing the Stripe webhook and reconciliation tests under the free plan's CPU limit.

This deployment would host:

- the Vite/React build as static assets;
- `/api/catalog`, `/api/checkout`, `/api/order`, and the Stripe webhook as Worker routes;
- the reconciliation task as a daily Cron Trigger; and
- all server-only credentials as encrypted Worker secrets.

The application would continue using Stripe, Sanity, and optionally Shippo exactly as described in `PLAN-stripe-and-shippo.md`.

### Why Cloudflare is the preferred backup

- Static asset requests are free and unlimited.
- Workers Free includes 100,000 Worker requests per day.
- Workers Free permits up to five Cron Triggers per account.
- The plan includes 128 MB memory, up to 64 environment variables, custom domains, and TLS.
- Free limits are hard service limits rather than automatic usage charges.
- Cloudflare does not describe Workers Free as restricted to personal, non-commercial sites. Its self-service terms contemplate customers that are companies or other legal entities. This is a terms-of-service observation, not legal advice.
- If the free CPU allowance proves insufficient, Workers Paid currently starts at **US$5/month**, substantially below Vercel Pro's cited price.

### Main constraint

Workers Free allows **10 ms of CPU time per HTTP request or Cron invocation**. Time spent waiting for network responses does not count, so requests to Stripe, Sanity, and Shippo are less concerning than local computation. Nevertheless, the following must be tested on the deployed Worker:

1. Stripe webhook signature verification using the raw request body.
2. Checkout Session creation.
3. Sanity transaction and optional Shippo order creation.
4. The daily reconciliation scan, including its maximum expected number of Sessions.
5. Duplicate webhook and reconciliation idempotency scenarios.

If these operations repeatedly exceed the free CPU allowance, upgrade to Workers Paid or use the Netlify fallback in section 3.

## 2. Cloudflare migration proposal

The frontend design and commerce behavior do not need to change. The migration is primarily a hosting adapter around the existing server modules.

### 2.1 Required code and configuration changes

1. Add a Cloudflare Worker entry point that routes the existing endpoints:
   - `GET /api/catalog`
   - `POST /api/checkout`
   - `GET /api/order`
   - `POST /api/stripe-webhook`
2. Expose the Vite `dist/` directory through Workers Static Assets and configure SPA fallback for `/story`, `/order/complete`, and the legal pages.
3. Replace `process.env` access in `server/env.ts` with Cloudflare environment bindings passed through the request context.
4. Store `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `SANITY_WRITE_TOKEN`, `SHIPPO_API_TOKEN`, `SHIPPO_WEBHOOK_TOKEN`, and `CRON_SECRET` as Worker secrets. Keep public Sanity configuration as non-secret bindings where appropriate.
5. Initialize Stripe with its Fetch HTTP client.
6. Verify Stripe webhook signatures asynchronously with the Web Crypto provider and the unmodified raw request body.
7. Replace the Vercel Cron HTTP endpoint with a Worker `scheduled()` handler running once daily. Keep the reconciliation implementation shared so it can still be invoked in tests.
8. Translate the security headers and SPA behavior from `vercel.json` into the Worker/static-assets configuration.
9. Add Wrangler configuration, local-development commands, and deployment scripts.
10. After deployment, register the Cloudflare production webhook URL in Stripe and, if Path A is enabled, Shippo.

Cloudflare's current Node compatibility layer supports many npm packages, but the deployed Stripe and Sanity paths must be exercised rather than assumed compatible.

### 2.2 Verification gate

Do not direct production traffic to Cloudflare until all of the following pass:

- `npm run typecheck` and `npm run build`;
- catalog enabled and disabled states;
- successful and rejected checkout requests;
- valid and invalid Stripe webhook signatures;
- paid-order fulfilment and exact-once stock decrement;
- duplicate webhook delivery;
- daily reconciliation, including an already-fulfilled Session;
- Shippo failure followed by reconciliation retry, if Path A is used;
- all SPA routes loaded directly and refreshed;
- production security headers;
- secret scan of the generated static assets; and
- a Stripe test-mode purchase from checkout through order completion.

### 2.3 Rollback

Keep the existing Vercel project available during validation. Initially deploy Cloudflare on its generated hostname, complete the test suite, and then move the custom domain. If a production problem appears, move DNS back to the last known-good deployment and remove or disable the Stripe webhook endpoint that should no longer receive events.

The commerce kill switch remains removal of `STRIPE_SECRET_KEY` followed by a deployment, or setting both Sanity stock documents to zero for an immediate no-deploy sales stop.

## 3. Secondary proposal: Netlify Free

Netlify Free is the second choice. It should require less backend adaptation because Netlify Functions use a Node.js runtime and accept Web-standard `Request` objects. Scheduled Functions are available on every pricing plan and currently have a 30-second execution limit.

### Advantages

- Smaller migration from the existing Vercel-style Node functions.
- Static hosting, serverless functions, secrets, custom domains, and scheduled functions are available together.
- The free plan has a hard monthly limit and does not automatically create overage charges.

### Disadvantages

New free accounts currently receive **300 credits per month**. Credits are consumed by:

- production deployments: 15 credits each;
- web bandwidth: 20 credits per GB;
- web requests: 2 credits per 10,000 requests; and
- function compute: 10 credits per GB-hour.

When the account reaches its limit, its projects are paused until the next billing cycle unless the owner upgrades. This is a material storefront-availability risk.

The current repository's generated site is approximately **14.6 MB**, including a roughly 4.9 MB video and several large PNG images. Browser caching and partial navigation reduce actual transfer, but an image-heavy campaign or repeated uncached visits could consume the Netlify allowance unexpectedly. Asset optimization would therefore be required before choosing Netlify Free for production.

### When to choose Netlify

Choose Netlify instead of Cloudflare only if:

- the Cloudflare implementation cannot reliably stay within its free CPU allowance;
- keeping the existing Node-oriented server code is more important than traffic headroom; and
- the owner accepts that the storefront may pause when the monthly credit allowance is exhausted.

## 4. Options not recommended

### GitHub Pages

Do not use GitHub Pages. GitHub explicitly states that Pages is not intended or allowed as free hosting for an online business or e-commerce site. It also does not provide the secret-bearing webhook and checkout backend this design requires.

### Static-only hosting

Do not place only the frontend on a static host while exposing Stripe secret keys in browser code. Checkout Session creation, webhook verification, Sanity writes, Shippo calls, and reconciliation must remain server-side.

### Firebase Spark

Do not select Firebase solely to preserve a zero-cost plan. The backend-function requirements may require enabling billed services, and the migration is not simpler than Cloudflare or Netlify.

### Render free services

Do not rely on a sleeping free web service for payment webhooks or scheduled fulfilment reconciliation. Payment and stock processing require predictable availability.

## 5. Revised D13

Replace decision D13 in `PLAN-stripe-and-shippo.md` with:

| ID | Decision | Recommendation | Why / consequence if changed |
|---|---|---|---|
| **D13** | Hosting plan | **Cloudflare Workers Free for launch**, after the Stripe webhook and reconciliation suite passes under the 10 ms CPU allowance. Upgrade fallback: Workers Paid from US$5/month. Secondary fallback: Netlify Free after asset optimization and acceptance of its monthly pause behavior. | Vercel Hobby restricts commercial use. Cloudflare can host the static Vite application, API routes, secrets, and daily scheduled task without a monthly charge at this store's expected launch volume. |

## 6. Decision sequence

1. Build a Cloudflare preview deployment without changing the production domain.
2. Run the complete commerce and webhook test suite in Stripe test mode.
3. Measure Worker CPU usage for the webhook and reconciliation paths.
4. If the free allowance is reliable, select Cloudflare Workers Free.
5. If it is not reliable, compare Workers Paid at US$5/month with Netlify Free's availability and credit tradeoffs.
6. Change DNS and production webhook destinations only after the selected platform passes the launch checklist.

## 7. Sources

Checked on 2026-09-20:

- [Cloudflare Workers pricing](https://developers.cloudflare.com/workers/platform/pricing/) — free and paid pricing, static asset billing, and lack of data-transfer charges on Workers Paid
- [Cloudflare Workers limits](https://developers.cloudflare.com/workers/platform/limits/) — request, CPU, memory, environment-variable, and Cron Trigger limits
- [Cloudflare Cron Triggers](https://developers.cloudflare.com/workers/configuration/cron-triggers/) — scheduled Worker handler and UTC scheduling
- [Cloudflare Static Assets billing and limitations](https://developers.cloudflare.com/workers/static-assets/billing-and-limitations/) — free and unlimited static asset requests
- [Cloudflare Pages Vite guide](https://developers.cloudflare.com/pages/framework-guides/deploy-a-vite3-project/) — Vite build and deployment support
- [Cloudflare SPA serving behavior](https://developers.cloudflare.com/pages/configuration/serving-pages/) — single-page application fallback
- [Cloudflare Node.js compatibility](https://developers.cloudflare.com/workers/runtime-apis/nodejs/) — Node compatibility behavior for npm dependencies
- [Stripe Cloudflare Worker template](https://github.com/stripe-samples/stripe-node-cloudflare-worker-template) — Stripe's Worker integration example
- [Netlify pricing](https://www.netlify.com/pricing/) — free-plan credits, deployment, bandwidth, request and compute meters, and hard-limit behavior
- [Netlify Scheduled Functions](https://docs.netlify.com/build/functions/scheduled-functions/) — availability on all plans and the 30-second scheduled execution limit
- [GitHub Pages limits](https://docs.github.com/en/pages/getting-started-with-github-pages/github-pages-limits) — prohibition on using Pages as free hosting for an online business or e-commerce site

