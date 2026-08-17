/** Configuration › District (Figma 06_Configuration - District). */
import { z } from 'zod'
import type { ColumnDef } from '@tanstack/react-table'
import { CrudPage, cell, type FieldSpec } from '@/components/crud/CrudPage'
import { fmtDateTime } from '@/lib/utils'
import { districtsApi, divisionsApi, type District, type DistrictInput } from './api'

const schema = z.object({
  name: z.string().trim().min(1, 'District Name is required').max(100),
  name_bn: z.string().trim().max(100).optional().nullable(),
  division_id: z.number({ invalid_type_error: 'Division is required' }).int().positive('Division is required'),
})
type FormValues = z.infer<typeof schema>

const fields: FieldSpec<FormValues>[] = [
  { name: 'name', label: 'District Name', type: 'text', required: true },
  { name: 'name_bn', label: 'District Name (Bangla)', type: 'text' },
  {
    name: 'division_id',
    label: 'Select Division',
    type: 'asyncSelect',
    required: true,
    placeholder: 'Please Choose-',
    optionsQueryKey: ['config-divisions', 'options'],
    fetchOptions: () => divisionsApi.options(undefined, 500),
  },
]

const columns: ColumnDef<District, unknown>[] = [
  { id: 'division', header: 'Division Name', accessorFn: (r) => r.division?.name, cell: ({ getValue }) => cell(getValue()), meta: { sortKey: 'division', filterKey: 'division' } },
  { id: 'name', header: 'District Name', accessorKey: 'name', meta: { sortKey: 'name', filterKey: 'name' } },
  { id: 'name_bn', header: 'District Name (Bangla)', accessorKey: 'name_bn', cell: ({ getValue }) => cell(getValue()), meta: { sortKey: 'name_bn', filterKey: 'name_bn' } },
]

export default function DistrictPage() {
  return (
    <CrudPage<District, FormValues, DistrictInput>
      title="District Name"
      listTitle="District Name List"
      module="configuration"
      queryKey="config-districts"
      api={districtsApi}
      entityLabel="District"
      fields={fields}
      schema={schema}
      defaultValues={{ name: '', name_bn: '', division_id: undefined }}
      columns={columns}
      defaultSort="name:asc"
      toForm={(r) => ({ name: r.name, name_bn: r.name_bn ?? '', division_id: r.division_id })}
      toPayload={(v) => ({ name: v.name, name_bn: v.name_bn || null, division_id: v.division_id })}
      detailTitle="District Details"
      toDetail={(r) => [
        {
          title: 'District Information',
          rows: [
            { label: 'Division Name', value: cell(r.division?.name) },
            { label: 'District Name', value: r.name },
            { label: 'District Name (Bangla)', value: cell(r.name_bn) },
            { label: 'Created', value: fmtDateTime(r.created_at) },
          ],
        },
      ]}
      minTableWidth={800}
    />
  )
}
