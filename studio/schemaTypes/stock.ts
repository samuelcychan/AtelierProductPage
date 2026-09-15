import {defineField, defineType} from 'sanity'

// liveEdit: every change saves immediately, with no draft. The checkout webhook
// decrements `available` on the same document, so a draft would overwrite it.
//
// One document per product, with fixed ids (stock-mustard, stock-tapenade)
// created by scripts/seed-commerce.ts. The server finds stock by those ids.
export const stock = defineType({
  name: 'stock',
  title: 'Stock',
  type: 'document',
  liveEdit: true,
  fields: [
    defineField({
      name: 'product',
      title: 'Product',
      type: 'reference',
      to: [{type: 'product'}],
      readOnly: true,
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'available',
      title: 'Jars available to sell',
      description:
        'Saves as you type. Orders lower this number automatically. Below zero means oversold: refund or make more.',
      type: 'number',
      validation: (rule) => rule.required().integer(),
    }),
  ],
  preview: {
    select: {title: 'product.internalTitle', available: 'available'},
    prepare: ({title, available}) => ({title: title ?? 'Stock', subtitle: `${available ?? 0} available`}),
  },
})
