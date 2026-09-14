/**
 * One-time seed of products from the site's current copy.
 *
 *   cd studio
 *   npx sanity exec scripts/seed.ts --with-user-token -- --dry-run
 *   npx sanity exec scripts/seed.ts --with-user-token
 *   npx sanity exec scripts/seed.ts --with-user-token -- --force   # overwrite existing products
 *
 * The shared name, tasting note and description come from the /story copy:
 * it is the newer text and agrees with the ingredient lists. Main-page-only
 * fields (eyebrow, badge, prices) come from src/app/i18n.ts.
 *
 * After launch the CMS is the source of truth. --force DISCARDS the owner's
 * edits to these products.
 */
import {createReadStream, existsSync} from 'node:fs'
import path from 'node:path'
import {getCliClient} from 'sanity/cli'
import {translations, type Lang} from '../../src/app/i18n'
import {storyCopy} from '../../src/app/story/copy'
import {formatPrice, formatSize, type Prices} from '../../src/features/products/format'

const LANGS: Lang[] = ['en', 'ja', 'fr', 'zh', 'zh-TW']
const args = new Set(process.argv.slice(2))
const DRY_RUN = args.has('--dry-run')
const FORCE = args.has('--force')

type Theme = 'story' | 'grove' | 'wabi'
type Text = (lang: Lang) => string

type SeedProduct = {
  slug: string
  internalTitle: string
  lineupIndex: number // position in translations[lang].lineup.items
  name: Text
  tastingNote?: Text
  description: Text
  ingredients?: Text
  japaneseLabel: string
  sizeValue: number
  prices: Prices
  isActive: boolean
  sortOrder: number
  photos: Array<{file: string; theme: Theme}>
}

const lineup = (lang: Lang, index: number) => translations[lang].lineup.items[index]

const SEED: SeedProduct[] = [
  {
    slug: 'mustard',
    internalTitle: 'Whole-grain mustard',
    lineupIndex: 1,
    name: (l) => storyCopy[l].mustard,
    tastingNote: (l) => storyCopy[l].mustardNote,
    description: (l) => storyCopy[l].mustardDesc,
    ingredients: (l) => translations[l].ingredients.items[0].desc,
    japaneseLabel: '粒マスタード',
    sizeValue: 200,
    prices: {usd: 13, jpy: 1900, eur: 12, cny: 91, twd: 400},
    isActive: true,
    sortOrder: 10,
    photos: [
      {file: 'jar_mustard_studio.jpg', theme: 'story'},
      {file: 'jar_mustard_studio.jpg', theme: 'grove'},
      {file: 'jar_mustard_wabisabi.jpg', theme: 'wabi'},
    ],
  },
  {
    slug: 'tapenade',
    internalTitle: 'Olive tapenade',
    lineupIndex: 2,
    name: (l) => storyCopy[l].tapenade,
    tastingNote: (l) => storyCopy[l].tapenadeNote,
    description: (l) => storyCopy[l].tapenadeDesc,
    ingredients: (l) => translations[l].ingredients.items[1].desc,
    japaneseLabel: 'タプナード',
    sizeValue: 200,
    prices: {usd: 14, jpy: 2100, eur: 13, cny: 101, twd: 440},
    isActive: true,
    sortOrder: 20,
    photos: [
      {file: 'story_tapenade.webp', theme: 'story'},
      {file: 'jar_tapenade.png', theme: 'grove'},
      {file: 'jar_tapenade_wabisabi.jpg', theme: 'wabi'},
    ],
  },
  {
    // Not shown anywhere yet; stored hidden so the catalogue is complete.
    slug: 'preserved-lemon',
    internalTitle: 'Preserved lemon',
    lineupIndex: 0,
    name: (l) => lineup(l, 0).name,
    description: (l) => lineup(l, 0).desc,
    japaneseLabel: '保存レモン',
    sizeValue: 350,
    prices: {usd: 16, jpy: 2400, eur: 15, cny: 115, twd: 500},
    isActive: false,
    sortOrder: 30,
    photos: [],
  },
]

