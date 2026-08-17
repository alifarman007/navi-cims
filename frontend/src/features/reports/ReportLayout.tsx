/**
 * Shared shell for the Report module pages: a "Filters" CollapsibleCard (selects / dates + Apply / Reset /
 * Export Excel) above a ListCard DataTable with server pagination + sorting (same design language as the
 * master-data pages). `useReportQuery` keeps draft vs applied filters and the table state together.
 */
import { useCallback, useMemo, useState, type ReactNode } from 'react'
import { useQuery, keepPreviousData } from '@tanstack/react-query'
import { toast } from 'sonner'
import type { ColumnDef } from '@tanstack/react-table'
import { FileSpreadsheet, RotateCcw, Search } from 'lucide-react'
import { CollapsibleCard, FormField, FormGrid, Fieldset, ListCard } from '@/components/ui/Form'
import { Button } from '@/components/ui/Button'
import { DataTable } from '@/components/ui/DataTable'
import { AsyncSelect } from '@/components/ui/AsyncSelect'
import { DateInput, Select, type SelectOption } from '@/components/ui/Input'
import { Checkbox } from '@/components/ui/Checkbox'
import { useTableState } from '@/hooks/useTableState'
import { useAuthStore } from '@/app/store/auth'
import { downloadBlob, errorMessage } from '@/lib/utils'
import type { IdLabel, ListQuery, Page } from '@/types/api'
import { cleanParams, exportFileName } from './api'

/* ------------------------------------------------------------------ hook */
export function useReportQuery<TFilters extends object, TRow>(opts: {
  queryKey: string
  defaults: TFilters
  fetch: (q: ListQuery, filters: TFilters) => Promise<Page<TRow>>
  defaultSort?: string
  enabled?: boolean
}) {
  const { queryKey, defaults, fetch, defaultSort, enabled = true } = opts
  const [draft, setDraft] = useState<TFilters>(defaults)
  const [applied, setApplied] = useState<TFilters>(defaults)
  const table = useTableState({ sort: defaultSort })

  const setField = useCallback(<K extends keyof TFilters>(key: K, value: TFilters[K]) => {
    setDraft((d) => ({ ...d, [key]: value }))
  }, [])

  const apply = useCallback(() => {
    setApplied(draft)
    table.setPage(1)
  }, [draft, table])

  const reset = useCallback(() => {
    setDraft(defaults)
    setApplied(defaults)
    table.reset()
    if (defaultSort) table.setSort(defaultSort)
  }, [defaults, defaultSort, table])

  const query = useQuery({
    queryKey: [queryKey, 'report', table.query, applied],
    queryFn: () => fetch(table.query, applied),
    placeholderData: keepPreviousData,
    enabled,
  })

  const isDirty = useMemo(() => JSON.stringify(draft) !== JSON.stringify(applied), [draft, applied])

  return { draft, setField, setDraft, apply, reset, applied, table, query, isDirty }
}

/* ------------------------------------------------------------------ filter controls */
export function FilterSelect({
  label,
  value,
  onChange,
  source,
  placeholder = 'All',
}: {
  label: string
  value: number | null | undefined
  onChange: (v: number | null) => void
  source: { key: readonly unknown[]; fetch: () => Promise<IdLabel[]> }
  placeholder?: string
}) {
  return (
    <FormField label={label}>
      <AsyncSelect
        queryKey={source.key}
        fetchOptions={source.fetch}
        value={value ?? ''}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value === '' ? null : Number(e.target.value))}
        aria-label={label}
      />
    </FormField>
  )
}

export function FilterEnum({
  label,
  value,
  onChange,
  options,
  placeholder = 'All',
}: {
  label: string
  value: string | null | undefined
  onChange: (v: string | null) => void
  options: SelectOption[]
  placeholder?: string
}) {
  return (
    <FormField label={label}>
      <Select options={options} value={value ?? ''} placeholder={placeholder} onChange={(e) => onChange(e.target.value || null)} aria-label={label} />
    </FormField>
  )
}

