/**
 * Adds the commerce data that checkout needs to the existing products, without
 * touching anything the owner has entered.
 *
 *   cd studio
 *   npx sanity exec scripts/seed-commerce.ts --with-user-token         # dry run: shows the plan
 *   npx sanity exec scripts/seed-commerce.ts write --with-user-token   # writes it
 *
 * `write` is a plain word so it works in every shell: PowerShell's npx wrapper
 * drops a bare `--`, which breaks the `-- --write` form. `-- --write` still
 * works in Git Bash, cmd or with npx.cmd.
 *
 * Unlike seed.ts this is a DRY RUN BY DEFAULT: nothing is written without `write`.
 * Run seed.ts first; this script finds the products by their slug (ID).
 *
 * What it does, per product:
 *   - stock-<slug>: created with `available: 0` and a reference to the product,
 *     only if it does not exist (createIfNotExists). An existing stock count is
 *     never changed.
 *   - sku: set only if the product has none (setIfMissing), on the published
 *     document and on its draft if one exists, so publishing the draft keeps it.
 *
 * Safe to re-run. It never overwrites a value, and never sets prices, packed
 * weight, customs description, HS code or stock numbers: the owner enters those
 * in the Studio (PLAN-stripe-and-shippo §7.3).
 */
import path from 'node:path'
import {getCliClient} from 'sanity/cli'

const args = new Set(process.argv.slice(2))
const WRITE = args.has('write') || args.has('--write')

const COMMERCE = [
  {slug: 'mustard', stockId: 'stock-mustard', sku: 'KIMIE-MUS-200'},
  {slug: 'tapenade', stockId: 'stock-tapenade', sku: 'KIMIE-TAP-200'},
]

type ProductRow = {
  _id: string
  slug: string
  sku?: string
  isActive?: boolean
  jpy?: number
  packedWeightGrams?: number
}

type StockRow = {_id: string; available?: number; productRef?: string}

const isDraft = (id: string) => id.startsWith('drafts.')

async function main() {
  if (path.basename(process.cwd()) !== 'studio') {
    console.error('Run this from the studio/ folder.')
    process.exit(1)
  }

  const client = getCliClient({apiVersion: '2026-09-15'})
  const slugs = COMMERCE.map((c) => c.slug)
  const stockIds = COMMERCE.map((c) => c.stockId)

  // Published documents and drafts both match by slug.
  const products: ProductRow[] = await client.fetch(
    `*[_type == "product" && slug.current in $slugs]{
      _id, "slug": slug.current, sku, isActive, "jpy": prices.jpy, packedWeightGrams
    }`,
    {slugs},
    {perspective: 'raw'},
  )
  const stocks: StockRow[] = await client.fetch(
    '*[_id in $stockIds]{_id, available, "productRef": product._ref}',
    {stockIds},
    {perspective: 'raw'},
  )

  const tx = client.transaction()
  let changes = 0
  const todo: string[] = []

  for (const c of COMMERCE) {
    const docs = products.filter((p) => p.slug === c.slug)
    const published = docs.filter((p) => !isDraft(p._id))
    const drafts = docs.filter((p) => isDraft(p._id))

    if (published.length !== 1) {
      console.warn(
        `${c.slug}: expected 1 published product, found ${published.length}` +
          (drafts.length ? ` (and ${drafts.length} draft)` : '') +
          '. Skipped. Publish the product (or run seed.ts) first.',
      )
      continue
    }
    const product = published[0]

    // Stock: create only when missing. The reference needs a published product.
    const stock = stocks.find((s) => s._id === c.stockId)
    if (stock) {
      console.log(`${c.stockId}: exists (available: ${stock.available ?? 'not set'}). Left unchanged.`)
      if (stock.productRef !== product._id) {
        console.warn(`${c.stockId}: references ${stock.productRef ?? 'nothing'}, expected ${product._id}. Check it in the Studio.`)
      }
    } else {
      console.log(`${c.stockId}: will create with available: 0, product -> ${product._id}.`)
      tx.createIfNotExists({
        _id: c.stockId,
        _type: 'stock',
        product: {_type: 'reference', _ref: product._id},
        available: 0,
      })
      changes++
    }

    // SKU: set only where missing, on the published document and any draft.
    for (const doc of [product, ...drafts]) {
      if (doc.sku) {
        console.log(`${doc._id}: sku is "${doc.sku}". Left unchanged.`)
      } else {
        console.log(`${doc._id}: will set sku to ${c.sku}.`)
        tx.patch(doc._id, (patch) => patch.setIfMissing({sku: c.sku}))
        changes++
      }
    }

    // Report what the owner still has to enter. Never written by this script.
    if (product.packedWeightGrams == null) todo.push(`${c.slug}: packed weight (g)`)
    if (product.jpy == null) todo.push(`${c.slug}: JPY price`)
    if (product.isActive !== true) todo.push(`${c.slug}: turn on "For sale" when ready`)
    todo.push(`${c.stockId}: jars available`)
  }

  if (todo.length) console.log('\nStill to fill in by hand in the Studio:\n  ' + todo.join('\n  '))

  if (changes === 0) {
    console.log('\nNothing to write.')
    return
  }
  if (!WRITE) {
    console.log(
      `\nDry run: ${changes} change(s) planned, nothing written. To apply:\n` +
        '  npx sanity exec scripts/seed-commerce.ts write --with-user-token',
    )
    return
  }
  await tx.commit()
  console.log(`\nWrote ${changes} change(s).`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
