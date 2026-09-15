import type { Lang } from "../src/app/i18n.js";
import { pick, type Localized } from "../src/features/products/localize.js";
import { STORY_SLUGS } from "../src/features/products/query.js";
import { sanity } from "./sanity.js";

const CATALOG_QUERY = /* groq */ `
*[_type == "product" && slug.current in $slugs] {
  "slug": slug.current, name, sizeValue, sizeUnit, sku, packedWeightGrams,
  customsDescription, hsCode, isActive, "jpy": prices.jpy,
  "stock": *[_type == "stock" && product._ref == ^._id][0]{ _id, _rev, available }
}`;

export interface CatalogStock {
  _id: string;
  _rev: string;
  available: number;
}

export interface CatalogItem {
  slug: string;
  name?: Localized | null;
  sizeValue?: number | null;
  sizeUnit?: string | null;
  sku?: string | null;
  packedWeightGrams?: number | null;
  customsDescription?: string | null;
  hsCode?: string | null;
  isActive?: boolean | null;
  jpy?: number | null;
  stock?: CatalogStock | null;
}

export type SellableItem = CatalogItem & { jpy: number; sku: string; packedWeightGrams: number; stock: CatalogStock };

export async function loadCatalog(): Promise<Map<string, CatalogItem>> {
  const items = await sanity().fetch<CatalogItem[]>(CATALOG_QUERY, { slugs: STORY_SLUGS });
  return new Map(items.map((item) => [item.slug, item]));
}

/**
 * For sale means: switched on, priced, SKU and packed weight set, and a stock
 * document with an integer count exists. The Studio requires SKU and weight only
 * while "For sale" is on, so a published product can still lack them.
 */
export function isForSale(item: CatalogItem | undefined): item is SellableItem {
  return (
    !!item?.isActive &&
    typeof item.jpy === "number" &&
    Number.isInteger(item.jpy) &&
    item.jpy > 0 &&
    !!item.sku &&
    typeof item.packedWeightGrams === "number" &&
    Number.isInteger(item.packedWeightGrams) &&
    item.packedWeightGrams > 0 &&
    !!item.stock &&
    Number.isInteger(item.stock.available)
  );
}

export function checkoutName(item: SellableItem, lang: Lang): string {
  const size = item.sizeValue && item.sizeUnit ? ` ${item.sizeValue}${item.sizeUnit}` : "";
  return `${pick(item.name ?? undefined, lang) || item.sku}${size}`;
}
