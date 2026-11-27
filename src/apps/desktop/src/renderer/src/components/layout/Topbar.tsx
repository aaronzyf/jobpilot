import { useState } from 'react'
import { Bell, Database, Languages, RefreshCw, RotateCw, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Kbd } from '@/components/ui/misc'
import { MenuItem, Popover } from '@/components/ui/overlay'
import { ThemeSwitch } from '@/components/layout/ThemeSwitch'
import { LANGS, useI18n } from '@/i18n'
import { pageInfo } from '@/lib/nav'
import { useApp } from '@/lib/store'
import { cn } from '@/lib/utils'
import { ipc } from '@/services/ipc'

export function LanguageSwitch() {
  const { lang, setLang, t } = useI18n()

  return (
    <Popover
      className="w-[152px]"
      trigger={({ toggle }) => (
        <button
          onClick={toggle}
          title={t('topbar.language')}
          className="flex h-7 items-center gap-1.5 rounded-md px-1.5 text-fg-muted transition-colors hover:bg-surface-3 hover:text-fg"
        >
          <Languages size={13.5} strokeWidth={1.7} />
          <span className="text-[10.5px] font-medium tabular-nums">
            {lang === 'zh' ? '中' : 'EN'}
          </span>
        </button>
      )}
    >
      {LANGS.map((item) => (
        <MenuItem
          key={item.value}
          selected={lang === item.value}
          onClick={() => setLang(item.value)}
        >
          {item.label}
        </MenuItem>
      ))}
    </Popover>
  )
}

export function Topbar() {
  const { page, go, setPaletteOpen, toast, refresh } = useApp()
  const { t } = useI18n()
  const [syncing, setSyncing] = useState(false)
  const info = pageInfo[page]

  const sync = () => {
    if (syncing) return
    setSyncing(true)
    toast(t('topbar.toastSyncStart'), 'default')
    setTimeout(() => {
      setSyncing(false)
      toast(t('topbar.toastSyncDone'), 'success')
    }, 1800)
  }

  return (
    <header className="drag win-inset flex h-11 shrink-0 items-center gap-3 border-b border-line px-5">
      <div className="flex min-w-0 items-baseline gap-2">
        <h1 className="shrink-0 text-[13px] font-medium">{t(info.titleKey)}</h1>
        <span className="truncate text-[11px] text-fg-subtle">{t(info.hintKey)}</span>
      </div>

      <div className="no-drag ml-auto flex items-center gap-1.5">
        <button
          onClick={() => setPaletteOpen(true)}
          className="flex h-7 w-[188px] items-center gap-2 rounded-md border border-line bg-surface-2 px-2 text-[11.5px] text-fg-subtle transition-colors hover:border-line-strong hover:text-fg-muted"
        >
          <Search size={12.5} strokeWidth={1.8} />
          <span className="flex-1 truncate text-left">{t('topbar.searchOrJump')}</span>
          <Kbd>⌘K</Kbd>
        </button>

        <button
          onClick={() => go('applications')}
          className="relative flex h-7 w-7 items-center justify-center rounded-md text-fg-muted transition-colors hover:bg-surface-3 hover:text-fg"
          title={t('topbar.pendingCount', { n: 3 })}
        >
          <Bell size={14} strokeWidth={1.7} />
          <span className="absolute right-1 top-1 h-1.5 w-1.5 rounded-full bg-warning ring-2 ring-bg" />
        </button>

        <Button variant="outline" size="sm" className="gap-1.5" onClick={sync}>
          <RefreshCw size={12.5} strokeWidth={1.8} className={cn(syncing && 'animate-spin')} />
          {syncing ? t('topbar.syncing') : t('topbar.sync')}
        </Button>

        <button
          onClick={() => {
            refresh()
            toast(t('topbar.toastReload'), 'default')
          }}
          title={t('topbar.reload')}
          aria-label={t('topbar.reload')}
          data-reload
          className="flex h-7 w-7 items-center justify-center rounded-md text-fg-muted transition-colors hover:bg-surface-3 hover:text-fg"
        >
          <RotateCw size={13.5} strokeWidth={1.7} />
        </button>

        {/* SQL 日志是开发期调试工具，生产构建里连按钮都不输出 */}
        {import.meta.env.DEV && (
          <button
            onClick={() => ipc.emit('sql-log:open')}
            title={t('topbar.sqlLog')}
            aria-label={t('topbar.sqlLog')}
            data-sql-log
            className="flex h-7 w-7 items-center justify-center rounded-md text-fg-muted transition-colors hover:bg-surface-3 hover:text-fg"
          >
            <Database size={14} strokeWidth={1.7} />
          </button>
        )}

        <span className="mx-0.5 h-4 w-px bg-line" />
        <ThemeSwitch />
        <LanguageSwitch />
      </div>
    </header>
  )
}
