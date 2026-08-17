/** Configuration › Rank (Figma 03_Configuration - Rank; Priority field added to the form per gap analysis). */
import { z } from 'zod'
import type { ColumnDef } from '@tanstack/react-table'
import { CrudPage, cell, type FieldSpec } from '@/components/crud/CrudPage'
import { fmtDateTime } from '@/lib/utils'
import { ranksApi, type Rank, type RankInput } from './api'

const schema = z.object({
  name: z.string().trim().min(1, 'Rank Name is required').max(100),
  name_bn: z.string().trim().max(100).optional().nullable(),
  priority: z
    .number({ invalid_type_error: 'Priority must be a number' })
    .int('Priority must be a whole number')
    .min(0)
    .max(100000)
    .nullable()
    .optional(),
})
type FormValues = z.infer<typeof schema>

const fields: FieldSpec<FormValues>[] = [
  { name: 'name', label: 'Rank Name', type: 'text', required: true },
  { name: 'name_bn', label: 'Rank Name (Bangla)', type: 'text' },
  { name: 'priority', label: 'Priority', type: 'number', min: 0, step: 1 },
]

const columns: ColumnDef<Rank, unknown>[] = [
  { id: 'name', header: 'Rank Name', accessorKey: 'name', meta: { sortKey: 'name', filterKey: 'name' } },
  { id: 'name_bn', header: 'Rank Name Bangla', accessorKey: 'name_bn', cell: ({ getValue }) => cell(getValue()), meta: { sortKey: 'name_bn', filterKey: 'name_bn' } },
  { id: 'priority', header: 'Priority', accessorKey: 'priority', cell: ({ getValue }) => cell(getValue()), meta: { sortKey: 'priority', filterKey: 'priority', width: 220 } },
]

export default function RankPage() {
  return (
    <CrudPage<Rank, FormValues, RankInput>
      title="Rank"
      listTitle="Rank Information List"
      module="configuration"
      queryKey="config-ranks"
      api={ranksApi}
      entityLabel="Rank"
      fields={fields}
      schema={schema}
      defaultValues={{ name: '', name_bn: '', priority: null }}
      columns={columns}
      defaultSort="priority:asc"
      toForm={(r) => ({ name: r.name, name_bn: r.name_bn ?? '', priority: r.priority ?? null })}
      toPayload={(v) => ({ name: v.name, name_bn: v.name_bn || null, priority: v.priority ?? null })}
      detailTitle="Rank Details"
      toDetail={(r) => [
        {
          title: 'Rank Information',
          rows: [
            { label: 'Rank Name', value: r.name },
            { label: 'Rank Name (Bangla)', value: cell(r.name_bn) },
            { label: 'Priority', value: cell(r.priority) },
            { label: 'Created', value: fmtDateTime(r.created_at) },
          ],
        },
      ]}
      minTableWidth={800}
    />
  )
}
