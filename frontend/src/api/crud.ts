import { api } from './client'
import { listParams } from '@/lib/utils'
import type { IdLabel, ListQuery, Page, Status } from '@/types/api'

/**
 * Typed client for a standard CRUD resource (docs/07-api-conventions.md).
 *   const brandsApi = crudApi<Brand, BrandInput>('/brands')
 */
export interface CrudApi<TRead, TWrite = Partial<TRead>> {
  path: string
  list: (q: ListQuery) => Promise<Page<TRead>>
  get: (id: number) => Promise<TRead>
  create: (data: TWrite) => Promise<TRead>
  update: (id: number, data: Partial<TWrite>) => Promise<TRead>
  setStatus: (id: number, status: Status) => Promise<TRead>
  remove: (id: number) => Promise<{ detail: string }>
  options: (q?: string, limit?: number) => Promise<IdLabel[]>
}

export function crudApi<TRead, TWrite = Partial<TRead>>(path: string): CrudApi<TRead, TWrite> {
  return {
    path,
    list: (q) => api.get<Page<TRead>>(path, { params: listParams(q) }).then((r) => r.data),
    get: (id) => api.get<TRead>(`${path}/${id}`).then((r) => r.data),
    create: (data) => api.post<TRead>(path, data).then((r) => r.data),
    update: (id, data) => api.put<TRead>(`${path}/${id}`, data).then((r) => r.data),
    setStatus: (id, status) => api.patch<TRead>(`${path}/${id}/status`, { status }).then((r) => r.data),
    remove: (id) => api.delete<{ detail: string }>(`${path}/${id}`).then((r) => r.data),
    options: (q, limit = 100) => api.get<IdLabel[]>(`${path}/options`, { params: { q, limit } }).then((r) => r.data),
  }
}
