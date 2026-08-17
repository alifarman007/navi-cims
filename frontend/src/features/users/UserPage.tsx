/**
 * User Management › User (Figma 01_User Management- User).
 * Form: User Type*, User Name*, Email*, Phone Number*, Role*, Password* (+ Full Name*, and Office / Ship-Base
 * depending on the user type). List: SL, User Type, User Name, Email, Phone Number, Role, Status, Action (edit + delete).
 * "Delete" = disable (SRS: accounts are never removed).
 */
import { useMemo, useState } from 'react'
import { z } from 'zod'
import type { ColumnDef } from '@tanstack/react-table'
import { crudApi } from '@/api/crud'
import { CrudPage, cell, type FieldSpec } from '@/components/crud/CrudPage'
import { ConfirmDialog } from '@/components/ui/Modal'
import { RowAction } from '@/components/ui/RowActions'
import { StatusText } from '@/components/ui/Misc'
import { useAuthStore } from '@/app/store/auth'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { errorMessage } from '@/lib/utils'
import type { Status, UserType } from '@/types/api'
import { rolesApi, USER_TYPE_LABELS, usersApi, type User, type UserInput } from './api'

const officeOptions = crudApi<{ id: number }, unknown>('/config/offices')
const shipBaseOptions = crudApi<{ id: number }, unknown>('/ship-bases')

const USER_TYPES: UserType[] = ['super_admin', 'admin', 'office_user', 'ship_base_user']

const schema = z
  .object({
    id: z.number().nullable(),
    user_type: z.enum(['super_admin', 'admin', 'office_user', 'ship_base_user'], { message: 'User Type is required' }),
    username: z
      .string()
      .trim()
      .min(3, 'User Name must be at least 3 characters')
      .max(64)
      .regex(/^[A-Za-z0-9._@+-]+$/, 'Only letters, digits and . _ @ + - are allowed'),
    full_name: z.string().trim().min(1, 'Full Name is required').max(150),
    email: z.string().trim().min(1, 'Email is required').email('Enter a valid email'),
    phone: z.string().trim().min(6, 'Phone Number is required').max(20),
    role_id: z.number({ message: 'Role is required' }).int().positive('Role is required'),
    password: z.string(),
    office_id: z.number().nullable(),
    ship_base_id: z.number().nullable(),
    status: z.enum(['active', 'inactive']),
  })
  .superRefine((v, ctx) => {
    if (v.id === null && v.password.length === 0) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['password'], message: 'Password is required' })
    }
    if (v.password.length > 0 && v.password.length < 8) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['password'], message: 'Password must be at least 8 characters' })
    }
    if (v.user_type === 'office_user' && !v.office_id) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['office_id'], message: 'Office is required for an Office User' })
    }
    if (v.user_type === 'ship_base_user' && !v.ship_base_id) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['ship_base_id'], message: 'Ship/Base is required for a Ship/Base User' })
    }
  })
type FormValues = z.infer<typeof schema>

const defaultValues: FormValues = {
  id: null,
  user_type: '' as unknown as UserType,
  username: '',
  full_name: '',
  email: '',
  phone: '',
  role_id: null as unknown as number,
  password: '',
  office_id: null,
  ship_base_id: null,
  status: 'active',
}

const columns: ColumnDef<User, unknown>[] = [
  {
    id: 'user_type',
    header: 'User Type',
    accessorKey: 'user_type',
    cell: ({ getValue }) => USER_TYPE_LABELS[getValue<UserType>()] ?? cell(getValue()),
    meta: {
      sortKey: 'user_type',
      filterKey: 'user_type',
      width: 200,
      filterOptions: USER_TYPES.map((t) => ({ value: t, label: USER_TYPE_LABELS[t] })),
    },
  },
  { id: 'username', header: 'User Name', accessorKey: 'username', meta: { sortKey: 'username', filterKey: 'username', width: 180 } },
  { id: 'email', header: 'Email', accessorKey: 'email', cell: ({ getValue }) => cell(getValue()), meta: { sortKey: 'email', filterKey: 'email', width: 220 } },
  { id: 'phone', header: 'Phone Number', accessorKey: 'phone', cell: ({ getValue }) => cell(getValue()), meta: { sortKey: 'phone', filterKey: 'phone', width: 160 } },
  { id: 'role', header: 'Role', accessorFn: (r) => r.role?.name, cell: ({ getValue }) => cell(getValue()), meta: { sortKey: 'role', filterKey: 'role', width: 220 } },
  {
    id: 'status',
    header: 'Status',
    accessorKey: 'status',
    cell: ({ getValue }) => <StatusText status={getValue<Status>()} />,
    meta: {
      sortKey: 'status',
      filterKey: 'status',
      width: 150,
      filterOptions: [
        { value: 'active', label: 'Active' },
        { value: 'inactive', label: 'Inactive' },
      ],
    },
  },
]

