import type { IconType } from 'react-icons'
import { FaFacebookF, FaInstagram, FaLinkedinIn, FaXTwitter, FaYoutube } from 'react-icons/fa6'
import { compatibleWallets, footerSections, socialLinks } from '@/shared/config/navigation'
import { NewsletterForm } from './newsletter-form'
import { UnavailableLink } from './unavailable-link'

const benefits = [
  {
    initial: 'W',
    title: 'Segurança da carteira',
    text: 'Proteja sua carteira e colecione arte digital verificada com confiança.',
  },
  {
    initial: 'C',
    title: 'Criadores em destaque',
    text: 'Conheça artistas, estúdios e comunidades que moldam a cultura digital na rede.',
  },
  {
    initial: 'D',
    title: 'Alertas de lançamentos',
    text: 'Receba calendários de cunhagem, novidades de listas de acesso e análises do mercado.',
  },
] as const

const socialIcons: Record<(typeof socialLinks)[number]['label'], IconType> = {
  Facebook: FaFacebookF,
  Instagram: FaInstagram,
  X: FaXTwitter,
  LinkedIn: FaLinkedinIn,
  YouTube: FaYoutube,
}

export function SiteFooter() {
  return (
    <footer className="mt-16 pb-32 md:pb-0">
      <div className="mx-auto w-full max-w-[1200px] px-6">
        <div className="grid gap-8 rounded-t-lg bg-card p-6 md:grid-cols-2 lg:grid-cols-4 lg:gap-0 lg:p-8">
          {benefits.map((benefit) => (
            <section
              key={benefit.title}
              className="flex flex-col gap-3 lg:border-r lg:border-border lg:px-6 lg:first:pl-0"
            >
              <span
                aria-hidden="true"
                className="flex size-12 items-center justify-center rounded-full bg-primary text-lg font-bold text-primary-foreground"
              >
                {benefit.initial}
              </span>
              <h2 className="text-sm font-bold">{benefit.title}</h2>
              <p className="text-xs leading-relaxed text-muted-foreground">{benefit.text}</p>
            </section>
          ))}
          <section className="flex flex-col gap-3 lg:pl-6">
            <h2 className="text-sm leading-tight font-bold">Antecipe-se ao próximo lançamento</h2>
            <NewsletterForm />
            <p className="text-xs leading-relaxed text-muted-foreground">
              Receba lançamentos selecionados, histórias de criadores e novidades do mercado.
            </p>
          </section>
        </div>

        <div className="grid items-center gap-3 bg-secondary px-6 py-6 text-xs md:grid-cols-4 lg:px-8">
          <p className="text-sm font-bold tracking-[0.1em]">KURIO</p>
          <p>Feito para colecionadores, criadores e cultura</p>
          <a href="mailto:contato@email.com" className="rounded-sm hover:text-primary">
            contato@email.com
          </a>
          <a href="tel:+551140028922" className="rounded-sm hover:text-primary">
            +55 11 4002 8922
          </a>
        </div>

        <div className="grid gap-8 rounded-b-lg bg-card p-6 sm:grid-cols-2 lg:grid-cols-4 lg:p-8">
          {footerSections.map((section) => (
            <nav key={section.title} aria-label={section.title} className="flex flex-col gap-3">
              <h2 className="text-sm font-bold">{section.title}</h2>
              <ul className="flex flex-col gap-2 text-xs text-muted-foreground">
                {section.links.map((link) => (
                  <li key={link.secao}>
                    <UnavailableLink secao={link.secao} className="rounded-sm hover:text-primary">
                      {link.label}
                    </UnavailableLink>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
          <div className="flex flex-col gap-5">
            <section className="flex flex-col gap-3">
              <h2 className="text-sm font-bold">Redes sociais</h2>
              <ul className="flex gap-2">
                {socialLinks.map((social) => {
                  const Icon = socialIcons[social.label]
                  return (
                    <li key={social.label}>
                      <a
                        href={social.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={`${social.label} (abre em nova aba)`}
                        className="flex size-7 items-center justify-center rounded-sm border border-primary text-primary transition-colors hover:bg-primary hover:text-primary-foreground"
                      >
                        <Icon className="size-3.5" aria-hidden="true" />
                      </a>
                    </li>
                  )
                })}
              </ul>
            </section>
            <section className="flex flex-col gap-3">
              <h2 className="text-sm font-bold">Carteiras compatíveis</h2>
              <p className="rounded-sm bg-secondary px-3 py-2 text-[10px] tracking-wide text-primary">
                {compatibleWallets.join(' · ')}
              </p>
            </section>
          </div>
        </div>

        <p className="py-6 text-center text-xs text-muted-foreground">
          © 2026 Kurio. Propriedade digital para todos.
        </p>
      </div>
    </footer>
  )
}
