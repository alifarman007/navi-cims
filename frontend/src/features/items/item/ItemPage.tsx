/** Item Management › Create Item (Figma 01_Item Management- Create Item). */
import { z } from 'zod'
import type { ColumnDef } from '@tanstack/react-table'
import { CrudPage, type FieldSpec } from '@/components/crud/CrudPage'
import { StatusText } from '@/components/ui/Misc'
import { dash, fmtDateTime } from '@/lib/utils'
import type { Status } from '@/types/api'
import {
  brandsApi,
  fetchCountryOptions,
  itemCategoriesApi,
  itemModelsApi,
  itemUnitsApi,
  itemsApi,
  type Item,
  type ItemInput,
} from '../api'

const optionalId = z.number().int().nullable().optional()

const schema = z.object({
  code: z.string().trim().min(1, 'Item ID is required').max(50),
  name: z.string().trim().min(1, 'Item Name is required').max(200),
  brand_id: optionalId,
  model_id: optionalId,
  oem: z.string().trim().max(200).nullable().optional(),
  warranty_months: z
    .number({ invalid_type_error: 'Warranty must be a number' })
    .int('Warranty must be whole months')
    .min(0, 'Warranty cannot be negative')
    .max(1200)
    .nullable()
    .optional(),
  country_of_manufacture_id: optionalId,
  country_of_origin_id: optionalId,
  category_id: z.number({ invalid_type_error: 'Category is required', required_error: 'Category is required' }).int(),
  unit_id: optionalId,
  procurement_year: z.number().int().min(1900).max(2100).nullable().optional(),
  status: z.enum(['active', 'inactive']),
})
type FormValues = z.infer<typeof schema>

const fields: FieldSpec<FormValues>[] = [
  { name: 'code', label: 'Item ID', type: 'text', required: true },
  { name: 'name', label: 'Item Name', type: 'text', required: true },
  {
    name: 'brand_id',
    label: 'Brand',
    type: 'asyncSelect',
    optionsQueryKey: ['brands', 'options'],
    fetchOptions: () => brandsApi.options(undefined, 500),
  },
  {
    name: 'model_id',
    label: 'Model',
    type: 'asyncSelect',
    optionsQueryKey: ['item-models', 'options'],
    fetchOptions: () => itemModelsApi.options(undefined, 500),
  },
  { name: 'oem', label: 'OEM', type: 'text' },
  { name: 'warranty_months', label: 'Warranty', type: 'number', min: 0, max: 1200, step: 1, placeholder: 'Months' },
  {
    name: 'country_of_manufacture_id',
    label: 'Country of Manufacture',
    type: 'asyncSelect',
    optionsQueryKey: ['countries', 'options'],
    fetchOptions: fetchCountryOptions,
  },
  {
    name: 'country_of_origin_id',
    label: 'Country of Origin',
    type: 'asyncSelect',
    optionsQueryKey: ['countries', 'options'],
    fetchOptions: fetchCountryOptions,
  },
  {
    name: 'category_id',
    label: 'Category',
    type: 'asyncSelect',
    required: true,
    optionsQueryKey: ['item-categories', 'options'],
    fetchOptions: () => itemCategoriesApi.options(undefined, 500),
  },
  {
    name: 'unit_id',
    label: 'Unit',
    type: 'asyncSelect',
    optionsQueryKey: ['item-units', 'options'],
    fetchOptions: () => itemUnitsApi.options(undefined, 500),
  },
  { name: 'procurement_year', label: 'Procurement Year', type: 'year' },
  { name: 'status', label: 'Status', type: 'status' },
]

