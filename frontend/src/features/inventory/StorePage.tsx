/**
 * Inventory Management › Store (Figma 01_Inventory Management- Store).
 * Form: ID*, Name*, Type* (select), Concern, Address (textarea, full width). List: SL | ID | Name | Type | Concern | Action.
 */
import { z } from 'zod'
import type { ColumnDef } from '@tanstack/react-table'
import { CrudPage, cell, type FieldSpec } from '@/components/crud/CrudPage'
import { StatusText } from '@/components/ui/Misc'
import { fmtDateTime } from '@/lib/utils'
import { STORE_TYPES, storesApi, type Store, type StoreInput } from './api'

const schema = z.object({
  code: z.string().trim().min(1, 'ID is required').max(50),
  name: z.string().trim().min(1, 'Name is required').max(200),
  store_type: z.string().min(1, 'Type is required'),
  concern: z.string().trim().max(200).optional().or(z.literal('')),
  address: z.string().trim().max(500).optional().or(z.literal('')),
  status: z.enum(['active', 'inactive']),
})
type FormValues = z.infer<typeof schema>

const TYPE_OPTIONS = STORE_TYPES.map((t) => ({ value: t, label: t }))

const fields: FieldSpec<FormValues>[] = [
  { name: 'code', label: 'ID', type: 'text', required: true },
  { name: 'name', label: 'Name', type: 'text', required: true },
  { name: 'store_type', label: 'Type', type: 'select', required: true, options: TYPE_OPTIONS },
  { name: 'concern', label: 'Concern', type: 'text' },
  { name: 'address', label: 'Address', type: 'textarea', colSpan: 2 },
]

const columns: ColumnDef<Store, unknown>[] = [
  { id: 'code', header: 'ID', accessorKey: 'code', meta: { sortKey: 'code', filterKey: 'code' } },
  { id: 'name', header: 'Name', accessorKey: 'name', meta: { sortKey: 'name', filterKey: 'name' } },
  {
    id: 'store_type',
    header: 'Type',
    accessorKey: 'store_type',
    cell: ({ getValue }) => cell(getValue()),
    meta: { sortKey: 'store_type', filterKey: 'store_type' },
  },
  { id: 'concern', header: 'Concern', accessorKey: 'concern', cell: ({ getValue }) => cell(getValue()), meta: { sortKey: 'concern', filterKey: 'concern' } },
]

export default function StorePage() {
  return (
    <CrudPage<Store, FormValues, StoreInput>
      title="Store"
      listTitle="Store List"
      module="inventory_management"
      queryKey="stores"
      api={storesApi}
      entityLabel="Store"
      fields={fields}
      schema={schema}
      defaultValues={{ code: '', name: '', store_type: '', concern: '', address: '', status: 'active' }}
      columns={columns}
      toForm={(r) => ({
        code: r.code,
        name: r.name,
        store_type: r.store_type ?? '',
        concern: r.concern ?? '',
        address: r.address ?? '',
        status: r.status,
      })}
      toPayload={(v) => ({
        code: v.code,
        name: v.name,
        store_type: v.store_type,
        concern: v.concern?.trim() ? v.concern.trim() : null,
        address: v.address?.trim() ? v.address.trim() : null,
        status: v.status,
      })}
      toDetail={(r) => [
        {
          title: 'Store Info',
          rows: [
            { label: 'ID', value: r.code },
            { label: 'Name', value: r.name },
            { label: 'Type', value: cell(r.store_type) },
            { label: 'Concern', value: cell(r.concern) },
            { label: 'Address', value: cell(r.address) },
            { label: 'Status', value: <StatusText status={r.status} /> },
            { label: 'Created', value: fmtDateTime(r.created_at) },
          ],
        },
      ]}
      minTableWidth={900}
    />
  )
}
