import {defineConfig, type WorkspaceOptions} from 'sanity'
import {structureTool} from 'sanity/structure'
import {visionTool} from '@sanity/vision'
import {internationalizedArray} from 'sanity-plugin-internationalized-array'
import {schemaTypes} from './schemaTypes'
import {LANGUAGES, LANGUAGE_IDS} from './schemaTypes/languages'

// The project id is public (it also ships in the storefront bundle). It is read
// from studio/.env so this file works before the Sanity project exists.
const projectId = process.env.SANITY_STUDIO_PROJECT_ID

if (!projectId) {
  throw new Error('Set SANITY_STUDIO_PROJECT_ID=<project id> in studio/.env.')
}

/**
 * One workspace per dataset, so the dataset in use is always named in the
 * navbar and switching needs no restart. `production` holds the real catalogue
 * and the real stock counts; `staging` is what the branch preview reads and
 * writes, so test purchases never touch live inventory (security finding F2).
 *
 * The CLI still follows `SANITY_STUDIO_DATASET` in studio/.env via
 * sanity.cli.ts — pass `--dataset` to be explicit when running scripts.
 */
function workspace(dataset: 'production' | 'staging', title: string): WorkspaceOptions {
  return {
    name: dataset,
    title,
    basePath: `/${dataset}`,
    projectId: projectId as string,
    dataset,

    plugins: [
      structureTool({
        structure: (S) =>
          S.list()
            .title('Content')
            .items([
              S.documentTypeListItem('product').title('Products'),
              // Stock saves as you type (liveEdit). The two documents are created
              // by scripts/seed-commerce.ts with fixed ids the checkout server uses.
              S.documentTypeListItem('stock').title('Stock'),
            ]),
      }),
      internationalizedArray({
        languages: [...LANGUAGES],
        // Show all five language rows on every product, so a missing translation
        // is visible rather than hidden behind an "add language" button.
        defaultLanguages: [...LANGUAGE_IDS],
        fieldTypes: ['string', 'text'],
      }),
      // GROQ playground for the developer.
      visionTool(),
    ],

    schema: {types: schemaTypes},

    document: {
      // Stock documents exist only under the fixed ids stock-mustard and
      // stock-tapenade, so they can't be created by hand.
      newDocumentOptions: (prev) => prev.filter((item) => item.templateId !== 'stock'),
      // No permanent deletion of products; stock can be neither deleted nor duplicated.
      actions: (prev, context) => {
        if (context.schemaType === 'product') return prev.filter(({action}) => action !== 'delete')
        if (context.schemaType === 'stock') {
          return prev.filter(({action}) => action !== 'delete' && action !== 'duplicate')
        }
        return prev
      },
    },
  }
}

export default defineConfig([
  workspace('production', 'PRODUCTION — real stock'),
  workspace('staging', 'Staging — preview tests'),
])
