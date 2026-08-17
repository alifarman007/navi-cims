/** Shared API types mirroring backend/app/schemas (docs/07-api-conventions.md). */

export type Status = 'active' | 'inactive'
export type UserType = 'super_admin' | 'admin' | 'office_user' | 'ship_base_user'
export type ShipBaseType = 'ship' | 'base'
export type AllocationType = 'allocation' | 'sanction'
export type AllocationStatus = 'pending' | 'approved' | 'sent_back' | 'cancelled'
export type VerificationAction = 'approved' | 'sent_back'
export type PermissionAction = 'menu' | 'list' | 'view' | 'add' | 'edit' | 'delete'

export type ModuleCode =
  | 'dashboard'
  | 'configuration'
  | 'item_management'
  | 'ship_base_management'
  | 'inventory_management'
  | 'procurement_item_info'
  | 'allocation_sanction'
  | 'compilation_verification'
  | 'report'
  | 'user_management'

export type Permissions = Partial<Record<ModuleCode, Record<PermissionAction, boolean>>>

export interface Page<T> {
  items: T[]
  total: number
  page: number
  page_size: number
  pages: number
}

export interface IdLabel {
  id: number
  label: string
}

export interface Ref {
  id: number
  code?: string | null
  name: string
}

export interface UserRef {
  id: number
  username: string
  full_name: string
}

export interface AuditFields {
  created_at?: string | null
  updated_at?: string | null
  created_by_id?: number | null
  updated_by_id?: number | null
}

/** Standard list query used by every DataTable → CRUD list endpoint. */
export interface ListQuery {
  page?: number
  page_size?: number
  sort?: string // "field:asc|desc"
  filter?: string[] // ["field:value", ...]
  q?: string
}

export interface ApiError {
  detail: string | { loc: (string | number)[]; msg: string; type: string }[]
}

// ---- auth ----
export interface UserMe {
  id: number
  user_type: UserType
  username: string
  full_name: string
  email?: string | null
  phone?: string | null
  status: Status
  is_superuser: boolean
  role?: { id: number; name: string } | null
  office?: Ref | null
  ship_base?: Ref | null
  last_login_at?: string | null
  avatar_url?: string | null
  permissions: Permissions
}

export interface TokenPair {
  access_token: string
  refresh_token: string
  token_type: string
  expires_in: number
  user: UserMe
}
