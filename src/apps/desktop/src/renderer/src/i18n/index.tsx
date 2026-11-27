import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode
} from 'react'
import { en } from './en'
import { zh } from './zh'

export type Lang = 'zh' | 'en'

export const LANGS: { value: Lang; label: string; short: string }[] = [
  { value: 'zh', label: '简体中文', short: '中' },
  { value: 'en', label: 'English', short: 'EN' }
]

const dicts = { zh, en }

// ---------------------------------------------------------------- key 类型推导

/** 把嵌套词典的叶子路径展开成 'a.b.c' 联合类型，写错 key 编译期就报错 */
type Path<T, P extends string = ''> = {
  [K in keyof T & string]: T[K] extends string
    ? P extends '' ? K : `${P}.${K}`
    : Path<T[K], P extends '' ? K : `${P}.${K}`>
}[keyof T & string]

export type TKey = Path<typeof zh>
export type TParams = Record<string, string | number>

// 编译期自检：TKey 必须是收窄的路径联合，而不是退化成 string。
// 若下面的断言报错，说明词典里有非字符串叶子（数组/数字），Path 会整体失效。
type Assert<T extends true> = T
export type __keyAcceptsValidPath = Assert<'nav.dashboard' extends TKey ? true : false>
export type __keyRejectsUnknownPath = Assert<'nav.nope' extends TKey ? false : true>

// ---------------------------------------------------------------- 插值

/**
 * 支持 {name} 占位符。
 * {p} 是复数后缀：英文里写 "{n} job{p}"，n === 1 时渲染为 "1 job"。
 * 中文不需要它，同一句话里不写 {p} 即可。
 */
export function interpolate(tpl: string, params?: TParams): string {
  if (!params) return tpl
  return tpl.replace(/\{(\w+)\}/g, (raw, key: string) => {
    if (key === 'p') return Number(params.n) === 1 ? '' : 's'
    const v = params[key]
    return v === undefined ? raw : String(v)
  })
}

function lookup(dict: unknown, path: string): string | undefined {
  let cur: unknown = dict
  for (const part of path.split('.')) {
    if (typeof cur !== 'object' || cur === null) return undefined
    cur = (cur as Record<string, unknown>)[part]
  }
  return typeof cur === 'string' ? cur : undefined
}

/** 组件外也能用的翻译函数（如 toast、工具函数） */
export function translate(lang: Lang, key: TKey, params?: TParams): string {
  const hit = lookup(dicts[lang], key)
  // 漏翻时回退中文，再退化为 key 本身，界面上不会出现空白
  const tpl = hit ?? lookup(dicts.zh, key) ?? key
  return interpolate(tpl, params)
}

// ---------------------------------------------------------------- Context

interface I18nContextValue {
  lang: Lang
  setLang: (lang: Lang) => void
  toggle: () => void
  t: (key: TKey, params?: TParams) => string
}

const I18nContext = createContext<I18nContextValue | null>(null)

const STORAGE_KEY = 'jobpilot.lang'

function detectLang(): Lang {
  const saved = localStorage.getItem(STORAGE_KEY)
  if (saved === 'zh' || saved === 'en') return saved
  return navigator.language.toLowerCase().startsWith('zh') ? 'zh' : 'en'
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(detectLang)

  const setLang = useCallback((next: Lang) => {
    setLangState(next)
    localStorage.setItem(STORAGE_KEY, next)
  }, [])

  const toggle = useCallback(() => {
    setLang(lang === 'zh' ? 'en' : 'zh')
  }, [lang, setLang])

  // 同步到根节点，影响 :lang 相关的字体栈与拼写检查
  useEffect(() => {
    document.documentElement.lang = lang
  }, [lang])

  const t = useCallback((key: TKey, params?: TParams) => translate(lang, key, params), [lang])

  const value = useMemo(() => ({ lang, setLang, toggle, t }), [lang, setLang, toggle, t])

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}

export function useI18n(): I18nContextValue {
  const ctx = useContext(I18nContext)
  if (!ctx) throw new Error('useI18n 必须在 I18nProvider 内使用')
  return ctx
}

/** 只取 t 的简写，大部分组件只需要它 */
export function useT() {
  return useI18n().t
}
