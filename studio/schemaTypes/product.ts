import {defineArrayMember, defineField, defineType} from 'sanity'
import {allLanguages} from './validation'

// Where a photo appears. Values must match PhotoContext in
// src/features/products/types.ts. Main-page titles match the labels visitors
// see in that page's theme switcher.
const PHOTO_CONTEXTS = [
  {title: 'Story page', value: 'story'},
  {title: 'Main page, Fresh Garden', value: 'grove'},
  {title: 'Main page, Wabi-Sabi', value: 'wabi'},
]

// One price per market. Major units: 13 means $13, 1900 means ¥1,900.
const PRICES = [
  {name: 'usd', title: 'USD, English site'},
  {name: 'jpy', title: 'JPY, Japanese site'},
  {name: 'eur', title: 'EUR, French site'},
  {name: 'cny', title: 'CNY, Simplified Chinese site'},
  {name: 'twd', title: 'TWD, Traditional Chinese site'},
]

// Fields marked MAIN PAGE are stored now so no migration is needed later, but
// stay hidden until the main page reads from Sanity (PLAN3 §8.5): editing them
// would change nothing visible yet. They carry no validation because Sanity
// validates hidden fields too, and an error Kimie cannot see would block
// publishing. When unhiding, restore the rules from PLAN3 §6.3.
const HIDDEN_UNTIL_MAIN_PAGE = true

export const product = defineType({
  name: 'product',
  title: 'Product',
  type: 'document',

  groups: [
    {name: 'copy', title: 'Words', default: true},
    {name: 'size', title: 'Size'},
    {name: 'photos', title: 'Photos'},
    {name: 'settings', title: 'Settings'},
  ],

  fields: [
    // ── Words: shared by every page ─────────────────────────────────────
    defineField({
      name: 'name',
      title: 'Product name',
      type: 'internationalizedArrayString',
      group: 'copy',
      validation: (rule) => rule.custom(allLanguages),
    }),
    defineField({
      name: 'tastingNote',
      title: 'Tasting note',
      description: 'One short line, for example "Bright. Tangy. A little unexpected."',
      type: 'internationalizedArrayString',
      group: 'copy',
      validation: (rule) => rule.custom(allLanguages),
    }),
    defineField({
      name: 'description',
      title: 'Description',
      type: 'internationalizedArrayText',
      group: 'copy',
      validation: (rule) => rule.custom(allLanguages),
    }),
    defineField({
      name: 'ingredients',
      title: 'Ingredients',
      description: 'Shown under "Ingredients & details".',
      type: 'internationalizedArrayText',
      group: 'copy',
      validation: (rule) => rule.custom(allLanguages).warning(),
    }),
    defineField({
      name: 'japaneseLabel',
      title: 'Japanese label',
      description: 'The vertical label on the product photo, for example 粒マスタード. Same in every language.',
      type: 'string',
      group: 'copy',
      validation: (rule) => rule.max(12).warning('Long labels overflow the photo.'),
    }),

    // ── Size ─────────────────────────────────────────────────────────────
    defineField({
      name: 'sizeValue',
      title: 'Size',
      type: 'number',
      group: 'size',
      validation: (rule) => rule.required().positive(),
    }),
    defineField({
      name: 'sizeUnit',
      title: 'Unit',
      type: 'string',
      group: 'size',
      initialValue: 'g',
      options: {list: ['g', 'ml'], layout: 'radio', direction: 'horizontal'},
      validation: (rule) => rule.required(),
    }),

    // ── Photos ───────────────────────────────────────────────────────────
    defineField({
      name: 'photos',
      title: 'Photos',
      description: 'Each photo belongs to one place on the site.',
      type: 'array',
      group: 'photos',
      of: [
        defineArrayMember({
          type: 'image',
          options: {hotspot: true},
          validation: (rule) => rule.required().assetRequired(),
          fields: [
            defineField({
              name: 'theme',
              title: 'Used on',
              type: 'string',
              options: {list: PHOTO_CONTEXTS, layout: 'radio'},
              validation: (rule) => rule.required(),
            }),
            defineField({
              name: 'alt',
              title: 'Description for screen readers',
              type: 'internationalizedArrayString',
              validation: (rule) => rule.custom(allLanguages).warning(),
            }),
            // MAIN PAGE: the "STUDIO · 01/03" label on that page's photo carousel.
            defineField({
              name: 'style',
              title: 'Shot',
              type: 'string',
              initialValue: 'STUDIO',
              options: {list: ['STUDIO', 'TABLE', 'DETAIL']},
              hidden: HIDDEN_UNTIL_MAIN_PAGE,
            }),
          ],
          preview: {
            select: {media: 'asset', theme: 'theme'},
            prepare: ({media, theme}) => ({
              media,
              title: PHOTO_CONTEXTS.find((c) => c.value === theme)?.title ?? 'Choose where this photo is used',
            }),
          },
        }),
      ],
      validation: (rule) =>
        rule
          .custom((photos: Array<{theme?: string}> | undefined) =>
            (photos ?? []).some((p) => p.theme === 'story') ||
            'No Story page photo: /story will fall back to the Fresh Garden photo, or the original one.',
          )
          .warning(),
    }),

    // ── Settings ─────────────────────────────────────────────────────────
    defineField({
      name: 'internalTitle',
      title: 'Name in this list',
      description: 'Only shown here in the Studio.',
      type: 'string',
      group: 'settings',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'slug',
      title: 'ID',
      description: 'Do not change: the site finds this product by its ID.',
      type: 'slug',
      group: 'settings',
      options: {source: 'internalTitle', maxLength: 48},
      validation: (rule) => rule.required(),
    }),

    // ── MAIN PAGE fields, hidden for now ─────────────────────────────────
    defineField({
      name: 'eyebrow',
      title: 'Small label above the name',
      type: 'internationalizedArrayString',
      hidden: HIDDEN_UNTIL_MAIN_PAGE,
    }),
    defineField({
      name: 'tag',
      title: 'Badge',
      type: 'internationalizedArrayString',
      hidden: HIDDEN_UNTIL_MAIN_PAGE,
    }),
    defineField({
      name: 'prices',
      title: 'Prices',
      type: 'object',
      hidden: HIDDEN_UNTIL_MAIN_PAGE,
      fields: PRICES.map(({name, title}) => defineField({name, title, type: 'number'})),
    }),
    defineField({
      name: 'isActive',
      title: 'Show on main page',
      type: 'boolean',
      initialValue: false,
      hidden: HIDDEN_UNTIL_MAIN_PAGE,
    }),
    defineField({
      name: 'sortOrder',
      title: 'Position on main page',
      type: 'number',
      initialValue: 100,
      hidden: HIDDEN_UNTIL_MAIN_PAGE,
    }),
  ],

  preview: {
    select: {title: 'internalTitle', media: 'photos.0.asset'},
    prepare: ({title, media}) => ({title: title ?? 'Untitled product', media}),
  },
})
