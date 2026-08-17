import { useMemo, useState, type ReactNode } from 'react'
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  type ColumnDef,
  type VisibilityState,
  type RowData,
} from '@tanstack/react-table'
import { ArrowDownUp, ArrowDown, ArrowUp, Search, ChevronDown } from 'lucide-react'
import { cn, serial } from '@/lib/utils'
import { Pagination } from './Pagination'
import { Checkbox } from './Checkbox'
import { Popover, Spinner, EmptyState } from './Misc'

declare module '@tanstack/react-table' {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface ColumnMeta<TData extends RowData, TValue> {
    /** server sort key (enables sort icon) */
    sortKey?: string
    /** server filter key (enables filter input under the header) */
    filterKey?: string
    /** filter input type — text (default) or select with options */
    filterOptions?: { value: string; label: string }[]
    width?: number | string
    align?: 'left' | 'center' | 'right'
    /** hide from column chooser (e.g. SL / Action) */
    fixed?: boolean
    className?: string
  }
}

export interface DataTableProps<T> {
  columns: ColumnDef<T, unknown>[]
  data: T[]
  loading?: boolean
  /** server pagination */
  page: number
  pageSize: number
  total: number
  pages: number
  onPageChange: (p: number) => void
  onPageSizeChange: (s: number) => void
  /** server sort "field:asc|desc" */
  sort?: string
  onSortChange?: (sort?: string) => void
  /** server filters {filterKey: value} */
  filters?: Record<string, string>
  onFilterChange?: (key: string, value: string) => void
  /** action cell renderer → adds the "Action" column */
  actions?: (row: T) => ReactNode
  actionsWidth?: number
  showSerial?: boolean
  emptyTitle?: string
  className?: string
  /** optional title rendered on the toolbar row (Figma: "Brand List" left, Columns chooser right) */
  title?: ReactNode
  /** extra toolbar content rendered left of the Columns chooser */
  toolbar?: ReactNode
  toolbarLeft?: ReactNode
  showColumnsChooser?: boolean
  rowKey?: (row: T, index: number) => string | number
  minWidth?: number
}

/**
 * Figma list table: header strip #E3E8FF (16px Medium #3C3C3C, sort icon), a filter row directly under
 * the header (search inputs; "--" under SL/Action), zebra rows (#F5F7FF), row h48, cell 14px Medium #4B5563,
 * Action column with icon buttons, pagination bar. Sorting/filtering/pagination are SERVER-side.
 */