export function FilterDate({ label, value, onChange }: { label: string; value: string | null | undefined; onChange: (v: string | null) => void }) {
  return (
    <FormField label={label}>
      <DateInput value={value ?? ''} onChange={(e) => onChange(e.target.value || null)} aria-label={label} />
    </FormField>
  )
}

export function FilterCheckbox({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex h-full flex-col justify-end pb-2.5">
      <Checkbox label={label} checked={checked} onChange={(e) => onChange(e.target.checked)} />
    </div>
  )
}

/* ------------------------------------------------------------------ layout */
export interface ReportLayoutProps<TRow> {
  listTitle: string
  /** filter controls (rendered inside a Fieldset grid) */
  filters: ReactNode
  cols?: 2 | 3
  onApply: () => void
  onReset: () => void
  /** export handler: receives nothing, returns a Blob (already filtered/sorted) */
  onExport?: () => Promise<Blob>
  exportName?: string
  columns: ColumnDef<TRow, unknown>[]
  data: Page<TRow> | undefined
  loading?: boolean
  table: ReturnType<typeof useTableState>
  rowKey?: (row: TRow, i: number) => string | number
  minTableWidth?: number
  toolbar?: ReactNode
  emptyTitle?: string
}

export function ReportLayout<TRow>({
  listTitle,
  filters,
  cols = 3,
  onApply,
  onReset,
  onExport,
  exportName = 'report',
  columns,
  data,
  loading,
  table,
  rowKey,
  minTableWidth = 1100,
  toolbar,
  emptyTitle,
}: ReportLayoutProps<TRow>) {
  const hasPermission = useAuthStore((s) => s.hasPermission)
  const canExport = hasPermission('report', 'view') || hasPermission('report', 'list')
  const [exporting, setExporting] = useState(false)

  const doExport = async () => {
    if (!onExport) return
    setExporting(true)
    try {
      const blob = await onExport()
      downloadBlob(blob, exportFileName(exportName))
      toast.success('Excel file downloaded')
    } catch (e) {
      toast.error(errorMessage(e, 'Export failed'))
    } finally {
      setExporting(false)
    }
  }

  return (
    <div className="flex flex-col gap-[30px]">
      <CollapsibleCard title="Filters">
        <form
          noValidate
          onSubmit={(e) => {
            e.preventDefault()
            onApply()
          }}
        >
          <Fieldset>
            <FormGrid cols={cols}>{filters}</FormGrid>
          </Fieldset>
          <div className="mt-6 flex flex-wrap items-center justify-end gap-4">
            <Button type="button" variant="outline" iconLeft={<RotateCcw size={16} />} onClick={onReset}>
              Reset
            </Button>
            <Button type="submit" variant="primary" iconLeft={<Search size={16} />}>
              Apply
            </Button>
          </div>
        </form>
      </CollapsibleCard>

      <ListCard>
        <DataTable<TRow>
          title={listTitle}
          toolbar={
            <>
              {toolbar}
              {onExport && canExport && (
                <Button type="button" variant="alt" size="sm" className="h-10 px-4" iconLeft={<FileSpreadsheet size={16} />} loading={exporting} onClick={doExport}>
                  Export Excel
                </Button>
              )}
            </>
          }
          columns={columns}
          data={data?.items ?? []}
          loading={loading}
          page={data?.page ?? table.state.page}
          pageSize={table.state.pageSize}
          total={data?.total ?? 0}
          pages={data?.pages ?? 0}
          onPageChange={table.setPage}
          onPageSizeChange={table.setPageSize}
          sort={table.state.sort}
          onSortChange={table.setSort}
          filters={table.state.filters}
          onFilterChange={table.setFilter}
          minWidth={minTableWidth}
          rowKey={rowKey}
          emptyTitle={emptyTitle}
        />
      </ListCard>
    </div>
  )
}

/** Merge table + explicit filters into a params object (used for export). */
export function mergedFilters(filters: Record<string, unknown>, tableFilters: Record<string, string>) {
  const f = Object.entries(tableFilters)
    .filter(([, v]) => v && v.trim() !== '')
    .map(([k, v]) => `${k}:${v.trim()}`)
  return { ...cleanParams(filters), ...(f.length ? { filter: f } : {}) }
}
