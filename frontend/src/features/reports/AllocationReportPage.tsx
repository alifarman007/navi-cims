/** Report > Allocation Report: allocations/sanctions by fiscal year, ship/base, store, item, status, date; Excel export. */
import { useMemo } from 'react'
import type { ColumnDef } from '@tanstack/react-table'
import { StatusText } from '@/components/ui/Misc'
import { fmtDate, fmtDateTime, fmtNumber, titleCase } from '@/lib/utils'
import { optionSources, reportsApi, type AllocationReportFilters, type AllocationReportRow } from './api'
import { FilterDate, FilterEnum, FilterSelect, ReportLayout, mergedFilters, useReportQuery } from './ReportLayout'

const DEFAULTS: AllocationReportFilters = {
  fiscal_year_id: null,
  ship_base_id: null,
  store_id: null,
  item_id: null,
  status: '',
  type: '',
  date_from: null,
  date_to: null,
}

export const ALLOCATION_STATUS_OPTIONS = [
  { value: 'pending', label: 'Pending' },
  { value: 'approved', label: 'Approved' },
  { value: 'sent_back', label: 'Sent Back' },
  { value: 'cancelled', label: 'Cancelled' },
]
const TYPE_OPTIONS = [
  { value: 'allocation', label: 'Allocation' },
  { value: 'sanction', label: 'Sanction' },
]

const columns: ColumnDef<AllocationReportRow, unknown>[] = [
  { id: 'code', header: 'ID', accessorKey: 'code', meta: { sortKey: 'code', filterKey: 'code', width: 130 } },
  {
    id: 'type',
    header: 'Type',
    accessorKey: 'type',
    cell: ({ getValue }) => titleCase(String(getValue() ?? '')),
    meta: { sortKey: 'type', filterKey: 'type', filterOptions: TYPE_OPTIONS, width: 140 },
  },
  { id: 'fiscal_year', header: 'Fiscal Year', accessorFn: (r) => r.fiscal_year?.name, meta: { sortKey: 'fiscal_year', filterKey: 'fiscal_year', width: 140 } },
  { id: 'date', header: 'Date', accessorFn: (r) => r.date, cell: ({ row }) => fmtDate(row.original.date), meta: { sortKey: 'date', width: 130 } },
  { id: 'store', header: 'Store', accessorFn: (r) => r.store?.name, meta: { sortKey: 'store', filterKey: 'store' } },
  { id: 'item', header: 'Item', accessorFn: (r) => (r.item ? `${r.item.code} - ${r.item.name}` : '--'), meta: { sortKey: 'item', filterKey: 'item' } },
  { id: 'ship_base', header: 'Ship/Base', accessorFn: (r) => r.ship_base?.name, meta: { sortKey: 'ship_base', filterKey: 'ship_base' } },
  { id: 'quantity', header: 'Qty', accessorFn: (r) => r.quantity, cell: ({ row }) => fmtNumber(row.original.quantity, 3), meta: { sortKey: 'quantity', align: 'right', width: 110 } },
  {
    id: 'status',
    header: 'Status',
    accessorKey: 'status',
    cell: ({ getValue }) => <StatusText status={String(getValue())} />,
    meta: { sortKey: 'status', filterKey: 'status', filterOptions: ALLOCATION_STATUS_OPTIONS, width: 140 },
  },
  { id: 'approved_by', header: 'Approved By', accessorFn: (r) => r.approved_by?.full_name ?? '--', meta: { width: 170 } },
  { id: 'approved_at', header: 'Approved At', accessorFn: (r) => r.approved_at, cell: ({ row }) => fmtDateTime(row.original.approved_at), meta: { sortKey: 'approved_at', width: 190 } },
]

export default function AllocationReportPage() {
  const rq = useReportQuery<AllocationReportFilters, AllocationReportRow>({
    queryKey: 'reports-allocations',
    defaults: DEFAULTS,
    fetch: (q, f) => reportsApi.allocations(q, f),
    defaultSort: 'date:desc',
  })

  const filters = useMemo(
    () => (
      <>
        <FilterSelect label="Fiscal Year" value={rq.draft.fiscal_year_id} onChange={(v) => rq.setField('fiscal_year_id', v)} source={optionSources.fiscalYears} />
        <FilterSelect label="Ship/Base" value={rq.draft.ship_base_id} onChange={(v) => rq.setField('ship_base_id', v)} source={optionSources.shipBases} />
        <FilterSelect label="Store" value={rq.draft.store_id} onChange={(v) => rq.setField('store_id', v)} source={optionSources.stores} />
        <FilterSelect label="Item" value={rq.draft.item_id} onChange={(v) => rq.setField('item_id', v)} source={optionSources.items} />
        <FilterEnum label="Type" value={rq.draft.type} onChange={(v) => rq.setField('type', (v ?? '') as AllocationReportFilters['type'])} options={TYPE_OPTIONS} />
        <FilterEnum label="Status" value={rq.draft.status} onChange={(v) => rq.setField('status', (v ?? '') as AllocationReportFilters['status'])} options={ALLOCATION_STATUS_OPTIONS} />
        <FilterDate label="Date From" value={rq.draft.date_from} onChange={(v) => rq.setField('date_from', v)} />
        <FilterDate label="Date To" value={rq.draft.date_to} onChange={(v) => rq.setField('date_to', v)} />
      </>
    ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [rq.draft],
  )

  return (
    <ReportLayout<AllocationReportRow>
      listTitle="Allocation Report"
      filters={filters}
      onApply={rq.apply}
      onReset={rq.reset}
      onExport={() =>
        reportsApi.export('/reports/allocations', rq.table.query, mergedFilters(rq.applied as Record<string, unknown>, rq.table.state.filters))
      }
      exportName="allocations"
      columns={columns}
      data={rq.query.data}
      loading={rq.query.isFetching}
      table={rq.table}
      rowKey={(r) => r.id}
      minTableWidth={1500}
    />
  )
}
