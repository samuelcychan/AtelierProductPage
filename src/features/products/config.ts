const env = import.meta.env;

export const SANITY = {
  projectId: env.VITE_SANITY_PROJECT_ID?.trim() ?? "",
  dataset: env.VITE_SANITY_DATASET?.trim() || "production",
  apiVersion: env.VITE_SANITY_API_VERSION?.trim() || "2026-09-14",
};

// Kill switch: without VITE_SANITY_PROJECT_ID the site renders its bundled
// product copy and makes no request to Sanity.
export const isSanityConfigured = /^[a-z0-9-]+$/.test(SANITY.projectId);
