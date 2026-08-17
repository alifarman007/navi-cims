import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { Controller, useForm, type DefaultValues, type FieldValues, type Path, type Resolver } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import type { ZodTypeAny } from 'zod'
import type { ColumnDef } from '@tanstack/react-table'
import { CheckCircle2, Eraser, X } from 'lucide-react'
import { CollapsibleCard, Fieldset, FormActions, FormField, FormGrid, ListCard } from '@/components/ui/Form'
import { Button } from '@/components/ui/Button'
import { DateInput, Input, PasswordInput, Select, Textarea, YearSelect, type SelectOption } from '@/components/ui/Input'
import { StatusRadio } from '@/components/ui/Checkbox'
import { AsyncSelect } from '@/components/ui/AsyncSelect'
import { DataTable } from '@/components/ui/DataTable'
import { ConfirmDialog, DetailModal, type DetailSection } from '@/components/ui/Modal'
import { RowAction, RowActions } from '@/components/ui/RowActions'
import { Badge } from '@/components/ui/Misc'
import { useTableState } from '@/hooks/useTableState'
import { useCrud } from '@/hooks/useCrud'
import { useAuthStore } from '@/app/store/auth'
import type { CrudApi } from '@/api/crud'
import type { IdLabel, ModuleCode } from '@/types/api'
import { cn } from '@/lib/utils'

/* ------------------------------------------------------------------ field spec */
export type FieldType =
  | 'text'
  | 'email'
  | 'phone'
  | 'number'
  | 'password'
  | 'textarea'
  | 'select'
  | 'asyncSelect'
  | 'date'
  | 'year'
  | 'status'
  | 'custom'

export interface FieldSpec<TForm extends FieldValues> {
  name: Path<TForm>
  label: string
  type: FieldType
  required?: boolean
  placeholder?: string
  options?: SelectOption[] // for 'select'
  /** for 'asyncSelect' */
  optionsQueryKey?: readonly unknown[]
  fetchOptions?: () => Promise<IdLabel[]>
  colSpan?: 1 | 2 | 3
  hint?: string
  min?: number
  max?: number
  step?: number | string
  disabled?: boolean | ((mode: 'create' | 'edit') => boolean)
  /** show only when predicate on current values passes */
  visible?: (values: TForm) => boolean
  /** custom renderer for 'custom' */
  render?: (p: { value: unknown; onChange: (v: unknown) => void; invalid: boolean; mode: 'create' | 'edit' }) => ReactNode
  /** hide entirely in create or edit mode */
  onlyIn?: 'create' | 'edit'
}

/* ------------------------------------------------------------------ crud page props */
export interface CrudPageProps<TRead extends { id: number }, TForm extends FieldValues, TWrite = TForm> {
  /** card header title (Figma: "Brand", "Create Item", …) */
  title: string
  /** list card title (Figma: "Brand List") */
  listTitle: string
  module: ModuleCode
  queryKey: string
  api: CrudApi<TRead, TWrite>
  fields: FieldSpec<TForm>[]
  schema: ZodTypeAny
  defaultValues: DefaultValues<TForm>
  columns: ColumnDef<TRead, unknown>[]
  /** map an existing row into form values (edit mode) */
  toForm: (row: TRead) => TForm
  /** map form values into API payload (default identity) */
  toPayload?: (values: TForm) => TWrite
  /** sections for the "Item Details" view modal */
  toDetail?: (row: TRead) => DetailSection[]
  detailTitle?: string
  cols?: 2 | 3
  /** row-level extras (e.g. approve icon) */
  extraActions?: (row: TRead, helpers: { refresh: () => void }) => ReactNode
  /** hide the built-in actions */
  hideActions?: Partial<Record<'view' | 'edit' | 'delete', boolean>>
  /** initial sort */
  defaultSort?: string
  /** additional toolbar buttons in the list card */
  toolbar?: ReactNode
  /** label used in the delete confirmation ("You want to delete this Brand!") */
  entityLabel?: string
  minTableWidth?: number
  /** called after a successful save (create/update) */
  onSaved?: (row: TRead, mode: 'create' | 'edit') => void
  /** optional content rendered above the form fields (e.g. mode banner) */
  formHeader?: ReactNode
  /** whether the form card is shown at all (some pages are list-only) */
  showForm?: boolean
}

/**
 * The Figma master-data page: CollapsibleCard form (fieldset grid + Clear All/Save) above a ListCard DataTable
 * with View (DetailModal) / Edit (loads the form) / Delete (ConfirmDialog) actions.
 */
