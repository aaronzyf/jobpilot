import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

const base =
  'w-full rounded-md border border-line bg-surface-2 px-2.5 text-[12.5px] text-fg placeholder:text-fg-subtle ' +
  'transition-colors focus:border-accent/60 focus:bg-surface-3 focus:outline-none'

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn(base, 'h-8', className)} {...props} />
}

export function Textarea({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn(base, 'resize-none py-2 leading-relaxed', className)}
      {...props}
    />
  )
}

export function Select({
  className,
  children,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <div className="relative">
      <select className={cn(base, 'h-8 cursor-pointer pr-7', className)} {...props}>
        {children}
      </select>
      <svg
        viewBox="0 0 12 12"
        className="pointer-events-none absolute right-2.5 top-1/2 h-2.5 w-2.5 -translate-y-1/2 text-fg-subtle"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
      >
        <path d="M2.5 4.5 6 8l3.5-3.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  )
}

export function Field({
  label,
  hint,
  children,
  className
}: {
  label: string
  hint?: string
  children: ReactNode
  className?: string
}) {
  return (
    <label className={cn('block', className)}>
      <div className="mb-1.5 flex items-baseline justify-between gap-2">
        <span className="text-[11.5px] text-fg-muted">{label}</span>
        {hint ? <span className="text-[10.5px] text-fg-subtle">{hint}</span> : null}
      </div>
      {children}
    </label>
  )
}

/** 带前缀图标或单位后缀的输入框容器 */
export function InputAffix({
  prefix,
  suffix,
  children
}: {
  prefix?: ReactNode
  suffix?: ReactNode
  children: ReactNode
}) {
  return (
    <div className="flex h-8 items-center gap-2 rounded-md border border-line bg-surface-2 px-2.5 focus-within:border-accent/60">
      {prefix ? <span className="shrink-0 text-fg-subtle">{prefix}</span> : null}
      <div className="min-w-0 flex-1 [&>input]:h-7 [&>input]:border-0 [&>input]:bg-transparent [&>input]:px-0 [&>input]:focus:bg-transparent">
        {children}
      </div>
      {suffix ? <span className="shrink-0 text-[11px] text-fg-subtle">{suffix}</span> : null}
    </div>
  )
}
