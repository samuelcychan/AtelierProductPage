# Kimie /story

Implementation brief derived from the existing brand, supplied assets, the proposed THREE-STORY-PLAN.md, and the user's instruction: “try to build the refine page in another route”. Routine creative choices below are authored implementation decisions, not invented user quotations.

- Vibe: warm, tactile, culinary, intimate. Existing green/cream palette and illustrated kitchen are evidence.
- Journey: kitchen invitation, quiet spoonful statement, interactive ingredients, comparable jars, serving ideas, maker, invitation to choose.
- Energy: gentle opening, quiet transition, one spatial peak, calm product comparison and closing.
- Feeling curve: welcome (kitchen collage), anticipation (large quiet sentence), wonder (ingredients leave a spoon), confidence (real jars), appetite (meal selection), trust (maker video), readiness (return to selected jar).
- Peak / tell-someone sentence: “It's the site where the ingredients lift out of a spoon, and you can switch between mustard and olive flavors.” The peak gets the only long sticky section.
- Signature: scroll opens an ingredient constellation above a modeled spoon; flavor choice changes the ingredients, explanatory copy, and selected jar.
- Aesthetic: retain brand's editorial serif and culinary illustration; real product photography. No generated asset work.
- Structure: distinct scenes, one sticky ingredient encounter, native scrolling elsewhere. Custom tasting-journey grammar: jump navigation, asymmetric collage hero, spatial taste encounter, static comparable products, interactive serving spread, maker split, resolved green close. Bans continuous camera flights, repeated pinning, slogan carousels, and fake cart actions.
- Assets: existing kitchen illustration, five product photos, three serving photos, and cooking video. No isolated person cutout exists; preserve the original complete illustration and layer a separate framed product photo in front rather than pretending it is a cutout.
- Audience / offer: visitors exploring Kimie's mustard and tapenade. End belief: a spoonful makes familiar meals more interesting. Primary action: explore the jars; commerce destination remains unconfigured.
- Scope: /story route in existing Vite application, original / preserved. All five locale choices supported. No deployment or platform migration for this alternate-route preview.
- Fingerprint: registry empty; no prior rows to compare.

## Layer contract

Paper background is stationary. Kitchen illustration translates slowly inside an arch. A real product photo in a separate foreground frame moves at a stronger rate and casts a contact shadow over the illustration frame. Typography stays stationary. On mobile the imagery follows the full headline; reduced motion retains the same complete composition without displacement.

## Score

| Beat | Device | Intent |
|---|---|---|
| Kitchen | Layered parallax collage | Welcome and depth |
| Spoonful | Quiet natural-flow typography | Anticipation without empty pinning |
| Taste | Sticky Three.js object transformation + flavor input | One memorable peak |
| Jars | Static comparison and native disclosures | Confidence |
| Meals | Image wipe on selected serving idea | Appetite and useful agency |
| Maker | Opt-in video with native controls | Trust |
| Close | Static oversized statement and selected-jar link | Resolve |

## Constraints

Dynamic import Three.js only near the scene. Render on demand, cap DPR, pause offscreen/hidden, dispose on unmount, preserve a semantic fallback, and remove extended sticky travel under reduced motion. Existing ingredient copy includes honey and fish: no vegan claims. No guessed checkout, contact, prices, stock, or shipping promise.
