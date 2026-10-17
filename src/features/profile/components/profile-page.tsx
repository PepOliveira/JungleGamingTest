import { toApiError } from '@/shared/api/api-error'
import { ErrorState } from '@/shared/ui/error-state'
import { Skeleton } from '@/shared/ui/skeleton'
import { useProfile } from '../use-profile'
import { ProfileForm } from './profile-form'

export function ProfilePage() {
  const query = useProfile()

  return (
    <section aria-labelledby="profile-title" className="flex flex-col gap-8">
      <h1 id="profile-title" className="text-base font-bold">
        Perfil do colecionador
      </h1>

      {query.isPending ? (
        <div aria-busy="true" className="grid gap-6 lg:grid-cols-2">
          <p role="status" className="sr-only">
            Carregando perfil
          </p>
          {Array.from({ length: 6 }, (_, index) => (
            <Skeleton key={index} className="h-16" />
          ))}
        </div>
      ) : query.isError ? (
        <ErrorState
          title="Não foi possível carregar o perfil"
          description={toApiError(query.error).message}
          onRetry={() => void query.refetch()}
          retrying={query.isFetching}
        />
      ) : (
        <ProfileForm key={query.data.id} user={query.data} />
      )}
    </section>
  )
}
