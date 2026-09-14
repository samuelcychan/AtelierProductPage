import mustardPhoto from "@/assets/jar_mustard_studio.jpg";
import tapenadePhoto from "@/assets/story_tapenade.webp";
import { translations, type Lang } from "@/app/i18n";
import { storyCopy } from "@/app/story/copy";
import type { StoryProduct, StorySlug } from "./types";

// Exactly what /story rendered before it read from Sanity. Shown when Sanity is
// not configured or unreachable, and used field by field for any value the CMS
// leaves empty.
export function storyFallback(lang: Lang): Record<StorySlug, StoryProduct> {
  const c = storyCopy[lang];
  const t = translations[lang];
  return {
    mustard: {
      slug: "mustard",
      name: c.mustard,
      tastingNote: c.mustardNote,
      description: c.mustardDesc,
      ingredients: t.ingredients.items[0].desc,
      japaneseLabel: "粒マスタード",
      sizeLabel: t.lineup.items[1].size,
      photo: { src: mustardPhoto, alt: t.lineup.items[1].name },
    },
    tapenade: {
      slug: "tapenade",
      name: c.tapenade,
      tastingNote: c.tapenadeNote,
      description: c.tapenadeDesc,
      ingredients: t.ingredients.items[1].desc,
      japaneseLabel: "タプナード",
      sizeLabel: t.lineup.items[2].size,
      photo: { src: tapenadePhoto, alt: t.lineup.items[2].name },
    },
  };
}
