import { useState } from 'react'
import { Check, PanelLeft, Settings2, Users2 } from 'lucide-react'
import { BrandMark } from '@/components/layout/BrandMark'
import { PersonAvatar } from '@/components/ui/avatar'
import { navItems } from '@/lib/nav'
import { channelBrand } from '@/lib/channelBrand'
import { useApp } from '@/lib/store'
import { useT } from '@/i18n'
import { cn } from '@/lib/utils'
import { APP_VERSION } from '@/generated/version'

/** 折叠状态落在本地，刷新后保持 */
const COLLAPSE_KEY = 'jobpilot.sidebar.collapsed'

/** 折叠后只留图标列的宽度 */
const RAIL_WIDTH = 'w-[52px]'
const FULL_WIDTH = 'w-[208px]'

/** macOS 的红绿灯画在窗口左上角，折叠时要把按钮让到它们下面 */
function onMac(): boolean {
  return document.documentElement.dataset.platform === 'darwin'
}

/**
 * 数字气泡。折叠后没有文字位置了，所有计数只能压在图标角上。
 * 用一圈背景色描边把气泡和图标隔开，否则两个形状会糊在一起。
 *
 * 折叠态的图标只有 15px，气泡必须比它矮一截、并且锚在角上，
 * 否则一个数字就能把整个图标盖掉。窄栏里也读不出三位数，99+ 足够。
 */
function Bubble({
  value,
  tone = 'accent',
  compact = false
}: {
  value: number
  tone?: 'accent' | 'danger'
  compact?: boolean
}) {
  if (!value) return null
  return (
    <span
      className={cn(
        'tnum absolute font-medium text-white',
        'shadow-[0_0_0_1.5px_var(--surface)]',
        compact
          ? // 紧凑态：从图标右上角向外伸，只压住角上一小块
            'left-[9px] -top-[6px] min-w-[11px] rounded-full px-[2px] text-center text-[8px] leading-[10px]'
          : 'min-w-[15px] rounded-full px-1 text-center text-[9.5px] leading-[14px]',
        tone === 'danger' ? 'bg-danger' : 'bg-accent'
      )}
    >
      {compact && value > 99 ? '99+' : value}
    </span>
  )
}

