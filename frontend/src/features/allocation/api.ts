/** Allocation/Sanction API (+ workflow actions) and Compilation/Verification API. */
import { api } from '@/api/client'
import { crudApi } from '@/api/crud'
import type { AllocationStatus, AllocationType, AuditFields, IdLabel, Ref, UserRef, VerificationAction } from '@/types/api'

export interface FiscalYearRef {
  id: number
  name: string
}

export interface VerificationBrief extends AuditFields {
  id: number
  code: string
  allocation_id: number
  approver_id: number
  approver?: UserRef | null
  action: VerificationAction
  comment?: string | null
  acted_at?: string | null
}

export interface Allocation extends AuditFields {
  id: number
  code: string
  allocation_type: AllocationType
  fiscal_year_id: number
  fiscal_year?: FiscalYearRef | null
  allocation_date: string
  store_id: number
  store?: Ref | null
  item_id: number
  item?: Ref | null
  ship_base_id: number
  ship_base?: Ref | null
  quantity: string | number
  status: AllocationStatus
  remarks?: string | null
  approved_at?: string | null
  approved_by_id?: number | null
  approved_by?: UserRef | null
  verifications: VerificationBrief[]
}

export interface AllocationInput {
  code: string
  allocation_type: AllocationType
  fiscal_year_id: number
  allocation_date: string
  store_id: number
  item_id: number
  ship_base_id: number
  quantity: number
  remarks?: string | null
}

export const allocationsApi = crudApi<Allocation, AllocationInput>('/allocations')

export const allocationActions = {
  approve: (id: number, comment?: string) =>
    api.post<Allocation>(`/allocations/${id}/approve`, comment ? { comment } : {}).then((r) => r.data),
  sendBack: (id: number, comment: string) =>
    api.post<Allocation>(`/allocations/${id}/send-back`, { comment }).then((r) => r.data),
  cancel: (id: number) => api.post<Allocation>(`/allocations/${id}/cancel`).then((r) => r.data),
  resubmit: (id: number) => api.post<Allocation>(`/allocations/${id}/resubmit`).then((r) => r.data),
  /** options filtered by status (Compilation/Verification form lists PENDING allocations) */
  options: (status?: AllocationStatus, q?: string, limit = 200) =>
    api.get<IdLabel[]>('/allocations/options', { params: { status, q, limit } }).then((r) => r.data),
}

/* ------------------------------------------------------------------ verification */
export interface AllocationBrief {
  id: number
  code: string
  status: AllocationStatus
  allocation_type: AllocationType
  quantity: string | number
  ship_base?: Ref | null
  item?: Ref | null
  store?: Ref | null
}

export interface Verification extends AuditFields {
  id: number
  code: string
  allocation_id: number
  allocation?: AllocationBrief | null
  approver_id: number
  approver?: UserRef | null
  action: VerificationAction
  comment?: string | null
  acted_at?: string | null
}

export interface VerificationInput {
  code?: string | null
  allocation_id: number
  approver_id?: number | null
  action?: VerificationAction
  comment?: string | null
}

export const verificationsApi = crudApi<Verification, VerificationInput>('/verifications')

/* ------------------------------------------------------------------ shared option fetchers */
export const optionFetchers = {
  fiscalYears: () => api.get<IdLabel[]>('/fiscal-years/options').then((r) => r.data),
  stores: () => api.get<IdLabel[]>('/stores/options', { params: { limit: 200 } }).then((r) => r.data),
  items: () => api.get<IdLabel[]>('/items/options', { params: { limit: 500 } }).then((r) => r.data),
  shipBases: () => api.get<IdLabel[]>('/ship-bases/options', { params: { limit: 200 } }).then((r) => r.data),
  users: () => api.get<IdLabel[]>('/users/options', { params: { limit: 200 } }).then((r) => r.data),
}

export const ALLOCATION_TYPE_OPTIONS = [
  { value: 'allocation', label: 'Allocation' },
  { value: 'sanction', label: 'Sanction' },
]

export const ALLOCATION_STATUS_OPTIONS = [
  { value: 'pending', label: 'Pending' },
  { value: 'approved', label: 'Approved' },
  { value: 'sent_back', label: 'Sent Back' },
  { value: 'cancelled', label: 'Cancelled' },
]
