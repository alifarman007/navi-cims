/** Item Management › Create Item Unit (Figma 02_Item Management- Create Item Unit). */
import { z } from 'zod'
import type { ColumnDef } from '@tanstack/react-table'
import { CrudPage, type FieldSpec } from '@/components/crud/CrudPage'
import { StatusText } from '@/components/ui/Misc'
import { dash, fmtDateTime } from '@/lib/utils'
import type { Status } from '@/types/api'
import { itemUnitsApi, type ItemUnit, type ItemUnitInput } from '../api'

const schema = z.object({
  code: z.string().trim().min(1, 'Unit ID is required').max(50),
  name: z.string().trim().min(1, 'Unit Name is required').max(100),
  unit_code: z.string().trim().min(1, 'Unit Code is required').max(20),
  status: z.enum(['active', 'inactive']),
})
type FormValues = z.infer<typeof schema>

const fields: FieldSpec<FormValues>[] = [
  { name: 'code', label: 'Unit ID', type: 'text', required: true },
  { name: 'name', label: 'Unit Name', type: 'text', required: true },
  { name: 'unit_code', label: 'Unit Code', type: 'text', required: true },
  { name: 'status', label: 'Status', type: 'status' },
]

const columns: ColumnDef<ItemUnit, unknown>[] = [
  { id: 'code', header: 'Unit ID', accessorKey: 'code', meta: { sortKey: 'code', filterKey: 'code' } },
  { id: 'name', header: 'Unit Name', accessorKey: 'name', meta: { sortKey: 'name', filterKey: 'name' } },
  {
    id: 'unit_code',
    header: 'Unit Code',
    accessorKey: 'unit_code',
    cell: ({ getValue }) => dash(getValue<string | null>()),
    meta: { sortKey: 'unit_code', filterKey: 'unit_code' },
  },
  {
    id: 'status',
    header: 'Status',
    accessorKey: 'status',
    cell: ({ getValue }) => <StatusText status={getValue<Status>()} />,
    meta: {
      sortKey: 'status',
      filterKey: 'status',
      width: 160,
      filterOptions: [
        { value: 'active', label: 'Active' },
        { value: 'inactive', label: 'Inactive' },
      ],
    },
  },
]

export default function ItemUnitPage() {
  return (
    <CrudPage<ItemUnit, FormValues, ItemUnitInput>
      title="Create Item Unit"
      listTitle="Item Unit List"
      module="item_management"
      queryKey="item-units"
      api={itemUnitsApi}
      entityLabel="Item Unit"
      fields={fields}
      schema={schema}
      defaultValues={{ code: '', name: '', unit_code: '', status: 'active' }}
      columns={columns}
      toForm={(r) => ({ code: r.code, name: r.name, unit_code: r.unit_code ?? '', status: r.status })}
      toDetail={(r) => [
        {
          title: 'Specification',
          rows: [
            { label: 'Unit ID', value: r.code },
            { label: 'Unit Name', value: r.name },
            { label: 'Unit Code', value: dash(r.unit_code) },
            { label: 'Status', value: <StatusText status={r.status} /> },
            { label: 'Created', value: fmtDateTime(r.created_at) },
          ],
        },
      ]}
      minTableWidth={800}
    />
  )
}
