/**
 * Procurement Item Info › Procurement Items — read-only list of the BNPIMS cache with "Sync from BNPIMS".
 * View (eye) opens the Figma GRN "Item Details" popup (Specification: GRN No … Remarks).
 */
import { z } from 'zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { ColumnDef } from '@tanstack/react-table'
import { RefreshCw } from 'lucide-react'
import { toast } from 'sonner'
import { CrudPage, cell } from '@/components/crud/CrudPage'
import { Button } from '@/components/ui/Button'
import { useAuthStore } from '@/app/store/auth'
import { errorMessage, fmtDateTime, fmtNumber } from '@/lib/utils'
import { procurementItemsApi, syncProcurementItems, type ProcurementItem } from './api'

const QUERY_KEY = 'procurement-items'

const schema = z.object({})
type FormValues = z.infer<typeof schema>

const columns: ColumnDef<ProcurementItem, unknown>[] = [
  { id: 'grn_no', header: 'GRN No', accessorKey: 'grn_no', cell: ({ getValue }) => cell(getValue()), meta: { sortKey: 'grn_no', filterKey: 'grn_no', width: 140 } },
  {
    id: 'transaction_date',
    header: 'Transaction Date',
    accessorKey: 'transaction_date',
    cell: ({ getValue }) => fmtDateTime(getValue<string | null>()),
    meta: { sortKey: 'transaction_date', filterKey: 'transaction_date', width: 190 },
  },
  { id: 'imc', header: 'IMC', accessorKey: 'imc', cell: ({ getValue }) => cell(getValue()), meta: { sortKey: 'imc', filterKey: 'imc', width: 190 } },
  { id: 'item_name', header: 'Item Name', accessorKey: 'item_name', cell: ({ getValue }) => cell(getValue()), meta: { sortKey: 'item_name', filterKey: 'item_name' } },
  { id: 'deno', header: 'Deno', accessorKey: 'deno', cell: ({ getValue }) => cell(getValue()), meta: { sortKey: 'deno', filterKey: 'deno', width: 110 } },
  {
    id: 'receive_quantity',
    header: 'Receive Quantity',
    accessorKey: 'receive_quantity',
    cell: ({ getValue }) => fmtNumber(getValue<number | string | null>(), 3),
    meta: { sortKey: 'receive_quantity', filterKey: 'receive_quantity', width: 150, align: 'right' },
  },
  { id: 'part_no', header: 'Part No', accessorKey: 'part_no', cell: ({ getValue }) => cell(getValue()), meta: { sortKey: 'part_no', filterKey: 'part_no', width: 130 } },
  { id: 'remarks', header: 'Remarks', accessorKey: 'remarks', cell: ({ getValue }) => cell(getValue()), meta: { filterKey: 'remarks' } },
]

function SyncButton() {
  const qc = useQueryClient()
  const sync = useMutation({
    mutationFn: () => syncProcurementItems(),
    onSuccess: (r) => {
      toast.success(`Synced from BNPIMS: ${r.fetched} fetched, ${r.created} new, ${r.updated} updated`)
      qc.invalidateQueries({ queryKey: [QUERY_KEY] })
    },
    onError: (e) => toast.error(errorMessage(e, 'Sync failed')),
  })
  return (
    <Button variant="alt" size="sm" className="h-9 px-4 text-sm" icon={<RefreshCw size={15} className={sync.isPending ? 'animate-spin' : undefined} />} onClick={() => sync.mutate()} loading={sync.isPending}>
      Sync from BNPIMS
    </Button>
  )
}

export default function ProcurementItemsPage() {
  const canEdit = useAuthStore((s) => s.hasPermission('procurement_item_info', 'edit'))
  return (
    <CrudPage<ProcurementItem, FormValues, never>
      title="Procurement Item"
      listTitle="Procurement Item List"
      module="procurement_item_info"
      queryKey={QUERY_KEY}
      api={procurementItemsApi}
      entityLabel="Procurement Item"
      showForm={false}
      fields={[]}
      schema={schema}
      defaultValues={{}}
      columns={columns}
      toForm={() => ({})}
      hideActions={{ edit: true, delete: true }}
      defaultSort="transaction_date:desc"
      toolbar={canEdit ? <SyncButton /> : undefined}
      detailTitle="Item Details"
      toDetail={(r) => [
        {
          title: 'Specification',
          rows: [
            { label: 'GRN No', value: r.grn_no ?? '--' },
            { label: 'Transaction Date', value: fmtDateTime(r.transaction_date) },
            { label: 'IMC', value: r.imc ?? '--' },
            { label: 'Item Name', value: r.item_name ?? '--' },
            { label: 'Deno', value: r.deno ?? '--' },
            { label: 'Receive Quantity', value: fmtNumber(r.receive_quantity, 3) },
            { label: 'Part No', value: r.part_no ?? '--' },
            { label: 'Remarks', value: r.remarks ?? '--' },
          ],
        },
      ]}
      minTableWidth={1400}
    />
  )
}
