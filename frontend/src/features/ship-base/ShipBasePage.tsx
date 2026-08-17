/** Ship/Base Management › Create Ship/Base (Figma 01_Ship/Base Management- Create Ship/Base). */
import { z } from 'zod'
import type { ColumnDef } from '@tanstack/react-table'
import { CrudPage, cell, type FieldSpec } from '@/components/crud/CrudPage'
import { StatusText } from '@/components/ui/Misc'
import { fmtDateTime } from '@/lib/utils'
import {
  SHIP_BASE_TYPE_OPTIONS,
  shipBaseCategoriesApi,
  shipBaseTypeLabel,
  shipBasesApi,
  type ShipBase,
  type ShipBaseInput,
} from './api'

const schema = z.object({
  code: z.string().trim().min(1, 'ID is required').max(50),
  type: z.enum(['ship', 'base'], { errorMap: () => ({ message: 'Type is required' }) }),
  name: z.string().trim().min(1, 'Name is required').max(150),
  category_id: z.number().int().nullable(),
})
type FormValues = z.infer<typeof schema>

// Figma order: ID | Type (row 1), Name | Category (row 2). Status is not on the Figma form -> defaults to active.
const fields: FieldSpec<FormValues>[] = [
  { name: 'code', label: 'ID', type: 'text', required: true },
  { name: 'type', label: 'Type', type: 'select', required: true, options: SHIP_BASE_TYPE_OPTIONS },
  { name: 'name', label: 'Name', type: 'text', required: true },
  {
    name: 'category_id',
    label: 'Category',
    type: 'asyncSelect',
    optionsQueryKey: ['ship-base-categories', 'options'],
    fetchOptions: () => shipBaseCategoriesApi.options(),
  },
]

const columns: ColumnDef<ShipBase, unknown>[] = [
  { id: 'code', header: 'ID', accessorKey: 'code', meta: { sortKey: 'code', filterKey: 'code' } },
  { id: 'name', header: 'Name', accessorKey: 'name', meta: { sortKey: 'name', filterKey: 'name' } },
  {
    id: 'type',
    header: 'Type',
    accessorKey: 'type',
    cell: ({ getValue }) => shipBaseTypeLabel(getValue<string>()),
    meta: { sortKey: 'type', filterKey: 'type', filterOptions: SHIP_BASE_TYPE_OPTIONS },
  },
  {
    id: 'category',
    header: 'Category',
    accessorFn: (r) => r.category?.name ?? null,
    cell: ({ getValue }) => cell(getValue()),
    meta: { sortKey: 'category', filterKey: 'category', width: 160 },
  },
]

export default function ShipBasePage() {
  return (
    <CrudPage<ShipBase, FormValues, ShipBaseInput>
      title="Create Ship/Base"
      listTitle="Ship/Base List"
      module="ship_base_management"
      queryKey="ship-bases"
      api={shipBasesApi}
      entityLabel="Ship/Base"
      fields={fields}
      schema={schema}
      defaultValues={{ code: '', type: undefined, name: '', category_id: null }}
      columns={columns}
      toForm={(r) => ({ code: r.code, type: r.type, name: r.name, category_id: r.category_id ?? null })}
      toPayload={(v) => ({ code: v.code, name: v.name, type: v.type, category_id: v.category_id })}
      toDetail={(r) => [
        {
          title: 'Specification',
          rows: [
            { label: 'ID', value: r.code },
            { label: 'Name', value: r.name },
            { label: 'Type', value: shipBaseTypeLabel(r.type) },
            { label: 'Category', value: r.category?.name ?? '--' },
            { label: 'Status', value: <StatusText status={r.status} /> },
            { label: 'Created', value: fmtDateTime(r.created_at) },
          ],
        },
      ]}
      minTableWidth={800}
    />
  )
}