export default function UserPage() {
  const me = useAuthStore((s) => s.user)
  const hasPermission = useAuthStore((s) => s.hasPermission)
  const canDelete = hasPermission('user_management', 'delete')
  const isSuper = me?.user_type === 'super_admin' || !!me?.is_superuser
  const [disabling, setDisabling] = useState<User | null>(null)
  const qc = useQueryClient()
  const remove = useMutation({
    mutationFn: (id: number) => usersApi.remove(id),
    onSuccess: () => {
      toast.success('User disabled')
      qc.invalidateQueries({ queryKey: ['users'] })
    },
    onError: (e) => toast.error(errorMessage(e)),
  })

  const fields = useMemo<FieldSpec<FormValues>[]>(
    () => [
      {
        name: 'user_type',
        label: 'User Type',
        type: 'select',
        required: true,
        placeholder: 'Please Choose',
        options: USER_TYPES.filter((t) => t !== 'super_admin' || isSuper).map((t) => ({ value: t, label: USER_TYPE_LABELS[t] })),
      },
      { name: 'username', label: 'User Name', type: 'text', required: true },
      { name: 'email', label: 'Email', type: 'email', required: true },
      { name: 'phone', label: 'Phone Number', type: 'phone', required: true },
      {
        name: 'role_id',
        label: 'Role',
        type: 'asyncSelect',
        required: true,
        optionsQueryKey: ['roles', 'options'],
        fetchOptions: () => rolesApi.options(),
      },
      { name: 'password', label: 'Password', type: 'password', required: true, onlyIn: 'create' },
      { name: 'password', label: 'Password (leave blank to keep)', type: 'password', onlyIn: 'edit' },
      { name: 'full_name', label: 'Full Name', type: 'text', required: true },
      {
        name: 'office_id',
        label: 'Office',
        type: 'asyncSelect',
        required: true,
        optionsQueryKey: ['config-offices', 'options'],
        fetchOptions: () => officeOptions.options(),
        visible: (v) => v.user_type === 'office_user',
      },
      {
        name: 'ship_base_id',
        label: 'Ship/Base',
        type: 'asyncSelect',
        required: true,
        optionsQueryKey: ['ship-bases', 'options'],
        fetchOptions: () => shipBaseOptions.options(),
        visible: (v) => v.user_type === 'ship_base_user',
      },
      { name: 'status', label: 'Status', type: 'status', onlyIn: 'edit' },
    ],
    [isSuper],
  )

  return (
    <>
      <CrudPage<User, FormValues, UserInput>
        title="User"
        listTitle="User List"
        module="user_management"
        queryKey="users"
        api={usersApi}
        entityLabel="User"
        fields={fields}
        schema={schema}
        defaultValues={defaultValues}
        columns={columns}
        toForm={(r) => ({
          id: r.id,
          user_type: r.user_type,
          username: r.username,
          full_name: r.full_name,
          email: r.email ?? '',
          phone: r.phone ?? '',
          role_id: r.role_id ?? (null as unknown as number),
          password: '',
          office_id: r.office_id ?? null,
          ship_base_id: r.ship_base_id ?? null,
          status: r.status,
        })}
        toPayload={(v) => {
          const payload: UserInput = {
            user_type: v.user_type,
            username: v.username,
            full_name: v.full_name,
            email: v.email,
            phone: v.phone,
            role_id: v.role_id,
            office_id: v.user_type === 'office_user' ? v.office_id : null,
            ship_base_id: v.user_type === 'ship_base_user' ? v.ship_base_id : null,
          }
          if (v.password) payload.password = v.password
          if (v.id !== null) payload.status = v.status
          return payload
        }}
        hideActions={{ view: true, delete: true }}
        extraActions={(row) =>
          canDelete ? (
            <RowAction
              kind="delete"
              title="Disable"
              disabled={row.status === 'inactive' || row.user_type === 'super_admin' || row.id === me?.id}
              onClick={() => setDisabling(row)}
            />
          ) : null
        }
        minTableWidth={1100}
      />
      <ConfirmDialog
        open={!!disabling}
        onClose={() => setDisabling(null)}
        tone="danger"
        message="You want to disable this user!"
        loading={remove.isPending}
        onConfirm={async () => {
          if (!disabling) return
          await remove.mutateAsync(disabling.id)
          setDisabling(null)
        }}
      />
    </>
  )
}
