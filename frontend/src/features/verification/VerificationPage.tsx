/**
 * Compilation/Verification (Figma 01_Compilation/Verification): CollapsibleCard form (ID auto, Allocation Id*,
 * Approver, Comment) whose Save APPROVES the selected pending allocation (POST /verifications), above the
 * "Compilation/Verification List". The list is the allocation queue (GET /allocations) seen from the verifier's
 * side: ID = verification code (once acted), Allocation Id, Approver, Status, Date; row actions View / Edit
 * (load a pending allocation into the form) / Demand Back (comment dialog → POST /allocations/{id}/send-back) /
 * Delete (admin: remove a sent-back verification record).
 */
import { useRef, useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import type { ColumnDef } from '@tanstack/react-table'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { CheckCircle2, Eraser } from 'lucide-react'
import { CollapsibleCard, Fieldset, FormActions, FormField, FormGrid, ListCard } from '@/components/ui/Form'
import { Button } from '@/components/ui/Button'
import { Input, Textarea } from '@/components/ui/Input'
import { AsyncSelect } from '@/components/ui/AsyncSelect'
import { DataTable } from '@/components/ui/DataTable'
import { CommentDialog, ConfirmDialog, DetailModal } from '@/components/ui/Modal'
import { RowAction, RowActions } from '@/components/ui/RowActions'
import { StatusText } from '@/components/ui/Misc'
import { useTableState } from '@/hooks/useTableState'
import { useAuthStore } from '@/app/store/auth'
import { errorMessage, fmtDateTime } from '@/lib/utils'
import type { AllocationStatus } from '@/types/api'
import { ALLOCATION_STATUS_OPTIONS } from '@/features/allocation/api'
import { allocationSections, latestVerification } from '@/features/allocation/AllocationDetail'
import { allocationActions, allocationsApi, optionFetchers, verificationsApi, type Allocation } from './api'

const schema = z.object({
  allocation_id: z.number({ message: 'Allocation Id is required' }).int().positive('Allocation Id is required'),
  approver_id: z.number().int().positive().nullable().optional(),
  comment: z.string().trim().max(500).optional().or(z.literal('')),
})
type FormValues = z.infer<typeof schema>

const columns: ColumnDef<Allocation, unknown>[] = [
  { id: 'verification_code', header: 'ID', accessorFn: (r) => latestVerification(r)?.code ?? '--', meta: { width: 160 } },
  { id: 'code', header: 'Allocation Id', accessorKey: 'code', meta: { sortKey: 'code', filterKey: 'code' } },
  {
    id: 'approver',
    header: 'Approver',
    accessorFn: (r) => latestVerification(r)?.approver?.full_name ?? r.approved_by?.full_name ?? '--',
  },
  { id: 'item', header: 'Item', accessorFn: (r) => r.item?.name ?? '--', meta: { sortKey: 'item', filterKey: 'item' } },
  { id: 'ship_base', header: 'Ship/Base', accessorFn: (r) => r.ship_base?.name ?? '--', meta: { sortKey: 'ship_base', filterKey: 'ship_base' } },
  {
    id: 'status',
    header: 'Status',
    accessorKey: 'status',
    cell: ({ getValue }) => <StatusText status={getValue<AllocationStatus>()} />,
    meta: { sortKey: 'status', filterKey: 'status', filterOptions: ALLOCATION_STATUS_OPTIONS, width: 130 },
  },
  { id: 'acted_at', header: 'Date', accessorFn: (r) => fmtDateTime(latestVerification(r)?.acted_at ?? r.approved_at), meta: { width: 170 } },
]

export default function VerificationPage() {
  const hasPermission = useAuthStore((s) => s.hasPermission)
  const me = useAuthStore((s) => s.user)
  const canAdd = hasPermission('compilation_verification', 'add')
  const canEdit = hasPermission('compilation_verification', 'edit')
  const canView = hasPermission('compilation_verification', 'view')
  const canDelete = hasPermission('compilation_verification', 'delete')
  const isAdmin = !!me && (me.is_superuser || me.user_type === 'super_admin' || me.user_type === 'admin')

  const qc = useQueryClient()
  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['allocations'] })
    qc.invalidateQueries({ queryKey: ['verifications'] })
  }

  const table = useTableState()
  const list = useQuery({ queryKey: ['allocations', 'list', 'verification', table.query], queryFn: () => allocationsApi.list(table.query) })

  const [viewing, setViewing] = useState<Allocation | null>(null)
  const [sendingBack, setSendingBack] = useState<Allocation | null>(null)
  const [deleting, setDeleting] = useState<Allocation | null>(null)
  const topRef = useRef<HTMLDivElement>(null)

  const defaults = (): FormValues => ({ allocation_id: undefined as unknown as number, approver_id: me?.id ?? null, comment: '' })
  const form = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: defaults(), mode: 'onTouched' })
  const errs = form.formState.errors
  const meOption = me ? [{ id: me.id, label: `${me.username} - ${me.full_name}` }] : []

  const save = useMutation({
    mutationFn: (v: FormValues) =>
      verificationsApi.create({ allocation_id: v.allocation_id, approver_id: v.approver_id ?? null, comment: v.comment || null, action: 'approved' }),
    onSuccess: () => {
      toast.success('Allocation approved')
      invalidate()
      form.reset(defaults())
    },
    onError: (e) => toast.error(errorMessage(e)),
  })
  const sendBack = useMutation({
    mutationFn: ({ id, comment }: { id: number; comment: string }) => allocationActions.sendBack(id, comment),
    onSuccess: () => {
      toast.success('Allocation sent back')
      invalidate()
      setSendingBack(null)
    },
    onError: (e) => toast.error(errorMessage(e)),
  })
  const removeVer = useMutation({
    mutationFn: (id: number) => verificationsApi.remove(id),
    onSuccess: () => {
      toast.success('Deleted successfully')
      invalidate()
      setDeleting(null)
    },
    onError: (e) => toast.error(errorMessage(e)),
  })

  const onSubmit = form.handleSubmit((v) => save.mutate(v))
  const pickForApproval = (row: Allocation) => {
    form.reset({ ...defaults(), allocation_id: row.id })
    topRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }
  const deletableVerification = (row: Allocation) => {
    const v = latestVerification(row)
    return v && v.action === 'sent_back' && isAdmin && canDelete ? v : undefined
  }

  return (
    <div className="flex flex-col gap-[30px]" ref={topRef}>
      {canAdd && (
        <CollapsibleCard title="Compilation/Verification">
          <form onSubmit={onSubmit} noValidate>
            <Fieldset>
              <FormGrid cols={2}>
                <FormField label="ID" required htmlFor="verification_code" hint="Generated automatically on save (VRF-00001, …)">
                  <Input id="verification_code" value="" placeholder="Auto" disabled readOnly />
                </FormField>
                <FormField label="Allocation Id" required error={errs.allocation_id?.message} htmlFor="allocation_id">
                  <Controller
                    control={form.control}
                    name="allocation_id"
                    render={({ field }) => (
                      <AsyncSelect
                        id="allocation_id"
                        queryKey={['allocations', 'options', 'pending']}
                        fetchOptions={() => allocationActions.options('pending')}
                        placeholder="-- Select a pending allocation --"
                        value={field.value ?? ''}
                        onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : null)}
                        onBlur={field.onBlur}
                        invalid={!!errs.allocation_id}
                      />
                    )}
                  />
                </FormField>
                <FormField label="Approver" error={errs.approver_id?.message} htmlFor="approver_id">
                  <Controller
                    control={form.control}
                    name="approver_id"
                    render={({ field }) => (
                      <AsyncSelect
                        id="approver_id"
                        queryKey={['users', 'options']}
                        fetchOptions={optionFetchers.users}
                        extra={meOption}
                        value={field.value ?? ''}
                        onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : null)}
                        onBlur={field.onBlur}
                        invalid={!!errs.approver_id}
                      />
                    )}
                  />
                </FormField>
                <FormField label="Comment" error={errs.comment?.message} htmlFor="comment">
                  <Controller control={form.control} name="comment" render={({ field }) => <Textarea id="comment" value={field.value ?? ''} onChange={(e) => field.onChange(e.target.value)} onBlur={field.onBlur} rows={1} className="min-h-[40px]" />} />
                </FormField>
              </FormGrid>
            </Fieldset>
            <FormActions>
              <Button type="button" variant="clear" icon={<Eraser size={18} />} onClick={() => form.reset(defaults())} disabled={save.isPending}>
                Clear All
              </Button>
              <Button type="submit" variant="primary" icon={<CheckCircle2 size={16} />} loading={save.isPending}>
                Save
              </Button>
            </FormActions>
          </form>
        </CollapsibleCard>
      )}

      <ListCard>
        <DataTable<Allocation>
          title="Compilation/Verification List"
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
          minWidth={1100}
          rowKey={(r) => r.id}
          actionsWidth={180}
          actions={(row) => (
            <RowActions>
              {canView && <RowAction kind="view" onClick={() => setViewing(row)} />}
              {canEdit && row.status === 'pending' && <RowAction kind="edit" title="Verify" onClick={() => pickForApproval(row)} />}
              {canEdit && row.status === 'pending' && <RowAction kind="back" title="Demand Back" onClick={() => setSendingBack(row)} />}
              {deletableVerification(row) && <RowAction kind="delete" title="Delete verification" onClick={() => setDeleting(row)} />}
            </RowActions>
          )}
        />
      </ListCard>

      <DetailModal open={!!viewing} onClose={() => setViewing(null)} title="Allocation Details" sections={viewing ? allocationSections(viewing) : []} />

      <CommentDialog
        open={!!sendingBack}
        onClose={() => setSendingBack(null)}
        title="Demand Back"
        loading={sendBack.isPending}
        onConfirm={(comment) => sendingBack && sendBack.mutate({ id: sendingBack.id, comment })}
      />

      <ConfirmDialog
        open={!!deleting}
        onClose={() => setDeleting(null)}
        tone="danger"
        message="You want to delete this Verification!"
        loading={removeVer.isPending}
        onConfirm={() => {
          const v = deleting && deletableVerification(deleting)
          if (v) removeVer.mutate(v.id)
        }}
      />
    </div>
  )
}
