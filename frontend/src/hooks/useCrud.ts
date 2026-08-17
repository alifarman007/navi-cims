import { useMutation, useQuery, useQueryClient, keepPreviousData } from '@tanstack/react-query'
import { toast } from 'sonner'
import type { CrudApi } from '@/api/crud'
import { errorMessage } from '@/lib/utils'
import type { ListQuery, Status } from '@/types/api'

/** React-Query hooks for a CRUD resource. `key` is the cache key prefix (e.g. 'brands'). */
export function useCrud<TRead, TWrite>(key: string, apiRes: CrudApi<TRead, TWrite>) {
  const qc = useQueryClient()
  const invalidate = () => qc.invalidateQueries({ queryKey: [key] })

  const useList = (q: ListQuery, enabled = true) =>
    useQuery({
      queryKey: [key, 'list', q],
      queryFn: () => apiRes.list(q),
      placeholderData: keepPreviousData,
      enabled,
    })

  const useOne = (id: number | null | undefined) =>
    useQuery({ queryKey: [key, 'one', id], queryFn: () => apiRes.get(id as number), enabled: !!id })

  const useOptions = (q?: string, enabled = true) =>
    useQuery({ queryKey: [key, 'options', q ?? ''], queryFn: () => apiRes.options(q), enabled, staleTime: 60_000 })

  const useCreate = () =>
    useMutation({
      mutationFn: (data: TWrite) => apiRes.create(data),
      onSuccess: () => {
        toast.success('Saved successfully')
        invalidate()
      },
      onError: (e) => toast.error(errorMessage(e)),
    })

  const useUpdate = () =>
    useMutation({
      mutationFn: ({ id, data }: { id: number; data: Partial<TWrite> }) => apiRes.update(id, data),
      onSuccess: () => {
        toast.success('Updated successfully')
        invalidate()
      },
      onError: (e) => toast.error(errorMessage(e)),
    })

  const useSetStatus = () =>
    useMutation({
      mutationFn: ({ id, status }: { id: number; status: Status }) => apiRes.setStatus(id, status),
      onSuccess: () => {
        toast.success('Status updated')
        invalidate()
      },
      onError: (e) => toast.error(errorMessage(e)),
    })

  const useRemove = () =>
    useMutation({
      mutationFn: (id: number) => apiRes.remove(id),
      onSuccess: () => {
        toast.success('Deleted successfully')
        invalidate()
      },
      onError: (e) => toast.error(errorMessage(e)),
    })

  return { useList, useOne, useOptions, useCreate, useUpdate, useSetStatus, useRemove, invalidate }
}
