import { forwardRef } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Select, type SelectProps } from './Input'
import type { IdLabel } from '@/types/api'

export interface AsyncSelectProps extends Omit<SelectProps, 'options' | 'loading'> {
  /** cache key, e.g. ['brands','options'] */
  queryKey: readonly unknown[]
  fetchOptions: () => Promise<IdLabel[]>
  enabled?: boolean
  /** extra option injected first (e.g. keep an inactive current value visible) */
  extra?: IdLabel[]
}

/** Native select whose options come from a `/options` endpoint (cached 60 s). */
export const AsyncSelect = forwardRef<HTMLSelectElement, AsyncSelectProps>(function AsyncSelect(
  { queryKey, fetchOptions, enabled = true, extra, ...rest },
  ref,
) {
  const q = useQuery({ queryKey, queryFn: fetchOptions, enabled, staleTime: 60_000 })
  const seen = new Set<number>()
  const opts = [...(extra ?? []), ...(q.data ?? [])]
    .filter((o) => (seen.has(o.id) ? false : (seen.add(o.id), true)))
    .map((o) => ({ value: o.id, label: o.label }))
  return <Select ref={ref} options={opts} loading={q.isLoading} {...rest} />
})
