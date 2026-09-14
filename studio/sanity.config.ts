import {defineConfig} from 'sanity'
import {structureTool} from 'sanity/structure'
import {visionTool} from '@sanity/vision'
import {internationalizedArray} from 'sanity-plugin-internationalized-array'
import {schemaTypes} from './schemaTypes'
import {LANGUAGES, LANGUAGE_IDS} from './schemaTypes/languages'

// The project id is public (it also ships in the storefront bundle). It is read
// from studio/.env so this file works before the Sanity project exists.
const projectId = process.env.SANITY_STUDIO_PROJECT_ID
const dataset = process.env.SANITY_STUDIO_DATASET || 'production'

if (!projectId) {
  throw new Error('Set SANITY_STUDIO_PROJECT_ID=<project id> in studio/.env.')
}

export default defineConfig({
  name: 'default',
  title: 'Kimie Jars',

  projectId,
  dataset,

  plugins: [
    structureTool({
      structure: (S) =>
        S.list()
          .title('Content')
          .items([S.documentTypeListItem('product').title('Products')]),
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
    // No permanent deletion of products.
    actions: (prev, context) =>
      context.schemaType === 'product' ? prev.filter(({action}) => action !== 'delete') : prev,
  },
})
