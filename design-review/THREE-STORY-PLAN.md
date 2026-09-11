# Storytelling and Three.js direction

## Recommendation

Use a hybrid page. Let semantic HTML, photography, and typography tell most of the story. Use Three.js for one signature transition between Kimie's kitchen and the two finished jars.

The concept is **From one spoonful to many meals**. As the visitor scrolls, a spoon lifts from the illustrated kitchen scene. Mustard seeds, olive fragments, capers, lemon peel, and herbs separate into light three-dimensional layers. They gather around the two jars, then resolve into real product photography. This is the emotional peak. The rest of the page returns to calm editorial layouts.

This preserves the handmade character. It avoids turning the product into a technology demonstration.

## Current, storytelling, and Three.js comparison

| Dimension | Current page | Editorial storytelling | Hybrid storytelling plus Three.js |
| --- | --- | --- | --- |
| First impression | Illustrated kitchen covered by a dense control panel | Clear headline beside the kitchen illustration | Layered kitchen hero with restrained depth and a clear headline |
| Page logic | Collection of product, recipe, process, and ingredient sections | A sequence in which each section changes what the visitor understands | The same sequence, with one spatial transformation at the emotional peak |
| Main interaction | Slogan, tasting-note, product, and gallery carousels | Scrolling reveals narrative chapters; product actions remain direct | Scroll drives a short 3D ingredient-to-jar sequence; other controls remain ordinary HTML |
| Brand feeling | Warm and crafted, but interface-heavy | Intimate, editorial, quiet, human | Intimate and tactile with one moment of wonder |
| Product clarity | One jar at a time with empty gallery positions | Both jars visible and comparable | 3D transition resolves into the same clear two-product comparison |
| Technical cost | Moderate React state and many controls | Low to moderate | Moderate to high for one isolated scene |
| Mobile behavior | Desktop interface wraps into several rows | Dedicated single-column composition | Dedicated mobile composition with simplified motion or static frames |
| Accessibility | Many small controls and automatic motion | Strong semantic reading order and reduced motion | Same semantic content remains underneath; canvas is decorative and replaceable |
| Performance risk | Large hero image and autoplay video | Mostly image optimization | WebGL memory, shader, texture, and low-power-device constraints must be managed |
| Distinctiveness | Strong illustration, familiar section structure | Strong art direction and narrative pacing | Most distinctive when the 3D moment is short and specific to the ingredients |

## Visitor journey

| Act | Visitor understanding | Feeling | Visual technique |
| --- | --- | --- | --- |
| 1. Invitation | Kimie makes two sauces for everyday meals | Welcome | Split hero with independently moving background, Kimie, jar, and foreground-food planes. Copy remains still and readable. |
| 2. The spoonful | A small amount changes a whole meal | Curiosity | A quiet macro crop of the spoon and mustard texture. One line of copy enters as the food moves slightly closer. |
| 3. Inside the flavor | Each sauce has recognizable ingredients and a distinct character | Wonder | Signature Three.js scene. Ingredient fragments separate in depth, respond subtly to pointer movement, and gather into mustard and tapenade families. |
| 4. The jars | There are two clear choices | Confidence | The 3D scene resolves into real product photographs. Both products appear together with flavor, uses, ingredients, price, and one action each. |
| 5. At the table | The jars fit into familiar meals | Appetite | Large food images use alternating horizontal reveals: salad, pasta, potatoes. Avoid another pinned or 3D sequence. |
| 6. Kimie's care | The sauces come from a thoughtful process | Trust | Existing kitchen video plays on request beside three concise preparation stages. |
| 7. Choose a jar | The visitor knows what to do next | Readiness | A calm, static close with both jars and the approved order action. The ending holds rather than fading away. |

The intended feeling curve is: welcome → curiosity → wonder → confidence → appetite → trust → readiness. The memorable peak is Act 3: “It is the site where the ingredients float out of Kimie's spoon and become the two jars.”

## Three.js signature scene

### Scene composition

- A transparent WebGL canvas sits behind real HTML copy.
- The scene begins with a shallow macro view of a spoon. Ingredient elements are separate meshes or camera-facing textured planes, not generic glowing particles.
- Mustard uses seed clusters, a thin ribbon of oil, lemon peel, and warm highlights.
- Tapenade uses olive pieces, capers, herb leaves, and a darker oil ribbon.
- Scroll progress moves ingredients from one shared spoon into two distinct flavor constellations.
- Near the end, the constellations align with the positions of the two product photographs. The canvas crossfades out while the HTML product section becomes fully visible.
- Pointer movement changes depth by only a few pixels. It should feel tactile rather than game-like.

