import { useEffect, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { X, Printer, TriangleAlert, BadgeCheck } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from './Button'
import { Textarea } from './Input'
import { useState } from 'react'

/* ------------------------------------------------------------------ base modal */
export function Modal({
  open,
  onClose,
  children,
  className,
  width = 792,
  closeOnBackdrop = true,
}: {
  open: boolean
  onClose: () => void
  children: ReactNode
  className?: string
  width?: number | string
  closeOnBackdrop?: boolean
}) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [open, onClose])

  if (!open) return null
  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4 animate-fade-in"
      onMouseDown={(e) => closeOnBackdrop && e.target === e.currentTarget && onClose()}
      role="dialog"
      aria-modal="true"
    >
      <div
        className={cn('max-h-[92vh] w-full overflow-hidden rounded-card bg-white shadow-modal animate-scale-in flex flex-col', className)}
        style={{ maxWidth: typeof width === 'number' ? `${width}px` : width }}
      >
        {children}
      </div>
    </div>,
    document.body,
  )
}

/* ------------------------------------------------------------ detail modal (Item Details) */
export interface DetailRow {
  label: string
  value: ReactNode
}
export interface DetailSection {
  title: string
  rows?: DetailRow[]
  content?: ReactNode
  /** rows per line (Figma "Item Info" packs 3 pairs on one line) */
  columns?: 1 | 2 | 3
}

/**
 * Figma "Item Details" popup: action bar (#E3E8FF, title Inter 600 14 #4B5563, print + close),
 * sections with a #F5F5F5 header strip (Roboto 500 18 #1C3586) and label : value rows.
 */
export function DetailModal({
  open,
  onClose,
  title = 'Item Details',
  sections,
  width = 792,
  printable = true,
  footer,
}: {
  open: boolean
  onClose: () => void
  title?: string
  sections: DetailSection[]
  width?: number
  printable?: boolean
  footer?: ReactNode
}) {
  return (
    <Modal open={open} onClose={onClose} width={width}>
      <div className="flex h-12 shrink-0 items-center justify-between rounded-t-tag border border-b-0 border-black/[0.08] bg-strip pl-6 pr-7">
        <span className="font-modal text-sm font-semibold text-ink-modal">{title}</span>
        <div className="flex items-center gap-4 text-ink-cell">
          {printable && (
            <button type="button" onClick={() => window.print()} title="Print" className="hover:text-primary no-print">
              <Printer size={17} />
            </button>
          )}
          <button type="button" onClick={onClose} aria-label="Close" className="hover:text-primary no-print">
            <X size={24} />
          </button>
        </div>
      </div>
      <div className="flex-1 space-y-4 overflow-y-auto px-[22px] py-4">
        {sections.map((s) => (
          <section key={s.title} className="rounded-b-[4px]">
            <div className="rounded-t-[4px] border border-b-0 border-[rgba(210,210,210,0.6)] bg-[#F5F5F5] px-5 py-0.5">
              <h4 className="text-lg font-medium text-primary">{s.title}</h4>
            </div>
            <div className="rounded-b-[4px] border border-[rgba(210,210,210,0.6)] pb-3 pl-5 pr-4 pt-4">
              {s.content}
              {s.rows && (
                <dl className={cn('grid gap-x-8', s.columns === 3 ? 'grid-cols-3' : s.columns === 2 ? 'grid-cols-2' : 'grid-cols-1')}>
                  {s.rows.map((r, i) => (
                    <div
                      key={i}
                      className="flex gap-2 border-b border-primary/5 py-[3px] text-[12px] leading-5 tracking-[0.5px] text-[#121212] last:border-b-0"
                    >
                      <dt className="w-[190px] shrink-0">{r.label}</dt>
                      <dd className="min-w-0 flex-1 break-words">: {r.value ?? '--'}</dd>
                    </div>
                  ))}
                </dl>
              )}
            </div>
          </section>
        ))}
      </div>
      {footer && <div className="shrink-0 border-t border-black/[0.08] bg-[#F3F4F6] px-6 py-3">{footer}</div>}
    </Modal>
  )
}

