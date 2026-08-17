import { useEffect, useState } from 'react'
import { ChevronsLeft, ChevronLeft, ChevronRight, ChevronsRight, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'

export const PAGE_SIZES = [10, 20, 30, 40]

/**
 * Figma pagination bar:
 *  left  → "Showing 1 to 10 of 11 results" (numbers semibold)
 *  centre→ « ‹ 1 2 3 › » (36×36, r8, active #2F4086) + page-jump box "1-2" + Go
 *  right → "Rows per page" select (10/20/30/40)
 */
export function Pagination({
  page,
  pageSize,
  total,
  pages,
  onPageChange,
  onPageSizeChange,
  className,
}: {
  page: number
  pageSize: number
  total: number
  pages: number
  onPageChange: (p: number) => void
  onPageSizeChange: (s: number) => void
  className?: string
}) {
  const [jump, setJump] = useState('')
  useEffect(() => setJump(''), [page])
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1
  const to = Math.min(page * pageSize, total)
  const lastPage = Math.max(pages, 1)

  const go = (p: number) => {
    const n = Math.min(Math.max(1, p), lastPage)
    if (n !== page) onPageChange(n)
  }
  const doJump = () => {
    const n = parseInt(jump, 10)
    if (!Number.isNaN(n)) go(n)
  }

  // window of up to 3 page numbers around current (Figma shows 1 2 3)
  const start = Math.max(1, Math.min(page - 1, lastPage - 2))
  const nums = Array.from({ length: Math.min(3, lastPage) }, (_, i) => start + i)

  const atom =
    'inline-flex h-9 min-w-9 items-center justify-center rounded-card border border-black/[0.08] bg-white px-2 text-base text-[rgba(119,119,119,0.7)] transition-colors disabled:cursor-not-allowed disabled:opacity-50 hover:enabled:bg-strip'

  return (
    <div className={cn('mt-6 flex flex-wrap items-center justify-between gap-4 px-2', className)}>
      <div className="text-sm text-ink-body/80">
        Showing <b className="font-semibold text-ink-body">{from}</b> to <b className="font-semibold text-ink-body">{to}</b> of{' '}
        <b className="font-semibold text-ink-body">{total}</b> results
      </div>

      <div className="flex items-center gap-2.5">
        <button type="button" className={atom} onClick={() => go(1)} disabled={page <= 1} aria-label="First page">
          <ChevronsLeft size={18} className="text-[#939393]" />
        </button>
        <button type="button" className={atom} onClick={() => go(page - 1)} disabled={page <= 1} aria-label="Previous page">
          <ChevronLeft size={18} className="text-[#939393]" />
        </button>
        {nums.map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => go(n)}
            className={cn(atom, n === page && 'border-primary-alt bg-primary-alt text-[#F9F9F9] hover:enabled:bg-primary-alt')}
            aria-current={n === page ? 'page' : undefined}
          >
            {n}
          </button>
        ))}
        <button type="button" className={atom} onClick={() => go(page + 1)} disabled={page >= lastPage} aria-label="Next page">
          <ChevronRight size={18} className="text-[#939393]" />
        </button>
        <button type="button" className={atom} onClick={() => go(lastPage)} disabled={page >= lastPage} aria-label="Last page">
          <ChevronsRight size={18} className="text-[#939393]" />
        </button>
        <input
          value={jump}
          onChange={(e) => setJump(e.target.value.replace(/[^\d]/g, ''))}
          onKeyDown={(e) => e.key === 'Enter' && doJump()}
          placeholder={`1-${lastPage}`}
          className="h-9 w-12 rounded-card border border-black/[0.08] bg-white text-center text-sm text-ink-body placeholder:text-[rgba(119,119,119,0.7)]"
          aria-label="Go to page"
        />
        <button
          type="button"
          onClick={doJump}
          className="inline-flex h-9 items-center justify-center rounded-card bg-primary-alt px-3 text-base text-white hover:bg-primary-hover"
        >
          Go
        </button>
      </div>

      <div className="flex items-center gap-2.5 text-sm text-ink-body/80">
        <span>Rows per page</span>
        <div className="relative">
          <select
            value={pageSize}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
            className="h-[33px] w-[68px] appearance-none rounded-input border border-line-input bg-white pl-3 pr-6 text-sm text-ink-body"
            aria-label="Rows per page"
          >
            {PAGE_SIZES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          <ChevronDown size={16} className="pointer-events-none absolute right-1.5 top-1/2 -translate-y-1/2 text-ink-cell" />
        </div>
      </div>
    </div>
  )
}
