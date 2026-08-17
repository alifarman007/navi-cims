import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react'
import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

export type ButtonVariant =
  | 'primary' // Save / Login — #1C3586
  | 'alt' // Create Role Permission / Go — #2F4086
  | 'clear' // Clear All — light red
  | 'outline' // Cancel (modal) — grey border
  | 'ghost'
  | 'confirm' // modal Confirm — #4558AE
  | 'dark' // Print — #484848
  | 'danger' // Download — #EF3F2E
  | 'toastCancel' // grey #A49C9C
  | 'back' // header Back pill

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
  icon?: ReactNode // right side icon (Figma: Save ✓, Clear All eraser)
  iconLeft?: ReactNode
}

const base =
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-card font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-60 select-none'

const variants: Record<ButtonVariant, string> = {
  primary: 'bg-primary text-white hover:bg-primary-hover border border-transparent',
  alt: 'bg-primary-alt text-white hover:bg-primary-hover border border-transparent',
  clear: 'bg-danger-soft text-danger border border-danger-border hover:bg-danger-softHover',
  outline: 'bg-white text-ink-modal border border-line-modal hover:bg-gray-50 font-modal',
  ghost: 'bg-transparent text-ink-cell hover:bg-black/5 border border-transparent',
  confirm: 'bg-primary-600 text-white border border-primary-400 hover:bg-primary-hover',
  dark: 'bg-print text-white border border-print-border hover:bg-black',
  danger: 'bg-badge text-white border border-[#FF8D82] hover:bg-red-600',
  toastCancel: 'bg-toast-cancel text-white border border-line-modal hover:bg-gray-500 font-modal',
  back: 'bg-white text-black border border-line-back rounded-[5px] text-13 font-medium tracking-[1.3px] hover:bg-gray-50',
}

const sizes = {
  sm: 'h-[30px] px-3 text-13',
  md: 'h-btn px-5 text-base',
  lg: 'h-[50px] px-6 text-base',
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { className, variant = 'primary', size = 'md', loading, icon, iconLeft, children, disabled, ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      className={cn(base, variants[variant], variant === 'back' ? 'h-[30px] px-3' : sizes[size], className)}
      disabled={disabled || loading}
      {...rest}
    >
      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : iconLeft}
      {children}
      {!loading && icon}
    </button>
  )
})