export function DataTable<T>({
  columns,
  data,
  loading,
  page,
  pageSize,
  total,
  pages,
  onPageChange,
  onPageSizeChange,
  sort,
  onSortChange,
  filters = {},
  onFilterChange,
  actions,
  actionsWidth = 150,
  showSerial = true,
  emptyTitle,
  className,
  title,
  toolbar,
  toolbarLeft,
  showColumnsChooser = true,
  rowKey,
  minWidth = 900,
}: DataTableProps<T>) {
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})

  const allColumns = useMemo<ColumnDef<T, unknown>[]>(() => {
    const cols: ColumnDef<T, unknown>[] = []
    if (showSerial) {
      cols.push({
        id: '__sl',
        header: 'SL',
        cell: ({ row }) => serial(row.index, page, pageSize),
        meta: { width: 60, fixed: true },
      })
    }
    cols.push(...columns)
    if (actions) {
      cols.push({
        id: '__actions',
        header: 'Action',
        cell: ({ row }) => actions(row.original),
        meta: { width: actionsWidth, align: 'center', fixed: true },
      })
    }
    return cols
  }, [columns, actions, actionsWidth, page, pageSize, showSerial])

  const table = useReactTable({
    data,
    columns: allColumns,
    state: { columnVisibility },
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
    manualSorting: true,
    manualFiltering: true,
    manualPagination: true,
  })

  const [sortField, sortDir] = (sort ?? '').split(':')
  const hasFilterRow = table.getVisibleLeafColumns().some((c) => c.columnDef.meta?.filterKey)

  return (
    <div className={cn('w-full', className)}>
      {(title || toolbarLeft || toolbar || showColumnsChooser) && (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            {title && <h3 className="text-lg font-medium text-ink-heading">{title}</h3>}
            {toolbarLeft}
          </div>
          <div className="flex items-center gap-3">
            {toolbar}
            {showColumnsChooser && (
            <ColumnsChooser
              columns={table
                .getAllLeafColumns()
                .filter((c) => !c.columnDef.meta?.fixed)
                .map((c) => ({
                  id: c.id,
                  label: typeof c.columnDef.header === 'string' ? c.columnDef.header : c.id,
                  visible: c.getIsVisible(),
                  toggle: () => c.toggleVisibility(),
                }))}
            />
            )}
          </div>
        </div>
      )}

      <div className="relative overflow-x-auto rounded-card border border-black/[0.08]">
        <table className="w-full border-collapse text-left" style={{ minWidth }}>
          <thead>
            {table.getHeaderGroups().map((hg) => (
              <tr key={hg.id} className="bg-strip">
                {hg.headers.map((h) => {
                  const meta = h.column.columnDef.meta
                  const sk = meta?.sortKey
                  const active = sk && sortField === sk
                  return (
                    <th
                      key={h.id}
                      style={{ width: meta?.width }}
                      className={cn(
                        'h-[50px] border-b border-strip-border px-5 py-1 text-base font-medium tracking-[0.5px] text-ink-heading first:rounded-tl-tag last:rounded-tr-tag',
                        meta?.align === 'center' && 'text-center',
                        meta?.align === 'right' && 'text-right',
                      )}
                    >
                      {h.isPlaceholder ? null : (
                        <button
                          type="button"
                          disabled={!sk || !onSortChange}
                          onClick={() => {
                            if (!sk || !onSortChange) return
                            if (!active) onSortChange(`${sk}:asc`)
                            else if (sortDir === 'asc') onSortChange(`${sk}:desc`)
                            else onSortChange(undefined)
                          }}
                          className={cn(
                            'inline-flex items-center gap-2 whitespace-nowrap',
                            meta?.align === 'center' && 'justify-center',
                            sk && onSortChange ? 'cursor-pointer' : 'cursor-default',
                          )}
                        >
                          {flexRender(h.column.columnDef.header, h.getContext())}
                          {sk && onSortChange && (
                            <span className="text-[#282828]">
                              {active ? (
                                sortDir === 'asc' ? <ArrowUp size={16} /> : <ArrowDown size={16} />
                              ) : (
                                <ArrowDownUp size={16} />
                              )}
                            </span>
                          )}
                        </button>
                      )}
                    </th>
                  )
                })}
              </tr>
            ))}
            {hasFilterRow && (
              <tr className="bg-white">
                {table.getVisibleLeafColumns().map((col) => {
                  const meta = col.columnDef.meta
                  const fk = meta?.filterKey
                  return (
                    <td key={col.id} className="h-14 border-b border-line px-5 py-2 align-middle">
                      {fk && onFilterChange ? (
                        meta?.filterOptions ? (
                          <div className="relative">
                            <select
                              value={filters[fk] ?? ''}
                              onChange={(e) => onFilterChange(fk, e.target.value)}
                              className="h-9 w-full appearance-none rounded-tag border border-line-filter bg-white pl-3 pr-7 text-sm text-ink-cell"
                              aria-label={`Filter ${fk}`}
                            >
                              <option value="">All</option>
                              {meta.filterOptions.map((o) => (
                                <option key={o.value} value={o.value}>
                                  {o.label}
                                </option>
                              ))}
                            </select>
                            <ChevronDown size={14} className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-ink-cell" />
                          </div>
                        ) : (
                          <div className="relative">
                            <Search size={15} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-[#292D32]" />
                            <input
                              value={filters[fk] ?? ''}
                              onChange={(e) => onFilterChange(fk, e.target.value)}
                              className="table-filter-input"
                              aria-label={`Filter ${fk}`}
                            />
                          </div>
                        )
                      ) : (
                        <span className={cn('block font-modal text-sm text-ink-placeholder', meta?.align === 'center' && 'text-center')}>--</span>
                      )}
                    </td>
                  )
                })}
              </tr>
            )}
          </thead>
          <tbody>
            {loading && data.length === 0 ? (
              <tr>
                <td colSpan={table.getVisibleLeafColumns().length} className="py-12 text-center">
                  <Spinner className="mx-auto" />
                </td>
              </tr>
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={table.getVisibleLeafColumns().length}>
                  <EmptyState title={emptyTitle} />
                </td>
              </tr>
            ) : (
              table.getRowModel().rows.map((row, i) => (
                <tr
                  key={rowKey ? rowKey(row.original, i) : row.id}
                  className={cn('h-row border-b border-line last:border-b-0', i % 2 === 0 ? 'bg-zebra' : 'bg-white', loading && 'opacity-60')}
                >
                  {row.getVisibleCells().map((cell) => {
                    const meta = cell.column.columnDef.meta
                    return (
                      <td
                        key={cell.id}
                        className={cn(
                          'px-5 py-1 text-sm font-medium tracking-[0.5px] text-ink-cell',
                          meta?.align === 'center' && 'text-center',
                          meta?.align === 'right' && 'text-right',
                          meta?.className,
                        )}
                      >
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    )
                  })}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Pagination
        page={page}
        pageSize={pageSize}
        total={total}
        pages={pages}
        onPageChange={onPageChange}
        onPageSizeChange={onPageSizeChange}
      />
    </div>
  )
}

/** "Columns ⌄" chooser (Figma: white button, border rgba(0,0,0,.1), r4, 143 wide). */
export function ColumnsChooser({
  columns,
}: {
  columns: { id: string; label: string; visible: boolean; toggle: () => void }[]
}) {
  return (
    <Popover
      align="right"
      className="p-2"
      trigger={({ toggle }) => (
        <button
          type="button"
          onClick={toggle}
          className="inline-flex h-10 w-[143px] items-center justify-between rounded-[4px] border border-black/10 bg-white px-4 text-sm text-ink-heading hover:bg-gray-50"
        >
          Columns
          <ChevronDown size={18} className="text-ink-cell" />
        </button>
      )}
    >
      <div className="max-h-72 w-52 overflow-y-auto">
        {columns.map((c) => (
          <div key={c.id} className="flex items-center rounded px-2 py-1.5 hover:bg-zebra">
            <Checkbox label={c.label} checked={c.visible} onChange={c.toggle} />
          </div>
        ))}
      </div>
    </Popover>
  )
}
