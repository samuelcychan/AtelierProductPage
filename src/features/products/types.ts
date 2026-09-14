import type { Prices } from "./format";
import type { Localized } from "./localize";

/** Where a photo is used: a main-page theme, or the /story page. */
export type PhotoContext = "grove" | "wabi" | "story";

/** One photo exactly as the queries return it. */
export interface CmsPhoto {
  _key: string;
  theme?: PhotoContext;
  style?: string;
  alt?: Localized;
  asset?: { _ref: string; _type?: string };
  crop?: { top: number; bottom: number; left: number; right: number };
  hotspot?: { x: number; y: number; height: number; width: number };
  lqip?: string;
}

/** One product exactly as the queries return it, with every language included. */
export interface CmsProduct {
  slug: string;
  name?: Localized;
  tastingNote?: Localized;
  description?: Localized;
  ingredients?: Localized;
  japaneseLabel?: string;
  sizeValue?: number;
  sizeUnit?: string;
  photos?: CmsPhoto[];
  // Stored for the main page, which does not read from Sanity yet.
  eyebrow?: Localized;
  tag?: Localized;
  prices?: Partial<Prices>;
  isActive?: boolean;
  sortOrder?: number;
}

/** /story is built around exactly these two flavours (switch, 3D scene, pairing link). */
export type StorySlug = "mustard" | "tapenade";

export interface StoryPhoto {
  src: string;
  srcSet?: string;
  alt: string;
  placeholder?: string; // blurred low-quality data URI
}

/** What /story renders for one flavour: one language, formatted, ready to display. */
export interface StoryProduct {
  slug: StorySlug;
  name: string;
  tastingNote: string;
  description: string;
  ingredients: string;
  japaneseLabel: string;
  sizeLabel: string;
  photo: StoryPhoto;
}

export type ProductsSource = "loading" | "cms" | "cache" | "fallback";
