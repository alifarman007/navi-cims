/** Configuration › Country (Figma 04_Configuration - Country). */
import { z } from 'zod'
import type { ColumnDef } from '@tanstack/react-table'
import { CrudPage, cell, type FieldSpec } from '@/components/crud/CrudPage'
import { fmtDateTime } from '@/lib/utils'
import { countriesApi, type Country, type CountryInput } from './api'

const schema = z.object({
  name: z.string().trim().min(1, 'Country Name is required').max(100),
  code: z.string().trim().max(10, 'Max 10 characters').optional().nullable(),
  gmt: z.string().trim().max(20, 'Max 20 characters').optional().nullable(),
})
type FormValues = z.infer<typeof schema>

const fields: FieldSpec<FormValues>[] = [
  { name: 'name', label: 'Country Name', type: 'text', required: true },
  { name: 'code', label: 'Country Code', type: 'text' },
  { name: 'gmt', label: 'GMT', type: 'text' },
]

const columns: ColumnDef<Country, unknown>[] = [
  { id: 'name', header: 'Country Name', accessorKey: 'name', meta: { sortKey: 'name', filterKey: 'name' } },
  { id: 'code', header: 'Country Code', accessorKey: 'code', cell: ({ getValue }) => cell(getValue()), meta: { sortKey: 'code', filterKey: 'code' } },
]

export default function CountryPage() {
  return (
    <CrudPage<Country, FormValues, CountryInput>
      title="Country Information"
      listTitle="Country Information List"
      module="configuration"
      queryKey="config-countries"
      api={countriesApi}
      entityLabel="Country"
      fields={fields}
      schema={schema}
      defaultValues={{ name: '', code: '', gmt: '' }}
      columns={columns}
      defaultSort="name:asc"
      toForm={(r) => ({ name: r.name, code: r.code ?? '', gmt: r.gmt ?? '' })}
      toPayload={(v) => ({ name: v.name, code: v.code || null, gmt: v.gmt || null })}
      detailTitle="Country Details"
      toDetail={(r) => [
        {
          title: 'Country Information',
          rows: [
            { label: 'Country Name', value: r.name },
            { label: 'Country Code', value: cell(r.code) },
            { label: 'GMT', value: cell(r.gmt) },
            { label: 'Created', value: fmtDateTime(r.created_at) },
          ],
        },
      ]}
      minTableWidth={700}
    />
  )
}
