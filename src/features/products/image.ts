import { createImageUrlBuilder } from "@sanity/image-url";
import { SANITY } from "./config";
import type { CmsPhoto } from "./types";

const WIDTHS = [400, 800, 1200, 1600];

let builder: ReturnType<typeof createImageUrlBuilder> | null = null;

// The /story frames crop with CSS object-fit and change shape at each
// breakpoint, so images are only width-bounded here, never cropped server-side.
// auto("format") serves WebP or AVIF to browsers that accept them.
function urlAt(photo: CmsPhoto, width: number): string {
  builder ??= createImageUrlBuilder({ projectId: SANITY.projectId, dataset: SANITY.dataset });
  return builder.image(photo).width(width).fit("max").auto("format").quality(80).url();
}

export function photoSources(photo: CmsPhoto): { src: string; srcSet: string } {
  return {
    src: urlAt(photo, 1200),
    srcSet: WIDTHS.map((w) => `${urlAt(photo, w)} ${w}w`).join(", "),
  };
}
