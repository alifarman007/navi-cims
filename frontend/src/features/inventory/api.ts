/** Inventory Management API: stores, opening stocks, stock balances (read-only), stock transactions (ledger). */
import { api } from '@/api/client'
import { crudApi } from '@/api/crud'
import { listParams } from '@/lib/utils'
import type { AuditFields, IdLabel, ListQuery, Page, Ref, Status } from '@/types/api'

/* ------------------------------------------------------------------ store */
export type StoreType = 'Central' | 'Depot' | 'Ship/Base' | 'Other'
export const STORE_TYPES: StoreType[] = ['Central', 'Depot', 'Ship/Base', 'Other']

export interface Store extends AuditFields {
  id: number
  code: string
  name: string
  store_type: StoreType | string | null
  concern?: string | null
  address?: string | null
  status: Status
}
export interface StoreInput {
  code: string
  name: string
  store_type: StoreType | string
  concern?: string | null
  address?: string | null
  status: Status
}
export const storesApi = crudApi<Store, StoreInput>('/stores')

/* ------------------------------------------------------------------ opening stock */
export interface OpeningStock extends AuditFields {
  id: number
  store_id: number
  item_id: number
  quantity: string | number
  entry_date: string
  low_stock_threshold?: string | number | null
  remarks?: string | null
  store?: Ref | null
  item?: Ref | null
}
export interface OpeningStockInput {
  store_id: number
  item_id: number
  quantity: number
  entry_date: string
  low_stock_threshold?: number | null
  remarks?: string | null
}
export const openingStocksApi = crudApi<OpeningStock, OpeningStockInput>('/opening-stocks')

/* ------------------------------------------------------------------ stock balance (read-only) */
export interface Stock {
  id: number
  store_id: number
  item_id: number
  quantity: string | number
  low_stock_threshold?: string | number | null
  is_low: boolean
  status: Status
  updated_at?: string | null
  store?: Ref | null
  item?: Ref | null
}
export interface StockSummary {
  store_id: number
  item_id: number
  quantity: string | number
  low_stock_threshold?: string | number | null
  is_low: boolean
}
export const stocksApi = {
  list: (q: ListQuery) => api.get<Page<Stock>>('/stocks', { params: listParams(q) }).then((r) => r.data),
  get: (id: number) => api.get<Stock>(`/stocks/${id}`).then((r) => r.data),
  summary: (store_id: number, item_id: number) =>
    api.get<StockSummary>('/stocks/summary', { params: { store_id, item_id } }).then((r) => r.data),
}

/* ------------------------------------------------------------------ stock transactions (ledger, read-only) */
export type StockTxnType = 'opening' | 'allocation_out' | 'receipt' | 'adjustment' | 'transfer_in' | 'transfer_out'
export interface StockTransaction {
  id: number
  store_id: number
  item_id: number
  txn_type: StockTxnType
  quantity_delta: string | number
  balance_after: string | number
  source?: string | null
  ref_type?: string | null
  ref_id?: number | null
  remarks?: string | null
  created_by_id?: number | null
  created_at?: string | null
  store?: Ref | null
  item?: Ref | null
}
export const stockTransactionsApi = {
  list: (q: ListQuery & { date_from?: string; date_to?: string }) =>
    api
      .get<Page<StockTransaction>>('/stock-transactions', {
        params: { ...listParams(q), date_from: q.date_from, date_to: q.date_to },
      })
      .then((r) => r.data),
}

/* ------------------------------------------------------------------ option fetchers used by selects */
export const fetchStoreOptions = (): Promise<IdLabel[]> => storesApi.options()
export const fetchItemOptions = (): Promise<IdLabel[]> =>
  api.get<IdLabel[]>('/items/options', { params: { limit: 500 } }).then((r) => r.data)
