/**
 * Allocation/Sanction (Figma 01_Allocation/Sanction): CollapsibleCard form (3 cols) + "Allocation/Sanction List"
 * with View / Edit (pending & sent-back only) / Approve (check-circle → "You want to Approve this !") /
 * Cancel / Resubmit / Delete. Same building blocks as CrudPage, composed here because row actions depend on
 * the workflow status of each row.
 */
import { useMemo, useRef, useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import type { ColumnDef } from '@tanstack/react-table'
import { useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'
import { CheckCircle2, Eraser, X } from 'lucide-react'
import { CollapsibleCard, Fieldset, FormActions, FormField, FormGrid, ListCard } from '@/components/ui/Form'
import { Button } from '@/components/ui/Button'
import { DateInput, Input, Select, Textarea } from '@/components/ui/Input'
import { AsyncSelect } from '@/components/ui/AsyncSelect'
import { DataTable } from '@/components/ui/DataTable'
import { ConfirmDialog, DetailModal } from '@/components/ui/Modal'
import { RowAction, RowActions } from '@/components/ui/RowActions'
import { Badge, StatusText } from '@/components/ui/Misc'
import { useTableState } from '@/hooks/useTableState'
import { useCrud } from '@/hooks/useCrud'
import { useAuthStore } from '@/app/store/auth'
import { errorMessage, fmtDate, fmtNumber, titleCase } from '@/lib/utils'
import type { AllocationStatus } from '@/types/api'
import {
  ALLOCATION_STATUS_OPTIONS,
  ALLOCATION_TYPE_OPTIONS,
  allocationActions,
  allocationsApi,
  optionFetchers,
  type Allocation,
  type AllocationInput,
} from './api'
import { allocationSections } from './AllocationDetail'

const schema = z.object({
  code: z.string().trim().min(1, 'ID is required').max(50),
  allocation_type: z.enum(['allocation', 'sanction'], { message: 'Type is required' }),
  fiscal_year_id: z.number({ message: 'Fiscal Year is required' }).int().positive('Fiscal Year is required'),
  allocation_date: z.string().min(1, 'Date is required'),
  store_id: z.number({ message: 'Store is required' }).int().positive('Store is required'),
  item_id: z.number({ message: 'Item is required' }).int().positive('Item is required'),
  ship_base_id: z.number({ message: 'Ship/Base is required' }).int().positive('Ship/Base is required'),
  quantity: z.number({ message: 'Allocation Qty is required' }).positive('Allocation Qty must be greater than 0'),
  remarks: z.string().trim().max(500).optional().or(z.literal('')),
})
type FormValues = z.infer<typeof schema>

const today = () => new Date().toISOString().slice(0, 10)
const defaultValues = (): FormValues => ({
  code: '',
  allocation_type: 'allocation',
  fiscal_year_id: undefined as unknown as number,
  allocation_date: today(),
  store_id: undefined as unknown as number,
  item_id: undefined as unknown as number,
  ship_base_id: undefined as unknown as number,
  quantity: undefined as unknown as number,
  remarks: '',
})

const EDITABLE: AllocationStatus[] = ['pending', 'sent_back']

const columns: ColumnDef<Allocation, unknown>[] = [
  { id: 'code', header: 'ID', accessorKey: 'code', meta: { sortKey: 'code', filterKey: 'code' } },
  {
    id: 'allocation_type',
    header: 'Type',
    accessorKey: 'allocation_type',
    cell: ({ getValue }) => titleCase(getValue<string>()),
    meta: { sortKey: 'allocation_type', filterKey: 'allocation_type', filterOptions: ALLOCATION_TYPE_OPTIONS, width: 130 },
  },
  {
    id: 'fiscal_year',
    header: 'Fiscal Year',
    accessorFn: (r) => r.fiscal_year?.name ?? '--',
    meta: { sortKey: 'fiscal_year', filterKey: 'fiscal_year', width: 130 },
  },
  {
    id: 'allocation_date',
    header: 'Date',
    accessorFn: (r) => fmtDate(r.allocation_date),
    meta: { sortKey: 'allocation_date', filterKey: 'allocation_date', width: 130 },
  },
  { id: 'store', header: 'Store', accessorFn: (r) => r.store?.name ?? '--', meta: { sortKey: 'store', filterKey: 'store' } },
  { id: 'item', header: 'Item', accessorFn: (r) => r.item?.name ?? '--', meta: { sortKey: 'item', filterKey: 'item' } },
  { id: 'ship_base', header: 'Ship/Base', accessorFn: (r) => r.ship_base?.name ?? '--', meta: { sortKey: 'ship_base', filterKey: 'ship_base' } },
  {
    id: 'quantity',
    header: 'Allocation Qty',
    accessorFn: (r) => fmtNumber(r.quantity, 3),
    meta: { sortKey: 'quantity', filterKey: 'quantity', width: 140 },
  },
  {
    id: 'status',
    header: 'Status',
    accessorKey: 'status',
    cell: ({ getValue }) => <StatusText status={getValue<AllocationStatus>()} />,
    meta: { sortKey: 'status', filterKey: 'status', filterOptions: ALLOCATION_STATUS_OPTIONS, width: 130 },
  },
]

export default function AllocationPage() {
  const hasPermission = useAuthStore((s) => s.hasPermission)
  const me = useAuthStore((s) => s.user)
  const canAdd = hasPermission('allocation_sanction', 'add')
  const canEdit = hasPermission('allocation_sanction', 'edit')
  const canDelete = hasPermission('allocation_sanction', 'delete')
  const canView = hasPermission('allocation_sanction', 'view')
  const canApprove = hasPermission('compilation_verification', 'edit')
  const isAdmin = !!me && (me.is_superuser || me.user_type === 'super_admin' || me.user_type === 'admin')

  const crud = useCrud<Allocation, AllocationInput>('allocations', allocationsApi)
  const table = useTableState()
  const list = crud.useList(table.query)
  const create = crud.useCreate()
  const update = crud.useUpdate()
  const remove = crud.useRemove()

  const [mode, setMode] = useState<'create' | 'edit'>('create')
  const [editing, setEditing] = useState<Allocation | null>(null)
  const [viewing, setViewing] = useState<Allocation | null>(null)
  const [deleting, setDeleting] = useState<Allocation | null>(null)
  const [approving, setApproving] = useState<Allocation | null>(null)
  const [cancelling, setCancelling] = useState<Allocation | null>(null)
  const [resubmitting, setResubmitting] = useState<Allocation | null>(null)
  const topRef = useRef<HTMLDivElement>(null)

  const form = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: defaultValues(), mode: 'onTouched' })

  const resetToCreate = () => {
    setMode('create')
    setEditing(null)
    form.reset(defaultValues())
  }
  const startEdit = (row: Allocation) => {
    setMode('edit')
    setEditing(row)
    form.reset({
      code: row.code,
      allocation_type: row.allocation_type,
      fiscal_year_id: row.fiscal_year_id,
      allocation_date: row.allocation_date,
      store_id: row.store_id,
      item_id: row.item_id,
      ship_base_id: row.ship_base_id,
      quantity: Number(row.quantity),
      remarks: row.remarks ?? '',
    })
    topRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const onSubmit = form.handleSubmit(async (v) => {
    const payload: AllocationInput = { ...v, remarks: v.remarks ? v.remarks : null }
    if (mode === 'edit' && editing) await update.mutateAsync({ id: editing.id, data: payload })
    else await create.mutateAsync(payload)
    resetToCreate()
  })

  const useAction = (fn: (id: number) => Promise<Allocation>, ok: string, done: () => void) =>
    useMutation({
      mutationFn: fn,
      onSuccess: () => {
        toast.success(ok)
        crud.invalidate()
        done()
      },
      onError: (e) => toast.error(errorMessage(e)),
    })
  const approve = useAction((id) => allocationActions.approve(id), 'Allocation approved', () => setApproving(null))
  const cancel = useAction((id) => allocationActions.cancel(id), 'Allocation cancelled', () => setCancelling(null))
  const resubmit = useAction((id) => allocationActions.resubmit(id), 'Allocation resubmitted', () => setResubmitting(null))

  const saving = create.isPending || update.isPending
  const errs = form.formState.errors
  const canCancelRow = (row: Allocation) => EDITABLE.includes(row.status) && (isAdmin || row.created_by_id === me?.id)
  const canResubmitRow = (row: Allocation) => row.status === 'sent_back' && (canEdit || row.created_by_id === me?.id)

  const fyKey = useMemo(() => ['fiscal-years', 'options'] as const, [])

  return (
    <div className="flex flex-col gap-[30px]" ref={topRef}>
      {(canAdd || canEdit) && (
        <CollapsibleCard
          title="Allocation/Sanction"
          actions={
            mode === 'edit' && editing ? (
              <div className="flex items-center gap-3">
                <Badge tone="orange">Editing {editing.code}</Badge>
                <button type="button" onClick={resetToCreate} className="inline-flex items-center gap-1 text-sm text-ink-cell hover:text-primary">
                  <X size={14} /> Cancel edit
                </button>
              </div>
            ) : undefined
          }
        >
          <form onSubmit={onSubmit} noValidate>
            <Fieldset>
              <FormGrid cols={3}>
                <FormField label="ID" required error={errs.code?.message} htmlFor="code">
                  <Controller control={form.control} name="code" render={({ field }) => <Input id="code" {...field} invalid={!!errs.code} autoComplete="off" />} />
                </FormField>
                <FormField label="Type" required error={errs.allocation_type?.message} htmlFor="allocation_type">
                  <Controller
                    control={form.control}
                    name="allocation_type"
                    render={({ field }) => (
                      <Select id="allocation_type" options={ALLOCATION_TYPE_OPTIONS} value={field.value ?? ''} onChange={(e) => field.onChange(e.target.value || null)} onBlur={field.onBlur} invalid={!!errs.allocation_type} />
                    )}
                  />
                </FormField>
                <FormField label="Fiscal Year" required error={errs.fiscal_year_id?.message} htmlFor="fiscal_year_id">
                  <Controller
                    control={form.control}
                    name="fiscal_year_id"
                    render={({ field }) => (
                      <AsyncSelect id="fiscal_year_id" queryKey={fyKey} fetchOptions={optionFetchers.fiscalYears} value={field.value ?? ''} onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : null)} onBlur={field.onBlur} invalid={!!errs.fiscal_year_id} />
                    )}
                  />
                </FormField>
                <FormField label="Date" required error={errs.allocation_date?.message} htmlFor="allocation_date">
                  <Controller control={form.control} name="allocation_date" render={({ field }) => <DateInput id="allocation_date" value={field.value ?? ''} onChange={(e) => field.onChange(e.target.value)} onBlur={field.onBlur} invalid={!!errs.allocation_date} />} />
                </FormField>
                <FormField label="Store" required error={errs.store_id?.message} htmlFor="store_id">
                  <Controller
                    control={form.control}
                    name="store_id"
                    render={({ field }) => (
                      <AsyncSelect id="store_id" queryKey={['stores', 'options']} fetchOptions={optionFetchers.stores} value={field.value ?? ''} onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : null)} onBlur={field.onBlur} invalid={!!errs.store_id} />
                    )}
                  />
                </FormField>
                <FormField label="Item" required error={errs.item_id?.message} htmlFor="item_id">
                  <Controller
                    control={form.control}
                    name="item_id"
                    render={({ field }) => (
                      <AsyncSelect id="item_id" queryKey={['items', 'options']} fetchOptions={optionFetchers.items} value={field.value ?? ''} onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : null)} onBlur={field.onBlur} invalid={!!errs.item_id} />
                    )}
                  />
                </FormField>
                <FormField label="Ship/Base" required error={errs.ship_base_id?.message} htmlFor="ship_base_id">
                  <Controller
                    control={form.control}
                    name="ship_base_id"
                    render={({ field }) => (
                      <AsyncSelect id="ship_base_id" queryKey={['ship-bases', 'options']} fetchOptions={optionFetchers.shipBases} value={field.value ?? ''} onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : null)} onBlur={field.onBlur} invalid={!!errs.ship_base_id} />
                    )}
                  />
                </FormField>
                <FormField label="Allocation Qty" required error={errs.quantity?.message} htmlFor="quantity">
                  <Controller
                    control={form.control}
                    name="quantity"
                    render={({ field }) => (
                      <Input id="quantity" type="number" inputMode="decimal" min={0} step="any" value={field.value ?? ''} onChange={(e) => field.onChange(e.target.value === '' ? null : Number(e.target.value))} onBlur={field.onBlur} invalid={!!errs.quantity} />
                    )}
                  />
                </FormField>
                <FormField label="Remarks" error={errs.remarks?.message} htmlFor="remarks">
                  <Controller control={form.control} name="remarks" render={({ field }) => <Textarea id="remarks" value={field.value ?? ''} onChange={(e) => field.onChange(e.target.value)} onBlur={field.onBlur} rows={1} className="min-h-[40px]" />} />
                </FormField>
              </FormGrid>
            </Fieldset>
            <FormActions>
              <Button type="button" variant="clear" icon={<Eraser size={18} />} onClick={resetToCreate} disabled={saving}>
                Clear All
              </Button>
              <Button type="submit" variant="primary" icon={<CheckCircle2 size={16} />} loading={saving} disabled={mode === 'edit' ? !canEdit : !canAdd}>
                Save
              </Button>
            </FormActions>
          </form>
        </CollapsibleCard>
      )}

      <ListCard>
        <DataTable<Allocation>
          title="Allocation/Sanction List"
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
          minWidth={1400}
          rowKey={(r) => r.id}
          actionsWidth={200}
          actions={(row) => (
            <RowActions>
              {canView && <RowAction kind="view" onClick={() => setViewing(row)} />}
              {canEdit && EDITABLE.includes(row.status) && <RowAction kind="edit" onClick={() => startEdit(row)} />}
              {canApprove && row.status === 'pending' && <RowAction kind="approve" onClick={() => setApproving(row)} />}
              {canResubmitRow(row) && <RowAction kind="forward" title="Resubmit" onClick={() => setResubmitting(row)} />}
              {canCancelRow(row) && <RowAction kind="reject" title="Cancel allocation" onClick={() => setCancelling(row)} />}
              {canDelete && EDITABLE.includes(row.status) && <RowAction kind="delete" onClick={() => setDeleting(row)} />}
            </RowActions>
          )}
        />
      </ListCard>

      <DetailModal open={!!viewing} onClose={() => setViewing(null)} title="Allocation Details" sections={viewing ? allocationSections(viewing) : []} />

      <ConfirmDialog
        open={!!approving}
        onClose={() => setApproving(null)}
        tone="approve"
        message="You want to Approve this !"
        loading={approve.isPending}
        onConfirm={() => approving && approve.mutate(approving.id)}
      />
      <ConfirmDialog
        open={!!cancelling}
        onClose={() => setCancelling(null)}
        tone="warning"
        message="You want to cancel this allocation!"
        loading={cancel.isPending}
        onConfirm={() => cancelling && cancel.mutate(cancelling.id)}
      />
      <ConfirmDialog
        open={!!resubmitting}
        onClose={() => setResubmitting(null)}
        tone="approve"
        message="You want to resubmit this allocation for verification!"
        loading={resubmit.isPending}
        onConfirm={() => resubmitting && resubmit.mutate(resubmitting.id)}
      />
      <ConfirmDialog
        open={!!deleting}
        onClose={() => setDeleting(null)}
        tone="danger"
        message="You want to delete this Allocation!"
        loading={remove.isPending}
        onConfirm={async () => {
          if (!deleting) return
          await remove.mutateAsync(deleting.id)
          if (editing?.id === deleting.id) resetToCreate()
          setDeleting(null)
        }}
      />
    </div>
  )
}
