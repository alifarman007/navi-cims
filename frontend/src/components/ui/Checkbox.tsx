import { forwardRef, type InputHTMLAttributes } from 'react'
import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string
  indeterminate?: boolean
}

/** Square checkbox (Figma: 18px, border #8C8C8C, checked = primary fill + white check). */
export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(function Checkbox(
  { className, label, checked, disabled, ...rest },
  ref,
) {
  return (
    <label className={cn('inline-flex cursor-pointer select-none items-center gap-2', disabled && 'cursor-not-allowed opacity-60', className)}>
      <span className="relative inline-flex h-[18px] w-[18px] items-center justify-center">
        <input ref={ref} type="checkbox" className="peer sr-only" checked={checked} disabled={disabled} {...rest} />
        <span className="absolute inset-0 rounded-[3px] border-2 border-[#8C8C8C] bg-white transition-colors peer-checked:border-primary-600 peer-checked:bg-primary-600 peer-focus-visible:ring-2 peer-focus-visible:ring-primary-400/60" />
        <Check size={13} strokeWidth={3} className="relative hidden text-white peer-checked:block" />
      </span>
      {label && <span className="text-sm text-ink-cell">{label}</span>}
    </label>
  )
})

export interface StatusRadioProps {
  value: 'active' | 'inactive'
  onChange: (v: 'active' | 'inactive') => void
  disabled?: boolean
  name?: string
  className?: string
}

/**
 * Figma "Status" control: a bordered input-height box containing two square-check style radios,
 * "Active" (default, filled #5F73D0) and "Inactive".
 */
export function StatusRadio({ value, onChange, disabled, name = 'status', className }: StatusRadioProps) {
  const opts: { v: 'active' | 'inactive'; label: string }[] = [
    { v: 'active', label: 'Active' },
    { v: 'inactive', label: 'Inactive' },
  ]
  return (
    <div className={cn('input-base flex items-center gap-8', className)} role="radiogroup" aria-label="Status">
      {opts.map((o) => {
        const checked = value === o.v
        return (
          <label key={o.v} className={cn('inline-flex cursor-pointer items-center gap-2', disabled && 'cursor-not-allowed')}>
            <input
              type="radio"
              name={name}
              className="sr-only"
              checked={checked}
              disabled={disabled}
              onChange={() => onChange(o.v)}
            />
            <span
              className={cn(
                'inline-flex h-[18px] w-[18px] items-center justify-center rounded-[3px] border-2 transition-colors',
                checked ? 'border-primary-400 bg-white' : 'border-[#AFB4BF] bg-white',
              )}
            >
              {checked && <span className="h-[10px] w-[10px] rounded-[2px] bg-primary-500" />}
            </span>
            <span className={cn('text-sm', checked ? 'text-[#2D2D2D]' : 'text-[#676767]')}>{o.label}</span>
          </label>
        )
      })}
    </div>
  )
}
