import { useCallback, useEffect, useMemo, useState } from 'react'
import type { ListQuery } from '@/types/api'

export interface TableState {
  page: number
  pageSize: number
  sort?: string
  filters: Record<string, string>
  q?: string
}

/**
 * Local (per page) table state → server ListQuery. Filters are debounced (typing in the filter row
 * doesn't spam the API). Changing filters/sort/pageSize resets to page 1.
 */
export function useTableState(initial?: Partial<TableState>, debounceMs = 400) {
  const [state, setState] = useState<TableState>({
    page: 1,
    pageSize: 10,
    sort: undefined,
    filters: {},
    ...initial,
  })
  const [debouncedFilters, setDebouncedFilters] = useState(state.filters)
  const [debouncedQ, setDebouncedQ] = useState(state.q)

  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedFilters(state.filters)
      setDebouncedQ(state.q)
    }, debounceMs)
    return () => clearTimeout(t)
  }, [state.filters, state.q, debounceMs])

  const setPage = useCallback((page: number) => setState((s) => ({ ...s, page })), [])
  const setPageSize = useCallback((pageSize: number) => setState((s) => ({ ...s, pageSize, page: 1 })), [])
  const setSort = useCallback((sort?: string) => setState((s) => ({ ...s, sort, page: 1 })), [])
  const setFilter = useCallback(
    (key: string, value: string) => setState((s) => ({ ...s, page: 1, filters: { ...s.filters, [key]: value } })),
    [],
  )
  const setFilters = useCallback((filters: Record<string, string>) => setState((s) => ({ ...s, page: 1, filters })), [])
  const setQ = useCallback((q?: string) => setState((s) => ({ ...s, q, page: 1 })), [])
  const reset = useCallback(() => setState((s) => ({ ...s, page: 1, filters: {}, q: undefined, sort: undefined })), [])

  const query: ListQuery = useMemo(
    () => ({
      page: state.page,
      page_size: state.pageSize,
      sort: state.sort,
      q: debouncedQ || undefined,
      filter: Object.entries(debouncedFilters)
        .filter(([, v]) => v !== undefined && v !== null && String(v).trim() !== '')
        .map(([k, v]) => `${k}:${String(v).trim()}`),
    }),
    [state.page, state.pageSize, state.sort, debouncedFilters, debouncedQ],
  )

  return { state, query, setPage, setPageSize, setSort, setFilter, setFilters, setQ, reset }
}
