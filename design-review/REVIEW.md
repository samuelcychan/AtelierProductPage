# Kimie's jars — landing page review and UI proposal

Design review, 8 September 2026. Scope: review the existing React page and create a separate design artifact before implementation. Application source remains unchanged.

Open `concept.html` through the existing Vite server at http://localhost:5173/design-review/concept.html. The mockup is responsive; its links navigate within the design and its ingredient disclosures open. It does not implement commerce or language switching. All imagery is reused from this repository. Copy and the shortened English wordmark are proposals.

## Direction

Keep the warm illustrated kitchen, cream/green/mustard palette, Fraunces display typography, and Mulish body type. Give visitors one clear introduction, an immediate comparison of the two sauces, and appetizing serving ideas. Preserve Kimie's personality while reducing the amount of interface surrounding the content.

## Current review

| Priority | Finding and evidence | Proposed response |
| --- | --- | --- |
| P0 | Hero “Add to Cart” and final “Order Now” link to `#`; product CTAs link to `#buy`, which is the hero. There is no visible cart flow. See `Hero`, `JarInfo`, and `BuyStrip` in `src/app/App.tsx`. | Hero CTA should say “Explore the jars” and go to the product section. Product order buttons should open the confirmed product/order destination, preserving product selection. Only use “Add to cart” when cart behavior exists. |
| P0 | Current copy combines a plant-based brand descriptor and a VEGAN salad tag with ingredient lists containing honey and anchovies. Product descriptions also omit ingredients shown further down. | Distinguish the maker's positioning from product dietary claims. Consolidate product facts and show ingredient information at the point of selection. Confirm actual labels before applying dietary/allergen badges. |
| P1 | Hero has an 11-slogan carousel and two separately controlled tasting-note lists. A dark panel overlays much of the kitchen art; the screenshot shows numerous small arrows, dots, counters, and labels. | One stable headline, one explanatory paragraph, one primary CTA, and one serving-ideas link. Place the text on cream beside the illustration. Move tasting notes to product cards. |
| P1 | English brand text is a long unbroken line. Narrow viewport inspection shows clipping and a header wrapped across several rows. | Proposed compact “Kimie's jars” mark with Japanese subtitle. Desktop has three main links; mobile has one Menu control with language selection inside. Brand wording requires review. |
| P1 | Lineup initially shows one jar; visitors can switch between Carousel and Side by Side. Each product gallery has one actual image and two null placeholder slots. | Always show both jars side by side on desktop and stacked on mobile. Show only available imagery. Remove layout and empty-gallery controls from the shopping interface. |
| P1 | Recipe photos are small inside large numbered panels. Photo array uses salad, pasta, and potatoes while English titles include tapenade toast and vinaigrette. | Use full-width 4:3 photos with short serving titles matched to the actual images. Label as serving inspiration until full recipes are supplied. |
| P1 | Process and ingredient grids use a 340px minimum track inside 24px side padding, which can exceed small screens. | Use a single fluid column below the content breakpoint. Validate widths 320, 390, 768, and 1440px and long localized strings. |
| P2 | Five lengthy process steps and another large ingredients section repeat information and create a long journey. | Three concise process groups with the kitchen video; move ingredients into each product disclosure. Restore an FAQ only with approved answers. |
| P2 | Footer has `〒000-0000`, repeated Japan text, generic “Email”, and placeholder policy/social links. Metadata still describes preserved lemon. | Supply actual contact and policy destinations; align page metadata and visible offering. Omit incomplete contact fields from the final public design. |
| P2 | Hero rotates automatically; video autoplays and preloads; reveals rely on motion. | Static headline; video poster with play/pause. Respect reduced motion, keep content visible when animation is disabled, and avoid mandatory motion to understand the page. |

## Proposed page sequence

1. Compact header: brand → jars → serving ideas → kitchen → language → primary CTA.
2. Split hero: benefit headline and explicit sauce description on the left, illustrated kitchen on the right.
3. Quiet three-item introduction strip, using descriptive content rather than unverified trust claims.
4. Two product cards: consistent photo dimensions, flavor notes, name, short use case, price/weight, product CTA, ingredients disclosure.
5. Three serving ideas with prominent food photos.
6. Maker/process section with the existing illustrated video and three concise steps.
7. Final order invitation and useful footer. Shipping/storage FAQ can sit here once verified.

## Visual and responsive specification

- Content container: max 1280px including padding; 48px desktop and 22px mobile side padding. Desktop hero uses equal columns and a 48px gap.
- Typography: Fraunces headings, Mulish body. Hero 42–74px, section headings 34–50px, body 16–18px, supporting labels 12–14px. Do not apply forced uppercase/letter spacing to CJK copy.
- Colors: cream `#F9F8E8`, green text `#16392A`, muted green `#527463`, sage surface `#E7F0CF`, mustard `#E3A52B`. Mustard buttons use dark green text. Final implementation should map to existing theme variables.
- Spacing: approximately 88px desktop / 56px mobile between sections; use borders and space instead of repeated decorative frames.
- Images: distinct arched hero crop, consistent product photo area, 4:3 serving photos. Confirm final product crops keep labels legible. Use real maker photography if supplied; retain illustration otherwise.
- Mobile below 760px: compact header, copy before image, stacked products and serving ideas. Do not shrink desktop text or hide one of the two jars in a carousel.
- Controls: primary actions at least 48px tall, touch targets at least 44px, visible focus, native disclosures, no hover-only content. A product action must expose pending/success/error or clearly navigate to a named shop.
- Language: preserve all five implemented locales (`en`, `ja`, `fr`, `zh`, `zh-TW`). Mockup shows English only. Final locale switcher needs selected state, keyboard support, and localized accessible names. Test French expansion and Japanese/Chinese line wrapping.
- Theme: mockup develops Fresh Garden. Recommend one public brand appearance; if the Wabi-Sabi option is retained, apply the same content hierarchy and validate both themes. This is a design decision, not a deletion performed here.

## Content needed before commerce implementation

- Confirm approved brand wording and whether the offered range is the current two sauces or also the preserved-lemon jar referenced in older content.
- Confirm price currency: English currently uses `$13` and `$14`, while other existing fields use yen. Mockup retains current English values as explicitly marked reference data.
- Confirm product/order destination, fulfillment countries, shipping charges, storage guidance, and actual ingredient labels. Do not invent checkout, free shipping, reviews, stock counts, or certification claims.
- Supply real contact, shipping, privacy, and social destinations. These are content dependencies, not blockers to reviewing this design.

## Suggested implementation order after design review

1. Approve hero composition, compact brand treatment, and two-product layout.
2. Rework header, hero, product comparison, and mobile layout using existing theme variables.
3. Align all five locales and product facts; connect approved ordering destinations.
4. Simplify serving ideas/process/footer and add media and accessibility behavior.
5. Verify mobile overflow, keyboard navigation, menu/disclosures, CTA destinations, locale expansion, contrast, and reduced motion. Run the production build once source changes are made.

No application build is required for this standalone design-only artifact. Validation of the mockup is recorded separately in the conversation.

Mockup validation: inspected desktop at 1440px and mobile at 390px; all seven image references loaded; no page-width overflow was measured at those widths. Verified mobile menu opening, hero CTA navigation to the jars, and ingredient disclosure state. Production application files were not modified.
