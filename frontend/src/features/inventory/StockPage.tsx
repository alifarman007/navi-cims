/**
 * Inventory Management › Stock Balance — read-only list of current balances per (store, item) in the same design
 * language as the Figma list cards. "View" opens the ledger (last stock transactions) for that balance.
 */
import { useMemo, useState } from 'react'
import { useQuery, keepPreviousData } from '@tanstack/react-query'
import type { ColumnDef } from '@tanstack/react-table'
import { Info } from 'lucide-react'
import { ListCard } from '@/components/ui/Form'
import { DataTable } from '@/components/ui/DataTable'
import { DetailModal } from '@/components/ui/Modal'
import { RowAction, RowActions } from '@/components/ui/RowActions'
import { Badge, StatusText, Spinner } from '@/components/ui/Misc'
import { useTableState } from '@/hooks/useTableState'
import { useAuthStore } from '@/app/store/auth'
import { fmtDateTime, fmtNumber, titleCase } from '@/lib/utils'
import { stockTransactionsApi, stocksApi, type Stock, type StockTransaction } from './api'

const refLabel = (r?: { code?: string | null; name: string } | null) => (r ? (r.code ? `${r.code} - ${r.name}` : r.name) : '--')

const columns: ColumnDef<Stock, unknown>[] = [
  { id: 'store', header: 'Store', accessorFn: (r) => r.store?.name, cell: ({ row }) => refLabel(row.original.store), meta: { sortKey: 'store', filterKey: 'store' } },
  { id: 'item', header: 'Item', accessorFn: (r) => r.item?.name, cell: ({ row }) => refLabel(row.original.item), meta: { sortKey: 'item', filterKey: 'item' } },
  {
    id: 'quantity',
    header: 'Quantity',
    accessorKey: 'quantity',
    cell: ({ getValue }) => fmtNumber(getValue<string>(), 3),
    meta: { sortKey: 'quantity', filterKey: 'quantity' },
  },
  {
    id: 'low_stock_threshold',
    header: 'Low stock threshold',
    accessorKey: 'low_stock_threshold',
    cell: ({ getValue }) => fmtNumber(getValue<string | null>(), 3),
    meta: { sortKey: 'low_stock_threshold', filterKey: 'low_stock_threshold' },
  },
  {
    id: 'is_low',
    header: 'Status',
    accessorKey: 'is_low',
    cell: ({ row }) => (row.original.is_low ? <Badge tone="red">Low</Badge> : <Badge tone="green">OK</Badge>),
    meta: {
      filterKey: 'is_low',
      width: 140,
      filterOptions: [
        { value: 'true', label: 'Low' },
        { value: 'false', label: 'OK' },
      ],
    },
  },
  {
    id: 'updated_at',
    header: 'Updated',
    accessorKey: 'updated_at',
    cell: ({ getValue }) => fmtDateTime(getValue<string | null>()),
    meta: { sortKey: 'updated_at', width: 190 },
  },
]

export default function StockPage() {
  const hasPermission = useAuthStore((s) => s.hasPermission)
  const canList = hasPermission('inventory_management', 'list')
  const canView = hasPermission('inventory_management', 'view')

  const table = useTableState({ sort: 'updated_at:desc' })
  const list = useQuery({
    queryKey: ['stocks', 'list', table.query],
    queryFn: () => stocksApi.list(table.query),
    placeholderData: keepPreviousData,
    enabled: canList,
  })
  const [viewing, setViewing] = useState<Stock | null>(null)

  return (
    <div className="flex flex-col gap-[30px]">
      <ListCard>
        <DataTable<Stock>
          title="Stock Balance"
          toolbar={
            <span className="inline-flex items-center gap-1.5 text-xs text-ink-muted">
              <Info size={14} className="text-primary" />
              Balances are read-only — they change only through Opening Stock entries and approved allocations.
            </span>
          }
          columns={columns}
          data={list.data?.items ?? []}
          loading={list.isFetching}
          page={list.data?.page ?? table.state.page}
          pageSize={table.state.pageSize}
          total={list.data?.total ?? 0}
          pages={list.data?.pages ?? 0}
          onPageChange={table.setPage}
          onPageSizeChange={table.setPageSize}
          sort={table.state.sort}
          onSortChange={table.setSort}
          filters={table.state.filters}
          onFilterChange={table.setFilter}
          minWidth={1000}
          rowKey={(r) => r.id}
          emptyTitle={canList ? 'No stock balances yet' : 'You do not have permission to view stock'}
          actions={
            canView
              ? (row) => (
                  <RowActions>
                    <RowAction kind="view" title="View ledger" onClick={() => setViewing(row)} />
                  </RowActions>
                )
              : undefined
          }
          actionsWidth={90}
        />
      </ListCard>

      <StockLedgerModal stock={viewing} onClose={() => setViewing(null)} />
    </div>
  )
}