export function CrudPage<TRead extends { id: number }, TForm extends FieldValues, TWrite = TForm>(
  props: CrudPageProps<TRead, TForm, TWrite>,
) {
  const {
    title,
    listTitle,
    module,
    queryKey,
    api,
    fields,
    schema,
    defaultValues,
    columns,
    toForm,
    toPayload,
    toDetail,
    detailTitle = 'Item Details',
    cols = 2,
    extraActions,
    hideActions,
    defaultSort,
    toolbar,
    entityLabel,
    minTableWidth,
    onSaved,
    formHeader,
    showForm = true,
  } = props

  const hasPermission = useAuthStore((s) => s.hasPermission)
  const canAdd = hasPermission(module, 'add')
  const canEdit = hasPermission(module, 'edit')
  const canDelete = hasPermission(module, 'delete')
  const canView = hasPermission(module, 'view')

  const crud = useCrud<TRead, TWrite>(queryKey, api)
  const table = useTableState({ sort: defaultSort })
  const list = crud.useList(table.query)
  const create = crud.useCreate()
  const update = crud.useUpdate()
  const remove = crud.useRemove()

  const [mode, setMode] = useState<'create' | 'edit'>('create')
  const [editing, setEditing] = useState<TRead | null>(null)
  const [viewing, setViewing] = useState<TRead | null>(null)
  const [deleting, setDeleting] = useState<TRead | null>(null)
  const topRef = useRef<HTMLDivElement>(null)

  const form = useForm<TForm>({
    resolver: zodResolver(schema) as unknown as Resolver<TForm>,
    defaultValues,
    mode: 'onTouched',
  })
  const values = form.watch()

  const resetToCreate = () => {
    setMode('create')
    setEditing(null)
    form.reset(defaultValues)
  }

  const startEdit = (row: TRead) => {
    setMode('edit')
    setEditing(row)
    form.reset(toForm(row) as DefaultValues<TForm>)
    topRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const onSubmit = form.handleSubmit(async (vals) => {
    const payload = (toPayload ? toPayload(vals) : (vals as unknown as TWrite)) as TWrite
    if (mode === 'edit' && editing) {
      const row = await update.mutateAsync({ id: editing.id, data: payload as Partial<TWrite> })
      onSaved?.(row, 'edit')
    } else {
      const row = await create.mutateAsync(payload)
      onSaved?.(row, 'create')
    }
    resetToCreate()
  })

  useEffect(() => {
    // if the row being edited disappears from the list after a refetch, keep the form (user may still save)
  }, [list.data])

  const visibleFields = useMemo(
    () => fields.filter((f) => (!f.onlyIn || f.onlyIn === mode) && (!f.visible || f.visible(values as TForm))),
    [fields, mode, values],
  )

  const saving = create.isPending || update.isPending
  const showActions = !(hideActions?.view && hideActions?.edit && hideActions?.delete) || !!extraActions

  return (
    <div className="flex flex-col gap-[30px]" ref={topRef}>
      {showForm && (canAdd || canEdit) && (
        <CollapsibleCard
          title={title}
          actions={
            mode === 'edit' && editing ? (
              <div className="flex items-center gap-3">
                <Badge tone="orange">Editing #{editing.id}</Badge>
                <button type="button" onClick={resetToCreate} className="inline-flex items-center gap-1 text-sm text-ink-cell hover:text-primary">
                  <X size={14} /> Cancel edit
                </button>
              </div>
            ) : undefined
          }
        >
          <form onSubmit={onSubmit} noValidate>
            {formHeader}
            <Fieldset>
              <FormGrid cols={cols}>
                {visibleFields.map((f) => {
                  const err = (form.formState.errors as Record<string, { message?: string } | undefined>)[f.name]?.message
                  const disabled = typeof f.disabled === 'function' ? f.disabled(mode) : f.disabled
                  const span = f.colSpan === 3 ? 'md:col-span-2 xl:col-span-3' : f.colSpan === 2 ? 'md:col-span-2' : ''
                  return (
                    <FormField key={f.name} label={f.label} required={f.required} error={err} hint={f.hint} className={span} htmlFor={f.name}>
                      <Controller
                        control={form.control}
                        name={f.name}
                        render={({ field }) => renderField(f, field, !!err, mode, disabled)}
                      />
                    </FormField>
                  )
                })}
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
        <DataTable<TRead>
          title={listTitle}
          toolbar={toolbar}
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
          minWidth={minTableWidth}
          rowKey={(r) => r.id}
          actions={
            showActions
              ? (row) => (
                  <RowActions>
                    {!hideActions?.view && toDetail && canView && <RowAction kind="view" onClick={() => setViewing(row)} />}
                    {!hideActions?.edit && canEdit && <RowAction kind="edit" onClick={() => startEdit(row)} />}
                    {extraActions?.(row, { refresh: crud.invalidate })}
                    {!hideActions?.delete && canDelete && <RowAction kind="delete" onClick={() => setDeleting(row)} />}
                  </RowActions>
                )
              : undefined
          }
        />
      </ListCard>

      {toDetail && (
        <DetailModal open={!!viewing} onClose={() => setViewing(null)} title={detailTitle} sections={viewing ? toDetail(viewing) : []} />
      )}

      <ConfirmDialog
        open={!!deleting}
        onClose={() => setDeleting(null)}
        tone="danger"
        message={`You want to delete this ${entityLabel ?? 'record'}!`}
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

/* ------------------------------------------------------------------ field renderer */
function renderField<TForm extends FieldValues>(
  f: FieldSpec<TForm>,
  field: { value: unknown; onChange: (v: unknown) => void; onBlur: () => void; name: string; ref: (i: unknown) => void },
  invalid: boolean,
  mode: 'create' | 'edit',
  disabled?: boolean,
) {
  const common = { id: field.name, name: field.name, onBlur: field.onBlur, invalid, disabled }
  const strVal = field.value === null || field.value === undefined ? '' : String(field.value)
  switch (f.type) {
    case 'textarea':
      return <Textarea {...common} value={strVal} onChange={(e) => field.onChange(e.target.value)} placeholder={f.placeholder ?? '-'} />
    case 'password':
      return <PasswordInput {...common} value={strVal} onChange={(e) => field.onChange(e.target.value)} placeholder={f.placeholder ?? '-'} autoComplete="new-password" />
    case 'number':
      return (
        <Input
          {...common}
          type="number"
          inputMode="decimal"
          min={f.min}
          max={f.max}
          step={f.step ?? 'any'}
          value={strVal}
          onChange={(e) => field.onChange(e.target.value === '' ? null : Number(e.target.value))}
          placeholder={f.placeholder ?? '-'}
        />
      )
    case 'select':
      return (
        <Select
          {...common}
          options={f.options ?? []}
          value={strVal}
          placeholder={f.placeholder ?? '--'}
          onChange={(e) => {
            const v = e.target.value
            const opt = (f.options ?? []).find((o) => String(o.value) === v)
            field.onChange(v === '' ? null : typeof opt?.value === 'number' ? Number(v) : v)
          }}
        />
      )
    case 'asyncSelect':
      return (
        <AsyncSelect
          {...common}
          queryKey={f.optionsQueryKey ?? [f.name, 'options']}
          fetchOptions={f.fetchOptions ?? (() => Promise.resolve([]))}
          value={strVal}
          placeholder={f.placeholder ?? '--'}
          onChange={(e) => field.onChange(e.target.value === '' ? null : Number(e.target.value))}
        />
      )
    case 'date':
      return <DateInput {...common} value={strVal} onChange={(e) => field.onChange(e.target.value || null)} />
    case 'year':
      return <YearSelect {...common} value={strVal} onChange={(e) => field.onChange(e.target.value === '' ? null : Number(e.target.value))} />
    case 'status':
      return <StatusRadio value={(field.value as 'active' | 'inactive') ?? 'active'} onChange={field.onChange} disabled={disabled} name={field.name} />
    case 'custom':
      return <>{f.render?.({ value: field.value, onChange: field.onChange, invalid, mode })}</>
    case 'email':
      return <Input {...common} type="email" value={strVal} onChange={(e) => field.onChange(e.target.value)} placeholder={f.placeholder ?? '-'} autoComplete="off" />
    case 'phone':
      return <Input {...common} type="tel" value={strVal} onChange={(e) => field.onChange(e.target.value)} placeholder={f.placeholder ?? '-'} autoComplete="off" />
    default:
      return <Input {...common} type="text" value={strVal} onChange={(e) => field.onChange(e.target.value)} placeholder={f.placeholder ?? '-'} autoComplete="off" />
  }
}

export function cell(v: unknown): ReactNode {
  return v === null || v === undefined || v === '' ? '--' : (v as ReactNode)
}

export const cnCell = cn
