import { useEffect, useMemo, useRef, useState } from 'react'
import { Briefcase, CornerDownLeft, Search, Send, Settings, UserRound } from 'lucide-react'
import { useT, type TKey } from '@/i18n'
import { scoreFor } from '@/lib/match'
import { navItems } from '@/lib/nav'
import { useApp } from '@/lib/store'
import { cn } from '@/lib/utils'

interface Item {
  id: string
  groupKey: TKey
  label: string
  hint?: string
  run: () => void
}

export function CommandPalette() {
  const { paletteOpen, setPaletteOpen, go, setCandidateId, candidate, toast, candidates, jobs } =
    useApp()
  const t = useT()
  const [q, setQ] = useState('')
  const [idx, setIdx] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (paletteOpen) {
      setQ('')
      setIdx(0)
      requestAnimationFrame(() => inputRef.current?.focus())
    }
  }, [paletteOpen])

  const items = useMemo<Item[]>(() => {
    const kw = q.trim().toLowerCase()
    const pages: Item[] = navItems.map((n) => ({
      id: `nav:${n.key}`,
      groupKey: 'palette.groupPages',
      label: t(n.labelKey),
      hint: `⌘${n.shortcut}`,
      run: () => go(n.key)
    }))

    const people: Item[] = candidates.map((c) => ({
      id: `cand:${c.id}`,
      groupKey: 'palette.groupCandidates',
      label: t('palette.switchTo', { name: c.name }),
      hint: c.headline,
      run: () => {
        setCandidateId(c.id)
        toast(t('candidates.toastSwitched', { name: c.name }), 'success')
      }
    }))

    const jobItems: Item[] = [...jobs]
      .sort((a, b) => scoreFor(b, candidate.id) - scoreFor(a, candidate.id))
      .map((j) => ({
        id: `job:${j.id}`,
        groupKey: 'palette.groupJobs',
        label: j.title,
        hint: t('palette.hintScore', {
          company: j.company,
          n: scoreFor(j, candidate.id)
        }),
        run: () => go('jobs', j.id)
      }))

    const all = [...pages, ...people, ...jobItems]
    if (!kw) return [...pages, ...people, ...jobItems.slice(0, 5)]
    return all.filter((i) => `${i.label} ${i.hint ?? ''}`.toLowerCase().includes(kw))
  }, [q, go, setCandidateId, candidate.id, toast, t, candidates, jobs])

  useEffect(() => setIdx(0), [q])

  if (!paletteOpen) return null

  const groups = Array.from(new Set(items.map((i) => i.groupKey)))
  const flat = items
  const active = flat[Math.min(idx, flat.length - 1)]

  const close = () => setPaletteOpen(false)

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') return close()
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setIdx((i) => Math.min(i + 1, flat.length - 1))
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault()
      setIdx((i) => Math.max(i - 1, 0))
    }
    if (e.key === 'Enter' && active) {
      e.preventDefault()
      active.run()
      close()
    }
  }

  const iconFor = (group: TKey) => {
    if (group === 'palette.groupCandidates') return UserRound
    if (group === 'palette.groupJobs') return Briefcase
    return Send
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-start justify-center pt-[12vh]">
      <div className="anim-fade absolute inset-0 bg-scrim backdrop-blur-[2px]" onClick={close} />
      <div
        className="anim-pop relative w-full max-w-[560px] overflow-hidden rounded-xl border border-line-strong bg-surface shadow-[0_28px_70px_-16px_rgba(0,0,0,0.75)]"
        onKeyDown={onKeyDown}
      >
        <div className="flex h-11 items-center gap-2.5 border-b border-line px-3.5">
          <Search size={14} className="shrink-0 text-fg-subtle" />
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={t('palette.placeholder')}
            className="h-full flex-1 bg-transparent text-[13px] text-fg placeholder:text-fg-subtle focus:outline-none"
          />
          <button
            onClick={close}
            className="rounded border border-line px-1.5 py-0.5 text-[10px] text-fg-subtle hover:text-fg-muted"
          >
            esc
          </button>
        </div>

        <div className="max-h-[48vh] overflow-y-auto py-1.5">
          {flat.length === 0 ? (
            <div className="px-4 py-8 text-center text-[12px] text-fg-subtle">
              {t('palette.noResults')}
            </div>
          ) : (
            groups.map((g) => (
              <div key={g}>
                <div className="px-3.5 pb-1 pt-2 text-[10px] uppercase tracking-wider text-fg-subtle">
                  {t(g)}
                </div>
                {flat
                  .filter((i) => i.groupKey === g)
                  .map((i) => {
                    const current = flat.indexOf(i) === idx
                    const Icon = iconFor(g)
                    return (
                      <button
                        key={i.id}
                        onMouseEnter={() => setIdx(flat.indexOf(i))}
                        onClick={() => {
                          i.run()
                          close()
                        }}
                        className={cn(
                          'flex w-full items-center gap-2.5 px-3.5 py-1.5 text-left',
                          current ? 'bg-surface-3' : 'hover:bg-surface-2'
                        )}
                      >
                        <Icon
                          size={13}
                          strokeWidth={1.7}
                          className={cn('shrink-0', current ? 'text-accent' : 'text-fg-subtle')}
                        />
                        <span className="min-w-0 flex-1 truncate text-[12.5px] text-fg">
                          {i.label}
                        </span>
                        {i.hint ? (
                          <span className="max-w-[46%] shrink-0 truncate text-[10.5px] text-fg-subtle">
                            {i.hint}
                          </span>
                        ) : null}
                        {current ? (
                          <CornerDownLeft size={11} className="shrink-0 text-fg-subtle" />
                        ) : null}
                      </button>
                    )
                  })}
              </div>
            ))
          )}
        </div>

        <div className="flex items-center gap-3 border-t border-line bg-surface-2/50 px-3.5 py-1.5 text-[10px] text-fg-subtle">
          <span className="flex items-center gap-1">
            <span className="rounded border border-line px-1">↑↓</span> {t('palette.hintSelect')}
          </span>
          <span className="flex items-center gap-1">
            <span className="rounded border border-line px-1">↵</span> {t('palette.hintOpen')}
          </span>
          <span className="ml-auto flex items-center gap-1">
            <Settings size={10} /> {t('palette.footerNote')}
          </span>
        </div>
      </div>
    </div>
  )
}
