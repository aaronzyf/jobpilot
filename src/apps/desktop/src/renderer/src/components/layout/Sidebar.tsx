import { Check, Settings2, Users2 } from 'lucide-react'
import { PersonAvatar } from '@/components/ui/avatar'
import { navItems } from '@/lib/nav'
import { useApp } from '@/lib/store'
import { useT } from '@/i18n'
import { cn } from '@/lib/utils'
import { APP_VERSION } from '@/generated/version'

export function Sidebar() {
  const {
    page,
    go,
    candidateId,
    setCandidateId,
    openCandidateConfig,
    matchRuns,
    unreadTotal,
    pendingInterviews,
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
            {t('sidebar.profiles')}
          </span>
          <button
            onClick={() => go('candidates')}
            className="text-[10.5px] text-fg-subtle hover:text-fg-muted"
          >
            {t('sidebar.manage')}
          </button>
        </div>

        <div className="space-y-px">
          {candidates.map((c) => {
            const isCurrent = c.id === candidateId
            const run = matchRuns[c.id]
            return (
              <div
                key={c.id}
                className={cn(
                  'group flex w-full items-center rounded-md px-1.5 py-1.5 transition-colors',
                  isCurrent
                    ? 'bg-surface-3 shadow-[inset_0_0_0_1px_var(--inset-highlight)]'
                    : 'hover:bg-surface-2',
                  !c.enabled && 'opacity-50'
                )}
              >
                <button
                  onClick={() => setCandidateId(c.id)}
                  disabled={!c.enabled}
                  title={c.enabled ? c.headline : t('sidebar.disabledHint')}
                  className="flex min-w-0 flex-1 items-center gap-1.5 text-left disabled:cursor-not-allowed"
                >
                  <PersonAvatar name={c.name} hue={c.hue} size={20} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1">
                      <span
                        className={cn(
                          'truncate text-[11.5px]',
                          isCurrent ? 'text-fg' : 'text-fg-muted'
                        )}
                      >
                        {c.name}
                      </span>
                      {isCurrent ? <Check size={11} className="shrink-0 text-accent" /> : null}
                      {!c.enabled ? (
                        <span className="shrink-0 text-[9px] text-fg-subtle">
                          {t('sidebar.disabled')}
                        </span>
                      ) : null}
                    </div>
                    <div className="truncate text-[10px] text-fg-subtle">
                      {!c.enabled
                        ? t('sidebar.matchPaused')
                        : run
                          ? t('sidebar.lastMatch', { n: run.scanned })
                          : t('sidebar.notMatched')}
                    </div>
                  </div>
                </button>
                <button
                  onClick={() => openCandidateConfig(c.id)}
                  title={t('sidebar.configureCandidate', { name: c.name })}
                  aria-label={t('sidebar.configureCandidate', { name: c.name })}
                  className="ml-1 flex h-6 w-6 shrink-0 items-center justify-center rounded text-fg-subtle opacity-60 hover:bg-surface-3 hover:text-fg group-hover:opacity-100"
                >
                  <Settings2 size={12} strokeWidth={1.7} />
                </button>
              </div>
            )
          })}
        </div>

        <div className="mt-1 flex items-center gap-1 px-1.5 text-[10px] text-fg-subtle">
          <span
            className={cn(
              'h-1 w-1 rounded-full',
              candidates.some((c) => c.enabled) ? 'animate-pulse bg-success' : 'bg-fg-subtle'
            )}
          />
          {t('sidebar.matchStatus', { n: candidates.filter((c) => c.enabled).length })}
          {running > 0 ? ` · ${t('sidebar.syncingChannel')}` : ''}
        </div>
      </div>
    </aside>
  )
}
