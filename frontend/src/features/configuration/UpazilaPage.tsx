/** Configuration › Upazila (Figma 07_Configuration - Upazila). */
import { z } from 'zod'
import type { ColumnDef } from '@tanstack/react-table'
import { CrudPage, cell, type FieldSpec } from '@/components/crud/CrudPage'
import { fmtDateTime } from '@/lib/utils'
import { districtOptions, upazilasApi, type Upazila, type UpazilaInput } from './api'

const schema = z.object({
  name: z.string().trim().min(1, 'Upazila Name is required').max(100),
  name_bn: z.string().trim().max(100).optional().nullable(),
  district_id: z.number({ invalid_type_error: 'District Name is required' }).int().positive('District Name is required'),
})
type FormValues = z.infer<typeof schema>

const fields: FieldSpec<FormValues>[] = [
  { name: 'name', label: 'Upazila Name', type: 'text', required: true },
  { name: 'name_bn', label: 'Upazila Name (Bangla)', type: 'text' },
  {
    name: 'district_id',
    label: 'District Name',
    type: 'asyncSelect',
    required: true,
    placeholder: 'Please Choose-',
    optionsQueryKey: ['config-districts', 'options'],
    fetchOptions: () => districtOptions(),
  },
]

const columns: ColumnDef<Upazila, unknown>[] = [
  { id: 'name', header: 'Upazila Name', accessorKey: 'name', meta: { sortKey: 'name', filterKey: 'name' } },
  { id: 'district', header: 'District Name', accessorFn: (r) => r.district?.name, cell: ({ getValue }) => cell(getValue()), meta: { sortKey: 'district', filterKey: 'district' } },
  { id: 'name_bn', header: 'Upazila Name (Bangla)', accessorKey: 'name_bn', cell: ({ getValue }) => cell(getValue()), meta: { sortKey: 'name_bn', filterKey: 'name_bn' } },
]

export default function UpazilaPage() {
  return (
    <CrudPage<Upazila, FormValues, UpazilaInput>
      title="Upazila Name"
      listTitle="Upazila List"
      module="configuration"
      queryKey="config-upazilas"
      api={upazilasApi}
      entityLabel="Upazila"
      fields={fields}
      schema={schema}
      defaultValues={{ name: '', name_bn: '', district_id: undefined }}
      columns={columns}
      defaultSort="name:asc"
      toForm={(r) => ({ name: r.name, name_bn: r.name_bn ?? '', district_id: r.district_id })}
      toPayload={(v) => ({ name: v.name, name_bn: v.name_bn || null, district_id: v.district_id })}
      detailTitle="Upazila Details"
      toDetail={(r) => [
        {
          title: 'Upazila Information',
          rows: [
            { label: 'Upazila Name', value: r.name },
            { label: 'Upazila Name (Bangla)', value: cell(r.name_bn) },
            { label: 'District Name', value: cell(r.district?.name) },
            { label: 'Division Name', value: cell(r.district?.division?.name) },
            { label: 'Created', value: fmtDateTime(r.created_at) },
          ],
        },
      ]}
      minTableWidth={800}
    />
  )
}
