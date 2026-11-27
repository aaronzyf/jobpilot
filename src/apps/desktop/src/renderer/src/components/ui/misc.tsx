import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

export function Kbd({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <kbd
      className={cn(
        'inline-flex h-4 min-w-4 items-center justify-center rounded border border-line bg-surface-2 px-1 text-[10px] font-normal text-fg-subtle',
        className
      )}
    >
      {children}
    </kbd>
  )
}

export function Empty({ title, hint, action }: { title: string; hint?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 px-6 py-16 text-center">
      <div className="text-[12.5px] text-fg-muted">{title}</div>
      {hint ? <div className="max-w-xs text-[11.5px] leading-relaxed text-fg-subtle">{hint}</div> : null}
      {action ? <div className="mt-1">{action}</div> : null}
    </div>
  )
}

export function Divider({ className }: { className?: string }) {
  return <div className={cn('h-px w-full bg-line', className)} />
}

export function Dot({ className }: { className?: string }) {
  return <span className={cn('h-1.5 w-1.5 shrink-0 rounded-full', className)} />
}

/** 键值信息行：详情面板里大量复用 */
export function KeyValue({
  label,
  children,
  className
}: {
  label: string
  children: ReactNode
  className?: string
}) {
  return (
    <div className={cn('flex items-baseline gap-3 py-1', className)}>
      <span className="w-[84px] shrink-0 truncate text-[11px] text-fg-subtle">{label}</span>
      <span className="min-w-0 flex-1 text-[11.5px] text-fg-muted">{children}</span>
    </div>
  )
}
