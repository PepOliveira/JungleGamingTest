import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import type { Path } from 'react-hook-form'
import type { User } from '@/contracts/auth'
import { ensSuffixSchema } from '@/contracts/auth'
import { networkSchema } from '@/contracts/common'
import { createWalletRequestSchema, walletProviderSchema } from '@/contracts/wallet'
import type { CreateWalletRequest, Wallet, WalletKind } from '@/contracts/wallet'
import { applyApiError } from '@/features/auth/apply-api-error'
import { networkLabels } from '@/features/catalog/labels'
import { announce } from '@/shared/lib/announcer'
import { Button } from '@/shared/ui/button'
import { EnsField, SelectField, TextField } from '@/shared/ui/form-fields'
import { providerLabels } from '../labels'
import { useSaveWallet } from '../use-wallets'

type WalletFormInput = CreateWalletRequest
type WalletFormOutput = ReturnType<typeof createWalletRequestSchema.parse>

const serverFields: readonly Path<WalletFormInput>[] = [
  'label',
  'holderName',
  'profileName',
  'network',
  'address',
  'alias',
  'provider',
  'referralCode',
  'contactEmail',
  'ensName.name',
]

const networkOptions = networkSchema.options.map((value) => ({
  value,
  label: networkLabels[value],
}))
const providerOptions = walletProviderSchema.options.map((value) => ({
  value,
  label: providerLabels[value],
}))

function fromWallet(wallet: Wallet): WalletFormInput {
  return {
    kind: wallet.kind,
    label: wallet.label,
    holderName: wallet.holderName,
    profileName: wallet.profileName,
    network: wallet.network,
    address: wallet.address,
    alias: wallet.alias,
    provider: wallet.provider,
    referralCode: wallet.referralCode,
    contactEmail: wallet.contactEmail,
    ensName: wallet.ensName,
  }
}

function fromProfile(kind: WalletKind, user: User | undefined): WalletFormInput {
  return {
    kind,
    label: '',
    holderName: user?.name ?? '',
    profileName: user?.name ?? '',
    network: '' as WalletFormInput['network'],
    address: '',
    alias: null,
    provider: '' as WalletFormInput['provider'],
    referralCode: '',
    contactEmail: user?.email ?? '',
    ensName: user?.ensName ?? { name: '', suffix: '.eth' },
  }
}

type WalletFormProps = {
  kind: WalletKind
  wallet?: Wallet
  mirrorOf?: Wallet
  user: User | undefined
  onSaved: () => void
}

export function WalletForm({ kind, wallet, mirrorOf, user, onSaved }: WalletFormProps) {
  const saveWallet = useSaveWallet()
  const locked = Boolean(mirrorOf)

  const defaults = wallet
    ? fromWallet(wallet)
    : mirrorOf
      ? { ...fromWallet(mirrorOf), kind }
      : fromProfile(kind, user)

  const form = useForm<WalletFormInput, unknown, WalletFormOutput>({
    resolver: zodResolver(createWalletRequestSchema),
    defaultValues: defaults,
  })
  const { errors, isSubmitting } = form.formState

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      await saveWallet.mutateAsync({ walletId: wallet?.id ?? null, body: values })
      announce(kind === 'primary' ? 'Carteira principal salva' : 'Carteira secundária salva', {
        visible: true,
      })
      onSaved()
    } catch (failure) {
      applyApiError(form, failure, serverFields)
    }
  })

  const ensError = errors.ensName?.name?.message ?? errors.ensName?.suffix?.message

  return (
    <form noValidate onSubmit={onSubmit} className="flex flex-col gap-8">
      <input type="hidden" {...form.register('kind')} />
      <div className="grid gap-x-10 gap-y-6 lg:grid-cols-2 lg:gap-x-7">
        <div className="flex flex-col gap-6">
          <TextField
            label="Nome de exibição"
            required
            readOnly={locked}
            error={errors.holderName?.message}
            {...form.register('holderName')}
          />
          <SelectField
            label="Rede"
            required
            placeholder="Selecione uma rede"
            options={networkOptions}
            disabled={locked}
            error={errors.network?.message}
            {...form.register('network')}
          />
          <TextField
            label="Endereço da carteira"
            required
            readOnly={locked}
            placeholder="Endereço 0x da carteira"
            autoComplete="off"
            spellCheck={false}
            error={errors.address?.message}
            {...form.register('address')}
          />
          <SelectField
            label="Tipo de carteira"
            required
            placeholder="Selecione uma carteira"
            options={providerOptions}
            disabled={locked}
            error={errors.provider?.message}
            {...form.register('provider')}
          />
          <TextField
            label="E-mail"
            type="email"
            required
            readOnly={locked}
            error={errors.contactEmail?.message}
            {...form.register('contactEmail')}
          />
        </div>
        <div className="flex flex-col gap-6">
          <TextField
            label="Apelido da carteira"
            required
            readOnly={locked}
            error={errors.label?.message}
            {...form.register('label')}
          />
          <TextField
            label="Nome do perfil"
            required
            readOnly={locked}
            error={errors.profileName?.message}
            {...form.register('profileName')}
          />
          <TextField
            label="ENS ou carteira secundária (opcional)"
            hideLabel
            readOnly={locked}
            placeholder="ENS ou carteira secundária (opcional)"
            fieldClassName="lg:mt-[1.625rem]"
            error={errors.alias?.message}
            {...form.register('alias', { setValueAs: (value: string) => value })}
          />
          <TextField
            label="Código de indicação"
            required
            readOnly={locked}
            error={errors.referralCode?.message}
            {...form.register('referralCode')}
          />
          <EnsField
            label="Nome ENS"
            required
            suffixes={ensSuffixSchema.options}
            suffixProps={{ ...form.register('ensName.suffix'), disabled: locked }}
            nameProps={{ ...form.register('ensName.name'), readOnly: locked }}
            error={ensError}
          />
        </div>
      </div>

      {errors.root?.server ? (
        <p role="alert" className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {errors.root.server.message}
        </p>
      ) : null}

      <Button type="submit" size="lg" disabled={isSubmitting} className="h-10 w-fit px-8 font-bold">
        {isSubmitting ? 'Salvando...' : 'Salvar carteira'}
      </Button>
    </form>
  )
}
