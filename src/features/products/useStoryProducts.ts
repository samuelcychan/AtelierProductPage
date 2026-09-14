import { useEffect, useMemo, useState } from "react";
import type { Lang } from "@/app/i18n";
import { getClient } from "./client";
import { isSanityConfigured } from "./config";
import { storyFallback } from "./fallback";
import { formatSize } from "./format";
import { photoSources } from "./image";
import { pick } from "./localize";
import { STORY_PRODUCTS_QUERY, STORY_SLUGS } from "./query";
import type { CmsProduct, ProductsSource, StoryProduct, StorySlug } from "./types";

const CACHE_KEY = "ym-story-products-v1"; // bump when STORY_PRODUCTS_QUERY's shape changes
const TIMEOUT_MS = 2500;

function isProductList(value: unknown): value is CmsProduct[] {
  return (
    Array.isArray(value) &&
    value.every((p) => p !== null && typeof p === "object" && typeof (p as CmsProduct).slug === "string")
  );
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
    // quota exceeded or storage blocked; the live data still renders
  }
}

function toStoryProduct(cms: CmsProduct | undefined, base: StoryProduct, lang: Lang): StoryProduct {
  if (!cms) return base;
  const photo = cms.photos?.find((p) => p.theme === "story") ?? cms.photos?.find((p) => p.theme === "grove");
  const name = pick(cms.name, lang) || base.name;
  return {
    slug: base.slug,
    name,
    tastingNote: pick(cms.tastingNote, lang) || base.tastingNote,
    description: pick(cms.description, lang) || base.description,
    ingredients: pick(cms.ingredients, lang) || base.ingredients,
    japaneseLabel: cms.japaneseLabel?.trim() || base.japaneseLabel,
    sizeLabel: formatSize(cms.sizeValue, cms.sizeUnit) || base.sizeLabel,
    photo: photo
      ? { ...photoSources(photo), alt: pick(photo.alt, lang) || name, placeholder: photo.lqip }
      : base.photo,
  };
}

/**
 * Product content for /story.
 *
 * 1. Not configured: bundled copy, no request.
 * 2. Cached response: rendered at once while live data loads.
 * 3. No cache: bundled copy is shown while loading, so the page is never blank.
 * 4. Live response within 2.5 s: rendered and cached.
 * 5. Later response: cached for the next visit but not swapped in.
 */
export function useStoryProducts(lang: Lang): { products: Record<StorySlug, StoryProduct>; source: ProductsSource } {
  const [state, setState] = useState<{ data: CmsProduct[] | null; source: ProductsSource }>(() => {
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
      .fetch<unknown>(STORY_PRODUCTS_QUERY, { slugs: STORY_SLUGS }, { signal: controller.signal })
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

  const products = useMemo(() => {
    const base = storyFallback(lang);
    const bySlug = new Map((state.data ?? []).map((p) => [p.slug, p] as const));
    return {
      mustard: toStoryProduct(bySlug.get("mustard"), base.mustard, lang),
      tapenade: toStoryProduct(bySlug.get("tapenade"), base.tapenade, lang),
    };
  }, [state.data, lang]);

  return { products, source: state.source };
}
