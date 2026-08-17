/** Item Management › Model (Figma 04_Item Management- Model). */
import { z } from 'zod'
import type { ColumnDef } from '@tanstack/react-table'
import { CrudPage, type FieldSpec } from '@/components/crud/CrudPage'
import { StatusText } from '@/components/ui/Misc'
import { dash, fmtDateTime } from '@/lib/utils'
import type { Status } from '@/types/api'
import { brandsApi, itemModelsApi, type ItemModel, type ItemModelInput } from '../api'

const schema = z.object({
  code: z.string().trim().min(1, 'Model ID is required').max(50),
  name: z.string().trim().min(1, 'Model Name is required').max(150),
  brand_id: z.number().int().nullable().optional(),
  status: z.enum(['active', 'inactive']),
})
type FormValues = z.infer<typeof schema>

const fields: FieldSpec<FormValues>[] = [
  { name: 'code', label: 'Model ID', type: 'text', required: true },
  { name: 'name', label: 'Model Name', type: 'text', required: true },
  {
    name: 'brand_id',
    label: 'Brand Name',
    type: 'asyncSelect',
    optionsQueryKey: ['brands', 'options'],
    fetchOptions: () => brandsApi.options(undefined, 500),
  },
  { name: 'status', label: 'Status', type: 'status' },
]

const columns: ColumnDef<ItemModel, unknown>[] = [
  { id: 'code', header: 'Model ID', accessorKey: 'code', meta: { sortKey: 'code', filterKey: 'code' } },
  { id: 'name', header: 'Model Name', accessorKey: 'name', meta: { sortKey: 'name', filterKey: 'name' } },
  {
    id: 'brand',
    header: 'Brand Name',
    accessorFn: (r) => r.brand?.name ?? null,
    cell: ({ row }) => dash(row.original.brand?.name),
    meta: { sortKey: 'brand', filterKey: 'brand' },
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

export default function ModelPage() {
  return (
    <CrudPage<ItemModel, FormValues, ItemModelInput>
      title="Model"
      listTitle="Model List"
      module="item_management"
      queryKey="item-models"
      api={itemModelsApi}
      entityLabel="Model"
      fields={fields}
      schema={schema}
      defaultValues={{ code: '', name: '', brand_id: null, status: 'active' }}
      columns={columns}
      toForm={(r) => ({ code: r.code, name: r.name, brand_id: r.brand_id ?? null, status: r.status })}
      toPayload={(v) => ({ code: v.code, name: v.name, brand_id: v.brand_id ?? null, status: v.status })}
      toDetail={(r) => [
        {
          title: 'Specification',
          rows: [
            { label: 'Model ID', value: r.code },
            { label: 'Model Name', value: r.name },
            { label: 'Brand Name', value: dash(r.brand?.name) },
            { label: 'Status', value: <StatusText status={r.status} /> },
            { label: 'Created', value: fmtDateTime(r.created_at) },
          ],
        },
      ]}
      minTableWidth={800}
    />
  )
}
