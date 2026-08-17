/** Configuration › Division (Figma 05_Configuration - Division). */
import { z } from 'zod'
import type { ColumnDef } from '@tanstack/react-table'
import { CrudPage, cell, type FieldSpec } from '@/components/crud/CrudPage'
import { fmtDateTime } from '@/lib/utils'
import { divisionsApi, type Division, type DivisionInput } from './api'

const schema = z.object({
  name: z.string().trim().min(1, 'Division Name is required').max(100),
  name_bn: z.string().trim().max(100).optional().nullable(),
})
type FormValues = z.infer<typeof schema>

const fields: FieldSpec<FormValues>[] = [
  { name: 'name', label: 'Division Name', type: 'text', required: true },
  { name: 'name_bn', label: 'Division Name (Bangla)', type: 'text' },
]

const columns: ColumnDef<Division, unknown>[] = [
  { id: 'name', header: 'Division Name', accessorKey: 'name', meta: { sortKey: 'name', filterKey: 'name' } },
  { id: 'name_bn', header: 'Division Name (Bangla)', accessorKey: 'name_bn', cell: ({ getValue }) => cell(getValue()), meta: { sortKey: 'name_bn', filterKey: 'name_bn' } },
]

export default function DivisionPage() {
  return (
    <CrudPage<Division, FormValues, DivisionInput>
      title="Division"
      listTitle="Division List"
      module="configuration"
      queryKey="config-divisions"
      api={divisionsApi}
      entityLabel="Division"
      fields={fields}
      schema={schema}
      defaultValues={{ name: '', name_bn: '' }}
      columns={columns}
      defaultSort="name:asc"
      toForm={(r) => ({ name: r.name, name_bn: r.name_bn ?? '' })}
      toPayload={(v) => ({ name: v.name, name_bn: v.name_bn || null })}
      detailTitle="Division Details"
      toDetail={(r) => [
        {
          title: 'Division Information',
          rows: [
            { label: 'Division Name', value: r.name },
            { label: 'Division Name (Bangla)', value: cell(r.name_bn) },
            { label: 'Created', value: fmtDateTime(r.created_at) },
          ],
        },
      ]}
      minTableWidth={700}
    />
  )
}
