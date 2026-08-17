/** Ship/Base Management — types + API clients (backend: /ship-bases, /ship-base-categories). */
import { crudApi } from '@/api/crud'
import type { AuditFields, Ref, Status } from '@/types/api'

export type ShipBaseType = 'ship' | 'base'

export const SHIP_BASE_TYPE_OPTIONS: { value: ShipBaseType; label: string }[] = [
  { value: 'ship', label: 'Ship' },
  { value: 'base', label: 'Base' },
]

export const shipBaseTypeLabel = (t?: ShipBaseType | string | null) =>
  SHIP_BASE_TYPE_OPTIONS.find((o) => o.value === t)?.label ?? '--'

export interface ShipBaseCategory extends AuditFields {
  id: number
  code: string
  name: string
}
export interface ShipBaseCategoryInput {
  code: string
  name: string
}

export interface ShipBase extends AuditFields {
  id: number
  code: string
  name: string
  type: ShipBaseType
  category_id: number | null
  category: Ref | null
  status: Status
}
export interface ShipBaseInput {
  code: string
  name: string
  type: ShipBaseType
  category_id: number | null
  /** not on the Figma form: omitted on create (backend defaults to active) and left untouched on edit */
  status?: Status
}

export const shipBaseCategoriesApi = crudApi<ShipBaseCategory, ShipBaseCategoryInput>('/ship-base-categories')
export const shipBasesApi = crudApi<ShipBase, ShipBaseInput>('/ship-bases')
