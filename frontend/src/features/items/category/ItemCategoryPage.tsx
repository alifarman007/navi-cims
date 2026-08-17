/** Item Management › Create Item Category (Figma 05_Item Management- Create Item Category). */
import { z } from 'zod'
import type { ColumnDef } from '@tanstack/react-table'
import { CrudPage, type FieldSpec } from '@/components/crud/CrudPage'
import { StatusText } from '@/components/ui/Misc'
import { fmtDateTime } from '@/lib/utils'
import type { Status } from '@/types/api'
import { itemCategoriesApi, type ItemCategory, type ItemCategoryInput } from '../api'

const schema = z.object({
  code: z.string().trim().min(1, 'Category ID is required').max(50),
  name: z.string().trim().min(1, 'Category Name is required').max(150),
  status: z.enum(['active', 'inactive']),
})
type FormValues = z.infer<typeof schema>

const fields: FieldSpec<FormValues>[] = [
  { name: 'code', label: 'Category ID', type: 'text', required: true },
  { name: 'name', label: 'Category Name', type: 'text', required: true },
  { name: 'status', label: 'Status', type: 'status' },
]

const columns: ColumnDef<ItemCategory, unknown>[] = [
  { id: 'code', header: 'Category ID', accessorKey: 'code', meta: { sortKey: 'code', filterKey: 'code' } },
  { id: 'name', header: 'Category Name', accessorKey: 'name', meta: { sortKey: 'name', filterKey: 'name' } },
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

export default function ItemCategoryPage() {
  return (
    <CrudPage<ItemCategory, FormValues, ItemCategoryInput>
      title="Create Item Category"
      listTitle="Item Category List"
      module="item_management"
      queryKey="item-categories"
      api={itemCategoriesApi}
      entityLabel="Item Category"
      fields={fields}
      schema={schema}
      defaultValues={{ code: '', name: '', status: 'active' }}
      columns={columns}
      toForm={(r) => ({ code: r.code, name: r.name, status: r.status })}
      toDetail={(r) => [
        {
          title: 'Specification',
          rows: [
            { label: 'Category ID', value: r.code },
            { label: 'Category Name', value: r.name },
            { label: 'Status', value: <StatusText status={r.status} /> },
            { label: 'Created', value: fmtDateTime(r.created_at) },
          ],
        },
      ]}
      minTableWidth={700}
    />
  )
}
