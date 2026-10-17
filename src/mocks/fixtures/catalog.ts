import type { Network } from '@/contracts/common'
import type { CollectionSlug, Edition, Rarity } from '@/contracts/nft'
import { createRng } from '../utils/rng'
import type { Rng } from '../utils/rng'
import { centsToEth } from '../utils/text'
import type { NftRecord } from '../db/types'
import { collectionLabels, networkLabels } from './labels'

type Character = {
  image: string
  alt: string
  collectionName: string
  attributes: readonly string[]
}

const characters: readonly Character[] = [
  {
    image: '/assets/nfts/emerald-ape-640.webp',
    alt: 'Macaco marrom de óculos redondos e jaqueta verde',
    collectionName: 'Kurio Apes',
    attributes: ['Óculos', 'Esmeralda'],
  },
  {
    image: '/assets/nfts/sage-nomad-640.webp',
    alt: 'Macaco cinza com chapéu verde e moletom roxo',
    collectionName: 'Sage Nomads',
    attributes: ['Chapéu', 'Moletom roxo'],
  },
  {
    image: '/assets/nfts/neon-vessel-640.webp',
    alt: 'Macaco preto com brinco dourado e gola alta verde',
    collectionName: 'Obsidian Vessels',
    attributes: ['Brinco dourado', 'Gola alta'],
  },
  {
    image: '/assets/nfts/golden-beat-640.webp',
    alt: 'Macaco dourado com fones de ouvido verdes',
    collectionName: 'Golden Frequencies',
    attributes: ['Fones de ouvido', 'Jaqueta creme'],
  },
]

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
    rarity: 'rare',
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
const TENTH_SOLD_OUT_INDEXES: ReadonlySet<number> = new Set([3])
const HEX = '0123456789abcdef'
const BASE58 = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz'

const editionTemplates = [
  { key: 'unique', label: '1/1', multiplier: 400, supply: 1 },
  { key: 'tenth', label: '1/10', multiplier: 200, supply: 10 },
  { key: 'fiftieth', label: '1/50', multiplier: 100, supply: 50 },
  { key: 'open', label: 'ABERTA', multiplier: 50, supply: 500 },
] as const

const DEFAULT_EDITION_KEY = 'fiftieth'

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

function randomString(rng: Rng, alphabet: string, length: number) {
  return Array.from({ length }, () => alphabet.charAt(rng.int(0, alphabet.length - 1))).join('')
}

function buildContractAddress(network: Network, rng: Rng) {
  return network === 'solana' ? randomString(rng, BASE58, 44) : `0x${randomString(rng, HEX, 40)}`
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
  const allEditions = index < featuredSeeds.length

  return editionTemplates
    .filter((template) => {
      const included = allEditions || template.key === DEFAULT_EDITION_KEY || rng.next() < 0.6
      return included
    })
    .map((template) => {
      const soldOut =
        SOLD_OUT_INDEXES.has(index) ||
        (template.key === 'tenth' && TENTH_SOLD_OUT_INDEXES.has(index))

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
  const creator = creatorAt(index)
  const editions = buildEditions(id, index, seed.cents, rng)
  const defaultEdition = editions.find((edition) => edition.id === `${id}_${DEFAULT_EDITION_KEY}`)
  if (!defaultEdition) {
    throw new Error('Every NFT needs a default edition')
  }

  const networkLabel = networkLabels[seed.network]
  const royaltyPercent = index === 0 ? 5 : rng.int(3, 10)
  const ratingAverage = index === 0 ? 4.8 : (35 + rng.int(0, 14)) / 10
  const ratingCount = index === 0 ? 19 : rng.int(3, 60)
  const contractAddress =
    index === 0
      ? '0x7A42c8f1d0b9E36A5c4f7d2B8e19a0C3D5b619E8'
      : buildContractAddress(seed.network, rng)
  const tokenNumber = /#(\d+)/.exec(seed.name)?.[1] ?? String(index + 1)

  return {
    id,
    name: seed.name,
    image: { url: main.image, alt: main.alt },
    price: defaultEdition.price,
    originalPrice: seed.originalCents ? centsToEth(seed.originalCents) : null,
    rarity: seed.rarity,
    collection: seed.collection,
    network: seed.network,
    available: editions.reduce((total, edition) => total + edition.available, 0),
    version: 1,
    tokenId: `#${tokenNumber.padStart(4, '0')}`,
    collectionName: main.collectionName,
    summary: `Um colecionável digital finalizado à mão da coleção ${main.collectionName}, verificado na ${networkLabel}, com arte desbloqueável e acesso para colecionadores.`,
    description: [
      `${seed.name} é uma obra digital finalizada à mão da coleção ${main.collectionName}. Cada atributo fica armazenado nos metadados do token e verificado na ${networkLabel}. A obra explora identidade, movimento e luz em um mundo digital sem fronteiras.`,
      `A propriedade inclui a arte em alta resolução, lançamentos exclusivos para colecionadores e um registro permanente de procedência registrada na rede. ${creator.name} recebe ${royaltyPercent}% de direitos autorais nas vendas secundárias, apoiando novos trabalhos e lançamentos da comunidade.`,
    ],
    attributes: [...main.attributes, ...(seed.rarity === 'rare' ? ['Raro'] : [])],
    creator,
    gallery: [0, 1, 2, 3].map((offset) => {
      const character = characterAt(seed.character + offset)
      return { url: character.image, alt: character.alt }
    }),
    editions,
    defaultEditionId: defaultEdition.id,
    rating: { average: ratingAverage, count: ratingCount },
    contractAddress,
    royaltyPercent,
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
