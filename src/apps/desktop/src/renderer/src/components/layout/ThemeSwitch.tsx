import { Check, Monitor, Moon, Sun, type LucideIcon } from 'lucide-react'
import { useT, type TKey } from '@/i18n'
import { THEME_MODES, useTheme, type Theme, type ThemeMode } from '@/lib/theme'
import { cn } from '@/lib/utils'

const ICON: Record<ThemeMode, LucideIcon> = { system: Monitor, light: Sun, dark: Moon }

// 显式标成 Record<联合类型, TKey>，'theme.' 拼字符串会退化成 string，编译期就查不出错 key
const LABEL: Record<ThemeMode, TKey> = {
  system: 'theme.system',
  light: 'theme.light',
  dark: 'theme.dark'
}

const DESC: Record<ThemeMode, TKey> = {
  system: 'theme.systemDesc',
  light: 'theme.lightDesc',
  dark: 'theme.darkDesc'
}

/**
 * 顶栏主题按钮：按当前生效主题直接切到相反的浅 / 深色。
 * 图标显示的是点击后的目标状态，设置页仍保留「跟随系统」三选一。
 */
export function ThemeSwitch({ className }: { className?: string }) {
  const { theme, setMode } = useTheme()
  const t = useT()
  const next: Theme = theme === 'dark' ? 'light' : 'dark'
  const Icon = ICON[next]
  const label = t('theme.switchTo', { name: t(next === 'dark' ? 'theme.dark' : 'theme.light') })

  return (
    <button
      onClick={() => setMode(next)}
      title={label}
      aria-label={label}
      data-theme-switch=""
      className={cn(
        'no-drag flex h-7 w-7 items-center justify-center rounded-md text-fg-muted transition-colors hover:bg-surface-3 hover:text-fg',
        className
      )}
    >
      <Icon size={14} strokeWidth={1.7} />
    </button>
  )
}

/** 设置页用的三选一卡片，与顶栏共用同一份文案与图标映射 */
export function ThemeChoices() {
  const { mode, setMode } = useTheme()
  const t = useT()

  return (
    <div className="grid grid-cols-3 gap-2 px-4 pb-3.5">
      {THEME_MODES.map((m) => {
        const Icon = ICON[m]
        const active = mode === m
        return (
          <button
            key={m}
            onClick={() => setMode(m)}
            aria-pressed={active}
            className={cn(
              'relative rounded-md border px-2.5 py-2 text-left transition-colors',
              active
                ? 'border-accent/50 bg-accent/[0.07]'
                : 'border-line bg-surface-2 hover:border-line-strong'
            )}
          >
            <div className="flex items-center justify-between gap-1">
              <span className="flex items-center gap-1.5 whitespace-nowrap text-[12px] text-fg">
                <Icon
                  size={12}
                  strokeWidth={1.7}
                  className={active ? 'text-accent' : 'text-fg-subtle'}
                />
                {t(LABEL[m])}
              </span>
              {active ? <Check size={11} className="shrink-0 text-accent" /> : null}
            </div>
            <div className="mt-1 text-[9.5px] leading-tight text-fg-subtle">{t(DESC[m])}</div>
          </button>
        )
      })}
    </div>
  )
}
