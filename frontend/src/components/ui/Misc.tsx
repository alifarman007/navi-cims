import { useEffect, useRef, useState, type ReactNode } from 'react'
import { Loader2, Inbox } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Status } from '@/types/api'

/** Coloured status text (Figma: Active #0E9F6E, Inactive #ACACAC). */
export function StatusText({ status, className }: { status?: Status | string | null; className?: string }) {
  if (!status) return <span className="text-ink-cell">--</span>
  const s = String(status).toLowerCase()
  const cls =
    s === 'active' || s === 'approved'
      ? 'text-status-active'
      : s === 'inactive' || s === 'cancelled'
        ? 'text-status-inactive'
        : s === 'pending'
          ? 'text-accent'
          : s === 'sent_back'
            ? 'text-action-delete'
            : 'text-ink-cell'
  const label = s.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
  return <span className={cn('font-medium', cls, className)}>{label}</span>
}

export function Badge({ children, tone = 'primary', className }: { children: ReactNode; tone?: 'primary' | 'green' | 'red' | 'grey' | 'orange'; className?: string }) {
  const tones = {
    primary: 'bg-strip text-primary',
    green: 'bg-action-approveBg text-status-active',
    red: 'bg-action-deleteBg text-action-delete',
    grey: 'bg-gray-100 text-ink-cell',
    orange: 'bg-orange-50 text-accent',
  }
  return <span className={cn('inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium', tones[tone], className)}>{children}</span>
}

export function Spinner({ className, size = 20 }: { className?: string; size?: number }) {
  return <Loader2 size={size} className={cn('animate-spin text-primary', className)} />
}

export function EmptyState({ title = 'No records found', hint, className }: { title?: string; hint?: string; className?: string }) {
  return (
    <div className={cn('flex flex-col items-center justify-center gap-2 py-12 text-center', className)}>
      <Inbox size={36} className="text-ink-placeholder/40" />
      <p className="text-sm font-medium text-ink-cell">{title}</p>
      {hint && <p className="text-xs text-ink-muted">{hint}</p>}
    </div>
  )
}

/** Simple click-outside popover anchored to a trigger. */
export function Popover({
  trigger,
  children,
  align = 'right',
  className,
  open: controlledOpen,
  onOpenChange,
}: {
  trigger: (props: { open: boolean; toggle: () => void }) => ReactNode
  children: ReactNode | ((close: () => void) => ReactNode)
  align?: 'left' | 'right'
  className?: string
  open?: boolean
  onOpenChange?: (o: boolean) => void
}) {
  const [innerOpen, setInnerOpen] = useState(false)
  const open = controlledOpen ?? innerOpen
  const setOpen = (o: boolean) => {
    setInnerOpen(o)
    onOpenChange?.(o)
  }
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!open) return
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    document.addEventListener('mousedown', onDoc)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDoc)
      document.removeEventListener('keydown', onKey)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])
  return (
    <div ref={ref} className="relative inline-block">
      {trigger({ open, toggle: () => setOpen(!open) })}
      {open && (
        <div
          className={cn(
            'absolute z-40 mt-2 min-w-[180px] rounded-card border border-black/10 bg-white shadow-modal animate-scale-in',
            align === 'right' ? 'right-0' : 'left-0',
            className,
          )}
        >
          {typeof children === 'function' ? children(() => setOpen(false)) : children}
        </div>
      )}
    </div>
  )
}

/** Page-level loading block. */
export function PageLoader() {
  return (
    <div className="flex h-40 items-center justify-center">
      <Spinner size={28} />
    </div>
  )
}
