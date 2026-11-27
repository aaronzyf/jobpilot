import { AlertTriangle, Check, Info } from 'lucide-react'
import { useApp } from '@/lib/store'
import { cn } from '@/lib/utils'

const toneStyle = {
  default: 'border-line-strong text-fg',
  success: 'border-success/30 text-fg',
  warning: 'border-warning/30 text-fg',
  danger: 'border-danger/35 text-fg'
}

const iconStyle = {
  default: 'text-fg-muted',
  success: 'text-success',
  warning: 'text-warning',
  danger: 'text-danger'
}

export function Toasts() {
  const { toasts } = useApp()

  return (
    <div className="pointer-events-none fixed bottom-4 left-1/2 z-[70] flex -translate-x-1/2 flex-col items-center gap-1.5">
      {toasts.map((t) => {
        const Icon = t.tone === 'success' ? Check : t.tone === 'default' ? Info : AlertTriangle
        return (
          <div
            key={t.id}
            className={cn(
              'anim-pop pointer-events-auto flex max-w-[520px] items-center gap-2 rounded-lg border bg-surface-2/95 px-3 py-2 text-[12px] shadow-[0_12px_32px_-8px_rgba(0,0,0,0.7)] backdrop-blur',
              toneStyle[t.tone]
            )}
          >
            <Icon size={13} className={cn('shrink-0', iconStyle[t.tone])} />
            <span className="leading-snug">{t.text}</span>
          </div>
        )
      })}
    </div>
  )
}
