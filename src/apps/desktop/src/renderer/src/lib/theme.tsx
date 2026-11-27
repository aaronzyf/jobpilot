import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode
} from 'react'
import { ipc } from '@/services/ipc'

/** 用户选择：跟随系统 / 强制浅色 / 强制深色 */
export type ThemeMode = 'system' | 'light' | 'dark'
/** 实际生效的主题 */
export type Theme = 'light' | 'dark'

export const THEME_MODES: ThemeMode[] = ['system', 'light', 'dark']
export const THEME_STORAGE_KEY = 'jobpilot.theme'

const DARK_QUERY = '(prefers-color-scheme: dark)'

export function detectMode(): ThemeMode {
  const saved = localStorage.getItem(THEME_STORAGE_KEY)
  return saved === 'light' || saved === 'dark' || saved === 'system' ? saved : 'system'
}

function systemTheme(): Theme {
  return window.matchMedia(DARK_QUERY).matches ? 'dark' : 'light'
}

function resolveMode(mode: ThemeMode): Theme {
  return mode === 'system' ? systemTheme() : mode
}

/**
 * 把结果写到 <html> 上：
 * - data-theme 决定 index.css 里哪套令牌生效
 * - color-scheme 让原生控件（滚动条、输入框、右键菜单）跟着换
 */
export function applyTheme(theme: Theme): void {
  const root = document.documentElement
  root.dataset.theme = theme
  root.style.colorScheme = theme
}

interface ThemeContextValue {
  mode: ThemeMode
  theme: Theme
  setMode: (mode: ThemeMode) => void
}

const ThemeContext = createContext<ThemeContextValue | null>(null)

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [mode, setModeState] = useState<ThemeMode>(detectMode)
  const [theme, setTheme] = useState<Theme>(() => resolveMode(detectMode()))

  const apply = useCallback((next: Theme) => {
    setTheme(next)
    applyTheme(next)
  }, [])

  // mode 变化时重新解析；跟随系统时还要订上系统切换事件
  useEffect(() => {
    const next = mode === 'system' ? systemTheme() : mode
    apply(next)
    // 主进程据此调整窗口底色、Windows 标题栏按钮配色，并让原生菜单跟随
    ipc.emit('theme:set-mode', mode)
    if (mode !== 'system') return

    const mql = window.matchMedia(DARK_QUERY)
    const onChange = () => apply(mql.matches ? 'dark' : 'light')
    mql.addEventListener('change', onChange)
    return () => mql.removeEventListener('change', onChange)
  }, [mode, apply])

  const setMode = useCallback((next: ThemeMode) => {
    setModeState(next)
    localStorage.setItem(THEME_STORAGE_KEY, next)
  }, [])

  const value = useMemo(() => ({ mode, theme, setMode }), [mode, theme, setMode])

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme 必须在 ThemeProvider 内使用')
  return ctx
}