function localized(type: 'String' | 'Text', text: Text) {
  return LANGS.map((lang) => ({
    _key: lang.replace('-', '_'),
    _type: `internationalizedArray${type}Value`,
    language: lang,
    value: text(lang),
  }))
}

// Guard: prices and sizes rendered from the CMS must equal today's strings.
function assertFormattingMatches() {
  const problems: string[] = []
  for (const p of SEED) {
    for (const lang of LANGS) {
      const item = lineup(lang, p.lineupIndex)
      // Intl's French output uses a no-break space (U+00A0); the source uses a normal space.
      const price = formatPrice(p.prices, lang).replace(/\u00A0/g, ' ')
      const size = formatSize(p.sizeValue, 'g')
      if (price !== item.price) problems.push(`${p.slug} ${lang} price: CMS "${price}" vs site "${item.price}"`)
      if (size !== item.size) problems.push(`${p.slug} ${lang} size: CMS "${size}" vs site "${item.size}"`)
    }
  }
  if (problems.length) {
    console.error('Formatting guard failed:\n  ' + problems.join('\n  '))
    process.exit(1)
  }
  console.log(`Formatting guard passed: ${SEED.length * LANGS.length} prices and sizes match the current site.`)
}

async function main() {
  if (path.basename(process.cwd()) !== 'studio') {
    console.error('Run this from the studio/ folder.')
    process.exit(1)
  }
  assertFormattingMatches()

  const client = getCliClient({apiVersion: '2026-09-14'})
  const ids = SEED.map((p) => `product-${p.slug}`)
  const existing: string[] = await client.fetch('*[_id in $ids]._id', {
    ids: [...ids, ...ids.map((id) => `drafts.${id}`)],
  })
  if (existing.length && !FORCE) {
    console.error(
      `Refusing to overwrite existing documents: ${existing.join(', ')}\n` +
        "Re-run with -- --force only if discarding the owner's edits is intended.",
    )
    process.exit(1)
  }

  const assetsDir = path.resolve(process.cwd(), '..', 'src', 'assets')
  const uploaded = new Map<string, string>() // file name -> asset id
  const upload = async (file: string) => {
    const cached = uploaded.get(file)
    if (cached) return cached
    const fullPath = path.join(assetsDir, file)
    if (!existsSync(fullPath)) throw new Error(`Missing asset: ${fullPath}`)
    // Asset ids are content hashes, so re-running never duplicates an image.
    const id = DRY_RUN
      ? `image-dry-run-${file}`
      : (await client.assets.upload('image', createReadStream(fullPath), {filename: file}))._id
    uploaded.set(file, id)
    return id
  }

  const tx = client.transaction()
  for (const p of SEED) {
    const photos = []
    for (const photo of p.photos) {
      photos.push({
        _key: photo.theme,
        _type: 'image',
        asset: {_type: 'reference', _ref: await upload(photo.file)},
        theme: photo.theme,
        style: 'STUDIO',
        alt: localized('String', (l) => lineup(l, p.lineupIndex).name),
      })
    }

    const doc = {
      _id: `product-${p.slug}`,
      _type: 'product',
      internalTitle: p.internalTitle,
      slug: {_type: 'slug', current: p.slug},
      name: localized('String', p.name),
      ...(p.tastingNote && {tastingNote: localized('String', p.tastingNote)}),
      description: localized('Text', p.description),
      ...(p.ingredients && {ingredients: localized('Text', p.ingredients)}),
      japaneseLabel: p.japaneseLabel,
      sizeValue: p.sizeValue,
      sizeUnit: 'g',
      photos,
      // Main page fields, hidden in the Studio for now.
      eyebrow: localized('String', (l) => lineup(l, p.lineupIndex).jp),
      tag: localized('String', (l) => lineup(l, p.lineupIndex).tag),
      prices: p.prices,
      isActive: p.isActive,
      sortOrder: p.sortOrder,
    }

    if (DRY_RUN) console.log(JSON.stringify(doc, null, 2))
    tx.createOrReplace(doc)
    tx.delete(`drafts.${doc._id}`) // so the Studio shows the seeded version
  }

  if (DRY_RUN) {
    console.log('Dry run: nothing written.')
    return
  }
  await tx.commit()
  console.log(`Seeded ${SEED.length} products.`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
