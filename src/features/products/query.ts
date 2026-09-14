import type { StorySlug } from "./types";

export const STORY_SLUGS: StorySlug[] = ["mustard", "tapenade"];

// Every language is returned and the page picks one client-side, so switching
// languages never triggers another request. Visibility and order are ignored:
// /story always presents both flavours.
export const STORY_PRODUCTS_QUERY = /* groq */ `
*[_type == "product" && slug.current in $slugs] {
  "slug": slug.current,
  name, tastingNote, description, ingredients, japaneseLabel,
  sizeValue, sizeUnit,
  "photos": photos[defined(asset._ref)]{
    _key, theme, alt, asset, crop, hotspot,
    "lqip": asset->metadata.lqip
  }
}`;
