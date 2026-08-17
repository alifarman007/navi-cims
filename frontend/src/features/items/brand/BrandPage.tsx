/**
 * REFERENCE FEATURE — Item Management › Brand (Figma 03_Item Management- Brand).
 * Every simple master page follows this exact shape: types → api → schema → fields → columns → CrudPage.
 */
import { z } from 'zod'
import type { ColumnDef } from '@tanstack/react-table'
import { crudApi } from '@/api/crud'
import { CrudPage, type FieldSpec } from '@/components/crud/CrudPage'
import { StatusText } from '@/components/ui/Misc'
import { fmtDateTime } from '@/lib/utils'
import type { AuditFields, Status } from '@/types/api'

export interface Brand extends AuditFields {
  id: number
  code: string
  name: string
  status: Status
}
export interface BrandInput {
  code: string
  name: string
  status: Status
}

export const brandsApi = crudApi<Brand, BrandInput>('/brands')

const schema = z.object({
  code: z.string().trim().min(1, 'Brand ID is required').max(50),
  name: z.string().trim().min(1, 'Brand Name is required').max(150),
  status: z.enum(['active', 'inactive']),
})
type FormValues = z.infer<typeof schema>

const fields: FieldSpec<FormValues>[] = [
  { name: 'code', label: 'Brand ID', type: 'text', required: true },
  { name: 'name', label: 'Brand Name', type: 'text', required: true },
  { name: 'status', label: 'Status', type: 'status' },
]

const columns: ColumnDef<Brand, unknown>[] = [
  { id: 'code', header: 'Brand ID', accessorKey: 'code', meta: { sortKey: 'code', filterKey: 'code' } },
  { id: 'name', header: 'Brand Name', accessorKey: 'name', meta: { sortKey: 'name', filterKey: 'name' } },
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

export default function BrandPage() {
  return (
    <CrudPage<Brand, FormValues, BrandInput>
      title="Brand"
      listTitle="Brand List"
      module="item_management"
      queryKey="brands"
      api={brandsApi}
      entityLabel="Brand"
      fields={fields}
      schema={schema}
      defaultValues={{ code: '', name: '', status: 'active' }}
      columns={columns}
      toForm={(r) => ({ code: r.code, name: r.name, status: r.status })}
      toDetail={(r) => [
        {
          title: 'Specification',
          rows: [
            { label: 'Brand ID', value: r.code },
            { label: 'Brand Name', value: r.name },
            { label: 'Status', value: <StatusText status={r.status} /> },
            { label: 'Created', value: fmtDateTime(r.created_at) },
          ],
        },
      ]}
      minTableWidth={700}
    />
  )
}
