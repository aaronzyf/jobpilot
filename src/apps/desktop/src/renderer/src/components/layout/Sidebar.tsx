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

/**
 * 折叠动效：宽度、位移、淡入淡出共用同一个时长与缓动。
 * 三者不同步就会出现「宽度还在收、文字先没了」的错位感。
 */
const DUR = 'duration-200 ease-out'

/**
 * 折叠后图标要从行首移到窄栏正中，位移量按窄栏宽度算：
 * 窄栏 52px − 导航左右内边距 16px − 按钮左右内边距 16px = 20px 内容盒，
 * 图标 15px，居中后左边距 2.5px，而原本贴着按钮内边距起点，
 * 所以要向右平移 2.5px。用 transform 而不是换 justify，
 * 因为 justify 的切换是瞬时的，图标会跳一下。
 */
const NAV_ICON_SHIFT = 'translate-x-[2.5px]'
/** 渠道色块：内容盒 28px、色块 18px，居中后右移 5px */
const CHANNEL_TILE_SHIFT = 'translate-x-[5px]'
/** 头像：内容盒 24px、头像 20px，居中后右移 2px */
const AVATAR_SHIFT = 'translate-x-[2px]'

/** macOS 的红绿灯画在窗口左上角 */
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
  anchor = 'icon'
}: {
  value: number
  tone?: 'accent' | 'danger'
  /**
   * 气泡锚在哪个元素上：
   * icon = 15px 的菜单图标，tile = 18px 的渠道色块。
   * 两者尺寸不同，偏移量也不同 —— 用同一组偏移会挡住色块里的字母。
   */
  anchor?: 'icon' | 'tile'
}) {
  if (!value) return null
  return (
    <span
      className={cn(
        'tnum absolute font-medium text-white',
        'shadow-[0_0_0_1.5px_var(--surface)]',
        // 从锚点右上角向外伸，只压住角上的一小块
        anchor === 'icon'
          ? 'left-[10px] -top-[7px] min-w-[11px] rounded-full px-[2px] text-center text-[8px] leading-[10px]'
          : 'left-[13px] -top-[7px] min-w-[11px] rounded-full px-[2px] text-center text-[8px] leading-[10px]',
        tone === 'danger' ? 'bg-danger' : 'bg-accent'
      )}
    >
      {value > 99 ? '99+' : value}
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

  const toggleButton = (
    <button
      onClick={toggleCollapsed}
      title={t(collapsed ? 'sidebar.expand' : 'sidebar.collapse')}
      aria-label={t(collapsed ? 'sidebar.expand' : 'sidebar.collapse')}
      data-collapse-toggle
      className="no-drag flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-fg-subtle transition-colors hover:bg-surface-2 hover:text-fg"
    >
      <PanelLeft size={15} strokeWidth={1.7} />
    </button>
  )

  return (
    <aside
      className={cn(
        'flex shrink-0 flex-col overflow-hidden border-r border-line bg-surface',
        'transition-[width]',
        DUR,
        collapsed ? RAIL_WIDTH : FULL_WIDTH
      )}
    >
      {/*
        顶部区域按平台分两种布局：

        macOS 的红绿灯画在窗口左上角，会盖住侧栏左上角。
        展开时侧栏够宽，折叠按钮在右侧够不着红绿灯，行高 44px；
        折叠后侧栏只有 52px，按钮会挪到红绿灯下面，
        所以行高要长到 74px、按钮贴着行底。行高与对齐一起过渡，
        按钮是滑下去的不是瞬移。

        Windows 的窗口按钮在窗口最右侧，侧栏顶部不受影响，
        品牌与折叠按钮同行即可。
      */}
      {mac ? (
        <>
          <div
            className={cn(
              'drag flex shrink-0 items-end justify-end transition-[height]',
              DUR,
              collapsed ? 'h-[74px] pb-2 pr-2' : 'h-11 pb-1 pr-2'
            )}
          >
            {toggleButton}
          </div>
          {/* macOS：产品名单独一行，避开红绿灯；折叠时整行收起 */}
          <div
            className={cn(
              'flex shrink-0 items-center overflow-hidden px-3 transition-[max-height,opacity]',
              DUR,
              collapsed ? 'max-h-0 opacity-0' : 'h-9 opacity-100'
            )}
          >
            {brand}
          </div>
        </>
      ) : (
        <div
          className={cn(
            'drag flex h-11 shrink-0 items-center justify-between gap-2 px-3'
          )}
        >
          <span
            className={cn(
              'flex min-w-0 items-center overflow-hidden transition-[max-width,opacity]',
              DUR,
              collapsed ? 'max-w-0 opacity-0' : 'max-w-[170px] opacity-100'
            )}
          >
            {brand}
          </span>
          {toggleButton}
        </div>
      )}

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
                'group relative flex h-[30px] items-center overflow-hidden rounded-md px-2 text-[12.5px] transition-colors',
                isActive
                  ? 'bg-surface-3 text-fg shadow-[inset_0_0_0_1px_var(--inset-highlight)]'
                  : 'text-fg-muted hover:bg-surface-2 hover:text-fg'
              )}
            >
              {/*
                图标与气泡绑成一个整体：气泡相对图标定位，
                若相对整行按钮定位会飘到图标右侧，两个形状还会互相压。
                折叠时图标平移到窄栏正中，文字同时收拢淡出。
              */}
              <span
                className={cn(
                  'relative flex shrink-0 items-center justify-center transition-transform',
                  DUR,
                  collapsed && NAV_ICON_SHIFT
                )}
              >
                <Icon
                  size={15}
                  strokeWidth={1.7}
                  className={cn(isActive ? 'text-accent-strong' : 'text-fg-subtle')}
                />
                {/*
                  气泡常驻 DOM：展开时透明，折叠时淡入。
                  卸载再挂载会瞬间出现，没有过渡可言。
                */}
                <span
                  className={cn(
                    'pointer-events-none transition-opacity',
                    DUR,
                    collapsed ? 'opacity-100' : 'opacity-0'
                  )}
                >
                  <Bubble value={badgeNum} anchor="icon" />
                </span>
              </span>
              <span
                className={cn(
                  'min-w-0 truncate transition-[max-width,margin-left,opacity]',
                  DUR,
                  collapsed
                    ? 'ml-0 max-w-0 opacity-0'
                    : 'ml-2 max-w-[110px] opacity-100'
                )}
              >
                {t(item.labelKey)}
              </span>
              <span
                className={cn(
                  'tnum min-w-0 transition-[max-width,margin-left,opacity]',
                  DUR,
                  collapsed
                    ? 'ml-0 max-w-0 opacity-0'
                    : 'ml-auto max-w-[32px] opacity-100'
                )}
              >
                {badgeText}
              </span>
            </button>
          )
        })}
      </nav>

      <div className="mt-2 px-2">
        {/* 区块标题：折叠后整行收起，高度与不透明度一起过渡 */}
        <div
          className={cn(
            'mb-1 flex items-center justify-between overflow-hidden px-1 transition-[max-height,opacity]',
            DUR,
            collapsed ? 'max-h-0 opacity-0' : 'max-h-5 opacity-100'
          )}
        >
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
            <button
              key={s.id}
              onClick={() => go('settings')}
              title={s.name}
              className="group relative flex h-7 w-full items-center overflow-hidden rounded px-1 text-[11px] text-fg-subtle transition-colors hover:bg-surface-2"
            >
              {/*
                色块折叠后要居中到窄栏中央：它平时贴着行首，
                所以折叠时向右平移，与文字收起同步。
              */}
              <span
                className={cn(
                  'relative flex shrink-0 items-center justify-center transition-transform',
                  DUR,
                  collapsed && CHANNEL_TILE_SHIFT
                )}
              >
                <ChannelTile id={s.id} name={s.name} state={s.state} size={18} />
                <span
                  className={cn(
                    'pointer-events-none transition-opacity',
                    DUR,
                    collapsed ? 'opacity-100' : 'opacity-0'
                  )}
                >
                  <Bubble value={s.found} anchor="tile" />
                </span>
              </span>
              <span
                className={cn(
                  'min-w-0 truncate transition-[max-width,margin-left,opacity]',
                  DUR,
                  collapsed
                    ? 'ml-0 max-w-0 opacity-0'
                    : 'ml-1.5 max-w-[104px] opacity-100'
                )}
              >
                {s.name}
              </span>
              <span
                className={cn(
                  'tnum min-w-0 transition-[max-width,margin-left,opacity]',
                  DUR,
                  collapsed
                    ? 'ml-0 max-w-0 opacity-0'
                    : 'ml-auto max-w-[28px] opacity-100'
                )}
              >
                {s.found || '—'}
              </span>
            </button>
          ))}
        </div>
        <div
          className={cn(
            'overflow-hidden transition-[max-height,opacity]',
            DUR,
            collapsed ? 'max-h-0 opacity-0' : 'max-h-12 opacity-100'
          )}
        >
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
      </div>

      <div className="mt-auto border-t border-line p-2">
        <div
          className={cn(
            'mb-1 flex items-center justify-between overflow-hidden px-1 transition-[max-height,opacity]',
            DUR,
            collapsed ? 'max-h-0 opacity-0' : 'max-h-5 opacity-100'
          )}
        >
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

        <div className="space-y-1">
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
                  {/* 折叠后头像移到窄栏中央，与文字收起同步 */}
                  <span
                    className={cn(
                      'flex shrink-0 transition-transform',
                      DUR,
                      collapsed && AVATAR_SHIFT
                    )}
                  >
                    <PersonAvatar name={c.name} hue={c.hue} size={20} />
                  </span>
                  <span
                    className={cn(
                      'min-w-0 flex-1 overflow-hidden transition-[max-width,opacity]',
                      DUR,
                      collapsed ? 'max-w-0 opacity-0' : 'max-w-[110px] opacity-100'
                    )}
                  >
                    <div className="flex items-center gap-1">
                      <span
                        className={cn(
                          'truncate text-[11.5px]',
                          isCurrent ? 'text-fg' : 'text-fg-muted'
                        )}
                      >
                        {c.name}
                      </span>
                      {isCurrent ? (
                        <Check size={11} className="shrink-0 text-accent" />
                      ) : null}
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
                  </span>
                </button>
                <span
                  className={cn(
                    'overflow-hidden transition-[max-width,opacity]',
                    DUR,
                    collapsed ? 'max-w-0 opacity-0' : 'max-w-[24px] opacity-100'
                  )}
                >
                  <button
                    onClick={() => openCandidateConfig(c.id)}
                    title={t('sidebar.configureCandidate', { name: c.name })}
                    aria-label={t('sidebar.configureCandidate', { name: c.name })}
                    className="ml-1 flex h-6 w-6 shrink-0 items-center justify-center rounded text-fg-subtle opacity-60 hover:bg-surface-3 hover:text-fg group-hover:opacity-100"
                  >
                    <Settings2 size={12} strokeWidth={1.7} />
                  </button>
                </span>
              </div>
            )
          })}
        </div>

        <div
          className={cn(
            'flex items-center gap-1 overflow-hidden px-1.5 text-[10px] text-fg-subtle transition-[max-height,opacity]',
            DUR,
            collapsed ? 'max-h-0 opacity-0' : 'mt-1 max-h-4 opacity-100'
          )}
        >
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