/** 渠道色块，右下角带状态点 */
function ChannelTile({
  id,
  name,
  state,
  size = 16
}: {
  id: string
  name: string
  state: 'ok' | 'running' | 'error' | 'paused'
  size?: number
}) {
  const brand = channelBrand(id, name)
  return (
    <span
      className="relative flex shrink-0 items-center justify-center rounded-[4px] font-semibold text-white"
      style={{ width: size, height: size, background: brand.color, fontSize: size * 0.52 }}
    >
      {brand.short}
      <span
        className={cn(
          'absolute -bottom-0.5 -right-0.5 h-1.5 w-1.5 rounded-full shadow-[0_0_0_1.5px_var(--surface)]',
          state === 'ok'
            ? 'bg-success/80'
            : state === 'running'
              ? 'bg-accent'
              : state === 'error'
                ? 'bg-danger'
                : 'bg-fg-subtle'
        )}
      />
    </span>
  )
}

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
  const [collapsed, setCollapsed] = useState(
    () => localStorage.getItem(COLLAPSE_KEY) === '1'
  )
  const needLogin = sources.filter((s) => s.state === 'error').length
  const running = sources.filter((s) => s.state === 'running').length
  const mac = onMac()
  /** Windows 上产品名与折叠按钮同行；macOS 的产品名另起一行 */
  const inlineBrand = !mac && !collapsed

  /** 品牌区：标识 + 产品名 + 版本号 */
  const brand = (
    <div className="flex min-w-0 items-center gap-1.5">
      <BrandMark size={16} className="text-accent-strong" />
      <span className="text-[14px] font-semibold tracking-[-0.01em] text-fg">
        JobPilot
      </span>
      <span className="tnum text-[11px] text-fg-subtle">{APP_VERSION}</span>
    </div>
  )

  const toggleCollapsed = () => {
    setCollapsed((prev) => {
      localStorage.setItem(COLLAPSE_KEY, prev ? '0' : '1')
      return !prev
    })
  }

  return (
    <aside
      className={cn(
        'flex shrink-0 flex-col border-r border-line bg-surface',
        collapsed ? RAIL_WIDTH : FULL_WIDTH
      )}
    >
      {/*
        标题行。两种平台的布局不一样：
        macOS 的红绿灯占着左上角，产品名只能另起一行；
        Windows 的窗口按钮在窗口最右侧，标题行左边放产品名、右边放折叠按钮。
        折叠态在 macOS 上还要多留一段高度，否则按钮会顶到红绿灯上。
      */}
      <div
        className={cn(
          'drag flex shrink-0',
          collapsed && mac
            ? 'h-[74px] items-end justify-end pb-[9px] pr-2'
            : inlineBrand
              ? 'h-11 items-center justify-between gap-2 px-3'
              : 'h-11 items-center justify-end px-2'
        )}
      >
        {inlineBrand ? brand : null}
        <button
          onClick={toggleCollapsed}
          title={t(collapsed ? 'sidebar.expand' : 'sidebar.collapse')}
          aria-label={t(collapsed ? 'sidebar.expand' : 'sidebar.collapse')}
          data-collapse-toggle
          className="no-drag flex h-7 w-7 items-center justify-center rounded-md text-fg-subtle transition-colors hover:bg-surface-2 hover:text-fg"
        >
          <PanelLeft size={15} strokeWidth={1.7} />
        </button>
      </div>

      {/* macOS：产品名单独一行，避开红绿灯 */}
      {mac && !collapsed ? (
        <div className="flex h-9 shrink-0 items-center px-3">{brand}</div>
      ) : null}

      <nav className="flex flex-col gap-px px-2 pb-1">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = item.key === page
          // 沟通的未读数与邀约的待确认数都是活的，其它入口仍是 mock 里的静态数字
          const live =
            item.key === 'messages'
              ? unreadTotal
              : item.key === 'interviews'
                ? pendingInterviews
                : null
          const badgeText = live === null ? item.badge : live ? String(live) : undefined
          const badgeNum = live === null ? Number(item.badge ?? 0) : live
          return (
            <button
              key={item.key}
              onClick={() => go(item.key)}
              title={collapsed ? t(item.labelKey) : undefined}
              aria-label={collapsed ? t(item.labelKey) : undefined}
              className={cn(
                'group relative flex h-[30px] items-center rounded-md text-[12.5px] transition-colors',
                collapsed ? 'justify-center' : 'gap-2 px-2',
                isActive
                  ? 'bg-surface-3 text-fg shadow-[inset_0_0_0_1px_var(--inset-highlight)]'
                  : 'text-fg-muted hover:bg-surface-2 hover:text-fg'
              )}
            >
              {/*
                图标与气泡要绑成一个整体：气泡必须相对图标定位，
                若相对整行按钮定位会飘到图标右侧，两个形状还会互相压。
              */}
              <span className="relative flex shrink-0 items-center justify-center">
                <Icon
                  size={15}
                  strokeWidth={1.7}
                  className={cn(isActive ? 'text-accent-strong' : 'text-fg-subtle')}
                />
                {collapsed ? <Bubble value={badgeNum} compact /> : null}
              </span>
              {collapsed ? null : (
                <>
                  <span className="flex-1 truncate text-left">{t(item.labelKey)}</span>
                  {badgeText ? (
                    <span className="tnum text-[10.5px] text-fg-subtle">{badgeText}</span>
                  ) : null}
                </>
              )}
            </button>
          )
        })}
      </nav>

      {collapsed ? (
        <div className="mt-2 flex flex-col items-center gap-1">
          {sources.slice(0, 4).map((s) => (
            <button
              key={s.id}
              onClick={() => go('settings')}
              title={s.name}
              className="relative flex h-8 w-8 items-center justify-center rounded-md transition-colors hover:bg-surface-2"
            >
              {/* 气泡贴着色块右上角 */}
              <span className="relative flex items-center justify-center">
                <ChannelTile id={s.id} name={s.name} state={s.state} size={18} />
                <Bubble value={s.found} compact />
              </span>
            </button>
          ))}
        </div>
      ) : (
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
                <ChannelTile id={s.id} name={s.name} state={s.state} />
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
      )}

      <div className="mt-auto border-t border-line p-2">
        {collapsed ? (
          <div className="flex flex-col items-center gap-1">
            {candidates.map((c) => (
              <button
                key={c.id}
                onClick={() => setCandidateId(c.id)}
                disabled={!c.enabled}
                title={c.enabled ? c.name : t('sidebar.disabledHint')}
                className={cn(
                  'flex h-8 w-8 items-center justify-center rounded-md transition-colors',
                  c.id === candidateId
                    ? 'bg-surface-3 shadow-[inset_0_0_0_1px_var(--inset-highlight)]'
                    : 'hover:bg-surface-2',
                  !c.enabled && 'opacity-50'
                )}
              >
                <PersonAvatar name={c.name} hue={c.hue} size={20} />
              </button>
            ))}
          </div>
        ) : (
          <>
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
          </>
        )}
      </div>
    </aside>
  )
}
