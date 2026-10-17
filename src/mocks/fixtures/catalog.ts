import type { Network } from '@/contracts/common'
import type { CollectionSlug, Edition, Rarity } from '@/contracts/nft'
import { createRng } from '../utils/rng'
import type { Rng } from '../utils/rng'
import { centsToEth } from '../utils/text'
import type { NftRecord } from '../db/types'

type Character = { image: string; alt: string }

const characters: readonly Character[] = [
  {
    image: '/assets/nfts/emerald-ape-640.webp',
    alt: 'Macaco marrom de óculos redondos e jaqueta verde',
  },
  {
    image: '/assets/nfts/sage-nomad-640.webp',
    alt: 'Macaco cinza com chapéu verde e moletom roxo',
  },
  {
    image: '/assets/nfts/neon-vessel-640.webp',
    alt: 'Macaco preto com brinco dourado e gola alta verde',
  },
  {
    image: '/assets/nfts/golden-beat-640.webp',
    alt: 'Macaco dourado com fones de ouvido verdes',
  },
]

const collectionLabels: Record<CollectionSlug, string> = {
  'arte-digital': 'Arte digital',
  fotografia: 'Fotografia',
  musica: 'Música',
  'arte-3d': 'Arte 3D',
  colecionaveis: 'Colecionáveis',
  generativa: 'Generativa',
  jogos: 'Jogos',
  assinaturas: 'Assinaturas',
  utilidade: 'Utilidade',
}

const networkLabels: Record<Network, string> = {
  ethereum: 'Ethereum',
  polygon: 'Polygon',
  solana: 'Solana',
}

const creators = [
  { id: 'creator_lia', name: 'Lia Montenegro' },
  { id: 'creator_theo', name: 'Theo Barreto' },
  { id: 'creator_iris', name: 'Íris Valadares' },
  { id: 'creator_caio', name: 'Caio Furtado' },
  { id: 'creator_nara', name: 'Nara Quintela' },
  { id: 'creator_otto', name: 'Otto Bellini' },
  { id: 'creator_vera', name: 'Vera Siqueira' },
  { id: 'creator_dante', name: 'Dante Moreira' },
] as const

type NftSeed = {
  name: string
  character: number
  cents: number
  originalCents?: number
  rarity: Rarity
  collection: CollectionSlug
  network: Network
}

const featuredSeeds: readonly NftSeed[] = [
  {
    name: 'Emerald Ape #042',
    character: 0,
    cents: 119,
    rarity: 'common',
    collection: 'arte-digital',
    network: 'ethereum',
  },
  {
    name: 'Sage Nomad #009',
    character: 1,
    cents: 169,
    rarity: 'common',
    collection: 'colecionaveis',
    network: 'polygon',
  },
  {
    name: 'Neon Vessel #552',
    character: 2,
    cents: 199,
    originalCents: 229,
    rarity: 'rare',
    collection: 'generativa',
    network: 'ethereum',
  },
  {
    name: 'Cosmic Bloom #118',
    character: 1,
    cents: 129,
    rarity: 'common',
    collection: 'arte-3d',
    network: 'solana',
  },
  {
    name: 'Violet Nomad #314',
    character: 1,
    cents: 139,
    rarity: 'common',
    collection: 'musica',
    network: 'polygon',
  },
  {
    name: 'Ivory Baron #088',
    character: 2,
    cents: 179,
    rarity: 'common',
    collection: 'fotografia',
    network: 'ethereum',
  },
  {
    name: 'Golden Beat #207',
    character: 3,
    cents: 99,
    rarity: 'common',
    collection: 'musica',
    network: 'ethereum',
  },
  {
    name: 'Golden Rhythm #073',
    character: 3,
    cents: 69,
    rarity: 'common',
    collection: 'jogos',
    network: 'solana',
  },
  {
    name: 'Golden Signal #160',
    character: 3,
    cents: 39,
    rarity: 'common',
    collection: 'assinaturas',
    network: 'polygon',
  },
]

const adjectives = [
  'Cosmic',
  'Velvet',
  'Solar',
  'Lunar',
  'Neon',
  'Amber',
  'Onyx',
  'Jade',
  'Coral',
  'Mystic',
  'Rustic',
  'Crimson',
] as const

const nouns = [
  'Ape',
  'Nomad',
  'Vessel',
  'Baron',
  'Signal',
  'Beat',
  'Bloom',
  'Echo',
  'Drifter',
  'Oracle',
  'Sentinel',
  'Muse',
] as const

const collectionSlugs = Object.keys(collectionLabels) as CollectionSlug[]
const networkSlugs = Object.keys(networkLabels) as Network[]

