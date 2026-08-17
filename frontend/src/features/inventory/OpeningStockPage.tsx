/**
 * Inventory Management › Opening Stock (Figma 02_Inventory Management- Opening Stock merged with the Frame 7374 variant —
 * see docs/04-gap-analysis.md). Form: Store*, Item*, Opening Quantity*, Stock Entry Date*, Low stock threshold, Remarks.
 * List: SL | Item | Store | Opening Quantity | Stock Entry Date | Low stock threshold | Action.
 * Opening quantity (and store/item) are IMMUTABLE after creation — edit only changes date / threshold / remarks.
 */
import { z } from 'zod'
import type { ColumnDef } from '@tanstack/react-table'
import { format } from 'date-fns'
import { CrudPage, cell, type FieldSpec } from '@/components/crud/CrudPage'
import { fmtDate, fmtDateTime, fmtNumber } from '@/lib/utils'
import { fetchItemOptions, fetchStoreOptions, openingStocksApi, type OpeningStock, type OpeningStockInput } from './api'

const schema = z.object({
  store_id: z.number({ invalid_type_error: 'Store is required' }).int().positive('Store is required'),
  item_id: z.number({ invalid_type_error: 'Item is required' }).int().positive('Item is required'),
  quantity: z.number({ invalid_type_error: 'Opening Quantity is required' }).positive('Opening Quantity must be greater than 0'),
  entry_date: z.string().min(1, 'Stock Entry Date is required'),
  low_stock_threshold: z.number().min(0, 'Threshold cannot be negative').nullable().optional(),
  remarks: z.string().trim().max(300).optional().or(z.literal('')),
})
type FormValues = z.infer<typeof schema>

const today = () => format(new Date(), 'yyyy-MM-dd')

const fields: FieldSpec<FormValues>[] = [
  {
    name: 'store_id',
    label: 'Store',
    type: 'asyncSelect',
    required: true,
    optionsQueryKey: ['stores', 'options'],
    fetchOptions: fetchStoreOptions,
    disabled: (mode) => mode === 'edit',
  },
  {
    name: 'item_id',
    label: 'Item',
    type: 'asyncSelect',
    required: true,
    optionsQueryKey: ['items', 'options'],
    fetchOptions: fetchItemOptions,
    disabled: (mode) => mode === 'edit',
  },
  {
    name: 'quantity',
    label: 'Opening Quantity',
    type: 'number',
    required: true,
    min: 0,
    disabled: (mode) => mode === 'edit',
  },
  { name: 'entry_date', label: 'Stock Entry Date', type: 'date', required: true },
  { name: 'low_stock_threshold', label: 'Low stock threshold', type: 'number', min: 0 },
  { name: 'remarks', label: 'Remarks', type: 'text' },
]

const columns: ColumnDef<OpeningStock, unknown>[] = [
  {
    id: 'item',
    header: 'Item',
    accessorFn: (r) => r.item?.name,
    cell: ({ row }) => (row.original.item ? `${row.original.item.code ?? ''} - ${row.original.item.name}`.replace(/^ - /, '') : '--'),
    meta: { sortKey: 'item', filterKey: 'item' },
  },
  {
    id: 'store',
    header: 'Store',
    accessorFn: (r) => r.store?.name,
    cell: ({ row }) => (row.original.store ? `${row.original.store.code ?? ''} - ${row.original.store.name}`.replace(/^ - /, '') : '--'),
    meta: { sortKey: 'store', filterKey: 'store' },
  },
  {
    id: 'quantity',
    header: 'Opening Quantity',
    accessorKey: 'quantity',
    cell: ({ getValue }) => fmtNumber(getValue<string>(), 3),
    meta: { sortKey: 'quantity', filterKey: 'quantity' },
  },
  {
    id: 'entry_date',
    header: 'Stock Entry Date',
    accessorKey: 'entry_date',
    cell: ({ getValue }) => fmtDate(getValue<string>()),
    meta: { sortKey: 'entry_date', filterKey: 'entry_date' },
  },
  {
    id: 'low_stock_threshold',
    header: 'Low stock threshold',
    accessorKey: 'low_stock_threshold',
    cell: ({ getValue }) => fmtNumber(getValue<string | null>(), 3),
    meta: { sortKey: 'low_stock_threshold', filterKey: 'low_stock_threshold' },
  },
]

export default function OpeningStockPage() {
  return (
    <CrudPage<OpeningStock, FormValues, OpeningStockInput>
      title="Opening Stock"
      listTitle="Opening Stock List"
      module="inventory_management"
      queryKey="opening-stocks"
      api={openingStocksApi}
      entityLabel="Opening Stock"
      fields={fields}
      schema={schema}
      defaultValues={{ store_id: undefined, item_id: undefined, quantity: undefined, entry_date: today(), low_stock_threshold: null, remarks: '' }}
      columns={columns}
      toForm={(r) => ({
        store_id: r.store_id,
        item_id: r.item_id,
        quantity: Number(r.quantity),
        entry_date: r.entry_date,
        low_stock_threshold: r.low_stock_threshold === null || r.low_stock_threshold === undefined ? null : Number(r.low_stock_threshold),
        remarks: r.remarks ?? '',
      })}
      toPayload={(v) => ({
        store_id: v.store_id,
        item_id: v.item_id,
        quantity: v.quantity,
        entry_date: v.entry_date,
        low_stock_threshold: v.low_stock_threshold ?? null,
        remarks: v.remarks?.trim() ? v.remarks.trim() : null,
      })}
      toDetail={(r) => [
        {
          title: 'Opening Stock Info',
          rows: [
            { label: 'Store', value: r.store ? `${r.store.code ?? ''} - ${r.store.name}` : '--' },
            { label: 'Item', value: r.item ? `${r.item.code ?? ''} - ${r.item.name}` : '--' },
            { label: 'Opening Quantity', value: fmtNumber(r.quantity, 3) },
            { label: 'Stock Entry Date', value: fmtDate(r.entry_date) },
            { label: 'Low stock threshold', value: fmtNumber(r.low_stock_threshold, 3) },
            { label: 'Remarks', value: cell(r.remarks) },
            { label: 'Created', value: fmtDateTime(r.created_at) },
          ],
        },
      ]}
      minTableWidth={1000}
    />
  )
}
