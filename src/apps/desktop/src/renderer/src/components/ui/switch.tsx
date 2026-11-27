import { cn } from '@/lib/utils'

export function Switch({
  checked,
  onChange,
  disabled,
  size = 'md'
}: {
  checked: boolean
  onChange: (v: boolean) => void
  disabled?: boolean
  size?: 'sm' | 'md'
}) {
  const w = size === 'sm' ? 'w-7' : 'w-8'
  const h = size === 'sm' ? 'h-4' : 'h-[18px]'
  const knob = size === 'sm' ? 'h-3 w-3' : 'h-3.5 w-3.5'
  const shift = size === 'sm' ? 'translate-x-3' : 'translate-x-[14px]'

  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn(
        'no-drag relative shrink-0 rounded-full transition-colors duration-150',
        w,
        h,
        checked ? 'bg-accent' : 'bg-surface-4',
        disabled && 'opacity-40'
      )}
    >
      <span
        className={cn(
          'absolute left-[2px] top-1/2 -translate-y-1/2 rounded-full bg-white shadow-sm transition-transform duration-150',
          knob,
          checked ? shift : 'translate-x-0'
        )}
      />
    </button>
  )
}

export function Checkbox({
  checked,
  onChange,
  className
}: {
  checked: boolean
  onChange: (v: boolean) => void
  className?: string
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={cn(
        'flex h-[14px] w-[14px] shrink-0 items-center justify-center rounded-[3px] border transition-colors',
        checked ? 'border-accent bg-accent text-white' : 'border-line-strong bg-surface-2',
        className
      )}
    >
      {checked ? (
        <svg viewBox="0 0 10 10" className="h-2 w-2" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="M1.5 5.2 3.8 7.5 8.5 2.6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ) : null}
    </button>
  )
}

export function Segmented<T extends string>({
  value,
  options,
  onChange,
  className
}: {
  value: T
  options: { value: T; label: string; badge?: string | number }[]
  onChange: (v: T) => void
  className?: string
}) {
  return (
    <div className={cn('inline-flex shrink-0 items-center gap-0.5 rounded-md bg-surface-2 p-0.5', className)}>
      {options.map((o) => (
        <button
          key={o.value}
          onClick={() => onChange(o.value)}
          className={cn(
            'flex h-6 shrink-0 items-center gap-1.5 whitespace-nowrap rounded px-2 text-[11.5px] transition-colors',
            value === o.value
              ? 'bg-surface-4 text-fg shadow-[0_1px_2px_rgba(0,0,0,0.25)]'
              : 'text-fg-muted hover:text-fg'
          )}
        >
          {o.label}
          {o.badge !== undefined ? (
            <span
              className={cn(
                'tnum text-[10.5px]',
                value === o.value ? 'text-fg-subtle' : 'text-fg-subtle/70'
              )}
            >
              {o.badge}
            </span>
          ) : null}
        </button>
      ))}
    </div>
  )
}
