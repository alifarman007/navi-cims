/** Report > Low Stock: stocks whose quantity is at/below their low-stock threshold; Excel export. */
import { useMemo } from 'react'
import type { ColumnDef } from '@tanstack/react-table'
import { fmtNumber } from '@/lib/utils'
import { optionSources, reportsApi, type StockReportFilters, type StockSummaryRow } from './api'
import { FilterSelect, ReportLayout, mergedFilters, useReportQuery } from './ReportLayout'
import { stockColumns } from './StockSummaryReportPage'

const DEFAULTS: StockReportFilters = { store_id: null, item_id: null, category_id: null }

const columns: ColumnDef<StockSummaryRow, unknown>[] = [
  ...stockColumns.filter((c) => c.id !== 'is_low'),
  {
    id: 'shortfall',
    header: 'Shortfall',
    accessorFn: (r) => Number(r.low_stock_threshold ?? 0) - Number(r.quantity),
    cell: ({ row }) => {
      const s = Number(row.original.low_stock_threshold ?? 0) - Number(row.original.quantity)
      return <span className="font-medium text-action-delete">{fmtNumber(s, 3)}</span>
    },
    meta: { align: 'right', width: 130 },
  },
]

export default function LowStockReportPage() {
  const rq = useReportQuery<StockReportFilters, StockSummaryRow>({
    queryKey: 'reports-low-stock',
    defaults: DEFAULTS,
    fetch: (q, f) => reportsApi.lowStock(q, f),
    defaultSort: 'quantity:asc',
  })

  const filters = useMemo(
    () => (
      <>
        <FilterSelect label="Store" value={rq.draft.store_id} onChange={(v) => rq.setField('store_id', v)} source={optionSources.stores} />
        <FilterSelect label="Item" value={rq.draft.item_id} onChange={(v) => rq.setField('item_id', v)} source={optionSources.items} />
        <FilterSelect label="Category" value={rq.draft.category_id} onChange={(v) => rq.setField('category_id', v)} source={optionSources.categories} />
      </>
    ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [rq.draft],
  )

  return (
    <ReportLayout<StockSummaryRow>
      listTitle="Low Stock Report"
      filters={filters}
      onApply={rq.apply}
      onReset={rq.reset}
      onExport={() =>
        reportsApi.export('/reports/low-stock', rq.table.query, mergedFilters(rq.applied as Record<string, unknown>, rq.table.state.filters))
      }
      exportName="low_stock"
      columns={columns}
      data={rq.query.data}
      loading={rq.query.isFetching}
      table={rq.table}
      rowKey={(r) => r.id}
      minTableWidth={1300}
      emptyTitle="No low-stock items"
    />
  )
}
