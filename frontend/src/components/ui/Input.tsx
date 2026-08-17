import { forwardRef, useState, type InputHTMLAttributes, type SelectHTMLAttributes, type TextareaHTMLAttributes } from 'react'
import { ChevronDown, Eye, EyeOff, Calendar } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  invalid?: boolean
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input({ className, invalid, ...rest }, ref) {
  return <input ref={ref} className={cn('input-base', invalid && 'border-danger', className)} placeholder="-" {...rest} />
})

export const PasswordInput = forwardRef<HTMLInputElement, InputProps>(function PasswordInput(
  { className, invalid, ...rest },
  ref,
) {
  const [show, setShow] = useState(false)
  return (
    <div className="relative">
      <input
        ref={ref}
        type={show ? 'text' : 'password'}
        className={cn('input-base pr-11', invalid && 'border-danger', className)}
        placeholder="-"
        {...rest}
      />
      <button
        type="button"
        tabIndex={-1}
        onClick={() => setShow((s) => !s)}
        className="absolute right-0 top-0 flex h-input w-10 items-center justify-center text-ink-placeholder/70 hover:text-ink-heading"
        aria-label={show ? 'Hide password' : 'Show password'}
      >
        {show ? <EyeOff size={20} /> : <Eye size={20} />}
      </button>
    </div>
  )
})

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  invalid?: boolean
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { className, invalid, rows = 2, ...rest },
  ref,
) {
  return (
    <textarea
      ref={ref}
      rows={rows}
      className={cn('input-base h-auto min-h-[60px] resize-y py-2', invalid && 'border-danger', className)}
      placeholder="-"
      {...rest}
    />
  )
})

export interface SelectOption {
  value: string | number
  label: string
}

export interface SelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'children'> {
  options: SelectOption[]
  placeholder?: string
  invalid?: boolean
  loading?: boolean
}

/** Native select styled like the Figma dropdown (chevron at right, "--" placeholder). */
export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { className, options, placeholder = '--', invalid, loading, value, ...rest },
  ref,
) {
  return (
    <div className="relative">
      <select
        ref={ref}
        className={cn(
          'input-base appearance-none pr-9',
          invalid && 'border-danger',
          (value === '' || value === undefined || value === null) && 'text-ink-placeholder/50',
          className,
        )}
        value={value ?? ''}
        {...rest}
      >
        <option value="">{loading ? 'Loading…' : placeholder}</option>
        {options.map((o) => (
          <option key={o.value} value={o.value} className="text-ink-heading">
            {o.label}
          </option>
        ))}
      </select>
      <ChevronDown
        size={18}
        className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-ink-placeholder/70"
      />
    </div>
  )
})

/** Native date input with the Figma calendar icon. */
export const DateInput = forwardRef<HTMLInputElement, InputProps>(function DateInput(
  { className, invalid, ...rest },
  ref,
) {
  return (
    <div className="relative">
      <input
        ref={ref}
        type="date"
        className={cn('input-base pr-10 [&::-webkit-calendar-picker-indicator]:opacity-0', invalid && 'border-danger', className)}
        {...rest}
      />
      <Calendar size={18} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#949699]" />
    </div>
  )
})

/** Year selector (Procurement Year) — Figma drew a date picker; a year is what the data needs. */
export const YearSelect = forwardRef<HTMLSelectElement, Omit<SelectProps, 'options'> & { from?: number; to?: number }>(
  function YearSelect({ from = 1990, to = new Date().getFullYear() + 1, ...rest }, ref) {
    const opts: SelectOption[] = []
    for (let y = to; y >= from; y--) opts.push({ value: y, label: String(y) })
    return <Select ref={ref} options={opts} {...rest} />
  },
)
