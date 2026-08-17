/** Configuration module — shared types + typed CRUD clients for the 7 masters (+ fiscal years). */
import { api } from '@/api/client'
import { crudApi } from '@/api/crud'
import type { AuditFields, IdLabel, Page, Ref, Status } from '@/types/api'

/* ---------------------------------------------------------------- Country */
export interface Country extends AuditFields {
  id: number
  name: string
  code?: string | null
  gmt?: string | null
}
export interface CountryInput {
  name: string
  code?: string | null
  gmt?: string | null
}
export const countriesApi = crudApi<Country, CountryInput>('/config/countries')

/* ---------------------------------------------------------------- Division */
export interface Division extends AuditFields {
  id: number
  name: string
  name_bn?: string | null
}
export interface DivisionInput {
  name: string
  name_bn?: string | null
}
export const divisionsApi = crudApi<Division, DivisionInput>('/config/divisions')

/* ---------------------------------------------------------------- District */
export interface District extends AuditFields {
  id: number
  division_id: number
  name: string
  name_bn?: string | null
  division?: Ref | null
}
export interface DistrictInput {
  division_id: number
  name: string
  name_bn?: string | null
}
export const districtsApi = crudApi<District, DistrictInput>('/config/districts')
/** /config/districts/options?division_id= */
export const districtOptions = (divisionId?: number | null, q?: string) =>
  api
    .get<IdLabel[]>('/config/districts/options', { params: { division_id: divisionId ?? undefined, q, limit: 500 } })
    .then((r) => r.data)

/* ---------------------------------------------------------------- Upazila */
export interface DistrictRef {
  id: number
  name: string
  division_id: number
  division?: Ref | null
}
export interface Upazila extends AuditFields {
  id: number
  district_id: number
  name: string
  name_bn?: string | null
  district?: DistrictRef | null
}
export interface UpazilaInput {
  district_id: number
  name: string
  name_bn?: string | null
}
export const upazilasApi = crudApi<Upazila, UpazilaInput>('/config/upazilas')
/** /config/upazilas/options?district_id= */
export const upazilaOptions = (districtId?: number | null, q?: string) =>
  api
    .get<IdLabel[]>('/config/upazilas/options', { params: { district_id: districtId ?? undefined, q, limit: 500 } })
    .then((r) => r.data)

/* ---------------------------------------------------------------- Office */
export const OFFICE_TYPES = ['HQ', 'Directorate', 'Command', 'Base', 'Depot', 'Other'] as const
export type OfficeType = (typeof OFFICE_TYPES)[number]
export const OFFICE_TYPE_OPTIONS = OFFICE_TYPES.map((t) => ({ value: t, label: t }))

export interface Office extends AuditFields {
  id: number
  code: string
  name: string
  office_type?: string | null
  country_id?: number | null
  division_id?: number | null
  district_id?: number | null
  address?: string | null
  status: Status
  country?: Ref | null
  division?: Ref | null
  district?: Ref | null
}
export interface OfficeInput {
  code: string
  name: string
  office_type: OfficeType | string
  country_id?: number | null
  division_id?: number | null
  district_id?: number | null
  address?: string | null
  status: Status
}
export const officesApi = crudApi<Office, OfficeInput>('/config/offices')

/* ---------------------------------------------------------------- Appointment */
export interface Appointment extends AuditFields {
  id: number
  name: string
  status: Status
}
export interface AppointmentInput {
  name: string
  status: Status
}
export const appointmentsApi = crudApi<Appointment, AppointmentInput>('/config/appointments')

/* ---------------------------------------------------------------- Rank */
export interface Rank extends AuditFields {
  id: number
  name: string
  name_bn?: string | null
  priority?: number | null
}
export interface RankInput {
  name: string
  name_bn?: string | null
  priority?: number | null
}
export const ranksApi = crudApi<Rank, RankInput>('/config/ranks')

/* ---------------------------------------------------------------- Fiscal years (read-only) */
export interface FiscalYear {
  id: number
  name: string
  start_date: string
  end_date: string
  is_current: boolean
}
export const fiscalYearsApi = {
  list: (params?: Record<string, unknown>) => api.get<Page<FiscalYear>>('/fiscal-years', { params }).then((r) => r.data),
  options: () => api.get<IdLabel[]>('/fiscal-years/options').then((r) => r.data),
  current: () => api.get<FiscalYear>('/fiscal-years/current').then((r) => r.data),
}
