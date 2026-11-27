import { Check, ChevronsUpDown, Plus, Users2 } from 'lucide-react'
import { PersonAvatar } from '@/components/ui/avatar'
import { MenuLabel, MenuSeparator, Popover } from '@/components/ui/overlay'
import { navItems } from '@/lib/nav'
import { useApp } from '@/lib/store'
import { useT } from '@/i18n'
import { cn } from '@/lib/utils'
import { APP_VERSION } from '@/generated/version'

export function Sidebar() {
  const {
    page,
    go,
    candidate,
    candidateId,
    setCandidateId,
    unreadTotal,
    pendingInterviews,
    toast,
    candidates,
    sources
  } = useApp()
  const t = useT()
  const needLogin = sources.filter((s) => s.state === 'error').length
  const running = sources.filter((s) => s.state === 'running').length

  return (
    <aside className="flex w-[208px] shrink-0 flex-col border-r border-line bg-surface">
      <div className="drag mac-inset flex h-11 items-center">
        <div className="flex items-center gap-2">
          <div className="flex h-[22px] w-[22px] items-center justify-center rounded-[6px] bg-gradient-to-b from-accent-strong to-accent text-[12px] font-semibold text-white shadow-[0_1px_2px_rgba(0,0,0,0.4)]">
            j
          </div>
          <span className="text-[13px] font-medium tracking-[-0.01em]">jobpilot</span>
          <span className="rounded bg-surface-3 px-1 text-[9.5px] leading-4 text-fg-subtle">
            v{APP_VERSION}
          </span>
        </div>
      </div>

      <nav className="flex flex-col gap-px px-2 pb-1">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = item.key === page
          return (
            <button
              key={item.key}
              onClick={() => go(item.key)}
              className={cn(
                'group flex h-[30px] items-center gap-2 rounded-md px-2 text-[12.5px] transition-colors',
                isActive
                  ? 'bg-surface-3 text-fg shadow-[inset_0_0_0_1px_var(--inset-highlight)]'
                  : 'text-fg-muted hover:bg-surface-2 hover:text-fg'
              )}
            >
              <Icon
                size={15}
                strokeWidth={1.7}
                className={cn('shrink-0', isActive ? 'text-accent-strong' : 'text-fg-subtle')}
              />
              <span className="flex-1 truncate text-left">{t(item.labelKey)}</span>
              {(() => {
                // 沟通的未读数与邀约的待确认数都是活的，其它入口仍是 mock 里的静态数字
                const live =
                  item.key === 'messages'
                    ? unreadTotal
                    : item.key === 'interviews'
                      ? pendingInterviews
                      : null
                const badge = live === null ? item.badge : live ? String(live) : undefined
                return badge ? (
                  <span className="tnum text-[10.5px] text-fg-subtle">{badge}</span>
                ) : null
              })()}
            </button>
          )
        })}
      </nav>

      <div className="mt-2 px-2">
        <div className="mb-1 flex items-center justify-between px-1">
          <span className="text-[10px] uppercase tracking-wider text-fg-subtle">
            {t('sidebar.channels')}
          </span>
          <button
            onClick={() => go('settings')}
            className="text-[10.5px] text-fg-subtle hover:text-fg-muted"
          >
            {t('sidebar.manage')}
          </button>
        </div>
        <div className="space-y-px">
          {sources.slice(0, 4).map((s) => (
            <div
              key={s.id}
              className="flex h-6 items-center gap-1.5 rounded px-1 text-[11px] text-fg-subtle"
            >
              <span
                className={cn(
                  'h-1 w-1 shrink-0 rounded-full',
                  s.state === 'ok'
                    ? 'bg-success/80'
                    : s.state === 'running'
                      ? 'bg-accent'
                      : s.state === 'error'
                        ? 'bg-danger'
                        : 'bg-fg-subtle'
                )}
              />
              <span className="min-w-0 flex-1 truncate">{s.name}</span>
              <span className="tnum text-[10px] text-fg-subtle/80">{s.found || '—'}</span>
            </div>
          ))}
        </div>
        {needLogin > 0 ? (
          <button
            onClick={() => go('settings')}
            className="mt-1 flex w-full items-center gap-1.5 rounded border border-danger/25 bg-danger/8 px-1.5 py-1 text-[10.5px] text-danger/90 hover:bg-danger/12"
          >
            <span className="h-1 w-1 rounded-full bg-danger" />
            {t('sidebar.needLogin', { n: needLogin })}
          </button>
        ) : null}
      </div>

      <div className="mt-auto border-t border-line p-2">
        <div className="mb-1 flex items-center justify-between px-1">
          <span className="flex items-center gap-1 text-[10px] uppercase tracking-wider text-fg-subtle">
            <Users2 size={10} />
            {t('sidebar.currentCandidate')}
          </span>
          <button
            onClick={() => go('candidates')}
            className="flex h-4 w-4 items-center justify-center rounded text-fg-subtle hover:bg-surface-3 hover:text-fg"
            title={t('sidebar.newCandidate')}
          >
            <Plus size={11} />
          </button>
        </div>

        <Popover
          align="start"
          side="top"
          className="w-[188px]"
          trigger={({ toggle }) => (
            <button
              onClick={toggle}
              className="flex w-full items-center gap-2 rounded-md px-1.5 py-1.5 text-left transition-colors hover:bg-surface-2"
            >
              <PersonAvatar name={candidate.name} hue={candidate.hue} size={24} />
              <div className="min-w-0 flex-1">
                <div className="truncate text-[12px] text-fg">{candidate.name}</div>
                <div className="truncate text-[10.5px] text-fg-subtle">
                  {t('sidebar.appliedPending', {
                    applied: candidate.stats.applied,
                    pending: candidate.stats.pending
                  })}
                </div>
              </div>
              <ChevronsUpDown size={12} className="shrink-0 text-fg-subtle" />
            </button>
          )}
        >
          <MenuLabel>{t('sidebar.switchCandidate')}</MenuLabel>
          {candidates.map((c) => (
            <button
              key={c.id}
              onClick={() => {
                setCandidateId(c.id)
                toast(t('sidebar.toastSwitched', { name: c.name }), 'success')
              }}
              className="flex w-full items-center gap-2 px-2 py-1.5 text-left hover:bg-surface-3"
            >
              <PersonAvatar name={c.name} hue={c.hue} size={20} />
              <div className="min-w-0 flex-1">
                <div className="truncate text-[11.5px] text-fg">{c.name}</div>
                <div className="truncate text-[10px] text-fg-subtle">{c.headline}</div>
              </div>
              {c.id === candidateId ? <Check size={12} className="shrink-0 text-accent" /> : null}
            </button>
          ))}
          <MenuSeparator />
          <button
            onClick={() => go('candidates')}
            className="flex w-full items-center gap-1.5 px-2.5 py-1.5 text-[11.5px] text-fg-muted hover:bg-surface-3 hover:text-fg"
          >
            <Plus size={12} />
            {t('sidebar.newProfile')}
          </button>
        </Popover>

        <div className="mt-1 flex items-center gap-1 px-1.5 text-[10px] text-fg-subtle">
          <span className="h-1 w-1 rounded-full bg-success" />
          {running > 0 ? t('sidebar.syncingChannel') : t('sidebar.lastSync')}
        </div>
      </div>
    </aside>
  )
}
