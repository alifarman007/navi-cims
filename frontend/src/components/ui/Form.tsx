import type { ReactNode } from 'react'
import { ChevronRight, ChevronDown } from 'lucide-react'
import { useState } from 'react'
import { cn } from '@/lib/utils'

/** Label + required star + control + error (Figma: label 14.5px #4C4C4C, red asterisk). */
export function FormField({
  label,
  required,
  error,
  hint,
  children,
  className,
  htmlFor,
}: {
  label: string
  required?: boolean
  error?: string
  hint?: string
  children: ReactNode
  className?: string
  htmlFor?: string
}) {
  return (
    <div className={cn('flex flex-col gap-2', className)}>
      <label htmlFor={htmlFor} className="text-14.5 text-ink-label">
        {label}
        {required && <span className="ml-1 text-danger">*</span>}
      </label>
      {children}
      {error ? <p className="text-xs text-danger">{error}</p> : hint ? <p className="text-xs text-ink-muted">{hint}</p> : null}
    </div>
  )
}

/** Responsive field grid: 2 or 3 columns at desktop, gap 24 (Figma). */
export function FormGrid({ cols = 2, children, className }: { cols?: 2 | 3; children: ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        'grid grid-cols-1 gap-6',
        cols === 3 ? 'md:grid-cols-2 xl:grid-cols-3' : 'md:grid-cols-2',
        className,
      )}
    >
      {children}
    </div>
  )
}

/** Inner grey fieldset panel (#F9F8F8, border rgba(0,0,0,.08), r6, p24). */
export function Fieldset({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn('rounded-tag border border-black/[0.08] bg-fieldset p-6', className)}>{children}</div>
}

/**
 * Figma card with a collapsible header strip (#E3E8FF, h53, chevron + title 20px Medium #1C3586)
 * and a white body (border rgba(0,0,0,.1), radius 8, padding 24).
 */
export function CollapsibleCard({
  title,
  children,
  defaultOpen = true,
  actions,
  className,
  bodyClassName,
}: {
  title: ReactNode
  children: ReactNode
  defaultOpen?: boolean
  actions?: ReactNode
  className?: string
  bodyClassName?: string
}) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <section className={cn('overflow-hidden rounded-card border border-black/10 bg-white', className)}>
      <header
        className="flex h-[53px] cursor-pointer select-none items-center justify-between gap-3 border-b border-black/[0.08] bg-strip px-5"
        onClick={() => setOpen((o) => !o)}
      >
        <div className="flex items-center gap-1.5">
          {open ? (
            <ChevronDown size={24} className="text-primary" />
          ) : (
            <ChevronRight size={24} className="text-primary" />
          )}
          <h2 className="text-xl font-medium text-primary">{title}</h2>
        </div>
        {actions && <div onClick={(e) => e.stopPropagation()}>{actions}</div>}
      </header>
      {open && <div className={cn('p-6', bodyClassName)}>{children}</div>}
    </section>
  )
}

/** White list card: title (18px Medium #3C3C3C) + right-side toolbar + content. */
export function ListCard({
  title,
  toolbar,
  children,
  className,
}: {
  title?: ReactNode
  toolbar?: ReactNode
  children: ReactNode
  className?: string
}) {
  return (
    <section className={cn('rounded-card border border-black/10 bg-white px-6 pb-7 pt-5', className)}>
      {(title || toolbar) && (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          {title && <h3 className="text-lg font-medium text-ink-heading">{title}</h3>}
          {toolbar && <div className="flex items-center gap-3">{toolbar}</div>}
        </div>
      )}
      {children}
    </section>
  )
}

/** Right-aligned Clear All / Save row (Figma). */
export function FormActions({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn('mt-8 flex flex-wrap items-center justify-end gap-5', className)}>{children}</div>
}
