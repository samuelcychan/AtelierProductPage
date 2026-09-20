// Server-only configuration. Never prefix these variables with VITE_.
//
// Relative imports in api/ and server/ carry a ".js" extension: Vercel runs
// these functions as Node ES modules ("type": "module"), which cannot resolve
// extensionless specifiers, and tsc's "bundler" resolution maps ".js" to ".ts".

const read = (name: string) => process.env[name]?.trim() ?? "";

export const env = {
  stripeSecretKey: read("STRIPE_SECRET_KEY"),
  stripeWebhookSecret: read("STRIPE_WEBHOOK_SECRET"),
  sanityProjectId: read("VITE_SANITY_PROJECT_ID"),
  sanityDataset: read("VITE_SANITY_DATASET") || "production",
  sanityWriteToken: read("SANITY_WRITE_TOKEN"),
  shippoApiToken: read("SHIPPO_API_TOKEN"),
  shippoWebhookToken: read("SHIPPO_WEBHOOK_TOKEN"),
  cronSecret: read("CRON_SECRET"),
  siteUrl: read("SITE_URL").replace(/\/$/, ""),
};

// Kill switch: without these, /api/catalog reports commerce as off and the site
// shows no prices or buy buttons. Removing STRIPE_SECRET_KEY and redeploying stops sales.
export const isCommerceConfigured = Boolean(
  env.stripeSecretKey && env.sanityProjectId && env.sanityWriteToken && env.siteUrl,
);

// Path A switch: without a Shippo token, fulfilment records the order and skips Shippo.
export const isShippoConfigured = env.shippoApiToken.length > 0;
