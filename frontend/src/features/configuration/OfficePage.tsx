/** Configuration › Office (Figma 01_Configuration - Office): 3-column form grid + Office List. */
import { z } from 'zod'
import type { ColumnDef } from '@tanstack/react-table'
import { CrudPage, cell, type FieldSpec } from '@/components/crud/CrudPage'
import { StatusText } from '@/components/ui/Misc'
import { fmtDateTime, STATUS_OPTIONS } from '@/lib/utils'
import type { Status } from '@/types/api'
import {
  countriesApi,
  districtOptions,
  divisionsApi,
  OFFICE_TYPE_OPTIONS,
  OFFICE_TYPES,
  officesApi,
  type Office,
  type OfficeInput,
} from './api'

const schema = z.object({
  code: z.string().trim().min(1, 'Office Code is required').max(50),
  name: z.string().trim().min(1, 'Office Name is required').max(150),
  office_type: z.enum(OFFICE_TYPES, { errorMap: () => ({ message: 'Office Type is required' }) }),
  district_id: z.number({ invalid_type_error: 'District is required' }).int().positive('District is required'),
  division_id: z.number({ invalid_type_error: 'Division is required' }).int().positive('Division is required'),
  country_id: z.number({ invalid_type_error: 'Country is required' }).int().positive('Country is required'),
  address: z.string().trim().min(1, 'Address is required').max(300),
  status: z.enum(['active', 'inactive']),
})
type FormValues = z.infer<typeof schema>

const fields: FieldSpec<FormValues>[] = [
  { name: 'code', label: 'Office Code', type: 'text', required: true },
  { name: 'name', label: 'Office Name', type: 'text', required: true },
  { name: 'office_type', label: 'Office Type', type: 'select', required: true, options: OFFICE_TYPE_OPTIONS },
  {
    name: 'district_id',
    label: 'District',
    type: 'asyncSelect',
    required: true,
    optionsQueryKey: ['config-districts', 'options'],
    fetchOptions: () => districtOptions(),
  },
  {
    name: 'division_id',
    label: 'Division',
    type: 'asyncSelect',
    required: true,
    optionsQueryKey: ['config-divisions', 'options'],
    fetchOptions: () => divisionsApi.options(undefined, 500),
  },
  {
    name: 'country_id',
    label: 'Country',
    type: 'asyncSelect',
    required: true,
    optionsQueryKey: ['config-countries', 'options'],
    fetchOptions: () => countriesApi.options(undefined, 500),
  },
  { name: 'address', label: 'Address', type: 'text', required: true, colSpan: 2 },
  { name: 'status', label: 'Status', type: 'status' },
]

const columns: ColumnDef<Office, unknown>[] = [
  { id: 'code', header: 'Office Code', accessorKey: 'code', meta: { sortKey: 'code', filterKey: 'code' } },
  { id: 'name', header: 'Office Name', accessorKey: 'name', meta: { sortKey: 'name', filterKey: 'name' } },
  { id: 'office_type', header: 'Office Type', accessorKey: 'office_type', cell: ({ getValue }) => cell(getValue()), meta: { sortKey: 'office_type', filterKey: 'office_type' } },
  { id: 'district', header: 'District', accessorFn: (r) => r.district?.name, cell: ({ getValue }) => cell(getValue()), meta: { sortKey: 'district', filterKey: 'district' } },
  { id: 'division', header: 'Division', accessorFn: (r) => r.division?.name, cell: ({ getValue }) => cell(getValue()), meta: { sortKey: 'division', filterKey: 'division' } },
  { id: 'country', header: 'Country', accessorFn: (r) => r.country?.name, cell: ({ getValue }) => cell(getValue()), meta: { sortKey: 'country', filterKey: 'country' } },
  {
    id: 'status',
    header: 'Status',
    accessorKey: 'status',
    cell: ({ getValue }) => <StatusText status={getValue<Status>()} />,
    meta: { sortKey: 'status', filterKey: 'status', width: 140, filterOptions: [...STATUS_OPTIONS] },
  },
]

const undef = undefined as unknown as number

export default function OfficePage() {
  return (
    <CrudPage<Office, FormValues, OfficeInput>
      title="Office"
      listTitle="Office List"
      module="configuration"
      queryKey="config-offices"
      api={officesApi}
      entityLabel="Office"
      cols={3}
      fields={fields}
      schema={schema}
      defaultValues={{ code: '', name: '', office_type: undefined, district_id: undefined, division_id: undefined, country_id: undefined, address: '', status: 'active' }}
      columns={columns}
      toForm={(r) => ({
        code: r.code,
        name: r.name,
        office_type: (r.office_type ?? undefined) as FormValues['office_type'],
        district_id: r.district_id ?? undef,
        division_id: r.division_id ?? undef,
        country_id: r.country_id ?? undef,
        address: r.address ?? '',
        status: r.status,
      })}
      toPayload={(v) => ({
        code: v.code,
        name: v.name,
        office_type: v.office_type,
        district_id: v.district_id,
        division_id: v.division_id,
        country_id: v.country_id,
        address: v.address,
        status: v.status,
      })}
      detailTitle="Office Details"
      toDetail={(r) => [
        {
          title: 'Office Information',
          rows: [
            { label: 'Office Code', value: r.code },
            { label: 'Office Name', value: r.name },
            { label: 'Office Type', value: cell(r.office_type) },
            { label: 'District', value: cell(r.district?.name) },
            { label: 'Division', value: cell(r.division?.name) },
            { label: 'Country', value: cell(r.country?.name) },
            { label: 'Address', value: cell(r.address) },
            { label: 'Status', value: <StatusText status={r.status} /> },
            { label: 'Created', value: fmtDateTime(r.created_at) },
          ],
        },
      ]}
      minTableWidth={1100}
    />
  )
}