const columns: ColumnDef<Item, unknown>[] = [
  { id: 'code', header: 'Item ID', accessorKey: 'code', meta: { sortKey: 'code', filterKey: 'code', width: 152 } },
  { id: 'name', header: 'Item Name', accessorKey: 'name', meta: { sortKey: 'name', filterKey: 'name', width: 200 } },
  {
    id: 'brand',
    header: 'Brand',
    accessorFn: (r) => r.brand?.name ?? null,
    cell: ({ row }) => dash(row.original.brand?.name),
    meta: { sortKey: 'brand', filterKey: 'brand', width: 144 },
  },
  {
    id: 'model',
    header: 'Model',
    accessorFn: (r) => r.model?.name ?? null,
    cell: ({ row }) => dash(row.original.model?.name),
    meta: { sortKey: 'model', filterKey: 'model', width: 146 },
  },
  {
    id: 'oem',
    header: 'OEM',
    accessorKey: 'oem',
    cell: ({ getValue }) => dash(getValue<string | null>()),
    meta: { sortKey: 'oem', filterKey: 'oem', width: 110 },
  },
  {
    id: 'country_of_manufacture',
    header: 'Country of Manufacture',
    accessorFn: (r) => r.country_of_manufacture?.name ?? null,
    cell: ({ row }) => dash(row.original.country_of_manufacture?.name),
    meta: { width: 231 },
  },
  {
    id: 'procurement_year',
    header: 'Procurement Year',
    accessorKey: 'procurement_year',
    cell: ({ getValue }) => dash(getValue<number | null>()),
    meta: { sortKey: 'procurement_year', filterKey: 'procurement_year', width: 176 },
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

const defaultValues: FormValues = {
  code: '',
  name: '',
  brand_id: null,
  model_id: null,
  oem: '',
  warranty_months: null,
  country_of_manufacture_id: null,
  country_of_origin_id: null,
  // empty until the user picks a category; zod reports "Category is required"
  category_id: undefined as unknown as number,
  unit_id: null,
  procurement_year: null,
  status: 'active',
}

function warrantyLabel(months?: number | null): string {
  if (months === null || months === undefined) return '--'
  return `${months} ${months === 1 ? 'month' : 'months'}`
}

export default function ItemPage() {
  return (
    <CrudPage<Item, FormValues, ItemInput>
      title="Create Item"
      listTitle="Item List"
      module="item_management"
      queryKey="items"
      api={itemsApi}
      entityLabel="Item"
      cols={3}
      fields={fields}
      schema={schema}
      defaultValues={defaultValues}
      columns={columns}
      toForm={(r) => ({
        code: r.code,
        name: r.name,
        brand_id: r.brand_id ?? null,
        model_id: r.model_id ?? null,
        oem: r.oem ?? '',
        warranty_months: r.warranty_months ?? null,
        country_of_manufacture_id: r.country_of_manufacture_id ?? null,
        country_of_origin_id: r.country_of_origin_id ?? null,
        category_id: r.category_id,
        unit_id: r.unit_id ?? null,
        procurement_year: r.procurement_year ?? null,
        status: r.status,
      })}
      toPayload={(v) => ({
        code: v.code,
        name: v.name,
        category_id: v.category_id,
        unit_id: v.unit_id ?? null,
        brand_id: v.brand_id ?? null,
        model_id: v.model_id ?? null,
        oem: v.oem ? v.oem : null,
        warranty_months: v.warranty_months ?? null,
        country_of_manufacture_id: v.country_of_manufacture_id ?? null,
        country_of_origin_id: v.country_of_origin_id ?? null,
        procurement_year: v.procurement_year ?? null,
        status: v.status,
      })}
      toDetail={(r) => [
        {
          title: 'Specification',
          rows: [
            { label: 'Item ID', value: r.code },
            { label: 'Item Name', value: r.name },
            { label: 'Brand', value: dash(r.brand?.name) },
            { label: 'Model', value: dash(r.model?.name) },
            { label: 'OEM', value: dash(r.oem) },
            { label: 'Warranty', value: warrantyLabel(r.warranty_months) },
            { label: 'Country of Manufacturer', value: dash(r.country_of_manufacture?.name) },
            { label: 'Country of Origin', value: dash(r.country_of_origin?.name) },
            { label: 'Category', value: dash(r.category?.name) },
            { label: 'Unit', value: dash(r.unit?.name) },
            { label: 'Procurement Year', value: dash(r.procurement_year) },
            { label: 'Status', value: <StatusText status={r.status} /> },
            { label: 'Created', value: fmtDateTime(r.created_at) },
          ],
        },
      ]}
      minTableWidth={1500}
    />
  )
}