/* -------------------------------------------------------------- confirm dialog */
export type ConfirmTone = 'warning' | 'approve' | 'danger'

/**
 * Figma "Are you sure?" dialog (548 wide): big icon, Roboto 500 32 #575555 title,
 * Roboto 18 #474141 message, Yes (#1C3586) + Cancel (#A49C9C).
 */
export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title = 'Are you sure?',
  message,
  tone = 'warning',
  confirmText = 'Yes',
  cancelText = 'Cancel',
  loading,
}: {
  open: boolean
  onClose: () => void
  onConfirm: () => void
  title?: string
  message: ReactNode
  tone?: ConfirmTone
  confirmText?: string
  cancelText?: string
  loading?: boolean
}) {
  return (
    <Modal open={open} onClose={onClose} width={548} closeOnBackdrop={!loading}>
      <div className="flex flex-col items-center gap-[15px] px-5 pb-[50px] pt-[45px] text-center">
        {tone === 'approve' ? (
          <div className="relative flex h-24 w-24 items-center justify-center">
            <BadgeCheck size={96} strokeWidth={1.2} className="text-toast-check drop-shadow" />
          </div>
        ) : (
          <TriangleAlert
            size={96}
            strokeWidth={1.4}
            className={cn(tone === 'danger' ? 'text-badge' : 'text-badge/80')}
          />
        )}
        <h3 className="text-[32px] font-medium tracking-[0.96px] text-ink-toastTitle">{title}</h3>
        <p className="text-lg text-ink-toastBody">{message}</p>
        <div className="mt-[10px] flex w-full max-w-[450px] items-center justify-center gap-5">
          <Button variant="primary" className="min-w-[90px] border border-primary-400 px-6" onClick={onConfirm} loading={loading}>
            {confirmText}
          </Button>
          <Button variant="toastCancel" className="min-w-[90px]" onClick={onClose} disabled={loading}>
            {cancelText}
          </Button>
        </div>
      </div>
    </Modal>
  )
}

/* -------------------------------------------------------------- comment dialog */
/**
 * Figma "Demand Back" / "Demand Forwarded" dialog (500 wide, Inter): title with divider,
 * required Comment textarea (450×91), Cancel (outline) + Confirm (#4558AE).
 */
export function CommentDialog({
  open,
  onClose,
  onConfirm,
  title,
  label = 'Comment',
  confirmText = 'Confirm',
  loading,
  required = true,
}: {
  open: boolean
  onClose: () => void
  onConfirm: (comment: string) => void
  title: string
  label?: string
  confirmText?: string
  loading?: boolean
  required?: boolean
}) {
  const [value, setValue] = useState('')
  const [touched, setTouched] = useState(false)
  useEffect(() => {
    if (open) {
      setValue('')
      setTouched(false)
    }
  }, [open])
  const invalid = required && touched && !value.trim()
  return (
    <Modal open={open} onClose={onClose} width={500} closeOnBackdrop={!loading}>
      <div className="relative p-5 font-modal">
        <button type="button" onClick={onClose} aria-label="Close" className="absolute right-5 top-5 text-ink-modalIcon hover:text-ink-modal">
          <X size={24} />
        </button>
        <h3 className="border-b border-black/10 pb-[10px] text-sm font-semibold text-ink-modal">{title}</h3>
        <label className="mt-4 block text-sm font-semibold text-ink-modal">
          {label}
          {required && <span className="ml-1 text-danger">*</span>}
        </label>
        <Textarea
          className="mt-4 min-h-[91px] rounded-card border-line-modal px-5 py-4 font-modal text-base text-ink-modalSoft"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onBlur={() => setTouched(true)}
          invalid={invalid}
          rows={3}
        />
        {invalid && <p className="mt-1 text-xs text-danger">{label} is required</p>}
        <div className="mt-7 flex justify-end gap-5">
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button
            variant="confirm"
            loading={loading}
            onClick={() => {
              setTouched(true)
              if (required && !value.trim()) return
              onConfirm(value.trim())
            }}
          >
            {confirmText}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
