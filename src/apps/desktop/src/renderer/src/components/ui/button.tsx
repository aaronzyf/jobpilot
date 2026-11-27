import type { ButtonHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

type Variant = 'primary' | 'outline' | 'ghost' | 'subtle' | 'danger'
type Size = 'xs' | 'sm' | 'md' | 'icon'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
}

const variants: Record<Variant, string> = {
  primary:
    'bg-accent text-white shadow-[0_1px_0_rgba(255,255,255,0.14)_inset] hover:bg-accent-strong',
  outline: 'border border-line-strong text-fg hover:bg-surface-3 hover:border-surface-4',
  ghost: 'text-fg-muted hover:bg-surface-3 hover:text-fg',
  subtle: 'bg-surface-3 text-fg hover:bg-surface-4',
  danger: 'bg-danger/12 text-danger hover:bg-danger/20'
}

const sizes: Record<Size, string> = {
  xs: 'h-6 px-2 text-[11px]',
  sm: 'h-7 px-2.5 text-[12px]',
  md: 'h-8 px-3 text-[13px]',
  icon: 'h-7 w-7'
}

export function Button({
  variant = 'subtle',
  size = 'md',
  className,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        'no-drag inline-flex shrink-0 select-none items-center justify-center gap-1.5 rounded-md font-medium transition-colors',
        'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent',
        'disabled:pointer-events-none disabled:opacity-40',
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    />
  )
}
