import type { FieldErrors, UseFormRegister } from 'react-hook-form'
import type { User } from '@/contracts/auth'
import type { Wallet } from '@/contracts/wallet'
import { networkLabels } from '@/features/catalog/labels'
import { providerLabels } from '@/features/wallets/labels'
import { TextAreaField, TextField } from '@/shared/ui/form-fields'

export type CollectorFormValues = {
  fullName: string
  email: string
  note: string
}

type CollectorFieldsProps = {
  register: UseFormRegister<CollectorFormValues>
  errors: FieldErrors<CollectorFormValues>
  profile: User
  wallet: Wallet | undefined
}

const readOnlyClass = 'hidden lg:flex'

export function CollectorFields({ register, errors, profile, wallet }: CollectorFieldsProps) {
  const ens = wallet ? `${wallet.ensName.name}${wallet.ensName.suffix}` : ''

  return (
    <section aria-labelledby="collector-title" className="flex flex-col gap-6">
      <h2 id="collector-title" className="text-base font-bold">
        Perfil do colecionador
      </h2>
      <div className="grid gap-x-10 gap-y-6 lg:grid-cols-2 lg:gap-x-[23px]">
        <TextField
          label="Nome de exibição"
          required
          autoComplete="name"
          error={errors.fullName?.message}
          {...register('fullName')}
        />
        <TextField
          label="Nome de usuário"
          required
          readOnly
          value={profile.username}
          fieldClassName={readOnlyClass}
        />
        <TextField
          label="Rede"
          required
          readOnly
          value={wallet ? networkLabels[wallet.network] : ''}
          fieldClassName={readOnlyClass}
        />
        <TextField
          label="Nome do perfil"
          required
          readOnly
          value={wallet?.profileName ?? ''}
          fieldClassName={readOnlyClass}
        />
        <TextField
          label="Endereço da carteira"
          required
          readOnly
          value={wallet?.address ?? ''}
          fieldClassName={readOnlyClass}
        />
        <TextField
          label="ENS ou carteira secundária (opcional)"
          hideLabel
          readOnly
          value={wallet?.alias ?? ''}
          placeholder="ENS ou carteira secundária (opcional)"
          fieldClassName="hidden lg:mt-[1.625rem] lg:flex"
        />
        <TextField
          label="Tipo de carteira"
          required
          readOnly
          value={wallet ? providerLabels[wallet.provider] : ''}
          fieldClassName={readOnlyClass}
        />
        <TextField
          label="Código de indicação"
          required
          readOnly
          value={wallet?.referralCode ?? ''}
          fieldClassName={readOnlyClass}
        />
        <TextField
          label="E-mail"
          type="email"
          required
          autoComplete="email"
          error={errors.email?.message}
          {...register('email')}
        />
        <TextField label="Nome ENS" required readOnly value={ens} fieldClassName={readOnlyClass} />
      </div>
      <TextAreaField
        label="Observação do colecionador (opcional)"
        maxLength={500}
        fieldClassName="lg:max-w-[470px]"
        error={errors.note?.message}
        {...register('note')}
      />
    </section>
  )
}
