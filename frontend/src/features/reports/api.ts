/** Report + Dashboard API (backend: app/api/v1/endpoints/reports.py, dashboard.py). */
import { api, apiDownload } from '@/api/client'
import { listParams } from '@/lib/utils'
import type { AllocationStatus, AllocationType, IdLabel, ListQuery, Page, Ref, UserRef } from '@/types/api'

/* ------------------------------------------------------------------ types */
export interface ReportItemRef {
  id: number
  code: string
  name: string
  category?: Ref | null
  unit?: Ref | null
}

export interface StockSummaryRow {
  id: number
  store: Ref
  item: ReportItemRef
  quantity: string | number
  low_stock_threshold?: string | number | null
  is_low: boolean
  last_updated?: string | null
}

export interface AllocationReportRow {
  id: number
  code: string
  type: AllocationType
  fiscal_year: { id: number; name: string }
  date: string
  store: Ref
  item: Ref
  ship_base: Ref
  quantity: string | number
  status: AllocationStatus
  approved_by?: UserRef | null
  approved_at?: string | null
}

export type AllocationBrief = Omit<AllocationReportRow, 'approved_by' | 'approved_at'>

export interface DashboardSummary {
  counts: {
    items: number
    ship_bases: number
    stores: number
    users: number
    allocations_pending: number
    allocations_approved: number
    allocations_sent_back: number
    low_stock_items: number
  }
  allocations_by_status: { status: AllocationStatus; count: number }[]
  allocations_by_fiscal_year: { fiscal_year: string; allocation: number; sanction: number; total_qty: string | number }[]
  allocations_by_ship_base: { ship_base: string; count: number; qty: string | number }[]
  items_by_category: { category: string; count: number }[]
  stock_by_store: { store: string; items: number; total_qty: string | number }[]
  recent_allocations: AllocationBrief[]
  low_stock: StockSummaryRow[]
}

/* ------------------------------------------------------------------ filters */
export interface StockReportFilters {
  store_id?: number | null
  item_id?: number | null
  category_id?: number | null
  low_only?: boolean
}

export interface AllocationReportFilters {
  fiscal_year_id?: number | null
  ship_base_id?: number | null
  store_id?: number | null
  item_id?: number | null
  status?: AllocationStatus | '' | null
  type?: AllocationType | '' | null
  date_from?: string | null
  date_to?: string | null
}

/** Drop empty filter values so they are not sent as query params. */
export function cleanParams(obj: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(obj)) {
    if (v === undefined || v === null || v === '' || v === false) continue
    out[k] = v
  }
  return out
}

/* ------------------------------------------------------------------ endpoints */
function reportParams(q: ListQuery, filters: Record<string, unknown>) {
  return { ...listParams(q), ...cleanParams(filters) }
}

export const reportsApi = {
  stockSummary: (q: ListQuery, f: StockReportFilters) =>
    api.get<Page<StockSummaryRow>>('/reports/stock-summary', { params: reportParams(q, f as Record<string, unknown>) }).then((r) => r.data),
  lowStock: (q: ListQuery, f: StockReportFilters) =>
    api.get<Page<StockSummaryRow>>('/reports/low-stock', { params: reportParams(q, f as Record<string, unknown>) }).then((r) => r.data),
  allocations: (q: ListQuery, f: AllocationReportFilters) =>
    api.get<Page<AllocationReportRow>>('/reports/allocations', { params: reportParams(q, f as Record<string, unknown>) }).then((r) => r.data),
  /** `?export=xlsx` — returns the file blob (same filters + sort as the table). */
  export: (path: '/reports/stock-summary' | '/reports/low-stock' | '/reports/allocations', q: ListQuery, filters: Record<string, unknown>) =>
    apiDownload(path, { ...reportParams({ sort: q.sort }, filters), export: 'xlsx' }),
}

export const dashboardApi = {
  summary: () => api.get<DashboardSummary>('/dashboard/summary').then((r) => r.data),
}

/* ------------------------------------------------------------------ option sources for filter selects */
const opts = (path: string) => () => api.get<IdLabel[]>(`${path}/options`, { params: { limit: 500 } }).then((r) => r.data)

export const optionSources = {
  stores: { key: ['stores', 'options'] as const, fetch: opts('/stores') },
  items: { key: ['items', 'options'] as const, fetch: opts('/items') },
  categories: { key: ['item-categories', 'options'] as const, fetch: opts('/item-categories') },
  shipBases: { key: ['ship-bases', 'options'] as const, fetch: opts('/ship-bases') },
  fiscalYears: { key: ['fiscal-years', 'options'] as const, fetch: opts('/fiscal-years') },
}

/** Build a download file name matching the backend's `cims_<report>_<date>.xlsx`. */
export function exportFileName(report: string) {
  return `cims_${report}_${new Date().toISOString().slice(0, 10)}.xlsx`
}