const TOTAL_NFTS = 48
const MIN_PRICE_CENTS = 2
const MAX_PRICE_CENTS = 1230
const BASE_LISTING_TIME = Date.parse('2026-10-10T12:00:00.000Z')
const HOUR_MS = 3_600_000
const NEW_COUNT = 12
const TRENDING_COUNT = 16
const SOLD_OUT_INDEXES: ReadonlySet<number> = new Set([11, 29])
const LIMITED_SOLD_OUT_INDEXES: ReadonlySet<number> = new Set([3])

const editionTemplates = [
  { key: 'standard', label: 'Edição padrão', multiplier: 100, supply: 100 },
  { key: 'limited', label: 'Edição limitada', multiplier: 150, supply: 25 },
  { key: 'rare', label: 'Edição rara', multiplier: 300, supply: 5 },
] as const

function characterAt(index: number) {
  const character = characters.at(index % characters.length)
  if (!character) {
    throw new Error('Character fixtures are empty')
  }
  return character
}

function creatorAt(index: number) {
  const creator = creators.at(index % creators.length)
  if (!creator) {
    throw new Error('Creator fixtures are empty')
  }
  return creator
}

function buildGeneratedSeeds(rng: Rng): NftSeed[] {
  const usedNames = new Set(featuredSeeds.map((seed) => seed.name))
  const seeds: NftSeed[] = []

  for (let index = 0; seeds.length < TOTAL_NFTS - featuredSeeds.length; index += 1) {
    const number = String(rng.int(1, 999)).padStart(3, '0')
    const name = `${rng.pick(adjectives)} ${rng.pick(nouns)} #${number}`
    if (usedNames.has(name)) {
      continue
    }
    usedNames.add(name)

    const cents = index === 0 ? MIN_PRICE_CENTS : index === 1 ? MAX_PRICE_CENTS : rng.int(10, 1100)

    seeds.push({
      name,
      character: rng.int(0, characters.length - 1),
      cents,
      originalCents: rng.next() < 0.2 ? Math.round(cents * 1.15) : undefined,
      rarity: rng.next() < 0.15 ? 'rare' : 'common',
      collection: rng.pick(collectionSlugs),
      network: rng.pick(networkSlugs),
    })
  }

  return seeds
}

function buildEditions(id: string, index: number, cents: number, rng: Rng): Edition[] {
  const count = index < featuredSeeds.length ? 2 : rng.int(1, 3)

  return editionTemplates.slice(0, count).map((template) => {
    const soldOut =
      SOLD_OUT_INDEXES.has(index) ||
      (template.key === 'limited' && LIMITED_SOLD_OUT_INDEXES.has(index))

    return {
      id: `${id}_${template.key}`,
      label: template.label,
      price: centsToEth(Math.round((cents * template.multiplier) / 100)),
      supply: template.supply,
      available: soldOut ? 0 : rng.int(1, template.supply),
    }
  })
}

function buildRecord(seed: NftSeed, index: number, rng: Rng): NftRecord {
  const id = `nft_${String(index + 1).padStart(3, '0')}`
  const main = characterAt(seed.character)
  const second = characterAt(seed.character + 1)
  const third = characterAt(seed.character + 2)
  const creator = creatorAt(index)
  const editions = buildEditions(id, index, seed.cents, rng)
  const standard = editions[0]
  if (!standard) {
    throw new Error('Every NFT needs at least one edition')
  }

  return {
    id,
    name: seed.name,
    image: { url: main.image, alt: main.alt },
    price: standard.price,
    originalPrice: seed.originalCents ? centsToEth(seed.originalCents) : null,
    rarity: seed.rarity,
    collection: seed.collection,
    network: seed.network,
    available: editions.reduce((total, edition) => total + edition.available, 0),
    version: 1,
    description: `${seed.name} é uma peça de ${collectionLabels[seed.collection]} criada por ${creator.name} e cunhada na rede ${networkLabels[seed.network]}.`,
    creator,
    gallery: [
      { url: main.image, alt: main.alt },
      { url: second.image, alt: second.alt },
      { url: third.image, alt: third.alt },
    ],
    editions,
    tags: [
      collectionLabels[seed.collection],
      networkLabels[seed.network],
      ...(seed.rarity === 'rare' ? ['Raro'] : []),
    ],
    listedAt: new Date(BASE_LISTING_TIME - index * 7 * HOUR_MS).toISOString(),
    popularity: rng.int(0, 1000),
    isNew: index < NEW_COUNT,
    isTrending: false,
  }
}

export function createCatalog(): NftRecord[] {
  const rng = createRng(7)
  const seeds = [...featuredSeeds, ...buildGeneratedSeeds(rng)]
  const records = seeds.map((seed, index) => buildRecord(seed, index, rng))

  const trendingIds = new Set(
    [...records]
      .sort((a, b) => b.popularity - a.popularity || a.id.localeCompare(b.id))
      .slice(0, TRENDING_COUNT)
      .map((record) => record.id),
  )

  return records.map((record) => ({ ...record, isTrending: trendingIds.has(record.id) }))
}
