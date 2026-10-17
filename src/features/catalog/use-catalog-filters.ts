import { useQuery } from '@tanstack/react-query'
import { useNavigate, useSearch } from '@tanstack/react-router'
import { useCallback, useMemo } from 'react'
import type { Network } from '@/contracts/common'
import type { CollectionSlug } from '@/contracts/nft'
import { nftListQueryOptions } from './api/catalog-queries'
import { clearedFilters, normalizeCatalogSearch, toListQuery } from './search'
import type { CatalogSearch } from './search'

type UpdateOptions = {
  replace?: boolean
}

function toggle<TValue>(values: readonly TValue[], value: TValue) {
  return values.includes(value) ? values.filter((item) => item !== value) : [...values, value]
}

export function useCatalogFilters() {
  const rawSearch = useSearch({ from: '/' })
  const navigate = useNavigate({ from: '/' })
  const search = useMemo(() => normalizeCatalogSearch(rawSearch), [rawSearch])

  const update = useCallback(
    (patch: Partial<CatalogSearch>, { replace = false }: UpdateOptions = {}) =>
      navigate({
        search: (previous) => ({ ...previous, ...patch, page: patch.page ?? 1 }),
        replace,
        resetScroll: false,
      }),
    [navigate],
  )

  const toggleCollection = useCallback(
    (collection: CollectionSlug) => update({ collections: toggle(search.collections, collection) }),
    [search.collections, update],
  )

  const toggleNetwork = useCallback(
    (network: Network) => update({ networks: toggle(search.networks, network) }),
    [search.networks, update],
  )

  const clearAll = useCallback(() => update(clearedFilters(search.sort)), [search.sort, update])

  return { search, update, toggleCollection, toggleNetwork, clearAll }
}

export function useNftList() {
  const { search } = useCatalogFilters()
  return useQuery(nftListQueryOptions(toListQuery(search)))
}
