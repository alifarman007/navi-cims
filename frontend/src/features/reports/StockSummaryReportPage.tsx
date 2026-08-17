/** Report > Stock Summary: current stock balance by store / item with low-stock flag; Excel export. */
import { useMemo } from 'react'
import type { ColumnDef } from '@tanstack/react-table'
import { fmtDateTime, fmtNumber } from '@/lib/utils'
import { optionSources, reportsApi, type StockReportFilters, type StockSummaryRow } from './api'
import { FilterCheckbox, FilterSelect, ReportLayout, mergedFilters, useReportQuery } from './ReportLayout'

const DEFAULTS: StockReportFilters = { store_id: null, item_id: null, category_id: null, low_only: false }

export function StockLevelText({ low }: { low: boolean }) {
  return low ? <span className="font-medium text-action-delete">Low</span> : <span className="font-medium text-status-active">OK</span>
}

export const stockColumns: ColumnDef<StockSummaryRow, unknown>[] = [
  { id: 'store', header: 'Store', accessorFn: (r) => r.store?.name, meta: { sortKey: 'store', filterKey: 'store' } },
  { id: 'item_code', header: 'Item ID', accessorFn: (r) => r.item?.code, meta: { sortKey: 'item_code', filterKey: 'item_code', width: 140 } },
  { id: 'item', header: 'Item Name', accessorFn: (r) => r.item?.name, meta: { sortKey: 'item', filterKey: 'item' } },
  { id: 'category', header: 'Category', accessorFn: (r) => r.item?.category?.name ?? '--', meta: { sortKey: 'category', filterKey: 'category' } },
  { id: 'unit', header: 'Unit', accessorFn: (r) => r.item?.unit?.name ?? '--', meta: { sortKey: 'unit', width: 120 } },
  {
    id: 'quantity',
    header: 'Quantity',
    accessorFn: (r) => r.quantity,
    cell: ({ row }) => fmtNumber(row.original.quantity, 3),
    meta: { sortKey: 'quantity', align: 'right', width: 130 },
  },
  {
    id: 'low_stock_threshold',
    header: 'Low Stock Threshold',
    accessorFn: (r) => r.low_stock_threshold,
    cell: ({ row }) => fmtNumber(row.original.low_stock_threshold, 3),
    meta: { sortKey: 'low_stock_threshold', align: 'right', width: 190 },
  },
  {
    id: 'is_low',
    header: 'Stock Level',
    accessorFn: (r) => r.is_low,
    cell: ({ row }) => <StockLevelText low={row.original.is_low} />,
    meta: { width: 130 },
  },
  {
    id: 'last_updated',
    header: 'Last Updated',
    accessorFn: (r) => r.last_updated,
    cell: ({ row }) => fmtDateTime(row.original.last_updated),
    meta: { sortKey: 'last_updated', width: 190 },
  },
]

export default function StockSummaryReportPage() {
  const rq = useReportQuery<StockReportFilters, StockSummaryRow>({
    queryKey: 'reports-stock-summary',
    defaults: DEFAULTS,
    fetch: (q, f) => reportsApi.stockSummary(q, f),
    defaultSort: 'store:asc',
  })

  const filters = useMemo(
    () => (
      <>
        <FilterSelect label="Store" value={rq.draft.store_id} onChange={(v) => rq.setField('store_id', v)} source={optionSources.stores} />
        <FilterSelect label="Item" value={rq.draft.item_id} onChange={(v) => rq.setField('item_id', v)} source={optionSources.items} />
        <FilterSelect label="Category" value={rq.draft.category_id} onChange={(v) => rq.setField('category_id', v)} source={optionSources.categories} />
        <FilterCheckbox label="Low stock only" checked={!!rq.draft.low_only} onChange={(v) => rq.setField('low_only', v)} />
      </>
    ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [rq.draft],
  )

  return (
    <ReportLayout<StockSummaryRow>
      listTitle="Stock Summary Report"
      filters={filters}
      onApply={rq.apply}
      onReset={rq.reset}
      onExport={() =>
        reportsApi.export('/reports/stock-summary', rq.table.query, mergedFilters(rq.applied as Record<string, unknown>, rq.table.state.filters))
      }
      exportName="stock_summary"
      columns={stockColumns}
      data={rq.query.data}
      loading={rq.query.isFetching}
      table={rq.table}
      rowKey={(r) => r.id}
      minTableWidth={1300}
    />
  )
}
