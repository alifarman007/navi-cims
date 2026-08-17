/**
 * Item Management API types + clients (Item, Item Unit, Model, Item Category).
 * Brand lives in ./brand/BrandPage.tsx (reference feature) and is re-exported here for convenience.
 */
import { api } from '@/api/client'
import { crudApi } from '@/api/crud'
import type { AuditFields, IdLabel, Ref, Status } from '@/types/api'

export { brandsApi, type Brand, type BrandInput } from './brand/BrandPage'

/* ---------------------------------------------------------------- Item Unit */
export interface ItemUnit extends AuditFields {
  id: number
  code: string
  name: string
  unit_code?: string | null
  status: Status
}
export interface ItemUnitInput {
  code: string
  name: string
  unit_code?: string | null
  status: Status
}
export const itemUnitsApi = crudApi<ItemUnit, ItemUnitInput>('/item-units')

/* ---------------------------------------------------------------- Item Category */
export interface ItemCategory extends AuditFields {
  id: number
  code: string
  name: string
  status: Status
}
export interface ItemCategoryInput {
  code: string
  name: string
  status: Status
}
export const itemCategoriesApi = crudApi<ItemCategory, ItemCategoryInput>('/item-categories')

/* ---------------------------------------------------------------- Model */
export interface ItemModel extends AuditFields {
  id: number
  code: string
  name: string
  brand_id?: number | null
  brand?: Ref | null
  status: Status
}
export interface ItemModelInput {
  code: string
  name: string
  brand_id?: number | null
  status: Status
}
export const itemModelsApi = crudApi<ItemModel, ItemModelInput>('/item-models')

/* ---------------------------------------------------------------- Item */
export interface Item extends AuditFields {
  id: number
  code: string
  name: string
  category_id: number
  unit_id?: number | null
  brand_id?: number | null
  model_id?: number | null
  oem?: string | null
  warranty_months?: number | null
  country_of_manufacture_id?: number | null
  country_of_origin_id?: number | null
  procurement_year?: number | null
  item_type?: string | null
  local_supplier?: string | null
  principal?: string | null
  year_of_manufacture?: number | null
  unit_price?: string | number | null
  functional_status?: string | null
  status: Status
  category?: Ref | null
  unit?: Ref | null
  brand?: Ref | null
  model?: Ref | null
  country_of_manufacture?: Ref | null
  country_of_origin?: Ref | null
}
export interface ItemInput {
  code: string
  name: string
  category_id: number
  unit_id?: number | null
  brand_id?: number | null
  model_id?: number | null
  oem?: string | null
  warranty_months?: number | null
  country_of_manufacture_id?: number | null
  country_of_origin_id?: number | null
  procurement_year?: number | null
  status: Status
}
export const itemsApi = crudApi<Item, ItemInput>('/items')

/** Country options come from the Configuration module (`/config/countries/options`). */
export const fetchCountryOptions = () =>
  api.get<IdLabel[]>('/config/countries/options', { params: { limit: 500 } }).then((r) => r.data)
