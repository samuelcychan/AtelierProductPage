import { isForSale, loadCatalog } from "../server/catalog.js";
import { isCommerceConfigured } from "../server/env.js";
import { json } from "../server/http.js";

export async function GET(): Promise<Response> {
  if (!isCommerceConfigured) return json({ enabled: false }, 200, "public, s-maxage=300");
  try {
    const catalog = await loadCatalog();
    const products = [...catalog.values()].map((item) => {
      const forSale = isForSale(item);
      return {
        slug: item.slug,
        forSale,
        available: forSale && item.stock.available > 0,
        unitAmount: forSale ? item.jpy : null,
        currency: "JPY" as const,
      };
    });
    // Short CDN cache: a price or stock change reaches the page within about a minute.
    // /api/checkout re-reads live values, so a stale page can never under-charge.
    return json({ enabled: true, products }, 200, "public, s-maxage=60, stale-while-revalidate=300");
  } catch (error) {
    console.error("[catalog] Sanity read failed", errorMessage(error));
    return json({ enabled: true, unavailable: true }, 503, "no-store");
  }
}

// Logs the message only: a client error object can carry request details.
function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
