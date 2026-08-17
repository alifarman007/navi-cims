/** Procurement Item Info (BNPIMS cache) — read-only resource + sync action. */
import { api } from '@/api/client'
import { crudApi } from '@/api/crud'

export interface ProcurementItem {
  id: number
  external_id: string
  grn_no?: string | null
  transaction_date?: string | null
  imc?: string | null
  item_name?: string | null
  deno?: string | null
  receive_quantity?: number | string | null
  part_no?: string | null
  remarks?: string | null
  synced_at?: string | null
}

export interface ProcurementItemDetail extends ProcurementItem {
  raw?: Record<string, unknown> | null
}

export interface ProcurementSyncResult {
  fetched: number
  created: number
  updated: number
  synced_at: string
}

/** list / get / options are the only endpoints that exist server-side (no create/update/delete). */
export const procurementItemsApi = crudApi<ProcurementItem, never>('/procurement-items')

export const syncProcurementItems = (incremental = false) =>
  api.post<ProcurementSyncResult>('/procurement-items/sync', null, { params: { incremental } }).then((r) => r.data)
