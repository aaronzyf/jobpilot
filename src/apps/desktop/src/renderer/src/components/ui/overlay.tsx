import { useEffect, useRef, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'

function useEscape(active: boolean, onClose: () => void) {
  useEffect(() => {
    if (!active) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation()
        onClose()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [active, onClose])
}

const widths = {
  sm: 'max-w-[420px]',
  md: 'max-w-[560px]',
  lg: 'max-w-[760px]'
}

/**
 * 浮层挂到 body 上。
 *
 * 页面容器带入场动画（transform），会让内部的 fixed 元素改以该容器为参照，
 * 结果弹窗被裁在页面里、层级也被兄弟元素盖住。挂到 body 才是一贯的整屏浮层。
 */
function Portal({ children }: { children: ReactNode }) {
  if (typeof document === 'undefined') return null
  return createPortal(children, document.body)
}

export function Dialog({
  open,
  onClose,
  title,
  desc,
  children,
  footer,
  width = 'md'
}: {
  open: boolean
  onClose: () => void
  title: ReactNode
  desc?: ReactNode
  children: ReactNode
  footer?: ReactNode
  width?: keyof typeof widths
}) {
  useEscape(open, onClose)
  if (!open) return null

  return (
    <Portal>
      <div className="fixed inset-0 z-50 flex items-start justify-center px-6 pt-[9vh]">
        <div className="anim-fade absolute inset-0 bg-scrim backdrop-blur-[2px]" onClick={onClose} />
        <div
          role="dialog"
          aria-modal="true"
          className={cn(
            'anim-pop relative flex max-h-[82vh] w-full flex-col overflow-hidden rounded-xl border border-line-strong bg-surface shadow-[0_24px_64px_-12px_rgba(0,0,0,0.7)]',
            widths[width]
          )}
        >
          <div className="flex items-start justify-between gap-4 border-b border-line px-4 py-3">
            <div className="min-w-0">
              <div className="text-[13px] font-medium text-fg">{title}</div>
              {desc ? <div className="mt-0.5 text-[11.5px] text-fg-subtle">{desc}</div> : null}
            </div>
            <button
              onClick={onClose}
              className="-mr-1 flex h-6 w-6 shrink-0 items-center justify-center rounded text-fg-subtle hover:bg-surface-3 hover:text-fg"
            >
              <X size={14} strokeWidth={1.8} />
            </button>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto px-4 py-3.5">{children}</div>
          {footer ? (
            <div className="flex items-center justify-end gap-2 border-t border-line bg-surface-2/60 px-4 py-2.5">
              {footer}
            </div>
          ) : null}
        </div>
      </div>
    </Portal>
  )
}

export function Sheet({
  open,
  onClose,
  title,
  desc,
  children,
  footer,
  width = 420
}: {
  open: boolean
  onClose: () => void
  title: ReactNode
  desc?: ReactNode
  children: ReactNode
  footer?: ReactNode
  width?: number
}) {
  useEscape(open, onClose)
  if (!open) return null

  return (
    <Portal>
      <div className="fixed inset-0 z-40 flex justify-end">
        <div className="anim-fade absolute inset-0 bg-scrim-soft" onClick={onClose} />
        <aside
          className="anim-slide relative flex h-full flex-col border-l border-line-strong bg-surface shadow-[-16px_0_48px_-16px_rgba(0,0,0,0.6)]"
          style={{ width }}
        >
          <div className="flex items-start justify-between gap-4 border-b border-line px-4 py-3">
            <div className="min-w-0">
              <div className="text-[13px] font-medium text-fg">{title}</div>
              {desc ? <div className="mt-0.5 text-[11.5px] text-fg-subtle">{desc}</div> : null}
            </div>
            <button
              onClick={onClose}
              className="-mr-1 flex h-6 w-6 shrink-0 items-center justify-center rounded text-fg-subtle hover:bg-surface-3 hover:text-fg"
            >
              <X size={14} strokeWidth={1.8} />
            </button>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto">{children}</div>
          {footer ? (
            <div className="flex items-center justify-end gap-2 border-t border-line bg-surface-2/60 px-4 py-2.5">
              {footer}
            </div>
          ) : null}
        </aside>
      </div>
    </Portal>
  )
}

export function Popover({
  trigger,
  children,
  align = 'end',
  side = 'bottom',
  className
}: {
  trigger: (props: { open: boolean; toggle: () => void }) => ReactNode
  children: ReactNode
  align?: 'start' | 'end'
  /** 面板展开方向：bottom 朝下（默认），top 朝上，用于贴近窗口底部的触发器 */
  side?: 'bottom' | 'top'
  className?: string
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [open])

  return (
    <div ref={ref} className="relative">
      {trigger({ open, toggle: () => setOpen((v) => !v) })}
      {open ? (
        <div
          className={cn(
            'anim-pop absolute z-30 min-w-[212px] overflow-hidden rounded-lg border border-line-strong bg-surface-2 py-1 shadow-[0_16px_40px_-8px_var(--popover-shadow)]',
            side === 'top' ? 'bottom-[calc(100%+6px)]' : 'top-[calc(100%+6px)]',
            align === 'end' ? 'right-0' : 'left-0',
            className
          )}
        >
          {children}
        </div>
      ) : null}
    </div>
  )
}

export function MenuItem({
  children,
  onClick,
  selected,
  hint
}: {
  children: ReactNode
  onClick?: () => void
  selected?: boolean
  hint?: string
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex w-full items-center gap-2 px-2.5 py-1.5 text-left text-[12px] transition-colors',
        selected ? 'text-fg' : 'text-fg-muted hover:bg-surface-3 hover:text-fg'
      )}
    >
      <span className="min-w-0 flex-1 truncate">{children}</span>
      {hint ? <span className="shrink-0 text-[10.5px] text-fg-subtle">{hint}</span> : null}
      {selected ? <span className="h-1 w-1 shrink-0 rounded-full bg-accent" /> : null}
    </button>
  )
}

export function MenuLabel({ children }: { children: ReactNode }) {
  return (
    <div className="px-2.5 pb-1 pt-1.5 text-[10px] uppercase tracking-wider text-fg-subtle">
      {children}
    </div>
  )
}

export function MenuSeparator() {
  return <div className="my-1 h-px bg-line" />
}
