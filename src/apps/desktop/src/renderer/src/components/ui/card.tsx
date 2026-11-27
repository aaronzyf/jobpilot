import type { HTMLAttributes, ReactNode } from 'react'
import { cn } from '@/lib/utils'

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('rounded-lg border border-line bg-surface', className)} {...props} />
}

export function CardHeader({
  title,
  subtitle,
  action,
  className
}: {
  title: ReactNode
  subtitle?: ReactNode
  action?: ReactNode
  className?: string
}) {
  return (
    <div className={cn('flex items-start justify-between gap-3 px-4 py-3', className)}>
      <div className="min-w-0">
        <div className="truncate text-[12.5px] font-medium text-fg">{title}</div>
        {subtitle ? <div className="mt-0.5 truncate text-[11px] text-fg-subtle">{subtitle}</div> : null}
      </div>
      {action}
    </div>
  )
}

export function CardBody({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('px-4 pb-4', className)} {...props} />
}

/** 分区标题：用于页面内的大块内容分隔 */
export function SectionTitle({
  title,
  hint,
  action
}: {
  title: string
  hint?: string
  action?: ReactNode
}) {
  return (
    <div className="mb-2 flex items-baseline justify-between gap-3">
      <div className="flex items-baseline gap-2">
        <h2 className="text-[12.5px] font-medium text-fg">{title}</h2>
        {hint ? <span className="text-[11px] text-fg-subtle">{hint}</span> : null}
      </div>
      {action}
    </div>
  )
}
