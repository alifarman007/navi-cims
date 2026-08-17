/** User Management API: users, roles (+ permission matrix) and modules. Mirrors backend/app/schemas/{user,role}.py */
import { api } from '@/api/client'
import { crudApi } from '@/api/crud'
import type { AuditFields, ModuleCode, PermissionAction, Ref, Status, UserType } from '@/types/api'

/* ---------------------------------------------------------------- users */
export interface User extends AuditFields {
  id: number
  user_type: UserType
  username: string
  full_name: string
  email?: string | null
  phone?: string | null
  role_id?: number | null
  office_id?: number | null
  ship_base_id?: number | null
  status: Status
  is_superuser: boolean
  last_login_at?: string | null
  role?: { id: number; name: string } | null
  office?: Ref | null
  ship_base?: Ref | null
}

export interface UserInput {
  user_type: UserType
  username: string
  full_name: string
  email: string
  phone: string
  password?: string
  role_id: number
  office_id?: number | null
  ship_base_id?: number | null
  status?: Status
}

export const usersApi = crudApi<User, UserInput>('/users')

export const resetUserPassword = (id: number, new_password: string) =>
  api.post<{ detail: string }>(`/users/${id}/reset-password`, { new_password }).then((r) => r.data)

export const USER_TYPE_LABELS: Record<UserType, string> = {
  super_admin: 'Super Admin',
  admin: 'Admin',
  office_user: 'Office User',
  ship_base_user: 'Ship/Base User',
}

/* ---------------------------------------------------------------- roles + modules */
export interface Module {
  id: number
  code: ModuleCode
  name: string
  sort_order: number
}

export type PermissionFlags = Record<PermissionAction, boolean>

export interface PermissionInput extends PermissionFlags {
  module_code: string
}

export interface RolePermission {
  module: Module
  can_menu: boolean
  can_list: boolean
  can_view: boolean
  can_add: boolean
  can_edit: boolean
  can_delete: boolean
}

export interface Role extends AuditFields {
  id: number
  name: string
  description?: string | null
  status: Status
  is_system: boolean
  permissions: RolePermission[]
}

export interface RoleInput {
  name?: string
  description?: string | null
  status?: Status
  permissions?: PermissionInput[]
}

export const rolesApi = crudApi<Role, RoleInput>('/roles')

export const fetchModules = () => api.get<Module[]>('/modules').then((r) => r.data)

export const setRolePermissions = (id: number, permissions: PermissionInput[]) =>
  api.put<Role>(`/roles/${id}/permissions`, { permissions }).then((r) => r.data)

/** Matrix state used by the form: {module_code: {menu,list,view,add,edit,delete}} */
export type Matrix = Record<string, PermissionFlags>

export const EMPTY_FLAGS: PermissionFlags = { menu: false, list: false, view: false, add: false, edit: false, delete: false }

export function roleToMatrix(role: Role): Matrix {
  const m: Matrix = {}
  for (const p of role.permissions) {
    m[p.module.code] = { menu: p.can_menu, list: p.can_list, view: p.can_view, add: p.can_add, edit: p.can_edit, delete: p.can_delete }
  }
  return m
}

export function matrixToPermissions(matrix: Matrix): PermissionInput[] {
  return Object.entries(matrix)
    .filter(([, f]) => Object.values(f).some(Boolean))
    .map(([module_code, f]) => ({ module_code, ...f }))
}