/* ------------------------------------------------------------------ ledger modal */
function StockLedgerModal({ stock, onClose }: { stock: Stock | null; onClose: () => void }) {
  const txns = useQuery({
    queryKey: ['stock-transactions', 'ledger', stock?.store_id, stock?.item_id],
    queryFn: () =>
      stockTransactionsApi.list({
        page: 1,
        page_size: 20,
        sort: 'id:desc',
        filter: [`store_id:${stock!.store_id}`, `item_id:${stock!.item_id}`],
      }),
    enabled: !!stock,
  })

  const sections = useMemo(() => {
    if (!stock) return []
    return [
      {
        title: 'Stock Info',
        rows: [
          { label: 'Store', value: refLabel(stock.store) },
          { label: 'Item', value: refLabel(stock.item) },
          { label: 'Quantity', value: fmtNumber(stock.quantity, 3) },
          { label: 'Low stock threshold', value: fmtNumber(stock.low_stock_threshold, 3) },
          { label: 'Stock Status', value: stock.is_low ? <Badge tone="red">Low</Badge> : <Badge tone="green">OK</Badge> },
          { label: 'Status', value: <StatusText status={stock.status} /> },
          { label: 'Updated', value: fmtDateTime(stock.updated_at) },
        ],
      },
      {
        title: 'Ledger (last 20 transactions)',
        content: txns.isLoading ? (
          <div className="flex justify-center py-6">
            <Spinner />
          </div>
        ) : (
          <LedgerTable rows={txns.data?.items ?? []} />
        ),
      },
    ]
  }, [stock, txns.data, txns.isLoading])

  return <DetailModal open={!!stock} onClose={onClose} title="Stock Details" sections={sections} width={900} />
}

function LedgerTable({ rows }: { rows: StockTransaction[] }) {
  if (rows.length === 0) return <p className="py-4 text-center text-sm text-ink-muted">No transactions recorded.</p>
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-left text-[13px]">
        <thead>
          <tr className="bg-strip text-ink-heading">
            <th className="px-3 py-2 font-medium">Date</th>
            <th className="px-3 py-2 font-medium">Type</th>
            <th className="px-3 py-2 text-right font-medium">Change</th>
            <th className="px-3 py-2 text-right font-medium">Balance</th>
            <th className="px-3 py-2 font-medium">Source</th>
            <th className="px-3 py-2 font-medium">Reference</th>
            <th className="px-3 py-2 font-medium">Remarks</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((t, i) => {
            const delta = Number(t.quantity_delta)
            return (
              <tr key={t.id} className={i % 2 === 0 ? 'bg-zebra' : 'bg-white'}>
                <td className="whitespace-nowrap px-3 py-2 text-ink-cell">{fmtDateTime(t.created_at)}</td>
                <td className="whitespace-nowrap px-3 py-2 text-ink-cell">{titleCase(t.txn_type)}</td>
                <td className={delta < 0 ? 'px-3 py-2 text-right font-medium text-action-delete' : 'px-3 py-2 text-right font-medium text-status-active'}>
                  {delta > 0 ? '+' : ''}
                  {fmtNumber(delta, 3)}
                </td>
                <td className="px-3 py-2 text-right text-ink-cell">{fmtNumber(t.balance_after, 3)}</td>
                <td className="px-3 py-2 text-ink-cell">{t.source ? titleCase(t.source) : '--'}</td>
                <td className="px-3 py-2 text-ink-cell">{t.ref_type ? `${titleCase(t.ref_type)}${t.ref_id ? ` #${t.ref_id}` : ''}` : '--'}</td>
                <td className="px-3 py-2 text-ink-cell">{t.remarks || '--'}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
