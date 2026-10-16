export type UnavailableSection = {
  label: string
  secao: string
}

export const primaryNavigation: readonly UnavailableSection[] = [
  { label: 'Mercado', secao: 'mercado' },
  { label: 'Criadores', secao: 'criadores' },
  { label: 'Aprenda', secao: 'aprenda' },
]

export type FooterSection = {
  title: string
  links: readonly UnavailableSection[]
}

export const footerSections: readonly FooterSection[] = [
  {
    title: 'Meu perfil',
    links: [
      { label: 'Meu perfil', secao: 'meu-perfil' },
      { label: 'Minha coleção', secao: 'minha-colecao' },
      { label: 'Atividade', secao: 'atividade' },
      { label: 'Estúdio do criador', secao: 'estudio-do-criador' },
      { label: 'Lista de interesse', secao: 'lista-de-interesse' },
    ],
  },
  {
    title: 'Central de ajuda',
    links: [
      { label: 'Central de ajuda', secao: 'central-de-ajuda' },
      { label: 'Como comprar NFTs', secao: 'como-comprar' },
      { label: 'Carteira e segurança', secao: 'carteira-e-seguranca' },
      { label: 'Política do mercado', secao: 'politica-do-mercado' },
      { label: 'Denunciar item', secao: 'denunciar-item' },
    ],
  },
  {
    title: 'Coleções',
    links: [
      { label: 'Arte digital', secao: 'arte-digital' },
      { label: 'Fotografia', secao: 'fotografia' },
      { label: 'Música', secao: 'musica' },
      { label: 'Arte 3D', secao: 'arte-3d' },
      { label: 'Utilidade', secao: 'utilidade' },
    ],
  },
]

export const socialLinks = [
  { label: 'Facebook', href: 'https://www.facebook.com' },
  { label: 'Instagram', href: 'https://www.instagram.com' },
  { label: 'X', href: 'https://x.com' },
  { label: 'LinkedIn', href: 'https://www.linkedin.com' },
  { label: 'YouTube', href: 'https://www.youtube.com' },
] as const

export const compatibleWallets = ['METAMASK', 'WALLETCONNECT', 'COINBASE'] as const