### Motion score

| Scroll range | Behavior |
| --- | --- |
| 0–20% | Spoon moves slightly forward; ingredients remain attached and legible as a single texture. |
| 20–50% | Ingredient layers separate along depth and begin sorting left and right. |
| 50–75% | Two flavor families become visually distinct; short HTML labels name their character. |
| 75–100% | Elements settle around jar silhouettes, then dissolve into real product photography. |

Use transforms and opacity for HTML. In WebGL, update object matrices from normalized scroll progress and interpolate toward the target state. Avoid free-running animation once the visitor stops scrolling.

## Technical architecture

| Layer | Technique | Purpose |
| --- | --- | --- |
| Document | React and semantic HTML | Headings, localized copy, links, product facts, disclosures, and complete reading order |
| Scroll state | One requestAnimationFrame loop fed by passive scroll observation | Smooth normalized progress without binding heavy work directly to every scroll event |
| 3D renderer | Three.js with a transparent WebGL canvas | Ingredient depth, camera motion, and the transformation into the product comparison |
| Assets | Compressed WebP/AVIF textures and simple low-polygon geometry | Keep visual fidelity without large model downloads |
| Section motion | CSS transforms, opacity, and clip-path | Lightweight reveals outside the WebGL act |
| Fallback | Static ingredient composition and direct product photography | Same message when WebGL, motion, or device capability is limited |

The first prototype should use Three.js directly rather than React Three Fiber. The page needs one controlled scene, so a small renderer lifecycle is easier to profile and dispose. React should own the section; Three.js should own only the canvas contents.

## Performance budget and safeguards

- Load the Three.js module and scene assets only when the visitor approaches the signature act.
- Keep the initial hero independent of WebGL so the first meaningful content does not wait for JavaScript or GPU setup.
- Target no more than two texture atlases, simple geometry, and a modest draw-call count. Prefer instancing for repeated mustard seeds or capers.
- Cap device pixel ratio, typically at 1.5 on desktop and 1 on constrained mobile devices.
- Pause rendering when the scene is outside the viewport or the document is hidden.
- Release textures, materials, geometry, event listeners, and the renderer when the component unmounts.
- Detect failed WebGL context creation and context loss, then reveal the static fallback immediately.
- Do not depend on hover, pointer precision, or WebGL to expose product information or actions.

## Mobile and reduced-motion treatment

Mobile should be art-directed separately. Use fewer ingredient elements, a shorter depth range, capped resolution, and no pointer response. If measured performance is poor, replace the live scene with three pre-rendered still states connected by simple crossfades.

For `prefers-reduced-motion: reduce`, render the final ingredient composition as a static image and continue directly into the product cards. All narrative copy remains visible in document order.

## Implementation plan

| Phase | Deliverable | Completion test |
| --- | --- | --- |
| 1. Story prototype | Static HTML/React layout for all seven acts using current assets | The page makes sense with JavaScript, animation, and WebGL disabled |
| 2. Layered hero | Separate background, Kimie, jar, and foreground planes; dedicated mobile crop | Headline retains contrast at every tested scroll position and no important visual is clipped |
| 3. WebGL proof | One isolated route or feature flag with the ingredient-to-jar scene | Stable on desktop and mobile test hardware; context failure produces the correct fallback |
| 4. Product handoff | Align the final 3D frame with the real two-card product section | Transition does not jump at 320, 390, 768, and 1440 pixel widths |
| 5. Supporting acts | Food-photo reveals, concise maker story, and resolved final CTA | At least four visual device families across the journey and no device repeats in adjacent acts |
| 6. Accessibility | Reduced-motion path, keyboard flow, canvas semantics, video controls | Full content and ordering path work without the canvas and without a pointer |
| 7. Optimization | Lazy loading, texture compression, pixel-ratio cap, lifecycle cleanup | Performance profiling shows no continuous offscreen rendering or accumulating GPU resources |
| 8. Visual verification | Desktop, mobile, reduced-motion, and intermediate-scroll screenshot strips | No dead scroll, unreadable copy, empty states, or broken transitions between sampled frames |

## Decision

Proceed with the hybrid if there is room for a custom interaction and real-device testing. Choose pure editorial storytelling if launch speed, broad low-end-device support, or content changes are the priority. Do not build the whole page as one continuous 3D flythrough; it would make the story monotonous and place every section behind the same technical risk.
