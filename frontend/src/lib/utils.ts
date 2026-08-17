import { clsx, type ClassValue } from 'clsx'
import { extendTailwindMerge } from 'tailwind-merge'
import { format, parseISO } from 'date-fns'
import type { ApiError, ListQuery } from '@/types/api'

/**
 * tailwind-merge must know our custom font-size tokens (text-13, text-14.5, text-15, text-17 in
 * tailwind.config.ts) — otherwise it classifies them as text COLOURS and drops e.g. `text-white`.
 */
const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      // custom theme keys from tailwind.config.ts — without these, tailwind-merge cannot detect conflicts
      'font-size': [{ text: ['13', '14.5', '15', '17'] }],
      w: [{ w: ['sidebar', 'content'] }],
      'max-w': [{ 'max-w': ['content'] }],
      h: [{ h: ['header', 'footer', 'input', 'btn', 'row'] }],
      pl: [{ pl: ['sidebar'] }],
      rounded: [{ rounded: ['card', 'input', 'tag'] }],
      shadow: [{ shadow: ['bar', 'modal', 'card'] }],
    },
  },
})

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** Human message from an axios/API error. */
export function errorMessage(err: unknown, fallback = 'Something went wrong'): string {
  const e = err as { response?: { data?: ApiError; status?: number }; message?: string }
  const detail = e?.response?.data?.detail
  if (typeof detail === 'string') return detail
  if (Array.isArray(detail) && detail.length) {
    return detail.map((d) => `${d.loc?.slice(-1)[0] ?? 'field'}: ${d.msg}`).join('; ')
  }
  if (e?.response?.status === 401) return 'Session expired. Please sign in again.'
  if (e?.response?.status === 403) return 'You do not have permission to do this.'
  return e?.message || fallback
}

export function fmtDate(value?: string | null, pattern = 'dd/MM/yyyy'): string {
  if (!value) return '--'
  try {
    return format(parseISO(value), pattern)
  } catch {
    return value
  }
}

export function fmtDateTime(value?: string | null): string {
  return fmtDate(value, 'dd/MM/yyyy hh:mm a')
}

export function fmtNumber(value?: number | string | null, digits = 0): string {
  if (value === null || value === undefined || value === '') return '--'
  const n = typeof value === 'string' ? Number(value) : value
  if (Number.isNaN(n)) return String(value)
  return n.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: digits })
}

export function dash(value?: string | number | null): string {
  if (value === null || value === undefined || value === '') return '--'
  return String(value)
}

/** SL number for a row given page/pageSize (01, 02, ...). */
export function serial(index: number, page: number, pageSize: number): string {
  return String((page - 1) * pageSize + index + 1).padStart(2, '0')
}

/** Build the query-string params object for list endpoints (repeatable `filter`). */
export function listParams(q: ListQuery): Record<string, unknown> {
  const params: Record<string, unknown> = {}
  if (q.page) params.page = q.page
  if (q.page_size) params.page_size = q.page_size
  if (q.sort) params.sort = q.sort
  if (q.q) params.q = q.q
  if (q.filter?.length) params.filter = q.filter
  return params
}

export function titleCase(s: string): string {
  return s.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

export const STATUS_OPTIONS = [
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
] as const

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}
