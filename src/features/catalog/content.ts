import type { Image } from '@/contracts/common'

export const images = {
  emerald: {
    url: '/assets/nfts/emerald-ape-640.webp',
    alt: 'Macaco marrom de óculos redondos e jaqueta verde',
  },
  sage: {
    url: '/assets/nfts/sage-nomad-640.webp',
    alt: 'Macaco cinza com chapéu verde e moletom roxo',
  },
  neon: {
    url: '/assets/nfts/neon-vessel-640.webp',
    alt: 'Macaco preto com brinco dourado e gola alta verde',
  },
  golden: {
    url: '/assets/nfts/golden-beat-640.webp',
    alt: 'Macaco dourado com fones de ouvido verdes',
  },
} as const satisfies Record<string, Image>

export type PromoBanner = {
  id: string
  image: Image
  title: string
  description: string
  search: { tab: 'new' } | { collections: ['arte-digital'] }
}

export const promoBanners: readonly PromoBanner[] = [
  {
    id: 'genesis',
    image: images.emerald,
    title: 'Lançamentos gênesis de edição limitada',
    description: 'Colecione edições escassas diretamente dos criadores antes da revelação pública.',
    search: { tab: 'new' },
  },
  {
    id: 'curated',
    image: images.neon,
    title: 'Arte digital selecionada e muito mais',
    description:
      'Explore novos artistas, coleções verificadas e obras digitais que definem a próxima era da cultura.',
    search: { collections: ['arte-digital'] },
  },
]

export type JournalArticle = {
  id: string
  image: Image
  date: string
  readTime: string
  title: string
  excerpt: string
}

export const journalArticles: readonly JournalArticle[] = [
  {
    id: 'propriedade',
    image: images.neon,
    date: '12 de setembro',
    readTime: 'Leitura de 6 min',
    title: 'Como funciona a propriedade de NFTs',
    excerpt: 'Aprenda a colecionar, negociar e verificar ativos digitais.',
  },
  {
    id: 'artistas',
    image: images.emerald,
    date: '13 de setembro',
    readTime: 'Leitura de 2 min',
    title: '10 artistas digitais para acompanhar',
    excerpt: 'Conheça criadores que moldam a cultura digital.',
  },
  {
    id: 'raridade',
    image: images.sage,
    date: '15 de setembro',
    readTime: 'Leitura de 3 min',
    title: 'Raridade, atributos e procedência',
    excerpt: 'Entenda raridade, procedência, direitos autorais e utilidade.',
  },
  {
    id: 'carteira',
    image: images.golden,
    date: '15 de setembro',
    readTime: 'Leitura de 2 min',
    title: 'Como proteger sua carteira',
    excerpt: 'Proteja sua carteira, seus ativos e sua identidade.',
  },
]
