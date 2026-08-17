/**
 * Figma "Assign Permission" matrix (Role Permission create/edit):
 * header strip #E3E8FF (select-all checkbox + "Assign Permission" | Menu | Edit | List | Add | Delete | View, each with an icon),
 * one rounded row per module (alternating #F5F7FF / #E3E8FF, border rgba(166,180,237,.46), 4px gap, row-select checkbox),
 * 18px square checkboxes.
 */
import { Eye, List, Menu, SquarePen, SquarePlus, Trash2 } from 'lucide-react'
import { Checkbox } from '@/components/ui/Checkbox'
import { cn } from '@/lib/utils'
import type { PermissionAction } from '@/types/api'
import { EMPTY_FLAGS, type Matrix, type Module, type PermissionFlags } from './api'

/** Column order exactly as drawn in Figma. */
export const MATRIX_COLUMNS: { key: PermissionAction; label: string; icon: React.ReactNode }[] = [
  { key: 'menu', label: 'Menu', icon: <Menu size={18} /> },
  { key: 'edit', label: 'Edit', icon: <SquarePen size={18} /> },
  { key: 'list', label: 'List', icon: <List size={18} /> },
  { key: 'add', label: 'Add', icon: <SquarePlus size={18} /> },
  { key: 'delete', label: 'Delete', icon: <Trash2 size={18} /> },
  { key: 'view', label: 'View', icon: <Eye size={18} /> },
]

export interface PermissionMatrixProps {
  modules: Module[]
  value: Matrix
  onChange: (next: Matrix) => void
  disabled?: boolean
  className?: string
}

const flagsOf = (value: Matrix, code: string): PermissionFlags => value[code] ?? EMPTY_FLAGS
const allTrue = (f: PermissionFlags) => MATRIX_COLUMNS.every((c) => f[c.key])
const withAll = (v: boolean): PermissionFlags => ({ menu: v, list: v, view: v, add: v, edit: v, delete: v })

export function PermissionMatrix({ modules, value, onChange, disabled, className }: PermissionMatrixProps) {
  const everything = modules.length > 0 && modules.every((m) => allTrue(flagsOf(value, m.code)))

  const setAll = (v: boolean) => {
    const next: Matrix = {}
    for (const m of modules) next[m.code] = withAll(v)
    onChange(next)
  }
  const setRow = (code: string, v: boolean) => onChange({ ...value, [code]: withAll(v) })
  const setCell = (code: string, key: PermissionAction, v: boolean) =>
    onChange({ ...value, [code]: { ...flagsOf(value, code), [key]: v } })

  const grid = 'grid grid-cols-[minmax(240px,1.6fr)_repeat(6,minmax(90px,1fr))] items-center'

  return (
    <div className={cn('overflow-x-auto', className)}>
      <div className="min-w-[900px]">
        {/* header strip */}
        <div className={cn(grid, 'h-[50px] rounded-t-tag border-b border-[#9EAFF9] bg-strip px-6')}>
          <div className="flex items-center gap-3">
            <Checkbox
              aria-label="Select all permissions"
              checked={everything}
              disabled={disabled || modules.length === 0}
              onChange={(e) => setAll(e.target.checked)}
            />
            <span className="text-base font-medium text-ink-heading">Assign Permission</span>
          </div>
          {MATRIX_COLUMNS.map((c) => (
            <div key={c.key} className="flex items-center justify-center gap-2 text-ink-heading">
              <span className="text-ink-cell">{c.icon}</span>
              <span className="text-base font-medium">{c.label}</span>
            </div>
          ))}
        </div>

        {/* module rows */}
        <div className="mt-2 flex flex-col gap-1">
          {modules.map((m, i) => {
            const flags = flagsOf(value, m.code)
            const rowAll = allTrue(flags)
            return (
              <div
                key={m.code}
                className={cn(
                  grid,
                  'h-[50px] rounded-card border border-[rgba(166,180,237,0.46)] px-6',
                  i % 2 === 0 ? 'bg-zebra' : 'bg-strip',
                )}
              >
                <div className="flex items-center gap-3">
                  <Checkbox
                    aria-label={`Select all ${m.name} permissions`}
                    checked={rowAll}
                    disabled={disabled}
                    onChange={(e) => setRow(m.code, e.target.checked)}
                  />
                  <span className="text-base font-medium text-ink-heading">{m.name}</span>
                </div>
                {MATRIX_COLUMNS.map((c) => (
                  <div key={c.key} className="flex items-center justify-center">
                    <Checkbox
                      aria-label={`${m.name} ${c.label}`}
                      checked={flags[c.key]}
                      disabled={disabled}
                      onChange={(e) => setCell(m.code, c.key, e.target.checked)}
                    />
                  </div>
                ))}
              </div>
            )
          })}
          {modules.length === 0 && <div className="py-6 text-center text-sm text-ink-muted">No modules found</div>}
        </div>
      </div>
    </div>
  )
}
