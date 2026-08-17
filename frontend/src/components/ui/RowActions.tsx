import type { ReactNode } from 'react'
import { Eye, SquarePen, Trash2, CircleCheck, CircleX, Undo2, Redo2, ArrowLeftRight, Download } from 'lucide-react'
import { cn } from '@/lib/utils'

/**
 * Figma row-action icon buttons: 40×30 hit area, coloured icon, tinted hover background.
 * view #89C74A · edit #1C3586 · delete #CD3F32 · approve #019204 · reject #EC4F4F · back #7C7D7D · forward/transfer #1C3586
 */
export type RowActionKind =
  | 'view'
  | 'edit'
  | 'delete'
  | 'approve'
  | 'reject'
  | 'back'
  | 'forward'
  | 'transfer'
  | 'download'

const KIND: Record<RowActionKind, { icon: ReactNode; cls: string; title: string }> = {
  view: { icon: <Eye size={18} />, cls: 'text-action-view hover:bg-action-viewBg', title: 'View' },
  edit: { icon: <SquarePen size={16} />, cls: 'text-action-edit hover:bg-action-editBg', title: 'Edit' },
  delete: { icon: <Trash2 size={16} />, cls: 'text-action-delete hover:bg-action-deleteBg', title: 'Delete' },
  approve: { icon: <CircleCheck size={18} />, cls: 'text-action-approve hover:bg-action-approveBg', title: 'Approve' },
  reject: { icon: <CircleX size={18} />, cls: 'text-action-reject hover:bg-action-rejectBg', title: 'Inactive' },
  back: { icon: <Undo2 size={18} />, cls: 'text-action-back hover:bg-action-backBg', title: 'Send back' },
  forward: { icon: <Redo2 size={18} />, cls: 'text-action-forward hover:bg-action-forwardBg', title: 'Forward' },
  transfer: { icon: <ArrowLeftRight size={18} />, cls: 'text-action-forward hover:bg-action-forwardBg', title: 'Transfer' },
  download: { icon: <Download size={18} />, cls: 'text-ink-cell hover:bg-black/5', title: 'Download' },
}

export interface RowActionProps {
  kind: RowActionKind
  onClick?: () => void
  title?: string
  disabled?: boolean
  className?: string
}

export function RowAction({ kind, onClick, title, disabled, className }: RowActionProps) {
  const k = KIND[kind]
  return (
    <button
      type="button"
      title={title ?? k.title}
      aria-label={title ?? k.title}
      disabled={disabled}
      onClick={(e) => {
        e.stopPropagation()
        onClick?.()
      }}
      className={cn(
        'inline-flex h-[30px] w-10 items-center justify-center rounded-tl-card rounded-br-card transition-colors disabled:cursor-not-allowed disabled:opacity-40',
        k.cls,
        className,
      )}
    >
      {k.icon}
    </button>
  )
}

export function RowActions({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn('flex items-center justify-center gap-1', className)}>{children}</div>
}
