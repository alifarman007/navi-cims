/** Ship/Base Management › Create Ship/Base Category (Figma 02_Ship/Base Management- Create Ship/Base Category). */
import { z } from 'zod'
import type { ColumnDef } from '@tanstack/react-table'
import { CrudPage, type FieldSpec } from '@/components/crud/CrudPage'
import { fmtDateTime } from '@/lib/utils'
import { shipBaseCategoriesApi, type ShipBaseCategory, type ShipBaseCategoryInput } from './api'

const schema = z.object({
  code: z.string().trim().min(1, 'Category ID is required').max(50),
  name: z.string().trim().min(1, 'Category Name is required').max(150),
})
type FormValues = z.infer<typeof schema>

const fields: FieldSpec<FormValues>[] = [
  { name: 'code', label: 'Category ID', type: 'text', required: true },
  { name: 'name', label: 'Category Name', type: 'text', required: true },
]

const columns: ColumnDef<ShipBaseCategory, unknown>[] = [
  { id: 'code', header: 'Category ID', accessorKey: 'code', meta: { sortKey: 'code', filterKey: 'code' } },
  { id: 'name', header: 'Category Name', accessorKey: 'name', meta: { sortKey: 'name', filterKey: 'name' } },
]

export default function ShipBaseCategoryPage() {
  return (
    <CrudPage<ShipBaseCategory, FormValues, ShipBaseCategoryInput>
      title="Create Ship/Base Category"
      listTitle="Ship/Base Category List"
      module="ship_base_management"
      queryKey="ship-base-categories"
      api={shipBaseCategoriesApi}
      entityLabel="Ship/Base Category"
      fields={fields}
      schema={schema}
      defaultValues={{ code: '', name: '' }}
      columns={columns}
      toForm={(r) => ({ code: r.code, name: r.name })}
      toDetail={(r) => [
        {
          title: 'Specification',
          rows: [
            { label: 'Category ID', value: r.code },
            { label: 'Category Name', value: r.name },
            { label: 'Created', value: fmtDateTime(r.created_at) },
          ],
        },
      ]}
      minTableWidth={700}
    />
  )
}
